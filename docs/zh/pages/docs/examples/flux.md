<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 `torch.compile` 在 H100 上快速运行 Flux

*更新：要加快另一个 >2 倍的推理速度，请查看额外的优化
我们在[这篇博文](https://modal.com/blog/flux-3x-faster)中尝试过的技术！*

在本指南中，我们将使用开源工具在 Modal 上尽可能快地运行 Flux。
我们将使用 `torch.compile` 和 NVIDIA H100 GPU。

## 设置镜像和依赖项

```python
import time
from io import BytesIO
from pathlib import Path

import modal

```

我们将使用完整的[CUDA工具包](https://modal.com/docs/guide/cuda)
在此示例中，我们将基于 `nvidia/cuda` 基础构建容器镜像。

```python
cuda_version = "12.4.0"  # should be no greater than host CUDA version
flavor = "devel"  # includes full CUDA toolkit
operating_sys = "ubuntu22.04"
tag = f"{cuda_version}-{flavor}-{operating_sys}"

cuda_dev_image = modal.Image.from_registry(
    f"nvidia/cuda:{tag}", add_python="3.11"
).entrypoint([])

```

现在我们使用 `apt` 和 `pip` 安装大部分依赖项。适用于 Hugging Face 的 [Diffusers](https://github.com/huggingface/diffusers) 库
我们从 GitHub 源安装，因此固定到特定的提交。

PyTorch 在 2.5 版本中为 Hopper GPU 添加了更快的注意力内核。

```python
diffusers_commit_sha = "81cf3b2f155f1de322079af28f625349ee21ec6b"

flux_image = (
    cuda_dev_image.apt_install(
        "git",
        "libglib2.0-0",
        "libsm6",
        "libxrender1",
        "libxext6",
        "ffmpeg",
        "libgl1",
    )
    .uv_pip_install(
        "invisible_watermark==0.2.0",
        "transformers==4.44.0",
        "huggingface-hub==0.36.0",
        "accelerate==0.33.0",
        "safetensors==0.4.4",
        "sentencepiece==0.2.0",
        "torch==2.5.0",
        f"git+https://github.com/huggingface/diffusers.git@{diffusers_commit_sha}",
        "numpy<2",
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1", "HF_HUB_CACHE": "/cache"})
)

```

稍后，我们还将使用`torch.compile`进一步提高速度。
每个新容器启动时都需要重新执行Torch编译，
因此我们打开一些额外的缓存来减少后续容器的编译时间。

```python
flux_image = flux_image.env(
    {
        "TORCHINDUCTOR_CACHE_DIR": "/root/.inductor-cache",
        "TORCHINDUCTOR_FX_GRAPH_CACHE": "1",
    }
)

```

最后，我们构建我们的模态 [App](https://modal.com/docs/reference/modal.App)，
将其默认图像设置为我们刚刚构建的图像，
并导入`FluxPipeline`以下载并运行Flux.1。

```python
app = modal.App("example-flux", image=flux_image)

with flux_image.imports():
    import torch
    from diffusers import FluxPipeline

```

## 定义参数化`Model`推理类
接下来，我们将模型的设置和推理代码映射到 Modal 上。

1. 我们在用`@modal.enter()`修饰的方法中运行模型设置。这包括加载
   权重并将其移动到 GPU，以及可选的 `torch.compile` 步骤（请参阅下面的详细信息）。
   `@modal.enter()` 装饰器确保此方法仅在新容器启动时运行一次，
   而不是在每次调用的路径中。

2. 我们在用`@modal.method()`修饰的方法中运行实际的推理。

*注：访问 Hugging Face 上的 Flux.1-schnell 模型是
[受许可协议限制](https://huggingface.co/docs/hub/en/models-gated)
您必须同意[这里](https://huggingface.co/black-forest-labs/FLUX.1-schnell)。
在您接受许可后，
[创建模态秘密](https://modal.com/secrets)
按照模板中的说明使用名称 `huggingface-secret`。*

```python
MINUTES = 60  # seconds
VARIANT = "schnell"  # or "dev"
NUM_INFERENCE_STEPS = 4  # use ~50 for [dev], smaller for [schnell]


@app.cls(
    gpu="H100",  # fast GPU with strong software support
    scaledown_window=20 * MINUTES,
    timeout=60 * MINUTES,  # leave plenty of time for compilation
    volumes={  # add Volumes to store serializable compilation artifacts, see section on torch.compile below
        "/cache": modal.Volume.from_name("hf-hub-cache", create_if_missing=True),
        "/root/.nv": modal.Volume.from_name("nv-cache", create_if_missing=True),
        "/root/.triton": modal.Volume.from_name("triton-cache", create_if_missing=True),
        "/root/.inductor-cache": modal.Volume.from_name(
            "inductor-cache", create_if_missing=True
        ),
    },
    secrets=[modal.Secret.from_name("huggingface-secret")],
)
class Model:
    compile: bool = (  # see section on torch.compile below for details
        modal.parameter(default=False)
    )

    @modal.enter()
    def enter(self):
        pipe = FluxPipeline.from_pretrained(
            f"black-forest-labs/FLUX.1-{VARIANT}", torch_dtype=torch.bfloat16
        ).to("cuda")  # move model to GPU
        self.pipe = optimize(pipe, compile=self.compile)

    @modal.method()
    def inference(self, prompt: str) -> bytes:
        print("🎨 generating image...")
        out = self.pipe(
            prompt,
            output_type="pil",
            num_inference_steps=NUM_INFERENCE_STEPS,
        ).images[0]

        byte_stream = BytesIO()
        out.save(byte_stream, format="JPEG")
        return byte_stream.getvalue()


```

## 调用我们的推理函数

要生成图像，我们只需要调用 `Model` 的 `generate` 方法
附加`.remote`。
您可以从任何有权访问您的 Modal 凭据的 Python 环境中调用 `.generate.remote`。
本地环境将以字节形式返回图像。

在这里，我们将调用包装在模态中 [`local_entrypoint`](https://modal.com/docs/reference/modal.App#local_entrypoint)
这样它就可以用 `modal run` 运行：

```bash
modal run flux.py
```

默认情况下，我们调用 `generate` 两次来演示速度有多快
推断是在冷启动之后。在我们的测试中，客户在大约 1.2 秒内收到图像。
我们将输出字节保存到临时文件中。

```python
@app.local_entrypoint()
def main(
    prompt: str = "a computer screen showing ASCII terminal art of the"
    " word 'Modal' in neon green. two programmers are pointing excitedly"
    " at the screen.",
    twice: bool = True,
    compile: bool = False,
):
    t0 = time.time()
    image_bytes = Model(compile=compile).inference.remote(prompt)
    print(f"🎨 first inference latency: {time.time() - t0:.2f} seconds")

    if twice:
        t0 = time.time()
        image_bytes = Model(compile=compile).inference.remote(prompt)
        print(f"🎨 second inference latency: {time.time() - t0:.2f} seconds")

    output_path = Path("/tmp") / "flux" / "output.jpg"
    output_path.parent.mkdir(exist_ok=True, parents=True)
    print(f"🎨 saving output to {output_path}")
    output_path.write_bytes(image_bytes)


```

## 使用 `torch.compile` 加速 Flux

默认情况下，我们会进行一些基本的优化，例如调整内存布局
并将注意力头投影重新表示为单个矩阵乘法。
但还有额外的加速！

PyTorch 2 添加了一个编译器来优化
计算在 PyTorch 执行期间动态创建的图。
此功能有助于缩小与静态图框架的性能差距
例如 TensorRT 和 TensorFlow。

在这里，我们遵循 Hugging Face 的建议
【快速扩散推理指南】(https://huggingface.co/docs/diffusers/en/tutorials/fast_diffusion),
我们用我们自己的内部基准进行了验证。
查看该指南以获取下面所做选择的详细说明。

根据我们的测试，编译后的 Flux `schnell` 部署将在一秒（约 700 毫秒）内将图像返回给客户端。
*超级施内尔*！

第一次迭代时编译最多需要二十分钟。
截至 2024 年年底撰写本文时，
编译工件无法完全序列化，
因此每次启动新容器时都必须重新执行一些编译工作。
这包括扩展现有部署或首次使用 `modal run` 调用函数时。

我们缓存 `nvcc`、`triton` 和 `inductor` 的编译输出，
这可以将编译时间缩短一个数量级。
详情请参阅【本教程】(https://pytorch.org/tutorials/recipes/torch_compile_caching_tutorial.html)。

您可以使用 `--compile` 标志打开编译。
尝试一下：

```bash
modal run flux.py --compile
```

`compile` 选项由我们类上的 [`modal.parameter`](https://modal.com/docs/reference/modal.parameter#modalparameter) 传递。
`parameter` 的每个不同选择都会创建一个[单独的自动扩展部署](https://modal.com/docs/guide/parameterized-functions)。
这意味着您的客户端可以使用任意逻辑来决定是命中已编译端点还是急切端点。

```python
def optimize(pipe, compile=True):
    # fuse QKV projections in Transformer and VAE
    pipe.transformer.fuse_qkv_projections()
    pipe.vae.fuse_qkv_projections()

    # switch memory layout to Torch's preferred, channels_last
    pipe.transformer.to(memory_format=torch.channels_last)
    pipe.vae.to(memory_format=torch.channels_last)

    if not compile:
        return pipe

    # set torch compile flags
    config = torch._inductor.config
    config.disable_progress = False  # show progress bar
    config.conv_1x1_as_mm = True  # treat 1x1 convolutions as matrix muls
    # adjust autotuning algorithm
    config.coordinate_descent_tuning = True
    config.coordinate_descent_check_all_directions = True
    config.epilogue_fusion = False  # do not fuse pointwise ops into matmuls

    # tag the compute-intensive modules, the Transformer and VAE decoder, for compilation
    pipe.transformer = torch.compile(
        pipe.transformer, mode="max-autotune", fullgraph=True
    )
    pipe.vae.decode = torch.compile(
        pipe.vae.decode, mode="max-autotune", fullgraph=True
    )

    # trigger torch compilation
    print("🔦 running torch compilation (may take up to 20 minutes)...")

    pipe(
        "dummy prompt to trigger torch compilation",
        output_type="pil",
        num_inference_steps=NUM_INFERENCE_STEPS,  # use ~50 for [dev], smaller for [schnell]
    ).images[0]

    print("🔦 finished torch compilation")

    return pipe

```