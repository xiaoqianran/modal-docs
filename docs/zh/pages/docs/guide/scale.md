<!-- modal-docs: machine-translated zh-CN from English source -->

# 横向扩展

Modal 使得跨数千个容器扩展计算变得非常容易。
您不必担心您的应用程序会因病毒式传播或需要等待而崩溃
批处理作业需要很长时间才能完成。

在大多数情况下，扩展会自动发生，您不需要
想想吧。但了解 Modal 的自动缩放器是如何工作的会很有帮助
工作原理以及当您需要更精细的控制时如何控制其行为。

## 自动缩放在 Modal 上如何工作？

每个模态函数都对应一个自动缩放容器池。尺寸
池的大小由 Modal 的自动缩放器管理。自动缩放器将启动新的
当没有容量可用于新输入时，容器会旋转
当资源空闲时关闭容器。默认情况下，模态函数将
当没有输入要处理时缩放为零。

快速而频繁地做出自动缩放决策，以便您的批处理作业
可以快速启动，您部署的应用程序可以响应任何突然的变化
交通。

## 配置自动缩放行为

Modal 公开了一些设置，允许您配置自动缩放器
行为。这些设置可以传递到`@app.function`或`@app.cls`
装饰器：

* `max_containers`：特定功能的容器上限。
* `min_containers`：应保温的最少容器数量，
  即使该功能处于非活动状态。
* `buffer_containers`：函数运行时要维护的缓冲区大小
  活动的，这样额外的输入就不需要排队等待新容器。
* `scaledown_window`：个体的最大持续时间（以秒为单位）
  缩小规模时容器可以保持空闲状态。

一般来说，这些设置允许您权衡成本和延迟。维护
更大的热池或空闲缓冲区会增加成本，但会降低发生这种情况的可能性
输入需要等待新容器启动。

同样，较长的缩减窗口将使容器空闲更长时间，这
可能有助于避免定期但不频繁接收的应用程序不必要的流失
输入。请注意，容器可能不会在整个缩小窗口之前等待
如果应用程序严重过度配置，则关闭。

## 动态自动缩放器更新

还可以动态更新自动缩放器设置（即，无需重新部署
应用程序）使用 [`Function.update_autoscaler()`](/docs/sdk/py/latest/Function#update_autoscaler)
方法：

```python notest
f = modal.Function.from_name("my-app", "f")
f.update_autoscaler(max_containers=100)
```
自动定标器设置将恢复为函数中的配置
下次部署应用程序时使用装饰器。或者它们可以被覆盖
进一步动态更新：

```python notest
f.update_autoscaler(min_containers=2, max_containers=10)
f.update_autoscaler(min_containers=4)  # max_containers=10 will still be in effect
```

常见的模式是在[计划函数](/docs/guide/cron) 中运行此方法
根据一天中的时间调整暖池（或容器缓冲区）的大小：

```python
@app.function()
def inference_server():
    ...

@app.function(schedule=modal.Cron("0 6 * * *", timezone="America/New_York"))
def increase_warm_pool():
    inference_server.update_autoscaler(min_containers=4)

@app.function(schedule=modal.Cron("0 22 * * *", timezone="America/New_York"))
def decrease_warm_pool():
    inference_server.update_autoscaler(min_containers=0)
```

当您有 [`modal.Cls`](/docs/sdk/py/latest/Cls) 时，`update_autoscaler`
是*实例*上的方法，将控制实例的自动缩放行为
为具有该特定参数集的函数提供服务的容器：

```python notest
MyClass = modal.Cls.from_name("my-app", "MyClass")
obj = MyClass(model_version="3.5")
obj.update_autoscaler(buffer_containers=2)  # type: ignore
```

请注意，有必要禁用这一行的类型检查，因为
对象将显示为您定义的类的实例，而不是
模态包装类型。

## 输入的并行执行

如果您的代码使用不同的独立函数重复运行相同的函数
输入（例如，网格搜索），提高性能的最简单方法是运行
使用 Modal 并行调用这些函数
[`Function.map()`](/docs/sdk/py/latest/Function#map) 方法。

这是一个例子，如果我们有一个函数 `evaluate_model` 需要一个
论点：

```python
import modal

app = modal.App()


@app.function()
def evaluate_model(x):
    ...


@app.local_entrypoint()
def main():
    inputs = list(range(100))
    for result in evaluate_model.map(inputs):  # runs many inputs in parallel
        ...
```

在此示例中，将使用 100 个输入中的每一个来调用 `evaluate_model`
（本例中为数字 0 - 99）大致并行，结果为
作为可迭代对象返回，结果的排序方式与输入相同。

### 例外情况

默认情况下，如果任何函数调用引发异常，该异常将
被传播。将异常视为成功结果并将其汇总到
结果列表，传入
[`return_exceptions=True`](/docs/sdk/py/latest/Function#map)。

```python
@app.function()
def my_func(a):
    if a == 2:
        raise Exception("ohno")
    return a ** 2

@app.local_entrypoint()
def main():
    print(list(my_func.map(range(3), return_exceptions=True)))
    # [0, 1, Exception('ohno'))]
```

### 星图

如果您的函数采用多个变量参数，您可以使用
[`Function.map()`](/docs/sdk/py/latest/Function#map) 带有一个输入迭代器
每个参数，或 [`Function.starmap()`](/docs/sdk/py/latest/Function#starmap)
使用包含序列（如元组）的单个输入迭代器，可以
传播争论。这与 Python 内置的 `map` 类似，并且
`itertools.starmap`。

```python
@app.function()
def my_func(a, b):
    return a + b

@app.local_entrypoint()
def main():
    assert list(my_func.starmap([(1, 2), (3, 4)])) == [3, 7]
```

### 陷阱

请注意，`.map()`是模态函数对象本身的一个方法，所以你不需要
显式*调用*该函数。

错误用法：

```python notest
results = evaluate_model(inputs).map()
```

Modal 的映射也与使用 Python 内置的 `map()` 不同。虽然
以下在技术上可行，它将按顺序执行所有输入，而不是
比并行。

错误用法：

```python notest
results = map(evaluate_model, inputs)
```

## 异步使用
所有 Modal API 均提供阻塞和异步变体。如果你
熟悉异步编程，您可以使用它来创建
任意并行执行模式，还有任何 Modal 的额外好处
功能将远程执行。请参阅[异步指南](/docs/guide/async) 或
有关异步使用的更多信息的示例。

## GPU 加速

有时，您可以利用 GPU 加速来加速应用程序。参见
有关更多信息，请参阅 [GPU 部分](/docs/guide/gpu)。

## 缩放限制

Modal 对每个函数强制执行以下限制：

* 2,000 个待处理输入（尚未分配给容器的输入）
* 总共 25,000 个输入（包括正在运行的输入和待处理的输入）

对于使用`.spawn()`为异步作业创建的输入，Modal 允许最多 100 万个待处理输入，而不是 2,000 个。

如果您尝试创建更多输入并超出这些限制，您将收到 `Resource Exhausted` 错误，您应该稍后重试您的请求。如果您需要更高的限制，请联系我们！

此外，每个 `.map()` 调用最多可以同时处理 1000 个输入。