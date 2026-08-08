<!-- modal-docs: machine-translated zh-CN from English source -->

# 在 Modal 上使用 CUDA

Modal 可让您使用数据中心级 NVIDIA GPU 轻松加速工作负载。

要利用硬件，您需要使用匹配的软件：CUDA 堆栈。
本指南解释了该堆栈的组件以及如何在 Modal 上安装它们。
有关 Modal 上可用的 GPU 以及如何为您的用例选择 GPU 的更多信息，
请参阅[本指南](/docs/guide/gpu)。深入了解这两个方面
[GPU 硬件](/gpu-glossary/device-hardware) 和 [软件](/gpu-glossary/device-software)
有关 [CUDA 堆栈](/gpu-glossary/host-software/) 的更多详细信息，
请参阅我们的 [GPU 术语表](/gpu-glossary/readme)。

这是 tl;dr：

* [适用于 Linux-x86\_64 的 NVIDIA 加速显卡驱动程序](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/#driver-installation)，版本 580.95.05，
  和 [CUDA 驱动 API](https://docs.nvidia.com/cuda/archive/13.0.0/cuda-driver-api/index.html) 版本 13.0 已安装。
  您可以调用 `nvidia-smi` 或从任何可访问 GPU 的模态函数运行已编译的 CUDA 程序。
* 这意味着您可以安装许多流行的库，例如 `torch`，它们捆绑了其他 CUDA 依赖项 [使用简单的 `pip_install`](#install-gpu-accelerated-torch-and-transformers-with-pip_install)。
* 对于像`flash-attn`这样的前沿库，您可能需要手动安装CUDA依赖项。
为了让您的生活更轻松，[使用现有图像](#for-more-complex-setups-use-an-officially-supported-cuda-image)。

## 什么是 CUDA？

当有人提到“安装 CUDA”或“使用 CUDA”时，
他们指的不是图书馆，而是
[stack](/gpu-glossary/host-software/cuda-software-platform) 具有多个层。
您的应用程序代码（及其依赖项）可以交互
与不同级别的堆栈。

![CUDA 堆栈](../../assets/docs/cuda-stack-diagram.png)

这会导致很多混乱。为了帮助澄清这一点，以下部分详细解释了每个组件。

### Level 0：内核模式驱动程序组件

最低级别是[*内核模式驱动程序组件*](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/#nvidia-open-gpu-kernel-modules)。
Linux 内核本质上是操作整个机器及其所有硬件的单个程序。
为了向机器添加硬件，可以通过向其中加载新模块来扩展该程序。
这些组件直接与硬件（在本例中为 GPU）通信。

由于它们是内核模块，因此这些驱动程序组件与主机操作系统紧密集成
它运行容器化的模态函数，并且您无法自行检查或更改。
### 第 1 级：用户模式驱动程序 API

Linux 中所有不在内核中发生的操作都发生在 [用户空间](https://en.wikipedia.org/wiki/User_space) 中。
要从用户空间程序与内核驱动程序对话，我们需要*用户模式驱动程序组件*。

最突出的是，其中包括：

* [CUDA 驱动程序 API](/gpu-glossary/host-software/cuda-driver-api),
  一个名为 `libcuda.so` 的[共享对象](https://en.wikipedia.org/wiki/Shared_library)。
  该对象公开了类似 [`cuMemAlloc`](https://docs.nvidia.com/cuda/archive/12.8.0/cuda-driver-api/group__CUDA__MEM.html#group__CUDA__MEM_1gb82d2a09844a58dd9e744dc31e8aa467) 的函数，
  用于分配 GPU 内存。
* [NVIDIA管理库](https://developer.nvidia.com/management-library-nvml)、`libnvidia-ml.so`及其命令行界面[`nvidia-smi`](https://developer.nvidia.com/system-management-interface)。
  您可以使用这些工具来检查系统 GPU 的状态。

这些组件安装在所有可以访问 GPU 的 Modal 机器上。
因为它们是用户级组件，所以您可以直接使用它们：

```python runner:ModalRunner
import modal

app = modal.App()

@app.function(gpu="any")
def check_nvidia_smi():
    import subprocess
    output = subprocess.check_output(["nvidia-smi"], text=True)
    assert "Driver Version:" in output
    assert "CUDA Version:" in output
    print(output)
    return output
```

### 第 2 级：CUDA 工具包

包装 CUDA 驱动程序 API 的是 [CUDA Runtime API](/gpu-glossary/host-software/cuda-runtime-api)，即 `libcudart.so` 共享库。
该 API 包括 [`cudaLaunchKernel`](https://docs.nvidia.com/cuda/archive/12.8.0/cuda-runtime-api/group__CUDART__HIGHLEVEL.html#group__CUDART__HIGHLEVEL_1g7656391f2e52f569214adbfc19689eb3) 等函数
并且在 CUDA 程序中更常用（请参阅[此 HackerNews 评论](https://news.ycombinator.com/item?id=20616385) 了解原因的彩色评论）。
默认情况下，Modal 上“未”安装此共享库。
CUDA Runtime API 通常作为更大的 [NVIDIA CUDA Toolkit](https://docs.nvidia.com/cuda/index.html) 的一部分安装，
其中包括 [NVIDIA CUDA 编译器驱动程序](/gpu-glossary/host-software/nvcc) (`nvcc`) 及其工具链
以及许多用于编写和调试 CUDA 程序的 [有用的东西](/gpu-glossary/host-software/cuda-binary-utilities)（`cuobjdump`、`cudnn`、分析器等）。

现代 GPU 加速的机器学习工作负载（例如 LLM 推理）经常使用 CUDA 工具包的许多组件，
比如运行时编译库[`nvrtc`](https://docs.nvidia.com/cuda/archive/12.8.0/nvrtc/index.html)。

那么为什么这些组件不与驱动程序一起安装呢？
编译后的 CUDA 程序无需在系统上安装 CUDA Runtime API 即可运行，
通过[静态链接](https://en.wikipedia.org/wiki/Static_library) CUDA Runtime API 到程序二进制文件中，
尽管这对于 CUDA 加速的 Python 程序来说相当罕见。
此外，某些应用程序需要这些组件的旧版本
有些应用程序部署甚至同时使用多个版本。
这两种模式都与 Modal 上提供的主机驱动程序兼容。

## 安装 GPU 加速的 `torch` 和 `transformers` 以及 `pip_install`

CUDA工具包的组件可以通过`pip`安装，
通过 PyPI 包，例如 [`nvidia-cuda-runtime-cu12`](https://pypi.org/project/nvidia-cuda-runtime-cu12/)
和[`nvidia-cuda-nvrtc-cu12`](https://pypi.org/project/nvidia-cuda-nvrtc-cu12/)。
这些组件被列为一些流行的 GPU 加速 Python 库的依赖项，例如 `torch`。

因为Modal已经包含了CUDA堆栈的较低部分，所以您可以安装这些库
使用 [`modal.Image` 的 `pip_install` 方法](/docs/guide/images#add-python-packages-with-pip_install)，就像任何其他 Python 库一样：

```python
image = modal.Image.debian_slim().pip_install("torch")


@app.function(gpu="any", image=image)
def run_torch():
    import torch
    has_cuda = torch.cuda.is_available()
    print(f"It is {has_cuda} that torch can access CUDA")
    return has_cuda
```

许多用于运行开放权重模型的库，例如 `transformers` 和 `vllm`，
在引擎盖下使用`torch`，因此可以以相同的方式安装：

```python
image = modal.Image.debian_slim().pip_install("transformers[torch]")
image = image.apt_install("ffmpeg")  # for audio processing


@app.function(gpu="any", image=image)
def run_transformers():
    from transformers import pipeline
    transcriber = pipeline(model="openai/whisper-tiny.en", device="cuda")
    result = transcriber("https://modal-cdn.com/mlk.flac")
    print(result["text"])  # I have a dream that one day this nation will rise up live out the true meaning of its creed
```## 对于更复杂的设置，请使用官方支持的 CUDA 映像

通过`pip`安装CUDA堆栈的缺点是
许多其他依赖于其组件作为普通系统包安装的库无法找到它们。

对于这些情况，我们建议您使用已将完整 CUDA 堆栈安装为系统包的映像
并且所有环境变量设置正确，例如 [Docker Hub 上的`nvidia/cuda:*-devel-*` 镜像](https://hub.docker.com/r/nvidia/cuda)。

[TensorRT-LLM](https://nvidia.github.io/TensorRT-LLM/overview.html) 是一种推理引擎，可加速和优化大型语言模型的性能。它需要完整的 CUDA 工具包才能安装。

```python
cuda_version = "12.8.1"  # should be no greater than host CUDA version
flavor = "devel"  # includes full CUDA toolkit
operating_sys = "ubuntu24.04"
tag = f"{cuda_version}-{flavor}-{operating_sys}"
HF_CACHE_PATH = "/cache"


image = (
    modal.Image.from_registry(f"nvidia/cuda:{tag}", add_python="3.12")
    .entrypoint([])  # remove verbose logging by base image on entry
    .apt_install("libopenmpi-dev")  # required for tensorrt
    .pip_install("tensorrt-llm==0.19.0", "pynvml", extra_index_url="https://pypi.nvidia.com")
    .pip_install("hf-transfer", "huggingface_hub[hf_xet]")
    .env({"HF_HUB_CACHE": HF_CACHE_PATH, "HF_HUB_ENABLE_HF_TRANSFER": "1", "PMIX_MCA_gds": "hash"})
)


app = modal.App("tensorrt-llm", image=image)
hf_cache_volume = modal.Volume.from_name("hf_cache_tensorrt", create_if_missing=True)


@app.function(gpu="A10G", volumes={HF_CACHE_PATH: hf_cache_volume})
def run_tiny_model():
    from tensorrt_llm import LLM, SamplingParams

    sampling_params = SamplingParams(temperature=0.8, top_p=0.95)

    llm = LLM(model="TinyLlama/TinyLlama-1.1B-Chat-v1.0")

    output = llm.generate("The capital of France is", sampling_params)
    print(f"Generated text: {output.outputs[0].text}")
    return output.outputs[0].text
```
确保选择的 CUDA 版本不高于主机提供的版本。
`12.*`和`13.*`系列中的旧版本保证与主机驱动程序兼容，
但较旧的主要版本（`11.*`、`10.*`等）可能不是。

## 接下来怎么办？

有关在 Modal 上访问和选择 GPU 的更多信息，请查看[本指南](/docs/guide/gpu)。
要深入了解 GPU 内部结构，请查看我们的 [GPU 术语表](/gpu-glossary/readme)。

要查看这些安装模式的实际效果，请查看以下示例：

* [大型 GPU 上的快速 LLM 推理](/docs/examples/llm_inference)
* [为您的宠物微调角色 LoRA](/docs/examples/diffusers_lora_finetune)
* [优化通量推断](/docs/examples/flux)