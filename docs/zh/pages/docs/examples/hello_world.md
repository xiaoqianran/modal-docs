<!-- modal-docs: machine-translated zh-CN from English source -->

＃ 你好世界！

本教程演示了 Modal 的一些核心功能：

* 您可以像在本地运行函数一样轻松地在 Modal 上运行函数。
* 在 Modal 上并行运行函数既简单又快速。
* 日志和错误立即显示，即使对于在 Modal 上运行的函数也是如此。

## 导入 Modal 并设置

我们首先导入 `modal` 并创建一个 `App`。
我们构建这个`App`来[定义我们的应用程序](https://modal.com/docs/guide/apps)。

```python
import sys

import modal

app = modal.App("example-hello-world")

```

## 定义一个函数

Modal 获取代码并在云中运行它。

所以首先我们必须编写一些代码。让我们编写一个接受输入的简单函数，
将日志或错误打印到控制台，
然后返回一个输出。

为了使这个函数与 Modal 一起工作，我们只需将它包装在一个装饰器中，
[`@app.function`](https://modal.com/docs/reference/modal.App#function)。

```python
@app.function()
def f(i):
    if i % 2 == 0:
        print("hello", i)
    else:
        print("world", i, file=sys.stderr)

    return i * i


```

## 本地、远程和并行运行我们的函数

现在让我们看看调用该函数的三种不同方式：

1. 作为对`local`机器的常规调用，使用`f.local`

2. 作为在云端运行的`remote`调用，带有`f.remote`

3. 通过 `map` 在云中通过多个输入 ping `f` 的多个副本，以及 `f.map`

我们在下面的 `main` 函数中以每种方式调用 `f`。

```python
@app.local_entrypoint()
def main():
    # run the function locally
    print(f.local(1000))

    # run the function remotely on Modal
    print(f.remote(1000))

    # run the function in parallel and remotely on Modal
    total = 0
    for ret in f.map(range(200)):
        total += ret

    print(total)


```
在 shell 中输入 `modal run hello_world.py`，您将看到 Modal 应用程序初始化。
然后您将看到 `print`ed 日志
`main` 函数，以及与它们混合的 `f` 运行时的所有日志
本地，然后远程，然后远程并行。

这都是通过添加触发的
[`@app.local_entrypoint`](https://modal.com/docs/reference/modal.App#local_entrypoint)
`main`上的装饰器，将其定义为当我们调用`modal run`时从本地启动的函数。

## 刚刚发生了什么？

当我们在`f`上调用`.remote`时，函数就被执行了
*在云中*，在 Modal 的基础设施上，而不是在本地计算机上。简而言之，我们将函数`f`放入容器中，
向其发送输入，并流回日志和输出。

## 但这为什么重要呢？

接下来尝试其中一项，开始了解 Modal 的全部威力！

### 你可以更改代码并再次运行

例如，更改函数`f`中的`print`语句
打印 `"spam"` 和 `"eggs"` 并再次运行应用程序。
您将看到您的新代码无需您进行额外的工作即可运行 -
它甚至应该运行得更快！

Modal 的目标是让在云端运行代码感觉就像是在
在本地运行代码。这意味着当您刚刚移动逗号时，无需等待长时间的图像构建，
无需摆弄容器映像推送，也无需上下文切换到 Web UI 来检查日志。

### 您可以映射更多数据

将 `map` 范围从 `200` 更改为某个较大的数字，例如 `1170`。你会看到
Modal 这次会并行创建并运行更多容器。

而且它会闪电般地发生！

### 你可以运行更有趣的函数

函数`f`有点傻，没有做太多事情，但在它的位置
想象一些对你来说重要的事情，比如：

* 运行【语言模型推理】(https://modal.com/docs/examples/vllm_inference)
  或[微调](https://modal.com/docs/examples/slack-finetune)
* 操作[音频](https://modal.com/docs/examples/musicgen)
  或[图片](https://modal.com/docs/examples/diffusers_lora_finetune)
* [嵌入巨大的文本数据集](https://modal.com/docs/examples/amazon_embeddings) 以闪电般的速度

Modal 允许您通过运行数百个或
云中的数千个容器。