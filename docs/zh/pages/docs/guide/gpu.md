<!-- modal-docs: machine-translated zh-CN from English source -->

#GPU加速

Modal 使您可以轻松地在 [GPU](/gpu-glossary/readme) 上运行代码。

## 快速入门

以下是在 Modal 中 A100 上运行的函数的简单示例：

```python
import modal

image = modal.Image.debian_slim().pip_install("torch", "numpy")
app = modal.App(image=image)


@app.function(gpu="A100")
def run():
    import torch

    assert torch.cuda.is_available()
```

## 指定GPU类型

您可以通过 `gpu` 参数为您的函数选择特定的 GPU 类型。
Modal 支持此参数的以下值：

* `T4`
* `L4`
* `A10`
* `L40S`
* `A100`
* `A100-40GB`
* `A100-80GB`
* `RTX-PRO-6000`
*`H100`/`H100!`
* `H200`
* `B200`/`B200+`
* `B300`

例如，要使用 B200，您可以使用 `@app.function(gpu="B200")`。

请参阅我们的[定价页面](/pricing)，了解每种 GPU 类型的最新定价。

## 指定 GPU 数量您可以通过将 `:n` 附加到 GPU 来为每个容器指定超过 1 个 GPU
论点。例如，要运行具有八个 H100 的函数：

```python

@app.function(gpu="H100:8")
def run_llama_405b_fp8():
    ...
```

目前 B300、B200、H200、H100、A100、L4、T4 和 L40S 实例最多支持 8 个 GPU（最高 2,304 GB GPU RAM），
A10 实例最多支持 4 个 GPU（最高 96 GB GPU RAM）。请注意，请求
每个容器超过 2 个 GPU 通常会导致更长的等待时间。这些
GPU 始终连接到同一台物理机器。

## 选择 GPU

