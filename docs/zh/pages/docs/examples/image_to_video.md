<!-- modal-docs: machine-translated zh-CN from English source -->

# 通过 CLI、API 和 Web UI 使用 Lightricks LTX-Video 制作图像动画

此示例演示如何在 Modal 上运行 [LTX-Video](https://huggingface.co/Lightricks/LTX-Video)
通过 API 和 Web UI 从本地命令行生成视频。

从冷启动开始生成 5 秒的视频大约需要 1 分钟。
一旦容器变热，5 秒的视频大约需要 15 秒。

这是我们生成的示例：

<center>
<video controls autoplay loop muted>
<source src="https://modal-cdn.com/example_image_to_video.mp4" type="video/mp4" />
</video>
</center>

## 基本设置

```python
import io
import random
import time
from pathlib import Path
from typing import Annotated, Optional

import fastapi
import modal

```

所有 Modal 程序都需要 [`App`](https://modal.com/docs/reference/modal.App) —
充当应用程序配方的对象。

```python
app = modal.App("example-image-to-video")

```

### 配置依赖项该模型在 Modal 的云上远程运行，这意味着我们需要
[定义它运行的环境](https://modal.com/docs/guide/images)。

下面，我们从一个轻量级的基础 Linux 镜像开始
然后安装我们的系统和Python依赖项，
比如 Hugging Face 的 `diffusers` 库和 `torch`。

```python
image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("python3-opencv")
    .uv_pip_install(
        "accelerate==1.4.0",
        "diffusers==0.32.2",
        "fastapi[standard]==0.115.8",
        "huggingface-hub==0.36.0",
        "imageio==2.37.0",
        "imageio-ffmpeg==0.6.0",
        "opencv-python==4.11.0.86",
        "pillow==11.1.0",
        "sentencepiece==0.2.0",
        "torch==2.6.0",
        "torchvision==0.21.0",
        "transformers==4.49.0",
    )
)

```

## 在 Modal 上存储模型权重

我们还需要远程模型的参数。
它们可以在运行时从 Hugging Face 加载，
基于存储库 ID 和修订版（也称为提交 SHA）。

```python
MODEL_ID = "Lightricks/LTX-Video"
MODEL_REVISION_ID = "a6d59ee37c13c58261aa79027d3e41cd41960925"

```

下载后，Hugging Face 还会将权重缓存到磁盘。
但模态函数是无服务器的，因此即使磁盘也是短暂的，
这意味着每次我们启动新实例时都会重新下载权重。

我们可以解决这个问题——无需对 Hugging Face 的模型加载代码进行任何修改！ --
通过将拥抱脸部缓存指向[模态体积](https://modal.com/docs/guide/volumes)。有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

```python
model_volume = modal.Volume.from_name("hf-hub-cache", create_if_missing=True)

MODEL_PATH = "/models"  # where the Volume will appear on our Functions' filesystems

image = image.env(
    {
        "HF_XET_HIGH_PERFORMANCE": "1",  # faster downloads
        "HF_HUB_CACHE": MODEL_PATH,
    }
)

```

## 在 Modal 上存储模型输出

现代视频模型可能需要很长时间才能运行，并且会产生大量输出。
这使得它们也成为模态卷存储的绝佳选择。
在 Modal 之外运行的 Python 代码也可以访问此存储，如下所示。```python
OUTPUT_PATH = "/outputs"
output_volume = modal.Volume.from_name("outputs", create_if_missing=True)

```

## 在 Modal 上实现 LTX-Video 推理

我们将推理逻辑包装在 Modal [Cls](https://modal.com/docs/guide/lifecycle-functions) 中
确保模型在新实例出现时被加载并移动到 GPU
启动，而不是每次运行它时。

`run` 函数只是包装了 `diffusers` 管道。
它将生成的视频保存到模态体积中，并返回文件名。

我们还包括一个 `web` 包装器，使其成为可能
通过 API 调用触发推理。
详情请参见以`inference-web.modal.run`结尾的URL的`/docs`路由
当您部署应用程序时出现。

```python
with image.imports():  # loaded on all of our remote Functions
    import diffusers
    import torch
    from PIL import Image

MINUTES = 60


@app.cls(
    image=image,
    gpu="H100",
    timeout=10 * MINUTES,
    scaledown_window=10 * MINUTES,
    volumes={MODEL_PATH: model_volume, OUTPUT_PATH: output_volume},
)
class Inference:
    @modal.enter()
    def load_pipeline(self):
        self.pipe = diffusers.LTXImageToVideoPipeline.from_pretrained(
            MODEL_ID,
            revision=MODEL_REVISION_ID,
            torch_dtype=torch.bfloat16,
        ).to("cuda")

    @modal.method()
    def run(
        self,
        image_bytes: bytes,
        prompt: str,
        negative_prompt: Optional[str] = None,
        num_frames: Optional[int] = None,
        num_inference_steps: Optional[int] = None,
        seed: Optional[int] = None,
    ) -> str:
        negative_prompt = (
            negative_prompt
            or "worst quality, inconsistent motion, blurry, jittery, distorted"
        )
        width = 768
        height = 512
        num_frames = num_frames or 25
        num_inference_steps = num_inference_steps or 50
        seed = seed or random.randint(0, 2**32 - 1)
        print(f"Seeding RNG with: {seed}")
        torch.manual_seed(seed)

        image = diffusers.utils.load_image(Image.open(io.BytesIO(image_bytes)))

        video = self.pipe(
            image=image,
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            num_frames=num_frames,
            num_inference_steps=num_inference_steps,
        ).frames[0]

        mp4_name = (
            f"{seed}_{''.join(c if c.isalnum() else '-' for c in prompt[:100])}.mp4"
        )
        diffusers.utils.export_to_video(
            video, f"{Path(OUTPUT_PATH) / mp4_name}", fps=24
        )
        output_volume.commit()
        torch.cuda.empty_cache()  # reduce fragmentation
        return mp4_name

    @modal.fastapi_endpoint(method="POST", docs=True)
    def web(
        self,
        image_bytes: Annotated[bytes, fastapi.File()],
        prompt: str,
        negative_prompt: Optional[str] = None,
        num_frames: Optional[int] = None,
        num_inference_steps: Optional[int] = None,
        seed: Optional[int] = None,
    ) -> fastapi.Response:
        mp4_name = self.run.local(  # run in the same container
            image_bytes=image_bytes,
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_frames=num_frames,
            num_inference_steps=num_inference_steps,
            seed=seed,
        )
        return fastapi.responses.FileResponse(
            path=f"{Path(OUTPUT_PATH) / mp4_name}",
            media_type="video/mp4",
            filename=mp4_name,
        )


```

## 从命令行生成视频
我们添加一个[本地入口点](https://modal.com/docs/reference/modal.App#local_entrypoint)
调用 `Inference.run` 方法从命令行运行推理。
该函数的参数会自动转换为 CLI。

运行它

```bash
modal run image_to_video.py --prompt "A cat looking out the window at a snowy mountain" --image-path /path/to/cat.jpg
```

您还可以传递 `--help` 查看完整的参数列表。

```python
@app.local_entrypoint()
def entrypoint(
    image_path: str,
    prompt: str,
    negative_prompt: Optional[str] = None,
    num_frames: Optional[int] = None,
    num_inference_steps: Optional[int] = None,
    seed: Optional[int] = None,
    twice: bool = True,
):
    import os
    import urllib.request

    print(f"🎥 Generating a video from the image at {image_path}")
    print(f"🎥 using the prompt {prompt}")

    if image_path.startswith(("http://", "https://")):
        image_bytes = urllib.request.urlopen(image_path).read()
    elif os.path.isfile(image_path):
        image_bytes = Path(image_path).read_bytes()
    else:
        raise ValueError(f"{image_path} is not a valid file or URL.")

    inference_service = Inference()

    for _ in range(1 + twice):
        start = time.time()
        mp4_name = inference_service.run.remote(
            image_bytes=image_bytes,
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_frames=num_frames,
            seed=seed,
        )
        duration = time.time() - start
        print(f"🎥 Generated video in {duration:.3f}s")

        output_dir = Path("/tmp/image_to_video")
        output_dir.mkdir(exist_ok=True, parents=True)
        output_path = output_dir / mp4_name
        # read in the file from the Modal Volume, then write it to the local disk
        output_path.write_bytes(b"".join(output_volume.read_file(mp4_name)))
        print(f"🎥 Video saved to {output_path}")


```

## 通过 API 生成视频

上面的模态`Cls`还包含了一个[`fastapi_endpoint`](https://modal.com/docs/examples/basic_web)，
它将一个简单的 Web API 添加到推理方法中。

要尝试一下，请运行

```bash
modal deploy image_to_video.py
```

复制以 `inference-web.modal.run` 结尾的打印 URL，
并在末尾添加`/docs`。这将带来互动
端点的 Swagger/OpenAPI 文档。

## 在 Web UI 中生成视频

最后，我们添加一个简单的前端 Web UI（用 Alpine.js 编写）
我们的图像到视频后端。

当您运行时也会部署它

```bash
modal deploy image_to_video.py.
```

`Inference` 类将自动从其自己的热 GPU 容器自动扩展池中为多个用户提供服务，
当没有请求时它们就会停止运行。

```python
frontend_path = Path(__file__).parent / "frontend"

web_image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install("jinja2==3.1.5", "fastapi[standard]==0.115.8")
    .add_local_dir(  # mount frontend/client code
        frontend_path, remote_path="/assets"
    )
)


@app.function(image=web_image)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def ui():
    import fastapi.staticfiles
    import fastapi.templating

    web_app = fastapi.FastAPI()
    templates = fastapi.templating.Jinja2Templates(directory="/assets")

    @web_app.get("/")
    async def read_root(request: fastapi.Request):
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "inference_url": Inference().web.get_web_url(),
                "model_name": "LTX-Video Image to Video",
                "default_prompt": "A young girl stands calmly in the foreground, looking directly at the camera, as a house fire rages in the background.",
            },
        )

    web_app.mount(
        "/static",
        fastapi.staticfiles.StaticFiles(directory="/assets"),
        name="static",
    )

    return web_app

```