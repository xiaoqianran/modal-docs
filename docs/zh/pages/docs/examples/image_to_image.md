<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 Flux Kontext 编辑图像

在此示例中，我们在*图像到图像*模式下运行 Flux Kontext 模型：
该模型接收提示和图像，并编辑图像以更好地匹配提示。

例如，模型根据提示将第一张图像编辑为第二张图像
“*可爱的狗巫师，灵感来自《指环王》中的甘道夫，具有吉卜力工作室风格的详细奇幻元素*”。

 <img src="https://modal-cdn.com/dog-wizard-ghibli-flux-kontext.jpg" alt="A photo of a dog transformed into a cartoon of a cute dog wizard" />

该模型是 Black Forest Labs 的 [FLUX.1-Kontext-dev](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev)。
了解有关该模型的更多信息[此处](https://bfl.ai/announcements/flux-1-kontext-dev)。

## 定义容器镜像

首先，我们定义模型推理将运行的环境，
[容器图像](https://modal.com/docs/guide/custom-container)。

我们从 NVIDIA CUDA 基础映像开始并安装必要的 Python 包。
我们使用 `diffusers` 库的特定提交来确保与 Flux Kontext 模型的兼容性。

```python
from io import BytesIO
from pathlib import Path

import modal

app = modal.App("example-image-to-image")

diffusers_commit_sha = "00f95b9755718aabb65456e791b8408526ae6e76"

image = (
    modal.Image.from_registry("nvidia/cuda:12.8.1-devel-ubuntu22.04", add_python="3.12")
    .entrypoint([])  # remove verbose logging by base image on entry
    .apt_install("git")
    .uv_pip_install(
        "Pillow~=11.2.1",
        "accelerate~=1.8.1",
        f"git+https://github.com/huggingface/diffusers.git@{diffusers_commit_sha}",
        "huggingface-hub==0.36.0",
        "optimum-quanto==0.2.7",
        "safetensors==0.5.3",
        "sentencepiece==0.2.0",
        "torch==2.7.1",
        "transformers~=4.53.0",
        extra_options="--index-strategy unsafe-best-match",
        extra_index_url="https://download.pytorch.org/whl/cu128",
    )
)

```

## 下载模型

我们将使用 Black Forest Labs 的 FLUX.1-Kontext-dev 模型。
该模型专门从事图像到图像的编辑，具有很强的即时依从性。

```python
MODEL_NAME = "black-forest-labs/FLUX.1-Kontext-dev"
MODEL_REVISION = "f9fdd1a95e0dfd7653cb0966cda2486745122695"

```

请注意，对 Hugging Face 上 FLUX.1-Kontext-dev 模型的访问是
[由许可协议控制](https://huggingface.co/docs/hub/en/models-gated) 其中
您必须同意[此处](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev)。
接受许可证后，[创建模态密钥](https://modal.com/secrets)
按照模板中的说明使用名称 `huggingface-secret`。

## 缓存模型权重

模型权重很大（几十GB），所以我们想缓存它们
以避免每次容器启动时都下载它们。
我们使用 [Modal Volume](https://modal.com/docs/guide/volumes) 来保存 Hugging Face 缓存。
模态卷就像所有模态函数都可以访问的共享磁盘。
有关在 Modal 上存储模型权重的更多信息，请参阅[本指南](https://modal.com/docs/guide/model-weights)。

```python
CACHE_DIR = Path("/cache")
cache_volume = modal.Volume.from_name("hf-hub-cache", create_if_missing=True)
volumes = {CACHE_DIR: cache_volume}

```我们引用之前创建的 Hugging Face 密钥来在下载模型时进行身份验证。

```python
secrets = [modal.Secret.from_name("huggingface-secret")]

```

我们配置环境变量以启用 Hugging Face 更快的下载速度
并将 Hugging Face 缓存指向我们的模态体积。

```python
image = image.env({"HF_XET_HIGH_PERFORMANCE": "1", "HF_HOME": str(CACHE_DIR)})

```

最后，我们导入将在推理函数中使用的包，
但不是本地的。

```python
with image.imports():
    import torch
    from diffusers import FluxKontextPipeline
    from diffusers.utils import load_image
    from PIL import Image


```

## 设置并运行 Flux Kontext

下面定义的 Modal `Cls` 包含设置和运行 Flux Kontext 推理的所有逻辑。

我们使用 `app.cls` 装饰器将 Python 类定义为 Modal `Cls`。
我们提供了一些参数来描述我们的推理应该运行的基础设施：

* 我们上面定义的Image、Volume和Secret
* 一个 [`gpu`](https://modal.com/docs/guide/gpu)，特别是一个 [B200](https://modal.com/blog/introducing-b200-h200)

[容器生命周期](https://modal.com/docs/guide/lifecycle-functions) 装饰器，
`@modal.enter`，确保在容器启动时、在获取任何输入之前将模型加载到内存中。
这对于管理尾部延迟很有用（有关详细信息，请参阅[本指南](https://modal.com/docs/guide/cold-start)）。

`inference`方法运行实际的模型推理。它接受一个图像（作为原始`bytes`）和一个字符串`prompt`并返回
一个新图像（也作为原始 `bytes`）。

```python
@app.cls(image=image, gpu="B200", volumes=volumes, secrets=secrets)
class Model:
    @modal.enter()
    def enter(self):
        print(f"Loading {MODEL_NAME}...")

        self.pipe = FluxKontextPipeline.from_pretrained(
            MODEL_NAME,
            revision=MODEL_REVISION,
            torch_dtype=torch.bfloat16,
            cache_dir=CACHE_DIR,
        ).to("cuda")

    @modal.method()
    def inference(
        self,
        image_bytes: bytes,
        prompt: str,
        guidance_scale: float = 3.5,
        num_inference_steps: int = 20,
        seed: int | None = None,
    ) -> bytes:
        init_image = load_image(Image.open(BytesIO(image_bytes))).resize((512, 512))

        generator = None
        if seed is not None:
            generator = torch.Generator(device="cuda").manual_seed(seed)

        image = self.pipe(
            image=init_image,
            prompt=prompt,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            output_type="pil",
            generator=generator,
        ).images[0]

        byte_stream = BytesIO()
        image.save(byte_stream, format="PNG")

        return byte_stream.getvalue()


```

## 从命令行运行模型

您可以从命令行运行模型

```bash
modal run image_to_image.py
```

使用 `--help` 了解更多详细信息。

```python
@app.local_entrypoint()
def main(
    image_path=Path(__file__).parent / "demo_images/dog.png",
    output_path=Path("/tmp/stable-diffusion/output.png"),
    prompt: str = "A cute dog wizard inspired by Gandalf from Lord of the Rings, featuring detailed fantasy elements in Studio Ghibli style",
):
    print(f"🎨 reading input image from {image_path}")
    input_image_bytes = Path(image_path).read_bytes()
    print(f"🎨 editing image with prompt '{prompt}'")
    output_image_bytes = Model().inference.remote(input_image_bytes, prompt)

    if isinstance(output_path, str):
        output_path = Path(output_path)

    dir = output_path.parent
    dir.mkdir(exist_ok=True, parents=True)

    print(f"🎨 saving output image to {output_path}")
    output_path.write_bytes(output_image_bytes)

```