对于运行（而不是训练）神经网络，我们建议从
与[L40S](https://resources.nvidia.com/en-us-l40s/l40s-datasheet-28413)，
它提供了成本和性能的完美平衡以及 48 GB GPU
RAM 用于存储模型权重和激活。

有关如何选择用于 LLaMA 或 Stable 等神经网络的 GPU 的更多信息
扩散，以及有关如何使 GPU 变得更好的提示，请查看
[Tim Dettemers 的博文](https://timdettmers.com/2023/01/30/which-gpu-for-deep-learning/)
或
[云 GPU 上的全栈深度学习页面](https://fullstackdeeplearning.com/cloud-gpus/)。

## B300 GPU

[B300s](https://www.nvidia.com/en-us/data-center/dgx-b300/) 是 NVIDIA
Blackwell Ultra GPU，基于 Blackwell [架构](/gpu-glossary/device-hardware/streaming-multiprocessor-architecture)。

要请求 B300，请将 `gpu` 参数设置为 `"B300"`：

```python
@app.function(gpu="B300:8")
def run_inference():
    ...
```

B300 需要 CUDA 版本 13.1+。确保您的容器镜像和库
在请求 B300 之前与 CUDA 13 兼容。

## B200 GPU

B200 是 [NVIDIA 数据中心 GPU](https://www.nvidia.com/en-us/data-center/dgx-b200/)
基于 Blackwell [架构](/gpu-glossary/device-hardware/streaming-multiprocessor-architecture)。

要请求 B200，请将 `gpu` 参数设置为 `"B200"`

```python
@app.function(gpu="B200:8")
def run_deepseek():
    ...
```

查看[此示例](/docs/examples/llm_inference)，了解如何使用 B200 最大限度地发挥 LLaMA 3.1-8B 的 vLLM 服务性能。

在选择这款强大的 GPU 之前，请确保您了解瓶颈在哪里
都在你的计算中。例如，运行小批量的语言模型
（例如一次一个提示）会导致[内存瓶颈，而不是算术瓶颈](https://kipp.ly/transformer-inference-arithmetic/)。
由于近年来算术吞吐量的增长速度快于内存吞吐量
硬件世代，受内存限制的 GPU 作业的加速并不那么极端
可能不值得额外的费用。

### 选择升级到 B300

使用 `gpu="B200+"` 允许 Modal 在 B200 或 B300 GPU 上运行请求。
无论使用哪种 GPU，B200+ 的计费方式都是 B200。仅使用此选项
如果您的代码与这两种类型的 GPU 兼容。 B300需要CUDA版本
13.1+。使用此功能可以自动访问更大的容量池。

## H200 和 H100 GPU

[H200s](https://www.nvidia.com/en-us/data-center/h200/) 和 [H100s](https://www.nvidia.com/en-us/data-center/h100/) 是之前的
NVIDIA 的新一代顶级数据中心芯片，基于 Hopper [架构](/gpu-glossary/device-hardware/streaming-multiprocessor-architecture)。
这些 GPU 比 Blackwell GPU 具有更好的软件支持（例如，流行的库包括 Hopper 的预编译内核，但不包括 Blackwell），
而且它们通常能够以具有竞争力的成本完成工作，因此无论是在 Modal 还是非 Modal，它们都是加速器的常见选择。
Modal 平台上的所有 H100 GPU 都是 SXM 变体，这可以通过检查
[功耗](/docs/guide/gpu-metrics) 在仪表板中或使用 `nvidia-smi`。

### 自动升级到 H200

Modal 可以自动升级`gpu="H100"` 请求以在 H200 上运行。
这种自动升级不会改变 GPU 的成本。

与 H200 兼容的内核也与 H100 兼容，
因此，只要不对内存容量做出严格的假设，您的代码仍然可以运行，只是速度更快。
H200 的 [HBM3e 内存](/gpu-glossary/device-hardware/gpu-ram)
容量为 141 GB，带宽为 4.8TB/s，比采用 HBM3 的 NVIDIA H100 大 1.75 倍，快 1.4 倍。

如果自动升级到 H200 没有帮助（例如，基准测试），您可以通过
`gpu=H100!`以避免它。

## A100 GPU

[A100s](https://www.nvidia.com/en-us/data-center/a100/) 基于 NVIDIA 的 Ampere [架构](/gpu-glossary/device-hardware/streaming-multiprocessor-architecture)。
Modal 提供两个版本的 A100：一个具有 40 GB RAM，另一个具有 80 GB RAM。

要请求具有 40 GB [GPU 内存](/gpu-glossary/device-hardware/gpu-ram) 的 A100，请使用 `gpu="A100"`：

```python
@app.function(gpu="A100")
def qwen_7b():
    ...
```
Modal 可能会自动升级 `gpu="A100"` 请求以在 80 GB A100 上运行。
这种自动升级不会改变 GPU 的成本。

您可以使用字符串 `A100-40GB` 特别请求 40GB A100。
要专门请求 80 GB A100，请使用字符串 `A100-80GB`：

```python
@app.function(gpu="A100-80GB")
def llama_70b_fp8():
    ...
```

## GPU 回退

Modal 允许指定可能的 GPU 类型列表，适用于以下功能
兼容多种选项。 Modal 尊重此列表的顺序并且
将尝试分配最首选的 GPU 类型，然后再回退到较少的 GPU 类型
首选。

```python
@app.function(gpu=["H100", "A100-40GB:2"])
def run_on_80gb():
    ...
```

有关更多详细信息，请参阅[此示例](/docs/examples/gpu_fallbacks)。

## 多GPU训练

Modal 目前支持在单节点上进行多 GPU 训练，并在私有 Beta 版中支持多节点训练（请发送电子邮件至 support@modal.com 获取访问权限）。
根据您使用的框架，您可能需要使用不同的技术在多个 GPU 上进行训练。

如果框架重新执行 Python 进程的入口点（例如 [PyTorch Lightning](https://lightning.ai/docs/pytorch/stable/index.html)），如果您希望直接调用训练，则需要将策略设置为 `ddp_spawn` 或 `ddp_notebook`。另一种选择是将训练脚本作为子进程运行。

```python
@app.function(gpu="A100:2")
def run():
    import subprocess
    import sys
    subprocess.run(
        ["python", "train.py"],
        stdout=sys.stdout, stderr=sys.stderr,
        check=True,
    )
```
## 示例和更多资源

有关 GPU 的更多一般信息，请查看我们的 [GPU 术语表](/gpu-glossary/readme)。

或者看一下使用 GPU 的模态应用程序的一些示例：

* [为你的宠物微调角色 LoRA](/docs/examples/diffusers_lora_finetune)
* [大型 GPU 上的快速 LLM 推理](/docs/examples/llm_inference)
* [使用 CLI、API 和 Web UI 实现稳定扩散](/docs/examples/text_to_image)
* [渲染 Blender 视频](/docs/examples/blender_video)

<YoutubeEmbed videoId="MLvC7W_b6SA"/>