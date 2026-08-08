<!-- modal-docs: machine-translated zh-CN from English source -->

# 内存快照

模态内存快照可以通过跳过大多数容器启动时的初始化工作来显着减少模态函数的[冷启动](/docs/guide/cold-start)延迟。

例如，在初始化期间，您的代码可能会顺序发出许多文件读取操作，
就像加载 `torch` 所需的 >20,000 个文件操作。
然后它可能会运行一个 JIT 编译器，这需要几分钟或更长时间，
就像 PyTorch 中的那样。
内存快照通过直接恢复工作创建的内存状态来取代此初始化工作。

相对加速是无限的：为了创建更少的字节而做的工作越多，加速就越大。
根据我们的经验，实际的初始化繁重的函数经常会启动
[内存快照速度提高 3-10 倍](/blog/gpu-mem-snapshots)。

内存快照有两种变体。
[CPU 内存快照](#cpu-memory-snapshots) 捕获 CPU 内存的状态。
[GPU 内存快照](#gpu-memory-snapshots) 是一项 [alpha 功能](/docs/guide/feature-maturity)，也可以捕获 GPU 内存的状态。

## CPU 内存快照

CPU 内存快照捕获容器的状态并将其保存到磁盘。
然后可以使用保存的快照将新容器直接置于完全相同的状态。

您可以使用 `enable_memory_snapshot=True` 参数为您的函数启用内存快照：

```python
@app.function(enable_memory_snapshot=True)
def my_func():
    ...
```

然后部署应用程序，例如与`modal deploy`。内存快照仅为已部署的应用程序创建。

在全局范围内执行的任何代码（例如导入）都将被捕获在内存快照中。
使用 [`Image.imports` 上下文管理器](/docs/sdk/py/latest/Image#imports)
在全局范围内导入仅远程依赖项。

```python
image = modal.Image.debian_slim().uv_pip_install("pandas")

with image.imports():
    import pandas as pd


@app.function(enable_memory_snapshot=True, image=image)
def my_func():
    print(f"pandas v{pd.__version__}")
```

## 容器生命周期挂钩和内存快照

Modal 的 [容器生命周期挂钩](/docs/guide/lifecycle-functions)
对容器初始化的哪些部分进行工作提供额外的控制
包含在内存快照中。输入您要运行的初始化代码
在用 `@modal.enter(snap=True)` 装饰的方法内进行快照之前。

```python
@app.cls(enable_memory_snapshot=True)
class MyCls:
    @modal.enter(snap=True)
    def load(self):
        ...  # will be snapshot

    @modal.enter()
    def load_more(self):
        ...  # will not be snapshot
```

## GPU 内存快照

<Callout variant="alpha" />

GPU 内存快照建立在 CPU 内存快照的基础上，并另外捕获 GPU 状态。

除了`enable_memory_snapshot=True`之外，
将 `experimental_options={"enable_gpu_snapshot": True}` 传递给您的函数或 Cls
启用 GPU 内存快照。

```python
@app.function(
    gpu="a10",
    enable_memory_snapshot=True,
    experimental_options={"enable_gpu_snapshot": True}
    )
def my_gpu_func():
    ...
```

您通常会希望包含任何昂贵的初始化工作
需要内存快照中的 GPU。
使用模态 [Cls](/docs/guide/lifecycle-functions)
并将该工作放入 `@modal.enter` 方法中，
像这样：

```python
image = modal.Image.debian_slim().uv_pip_install("transformers[torch]")

with image.imports():
     import torch
     from transformers import pipeline


@app.cls(
    gpu="h100",
    enable_memory_snapshot=True,
    experimental_options={"enable_gpu_snapshot": True},
    image=image,
)
class Llm:
    @modal.enter(snap=True)
    def init(self):
        self.pipeline = pipeline(model="Qwen/Qwen3-1.7B", device_map="cuda")
        self.pipeline.model = torch.compile(self.pipeline.model, mode="reduce-overhead")
        context = [{"role": "user", "content": DEFAULT_PROMPT}]
        self.pipeline(context)
```

您可以在[此处](/docs/examples/gpu_snapshot)找到完整的代码示例。

我们建议通过对样本数据运行一些前向传递来预热您的模型
在 `@modal.enter(snap=True)` 方法中将更多初始化工作移至快照阶段。
如果没有预热，这项工作通常是在容器启动后的前几个请求上完成的
（无论是否使用内存快照），
这显示为尾部延迟。

### GPU 内存快照的限制

[我们已经看到](/blog/gpu-mem-snapshots) GPU 内存快照可以大大减少冷启动时间，
但它们受到某些限制。
设备驱动程序中的底层检查点/恢复技术
还是蛮新的。我们预计这些限制将随着驱动程序的更新而得到解决。
我们建议查看以下材料
在将 GPU 内存快照添加到模态函数之前。

#### 您可能需要重写代码以实现兼容性或提高性能

虽然大多数 GPU 加速模态函数可以利用 GPU 内存快照，
除了下述限制外，
大多数函数需要重写一些代码以确保与 GPU 内存快照的兼容性
或实现性能改进。

对于更复杂的推理引擎尤其如此，
就像那些用于最大化 [LLM 推理性能](/docs/guide/high-performance-llm-inference) 的方法。
例如，通常最好在拍摄快照之前丢弃初始的、未填充的 KV 缓存，
然后在恢复时重新创建它，而不是在快照中写入然后读取 KV 缓存的无意义页面。
请参阅[此 vLLM 示例](/docs/examples/vllm_snapshot)
和[此示例使用 SGLang](/docs/examples/sglang_snapshot)
获取示例代码、模式和其他指导。

#### GPU 内存快照通常与多 GPU 代码不兼容

虽然一些与多个GPU交互的简单程序可以成功快照，
多个 GPU 的大多数实际使用都存在已知问题，
源于多进程和多 GPU 资源管理问题。
我们预计未来的驱动程序会有所改进。

#### GPU 内存快照通常与非 CUDA GPU 代码不兼容
例如，在快照之前使用图形功能通常会导致失败。

#### GPU 内存快照不会加快从存储加载模型的速度

内存快照使用相同的高性能分布式文件系统
提供模态[图像](/docs/guide/images)
和模态 [卷](/docs/guide/volumes)
以最短的延迟和最大的吞吐量传输到我们全球的集装箱船队。

这意味着如果大部分初始化延迟都花在加载权重上，
GPU 内存快照通常不会改善冷启动时间 --
甚至可能通过增加开销而使情况变得更糟。
相反，内存快照应该主要用于“跳过”工作
不受存储带宽的瓶颈，例如库初始化（导入）
和 JIT 编译（Torch、DeepGEMM、Triton 等）。

#### GPU 内存快照与 `torch.compile` 的交互效果不佳

在某些情况下，运行 Torch Compiler 可能会导致内存快照创建失败。

其中一些故障可以通过在编译前将环境变量 `TORCHINDUCTOR_COMPILE_THREADS` 设置为 `1` 来修复。

## 内存快照常见问题解答

### 我如何知道是否正在创建或使用内存快照？
您可以在函数的“容器”选项卡中查看正在运行的内存快照。创建内存快照的容器在“启动”列中标有 <CloudUpload size={16} class="inline opacity-80" /> 图标。从快照恢复的容器标有 <CloudLightning size={16} class="inline opacity-80" /> 图标。在下面的屏幕截图中，从内存快照恢复时容器的启动时间明显更快。

![快照图标](https://modal-cdn.com/cdnbot/memory-snapshot-iconss6tm168n_cb303ec9.webp)

您还可以在 Modal 应用程序的日志中搜索行 `Snapshot created. Restoring Function from memory snapshot.`

### 内存快照何时更新？

使用新配置重新部署您的函数（例如[新 GPU 类型](/docs/guide/gpu)）
或者新代码将导致以前的内存快照变得过时。
对新函数版本的后续调用将自动使用新配置和代码创建新的内存快照。

对[模式卷](/docs/guide/volumes) 的更改不会导致内存快照更新。
删除恢复期间使用的卷中的文件将导致恢复失败。

### 我没有改变我的功能。为什么我有时仍会看到正在创建内存快照？

Modal 重新捕获内存快照以跟上平台最新的运行时和安全更改。
此外，您可能会观察到您的函数在前几次调用期间多次被快照。
发生这种情况是因为内存快照特定于创建它们的底层工作线程类型
（例如 CPU 标志），模态函数在少数工作类型上运行。

快照创建可能会给函数初始化增加一些延迟。

仅 CPU 的函数需要大约 6 个快照才能完全覆盖，而针对特定目标的函数
GPU（例如A100）需要2-3个。

### 内存快照如何处理随机性？

如果您的申请取决于州的独特性，您必须评估您的
功能代码并验证它是否能够适应快照操作。对于
例如，如果一个变量是随机初始化的并且该值包含在内存快照中，
每次恢复后该变量都将相同，这可能会打破唯一性期望
后面的代码。

## 内存快照的高级用法

### 使用 GPU 而不使用 GPU 内存快照

CPU 内存快照本身会阻止 GPU 访问，
但 GPU 功能仍然可以从内存快照中受益。
这涉及重构初始化代码以在两个单独的 `@modal.enter` 函数上运行：
在创建快照之前运行的一个 (`snap=True`)，
以及从快照恢复后运行的一个 (`snap=False`)。

例如，您可以使用 `snap=True` 方法将模型权重加载到 CPU 内存中，
然后通过 `snap=False` 方法将权重移动到 GPU 内存上。

即使没有 GPU 快照，该技术也可以减少 `Embedder.run` 的启动时间
在下面的示例中，速度提高了约 3 倍，从约 6 秒缩短到约 2 秒。

```python
import modal

image = modal.Image.debian_slim().uv_pip_install("sentence-transformers")
app = modal.App("sentence-transformers", image=image)

with image.imports():
    from sentence_transformers import SentenceTransformer

model_vol = modal.Volume.from_name("sentence-transformers-models", create_if_missing=True)


@app.cls(gpu="a10", volumes={"/models": model_vol}, enable_memory_snapshot=True)
class Embedder:
    model_id = "BAAI/bge-small-en-v1.5"

    @modal.enter(snap=True)
    def load(self):
        # Create a memory snapshot with the model loaded in CPU memory.
        self.model = SentenceTransformer(f"/models/{self.model_id}", device="cpu")

    @modal.enter(snap=False)
    def setup(self):
        self.model.to("cuda")  # Move the model to the GPU!

    @modal.method()
    def run(self, sentences:list[str]):
        embeddings = self.model.encode(sentences, normalize_embeddings=True)
        print(embeddings)


@app.local_entrypoint()
def main():
    Embedder().run.remote(sentences=["what is the meaning of life?"])


if __name__ == "__main__":
    cls = modal.Cls.from_name("sentence-transformers", "Embedder")
    cls().run.remote(sentences=["what is the meaning of life?"])
```

#### GPU 在仅 CPU 内存快照中不可用

如果您使用 GPU 内存快照功能 (`enable_gpu_snapshot`)，则
GPU 在 `@modal.enter(snap=True)` 中可用。如果您使用内存快照*没有* `enable_gpu_snapshot`，那么这一点很重要
请注意，GPU 在 `@modal.enter(snap=True)` 方法中不可用。

```python
image = modal.Image.debian_slim().uv_pip_install("torch", "numpy")


@app.cls(enable_memory_snapshot=True, gpu="a10", image=image)
class GPUAvailability:
    @modal.enter(snap=True)
    def no_gpus_available_during_snapshots(self):
        import torch
        print(f"GPUs available: {torch.cuda.is_available()}")  # False

    @modal.enter(snap=False)
    def gpus_available_following_restore(self):
        import torch
        print(f"GPUs available: {torch.cuda.is_available()}")  # True

    @modal.method()
    def demo(self):
        print(f"GPUs available: {torch.cuda.is_available()}") # True
```

#### 在仅 CPU 内存快照期间注意意外 GPU 初始化

`torch.cuda`模块有多个函数，如果在
快照，会将 CUDA 初始化为具有零个 GPU 设备。此类功能
包括`torch.cuda.is_available`和`torch.cuda.get_device_capability`。
如果您使用的框架在导入阶段调用这些方法，
它可能与内存快照不兼容。问题可以表现为
令人困惑的“cuda 不可用”或“未检测到支持 CUDA 的设备”错误。
我们发现导入 PyTorch 两次可以在某些情况下解决问题：

```python

@app.cls(enable_memory_snapshot=True, gpu="A10")
class GPUAvailability:
    @modal.enter(snap=True)
    def pre_snap(self):
        import torch
        ...
    @modal.enter(snap=False)
    def post_snap(self):
        import torch   # re-import to re-init GPU availability state
        ...
```

特别是，已知 `xformers` 会调用 `torch.cuda.get_device_capability`
导入，因此如果在快照期间导入它，它可能无助于初始化
零 GPU 的 CUDA。的
[解决方法](https://github.com/facebookresearch/xformers/issues/1030) 为此
就是将`modal.Image`中的`XFORMERS_ENABLE_TRITON`环境变量设置为`1`。

```python
image = modal.Image.debian_slim().pip_install("xformers>=0.28")  # for instance
image = image.env({"XFORMERS_ENABLE_TRITON": "1"})
```