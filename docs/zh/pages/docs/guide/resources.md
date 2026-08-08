<!-- modal-docs: machine-translated zh-CN from English source -->

# 配置CPU、内存和磁盘

每个模态函数或沙箱容器的默认请求为 0.125 个 CPU 核心和 128 MiB 内存。
如果工作线程有可用的 CPU 或内存，容器可能会超过此最小值。
您还可以通过请求更大的值来保证访问更多资源，[类似于 Kubernetes](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)。

本指南涵盖了 [函数](/docs/guide/apps#apps-functions-and-entrypoints) 的资源配置
和[沙箱](/docs/guide/sandboxes)。有关沙箱特定的定价指南和
成本优化，请参阅[沙盒定价和资源](/docs/guide/sandbox-resources)。

## CPU 核心

如果您的代码必须在更多内核上运行，您可以
请求使用 `cpu` 参数。这允许您指定一个
CPU核心的浮点数：

```python
import modal

app = modal.App()

@app.function(cpu=8.0)
def my_function():
    # code here will have access to at least 8.0 cores
    ...
```

请注意，该值对应于物理核心，而不是 vCPU。

Modal还会设置几个控制多线程的环境变量
线性代数和推理库中的行为（例如，
`OPENBLAS_NUM_THREADS`、`OMP_NUM_THREADS`、`MKL_NUM_THREADS`、
`ORT_INTRA_OP_NUM_THREADS`) 基于您的 CPU 请求。

## 内存

如果您的代码需要更多有保证的内存，您可以使用
`memory` 论证。这需要整数兆字节：

```python
import modal

app = modal.App()

@app.function(memory=32768)
def my_function():
    # code here will have access to at least 32 GiB of RAM
    ...
```

## 我可以请求多少？

对于 CPU 和内存，在函数或沙箱创建时强制执行最大值
确保您的容器可以安排执行。请求超过
最大将被拒绝
[`InvalidError`](/docs/sdk/py/latest/exception#invaliderror)。

## 计费

对于 CPU 和内存，我们将根据您的请求或实际使用情况（以较高者为准）向您收费。

磁盘请求按 20:1 的比例增加内存请求来计费。例如，请求 500 GiB 磁盘会将内存请求增加到 25 GiB（如果尚未设置得更高）。

## 资源限制

### CPU 限制

模态容器具有默认的软 CPU 限制，设置为高于 CPU 请求 16 个物理核心。
鉴于默认 CPU 请求为 0.125 个核心，默认软 CPU 限制为 16.125 个核心。
超过此限制，主机将开始限制容器的 CPU 使用率。

您也可以显式设置 CPU 限制：

```python
cpu_request = 1.0
cpu_limit = 4.0
@app.function(cpu=(cpu_request, cpu_limit))
def f():
    ...
```

### 内存限制

模态容器可能有硬内存限制，这会导致“内存不足”(OOM) 终止
试图超过限制的容器。当进程
存在严重的内存泄漏。您可以设置限制并杀死容器以避免付费
对于泄漏的 GB 内存。

使用 [`@app.function()`](/docs/sdk/py/latest/App#function) 或 [`Sandbox.create()`](/docs/sdk/py/latest/Sandbox#create) 上的 `memory` 参数指定此限制：

```python
mem_request = 1024
mem_limit = 2048
@app.function(
    memory=(mem_request, mem_limit),
)
def f():
    ...
```

### 磁盘限制

运行的 Modal 容器可以访问许多 GB 的 SSD 磁盘，但数量
写入次数受限于：

1、底层worker的SSD盘容量大小
2. 每个容器的磁盘配额默认为 512 GiB。

达到任一限制都会导致容器的磁盘写入被拒绝，这
通常表现为`OSError`。

可以使用 [`@app.function()`](/docs/sdk/py/latest/App#function) 上的 `ephemeral_disk` 参数请求增加磁盘大小。最大
磁盘大小为 3.0 TiB (3,145,728 MiB)。较大的磁盘旨在用于[数据集处理](/docs/guide/dataset-ingestion)。