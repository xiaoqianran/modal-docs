<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 Lightricks LTX-Video 根据提示生成视频

本例演示如何运行[LTX-Video](https://github.com/Lightricks/LTX-Video)
Modal 上 [Lightricks](https://www.lightricks.com/) 的视频生成模型。

LTX-视频速度很快！生成中等质量的 20 秒 480p 视频
在温暖的容器上仅需两秒钟。

这是我们生成的：

<center>
<video controls autoplay loop muted>
<source src="https://modal-cdn.com/blonde-woman-blinking.mp4" type="video/mp4" />
</video>
</center>

## 设置

我们首先导入本地需要的依赖项，
定义一个模态 [App](https://modal.com/docs/guide/apps)，
并定义容器[Image](https://modal.com/docs/guide/images)
我们的视频模型将在其中运行。

```python
import string
import time
from pathlib import Path
from typing import Optional

import modal

app = modal.App("example-ltx")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "accelerate==1.6.0",
        "diffusers==0.33.1",
        "huggingface-hub==0.36.0",
        "imageio==2.37.0",
        "imageio-ffmpeg==0.5.1",
        "sentencepiece==0.2.0",
        "torch==2.7.0",
        "transformers==4.51.3",
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1"})
)

```

## 在模态体上存储数据

在 Modal 上，我们将大量或计算成本高昂的数据保存到
[分布式卷](https://modal.com/docs/guide/volumes)
可以在本地和远程访问。

我们将存储 LTX-Video 模型的权重和我们生成的输出
关于模态体积。

我们将输出存储在模态卷上，以便客户端
无需等待视频生成。

```python
VOLUME_NAME = "ltx-outputs"
outputs = modal.Volume.from_name(VOLUME_NAME, create_if_missing=True)
OUTPUTS_PATH = Path("/outputs")

```

我们将权重存储在模态体积上，这样我们就不会
每次都必须从 Hugging Face Hub 中获取它们
集装箱靴子。此下载大约需要两分钟，
取决于流量和网络速度。

```python
MODEL_VOLUME_NAME = "ltx-model"
model = modal.Volume.from_name(MODEL_VOLUME_NAME, create_if_missing=True)

```
我们不必更改任何 Hugging Face 代码即可执行此操作 --
我们只是将 Hugging Face 的缓存位置设置在一个 Volume 上
使用 `HF_HOME` 环境变量。

```python
MODEL_PATH = Path("/models")
image = image.env({"HF_HOME": str(MODEL_PATH)})

```

有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

## 设置我们的 LTX 类

我们使用 `@cls` 装饰器来指定我们的推理函数所需的基础设施，
如上所定义。

该装饰器还使我们能够控制
[生命周期](https://modal.com/docs/guide/lifecycle-functions)
我们的云容器。

具体来说，我们使用`enter`方法将模型加载到GPU内存中（如果存在，则来自卷；如果不存在，则来自集线器）
在容器被标记为准备好输入之前。

这有助于减少冷启动引起的尾部延迟。
有关详细信息和更多提示，请参阅[本指南](https://modal.com/docs/guide/cold-start#cold-start-performance)。

实际的推理代码位于类的`modal.method`中。

```python
MINUTES = 60  # seconds


@app.cls(
    image=image,  # use our container Image
    volumes={OUTPUTS_PATH: outputs, MODEL_PATH: model},  # attach our Volumes
    gpu="H100",  # use a big, fast GPU
    timeout=10 * MINUTES,  # run inference for up to 10 minutes
    scaledown_window=15 * MINUTES,  # stay idle for 15 minutes before scaling down
)
class LTX:
    @modal.enter()
    def load_model(self):
        import torch
        from diffusers import DiffusionPipeline

        self.pipe = DiffusionPipeline.from_pretrained(
            "Lightricks/LTX-Video", torch_dtype=torch.bfloat16
        )
        self.pipe.to("cuda")

    @modal.method()
    def generate(
        self,
        prompt,
        negative_prompt="",
        num_inference_steps=200,
        guidance_scale=4.5,
        num_frames=19,
        width=704,
        height=480,
    ):
        from diffusers.utils import export_to_video

        frames = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            num_frames=num_frames,
            width=width,
            height=height,
        ).frames[0]

        # save to disk using prompt as filename
        mp4_name = slugify(prompt)
        export_to_video(frames, Path(OUTPUTS_PATH) / mp4_name)
        outputs.commit()
        return mp4_name


```

## 从命令行生成视频

我们通过运行以下代码从本地计算机触发 LTX-Video 推理
下面的本地入口点为`modal run`。

它将启动一个新的副本来生成视频。
然后它会默认生成第二个视频来演示
当遇到温暖的容器时延迟较低。

您可以通过以下方式触发推理：

```bash
modal run ltx
```
所有输出都保存在本地和模态体积上。
您可以从模态仪表板探索模态体积的内容
或者从命令行使用 `modal volume` 命令。

```bash
modal volume ls ltx-outputs
```

详情请参阅`modal volume --help`。

可以使用以下命令查看脚本的可选命令行标志：

```bash
modal run ltx --help
```

使用这些标志，您可以从命令行调整您的生成：

```bash
modal run --detach ltx --prompt="a cat playing drums in a jazz ensemble" --num-inference-steps=64
```

```python
@app.local_entrypoint()
def main(
    prompt: Optional[str] = None,
    negative_prompt="worst quality, blurry, jittery, distorted",
    num_inference_steps: int = 10,  # 10 when testing, 100 or more when generating
    guidance_scale: float = 2.5,
    num_frames: int = 150,  # produces ~10s of video
    width: int = 704,
    height: int = 480,
    twice: bool = True,  # run twice to show cold start latency
):
    if prompt is None:
        prompt = DEFAULT_PROMPT

    ltx = LTX()

    def run():
        print(f"🎥 Generating a video from the prompt '{prompt}'")
        start = time.time()
        mp4_name = ltx.generate.remote(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            num_frames=num_frames,
            width=width,
            height=height,
        )
        duration = time.time() - start
        print(f"🎥 Client received video in {int(duration)}s")
        print(f"🎥 LTX video saved to Modal Volume at {mp4_name}")

        local_dir = Path("/tmp/ltx")
        local_dir.mkdir(exist_ok=True, parents=True)
        local_path = local_dir / mp4_name
        local_path.write_bytes(b"".join(outputs.read_file(mp4_name)))
        print(f"🎥 LTX video saved locally at {local_path}")

    run()

    if twice:
        print("🎥 Generating a video from a warm container")
        run()


```

## 附录

该文件中的其余代码是实用程序代码。

```python
DEFAULT_PROMPT = (
    "The camera pans over a snow-covered mountain range,"
    " revealing a vast expanse of snow-capped peaks and valleys."
    " The mountains are covered in a thick layer of snow,"
    " with some areas appearing almost white while others have a slightly darker, almost grayish hue."
    " The peaks are jagged and irregular, with some rising sharply into the sky"
    " while others are more rounded."
    " The valleys are deep and narrow, with steep slopes that are also covered in snow."
    " The trees in the foreground are mostly bare, with only a few leaves remaining on their branches."
)


def slugify(prompt):
    for char in string.punctuation:
        prompt = prompt.replace(char, "")
    prompt = prompt.replace(" ", "_")
    prompt = prompt[:230]  # some OSes limit filenames to <256 chars
    mp4_name = str(int(time.time())) + "_" + prompt + ".mp4"
    return mp4_name

```