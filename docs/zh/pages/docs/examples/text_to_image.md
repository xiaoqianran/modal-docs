<!-- modal-docs: machine-translated zh-CN from English source -->

# 将 Stable Diffusion 3.5 Large Turbo 作为 CLI、API 和 Web UI 运行

此示例展示如何在 Modal 上运行 [Stable Diffusion 3.5 Large Turbo](https://huggingface.co/stabilityai/stable-diffusion-3.5-large-turbo)
通过 API 从本地命令行生成图像并作为 Web UI。

推理到冷启动大约需要一分钟，
此时图像以每 1-2 秒一张图像的速率生成
适用于 1 到 16 之间的批量大小。

下面是根据提示生成的四张图片
“骑着小马的公主”。

![稳定的扩散蒙太奇](https://modal-cdn.com/cdnbot/sd-montage-princess-yxu2vnbl_e896a9c0.webp)

## 基本设置

```python
import io
import random
import time
from pathlib import Path
from typing import Optional

import modal

MINUTES = 60

```所有 Modal 程序都需要一个 [`App`](https://modal.com/docs/reference/modal.App) — 一个充当配方的对象
该应用程序。让我们给它起一个友好的名字吧。

```python
app = modal.App("example-text-to-image")

```

## 配置依赖

该模型在[容器](https://modal.com/docs/guide/custom-container)内远程运行。
这意味着我们需要在该容器的映像中安装必要的依赖项。

下面，我们从一个轻量级的基础 Linux 镜像开始
然后安装我们的 Python 依赖项，例如 Hugging Face 的 `diffusers` 库和 `torch`。

```python
CACHE_DIR = "/cache"

image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "accelerate==0.33.0",
        "diffusers==0.31.0",
        "fastapi[standard]==0.115.4",
        "huggingface-hub==0.36.0",
        "sentencepiece==0.2.0",
        "torch==2.5.1",
        "torchvision==0.20.1",
        "transformers~=4.44.0",
    )
    .env(
        {
            "HF_XET_HIGH_PERFORMANCE": "1",  # faster downloads
            "HF_HUB_CACHE": CACHE_DIR,
        }
    )
)

with image.imports():
    import diffusers
    import torch
    from fastapi import Response

```

## 在 Modal 上实现 SD3.5 Large Turbo 推理

我们将推理包装在模态 [Cls](https://modal.com/docs/guide/lifecycle-functions) 中
确保当新容器出现时模型会被加载并移动到 GPU
在容器开始执行任何工作之前启动。
`run` 函数只是包装了 `diffusers` 管道。
它将输出图像以字节形式发送回客户端。

我们还包括一个 `web` 包装器，使其成为可能
通过 API 调用触发推理。
查看以 `inference-web.modal.run` 结尾的 URL 的 `/docs` 路由
部署应用程序时出现的详细信息。

```python
MODEL_ID = "adamo1139/stable-diffusion-3.5-large-turbo-ungated"
MODEL_REVISION_ID = "9ad870ac0b0e5e48ced156bb02f85d324b7275d2"

cache_volume = modal.Volume.from_name("hf-hub-cache", create_if_missing=True)


@app.cls(
    image=image,
    gpu="H100",
    timeout=10 * MINUTES,
    volumes={CACHE_DIR: cache_volume},
)
class Inference:
    @modal.enter()
    def load_pipeline(self):
        self.pipe = diffusers.StableDiffusion3Pipeline.from_pretrained(
            MODEL_ID,
            revision=MODEL_REVISION_ID,
            torch_dtype=torch.bfloat16,
        ).to("cuda")

    @modal.method()
    def run(
        self, prompt: str, batch_size: int = 4, seed: Optional[int] = None
    ) -> list[bytes]:
        seed = seed if seed is not None else random.randint(0, 2**32 - 1)
        print("seeding RNG with", seed)
        torch.manual_seed(seed)
        images = self.pipe(
            prompt,
            num_images_per_prompt=batch_size,  # outputting multiple images per prompt is much cheaper than separate calls
            num_inference_steps=4,  # turbo is tuned to run in four steps
            guidance_scale=0.0,  # turbo doesn't use CFG
            max_sequence_length=512,  # T5-XXL text encoder supports longer sequences, more complex prompts
        ).images

        image_output = []
        for image in images:
            with io.BytesIO() as buf:
                image.save(buf, format="PNG")
                image_output.append(buf.getvalue())
        torch.cuda.empty_cache()  # reduce fragmentation
        return image_output

    @modal.fastapi_endpoint(docs=True)
    def web(self, prompt: str, seed: Optional[int] = None):
        return Response(
            content=self.run.local(  # run in the same container
                prompt, batch_size=1, seed=seed
            )[0],
            media_type="image/png",
        )


```

## 从命令行生成稳定的扩散图像

这是我们将用来生成图像的命令。它需要一个文本`prompt`，
一个 `batch_size` 确定每个提示生成的图像数量，
以及运行图像生成的次数（`samples`）。您还可以提供 `seed` 以使采样更具确定性。

运行它

```bash
modal run text_to_image.py
```

并通过`--help`查看更多选项。

```python
@app.local_entrypoint()
def entrypoint(
    samples: int = 4,
    prompt: str = "A princess riding on a pony",
    batch_size: int = 4,
    seed: Optional[int] = None,
):
    print(
        f"prompt => {prompt}",
        f"samples => {samples}",
        f"batch_size => {batch_size}",
        f"seed => {seed}",
        sep="\n",
    )

    output_dir = Path("/tmp/stable-diffusion")
    output_dir.mkdir(exist_ok=True, parents=True)

    inference_service = Inference()

    for sample_idx in range(samples):
        start = time.time()
        images = inference_service.run.remote(prompt, batch_size, seed)
        duration = time.time() - start
        print(f"Run {sample_idx + 1} took {duration:.3f}s")
        if sample_idx:
            print(
                f"\tGenerated {len(images)} image(s) at {(duration) / len(images):.3f}s / image."
            )
        for batch_idx, image_bytes in enumerate(images):
            output_path = (
                output_dir
                / f"output_{slugify(prompt)[:64]}_{str(sample_idx).zfill(2)}_{str(batch_idx).zfill(2)}.png"
            )
            if not batch_idx:
                print("Saving outputs", end="\n\t")
            print(
                output_path,
                end="\n" + ("\t" if batch_idx < len(images) - 1 else ""),
            )
            output_path.write_bytes(image_bytes)


```

## 通过 API 生成稳定的扩散图像

上面的模态`Cls`还包含了一个[`fastapi_endpoint`](https://modal.com/docs/examples/basic_web)，
它将一个简单的 Web API 添加到推理方法中。

要尝试一下，请运行

```bash
modal deploy text_to_image.py
```

复制以 `inference-web.modal.run` 结尾的打印 URL，
并在末尾添加`/docs`。这将带来互动
端点的 Swagger/OpenAPI 文档。

## 在 Web UI 中生成稳定的扩散图像

最后，我们添加一个简单的前端 Web UI（用 Alpine.js 编写）
我们的图像生成后端。

这也是通过运行来部署的
```bash
modal deploy text_to_image.py.
```

`Inference` 类将自动从其自己的热 GPU 容器自动扩展池中为多个用户提供服务。

```python
frontend_path = Path(__file__).parent / "frontend"

web_image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install("jinja2==3.1.4", "fastapi[standard]==0.115.4")
    .add_local_dir(frontend_path, remote_path="/assets")
)


@app.function(image=web_image)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def ui():
    import fastapi.staticfiles
    from fastapi import FastAPI, Request
    from fastapi.templating import Jinja2Templates

    web_app = FastAPI()
    templates = Jinja2Templates(directory="/assets")

    @web_app.get("/")
    async def read_root(request: Request):
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "inference_url": Inference.web.get_web_url(),
                "model_name": "Stable Diffusion 3.5 Large Turbo",
                "default_prompt": "A cinematic shot of a baby raccoon wearing an intricate italian priest robe.",
            },
        )

    web_app.mount(
        "/static",
        fastapi.staticfiles.StaticFiles(directory="/assets"),
        name="static",
    )

    return web_app


def slugify(s: str) -> str:
    return "".join(c if c.isalnum() else "-" for c in s).strip("-")

```