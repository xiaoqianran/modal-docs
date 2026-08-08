<!-- modal-docs: machine-translated zh-CN from English source -->

# 微调开源 YOLO 模型以进行目标检测

例如 [@Erik-Dunteman](https://github.com/erik-dunteman) 和 [@AnirudhRahul](https://github.com/AnirudhRahul/)。

流行的“You Only Look Once”(YOLO) 型号系列以经济实惠的方式提供高质量的物体检测。
在此示例中，我们使用 2024 年 5 月 23 日发布的 [YOLOv10](https://docs.ultralytics.com/models/yolov10/) 模型。

我们将：

* 从[Roboflow](https://roboflow.com/)计算机视觉平台下载两个自定义数据集：猫的数据集和狗的数据集

* 使用 [Ultralytics 包](https://docs.ultralytics.com/) 并行微调这些数据集上的模型* 使用微调模型在单个图像和流帧上运行推理

如需商业用途，请务必查阅[Ultralytics软件许可选项](https://docs.ultralytics.com/#yolo-licenses-how-is-ultralytics-yolo-licensed)，
其中包括 AGPL-3.0。

## 设置环境

```python
import warnings
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import modal

```

Modal 在容器内的云中运行您的代码。所以要使用它，我们必须定义依赖关系
我们的代码作为容器的[图像](https://modal.com/docs/guide/custom-container)的一部分。

```python
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(  # install system libraries for graphics handling, model download
        ["libgl1-mesa-glx", "libglib2.0-0", "curl"]
    )
    .uv_pip_install(  # install python libraries for computer vision
        ["ultralytics~=8.2.68", "roboflow~=1.1.37", "opencv-python~=4.10.0"]
    )
    .uv_pip_install(  # add an optional extra that renders images in the terminal
        "term-image==0.7.1"
    )
)

```

我们还创建了一个持久的[Volume](https://modal.com/docs/guide/volumes)来存储数据集、训练权重和推理输出。有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

```python
volume = modal.Volume.from_name("example-yolo-finetune", create_if_missing=True)
volume_path = (  # the path to the volume from within the container
    Path("/root") / "data"
)

```

我们将这两个附加到模态 [App](https://modal.com/docs/guide/apps)。

```python
app = modal.App("example-yolo-finetune", image=image, volumes={volume_path: volume})


```
## 下载数据集

我们将从 [Roboflow](https://roboflow.com/) 计算机视觉平台下载数据，因此要继续操作，您需要：

* 在[Roboflow]上创建免费帐户(https://app.roboflow.com/)

* [生成私有API密钥](https://app.roboflow.com/settings/api)

* 在 Modal UI [此处](https://modal.com/secrets) 中设置一个名为 `roboflow-api-key` 的 Modal [秘密](https://modal.com/docs/guide/secrets)，
  将 `ROBOFLOW_API_KEY` 设置为您的 API 密钥的值。

您还可以随意携带自己的数据集以及 YOLOv10 兼容 yaml 格式的配置。

我们将在中型模型上进行训练，但您可以自由尝试[其他模型尺寸](https://docs.ultralytics.com/models/yolov10/#model-variants)。

```python
@dataclass
class DatasetConfig:
    """Information required to download a dataset from Roboflow."""

    workspace_id: str
    project_id: str
    version: int
    format: str
    target_class: str

    @property
    def id(self) -> str:
        return f"{self.workspace_id}/{self.project_id}/{self.version}"


@app.function(
    secrets=[
        modal.Secret.from_name("roboflow-api-key", required_keys=["ROBOFLOW_API_KEY"])
    ]
)
def download_dataset(config: DatasetConfig):
    import os

    from roboflow import Roboflow

    rf = Roboflow(api_key=os.getenv("ROBOFLOW_API_KEY"))
    project = (
        rf.workspace(config.workspace_id)
        .project(config.project_id)
        .version(config.version)
    )
    dataset_dir = volume_path / "dataset" / config.id
    project.download(config.format, location=str(dataset_dir))


```

## 训练模型我们在单个 A100 GPU 上训练模型。训练通常只需要几分钟。

```python
MINUTES = 60

TRAIN_GPU_COUNT = 1
TRAIN_GPU = f"A100:{TRAIN_GPU_COUNT}"
TRAIN_CPU_COUNT = 4


@app.function(
    gpu=TRAIN_GPU,
    cpu=TRAIN_CPU_COUNT,
    timeout=60 * MINUTES,
)
def train(
    model_id: str,
    dataset: DatasetConfig,
    model_size="yolov10m.pt",
    quick_check=False,
):
    from ultralytics import YOLO

    volume.reload()  # make sure volume is synced

    model_path = volume_path / "runs" / model_id
    model_path.mkdir(parents=True, exist_ok=True)

    data_path = volume_path / "dataset" / dataset.id / "data.yaml"

    model = YOLO(model_size)
    model.train(
        # dataset config
        data=data_path,
        fraction=0.4
        if not quick_check
        else 0.04,  # fraction of dataset to use for training/validation
        # optimization config
        device=list(range(TRAIN_GPU_COUNT)),  # use the GPU(s)
        epochs=8 if not quick_check else 1,  # pass over entire dataset this many times
        batch=0.95,  # automatic batch size to target fraction of GPU util
        seed=117,  # set seed for reproducibility
        # data processing config
        workers=max(
            TRAIN_CPU_COUNT // TRAIN_GPU_COUNT, 1
        ),  # split CPUs evenly across GPUs
        cache=False,  # cache preprocessed images in RAM?
        # model saving config
        project=f"{volume_path}/runs",
        name=model_id,
        exist_ok=True,  # overwrite previous model if it exists
        verbose=True,  # detailed logs
    )


```

## 对单个输入和流运行推理

我们演示了两种不同的运行推理的方法——在单个图像上和在图像流上。

我们用于推理的图像是从测试集加载的，当我们下载数据集时，测试集已添加到我们的卷中。
每个图像读取需要约 50 毫秒，推理可能需要约 5 毫秒，因此如果我们只是循环遍历图像路径，磁盘读取将是我们最大的瓶颈。
为了避免这种情况，我们使用 Modal 的 [`.map`](https://modal.com/docs/guide/scale) 并行化许多工作线程的磁盘读取，
将图像流式传输到模型。这大致模仿了交互式对象检测管道的行为。
这可以将吞吐量提高至约 60 个图像/秒，或约 17 毫秒/图像，具体取决于图像大小。

```python
@app.function()
def read_image(image_path: str):
    import cv2

    source = cv2.imread(image_path)
    return source


```

我们使用[`modal.Cls`](https://modal.com/docs/guide/lifecycle-functions)的`@enter`特征
在容器启动时仅加载一次模型并重用它以供将来的推理。
我们使用生成器将图像流式传输到模型。

```python
@app.cls(gpu="a10g")
class Inference:
    weights_path: str = modal.parameter()

    @modal.enter()
    def load_model(self):
        from ultralytics import YOLO

        self.model = YOLO(self.weights_path)

    @modal.method()
    def predict(self, model_id: str, image_path: str, display: bool = False):
        """A simple method for running inference on one image at a time."""
        results = self.model.predict(
            image_path,
            half=True,  # use fp16
            save=True,
            exist_ok=True,
            project=f"{volume_path}/predictions/{model_id}",
        )
        if display:
            from term_image.image import from_file

            terminal_image = from_file(results[0].path)
            terminal_image.draw()
        # you can view the output file via the Volumes UI in the Modal dashboard -- https://modal.com/storage

    @modal.method()
    def streaming_count(self, batch_dir: str, threshold: float | None = None):
        """Counts the number of objects in a directory of images.

        Intended as a demonstration of high-throughput streaming inference."""
        import os
        import time

        image_files = [os.path.join(batch_dir, f) for f in os.listdir(batch_dir)]

        completed, start = 0, time.monotonic_ns()
        for image in read_image.map(image_files):
            # note that we run predict on a single input at a time.
            # each individual inference is usually done before the next image arrives, so there's no throughput benefit to batching.
            results = self.model.predict(
                image,
                half=True,  # use fp16
                save=False,  # don't save to disk, as it slows down the pipeline significantly
                verbose=False,
            )
            completed += 1
            for res in results:
                for conf in res.boxes.conf:
                    if threshold is None:
                        yield 1
                        continue
                    if conf.item() >= threshold:
                        yield 1
            yield 0

        elapsed_seconds = (time.monotonic_ns() - start) / 1e9
        print(
            "Inferences per second:",
            round(completed / elapsed_seconds, 2),
        )


```

## 运行示例

我们将开始并行训练作业并从命令行运行推理。

```bash
modal run finetune_yolo.py
```

这会在 `quick_check` 模式下运行训练，对于调试管道并感受它很有用。
要进行更长时间的运行以真正有意义地提高性能，请使用：

```bash
modal run finetune_yolo.py --no-quick-check
```

```python
@app.local_entrypoint()
def main(quick_check: bool = True, inference_only: bool = False):
    """Run fine-tuning and inference on two datasets.

    Args:
        quick_check: fine-tune on a small subset. Lower quality results, but faster iteration.
        inference_only: skip fine-tuning and only run inference
    """

    dogs = DatasetConfig(
        workspace_id="cv-project-v2",
        project_id="6-dog-breeds",
        version=1,
        format="yolov9",
        target_class="🐶",
    )
    cats = DatasetConfig(
        workspace_id="jus-workspace",
        project_id="cats-w7ohy",
        version=3,
        format="yolov9",
        target_class="🐱",
    )
    datasets = [dogs, cats]

    # .for_each runs a function once on each element of the input iterators
    # here, that means download each dataset, in parallel
    if not inference_only:
        download_dataset.for_each(datasets)

    today = datetime.now().strftime("%Y-%m-%d")
    model_ids = [dataset.id + f"/{today}" for dataset in datasets]

    if not inference_only:
        train.for_each(model_ids, datasets, kwargs={"quick_check": quick_check})

    # let's run inference!
    for model_id, dataset in zip(model_ids, datasets):
        inference = Inference(
            weights_path=str(volume_path / "runs" / model_id / "weights" / "best.pt")
        )

        # predict on a single image and save output to the volume
        test_images = volume.listdir(
            str(Path("dataset") / dataset.id / "test" / "images")
        )
        # run inference on the first 5 images
        for ii, image in enumerate(test_images):
            print(f"{model_id}: Single image prediction on image", image.path)
            inference.predict.remote(
                model_id=model_id,
                image_path=f"{volume_path}/{image.path}",
                display=(
                    ii == 0  # display inference results only on first image
                ),
            )
            if ii >= 4:
                break

        # streaming inference on images from the test set
        print(f"{model_id}: Streaming inferences on all images in the test set...")
        count = 0
        for detection in inference.streaming_count.remote_gen(
            batch_dir=f"{volume_path}/dataset/{dataset.id}/test/images"
        ):
            if detection:
                print(f"{dataset.target_class}", end="")
                count += 1
            else:
                print("🎞️", end="", flush=True)
        print(f"\n{model_id}: Counted {count} {dataset.target_class}s!")


```

## 附录

本示例中的其余代码是实用程序代码。

```python
warnings.filterwarnings(  # filter warning from the terminal image library
    "ignore",
    message="It seems this process is not running within a terminal. Hence, some features will behave differently or be disabled.",
    category=UserWarning,
)

```