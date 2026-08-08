<!-- modal-docs: machine-translated zh-CN from English source -->

# 输入并发数

本指南记录了 `modal.concurrent` 装饰器的使用
在单个 Modal 容器中同时处理多个输入。

本页是输入并发的高级指南。供参考文档
`modal.concurrent`装饰器的详细信息，请参阅[本页](/docs/sdk/py/latest/concurrent)。

## 概述

随着应用程序流量的增加，Modal 会自动扩展
运行您的函数的容器数量：

<div class="flex justify-center"><NoConcurrentInputs /></div>

默认情况下，每个容器一次会分配一个输入。自动缩放
跨容器允许您的函数并行处理输入。这是
当您的函数执行的操作受 CPU 限制时，这是理想的选择。

但对于某些工作负载，容器处理输入的效率很低
一对一。 Modal 通过其“输入并发”功能支持这些工作负载，
它允许单个容器同时处理多个输入：

<div class="flex justify-center"><WithConcurrentInputs /></div>

如果有效使用，输入并发可以减少延迟并降低成本。

## 用例

输入并发对于主要是
I/O 限制，例如：

* 查询数据库
* 发出外部API请求
* 远程调用其他模态函数

对于此类工作负载，各个容器可能能够同时处理
大量输入，且附加延迟最小。这意味着您的
模态应用程序总体上会更加高效，因为它不需要扩展
集装箱随着交通的涨落而上下。

另一个用例是在 GPU 加速上利用“连续批处理”
容器。 [vLLM](/docs/examples/llm_inference) 等框架可以
实现跨多个输入进行批处理的好处，即使这些
输入不会同时到达（因为每个批次都会形成新的批次）
模型的前向传播）。

请注意，对于 CPU 密集型工作负载，输入并发性可能不会像
有效（甚至会适得其反），你可能想使用
相反，Modal 的[*动态批处理*功能](/docs/guide/dynamic-batching)。

## 启用输入并发

要启用输入并发，请添加 `@modal.concurrent` 装饰器：

```python
@app.function()
@modal.concurrent(max_inputs=100)
def my_function(input: str):
    ...

```

当使用类模式时，装饰器应该应用在
*类*，而不是单个方法：

```python
@app.cls()
@modal.concurrent(max_inputs=100)
class MyCls:

    @modal.method()
    def my_method(self, input: str):
        ...
```

因为一个类上的所有方法都将由相同的容器提供服务，一个类
启用输入并发将同时运行不同的方法
除了同一方法的多个输入之外。

## 设置并发目标

当使用 `@modal.concurrent` 装饰器时，你必须始终配置
每个容器将同时处理的最大输入数。如果
需求超过这个限制，Modal会自动扩展更多的容器。

当这些额外的容器冷时，额外的输入可能需要排队
开始。为了帮助避免扩展过程中延迟降低，`@modal.concurrent`
装饰器有一个单独的 `target_inputs` 参数。设置后，Modal 的自动缩放器
将在提供资源时致力于实现这一目标。如果需求增长得更快
当新容器无法启动时，活动容器将被允许爆裂
高于目标直至 `max_inputs` 限制：

```python
@app.function()
@modal.concurrent(max_inputs=96, target_inputs=80)  # Allow a 20% burst
def my_function(input: str):
    ...
```

可能需要一些实验才能找到这些参数的正确设置
在您的特定应用程序中。我们的建议是设置`target_inputs`
基于您期望的延迟和基于资源限制的`max_inputs`
（即避免 GPU OOM）。您还可以考虑相对延迟成本
扩展新容器与使现有容器超载。

## 并发机制
Modal 使用不同的并发机制来执行您的 Function，具体取决于
是否定义为同步或异步。每种机制都强加
对功能实现有一定的要求。输入并发数是
高级功能，重要的是要确保您的实施
遵守这些要求以避免意外行为。

对于同步函数，Modal 将在单独的函数上执行并发输入
线程。 *这意味着 Function 实现必须是线程安全的。*

```python
# Each container can execute up to 10 inputs in separate threads
@app.function()
@modal.concurrent(max_inputs=10)
def sleep_sync():
    # Function must be thread-safe
    time.sleep(1)
```

对于异步函数，Modal 将使用以下命令执行并发输入
在单个线程上分离 `asyncio` 任务。这不需要线程
安全性，但这确实意味着该功能需要参与
协作多任务处理（即，它不应阻塞事件循环）。

```python
# Each container can execute up to 10 inputs with separate async tasks
@app.function()
@modal.concurrent(max_inputs=10)
async def sleep_async():
    # Function must not block the event loop
    await asyncio.sleep(1)
```

## 陷阱

输入并发是一个强大的功能，但有一些注意事项
在采用之前了解一下是有用的。

### 输入取消

同步和异步函数处理输入取消的方式不同。
Modal 会在同步中引发 `modal.exception.InputCancellation` 异常
函数和异步函数中的`asyncio.CancelledError`。
当使用同步函数的输入并发时，单个输入
取消将终止整个容器。如果您的工作流程取决于
优雅的输入取消，我们建议使用异步
实施。

### 并发日志记录

执行并发输入的单独线程或任务将
将任何日志写入同一流。这使得关联日志变得困难
具有特定的输入，并过滤 Modal 网络中的特定函数调用
仪表板将显示同时运行的所有输入的日志。

要解决此问题，我们建议在消息中包含唯一标识符
您记录（您自己的标识符或`modal.current_input_id()`）以便
您可以使用搜索功能来显示特定输入的日志：

```python
@app.function()
@modal.concurrent(max_inputs=10)
async def better_concurrent_logging(x: int):
    logger.info(f"{modal.current_input_id()}: Starting work with {x}")
```