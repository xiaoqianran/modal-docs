<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数调用方法

模态[函数](/docs/guide/functions) 公开了几种不同的调用方法。这些方法的语义在多个维度上有所不同。了解它们如何变化将使您选择最适合特定用例的方法。

## 同步与异步

从调用过程的角度来看，函数调用可以是同步的，也可以是异步的。同步方法在返回结果之前等待远程进程完成，而异步方法发送输入并立即返回 [`modal.FunctionCall`](/docs/sdk/py/latest/FunctionCall) 句柄。该句柄可用于轮询进度或稍后检索结果。

请注意，这种同步/异步区别与 Modal 的 [`.aio` 接口](/docs/guide/async) 无关。 `.aio`接口仅影响本地进程中的执行机制，而不影响Modal系统如何处理调用。 Function 的实现是否使用异步 Python 编写也并不重要。

同步和异步调用在可扩展性、持久性和延迟方面有所不同。

### 可扩展性
同步调用受到更严格的平台限制：

* 任一时间排队等待容器的同步输入不得超过 2,000 个。
* 系统中任何时刻（排队或运行）的同步输入总数不得超过 25,000 个。

相比之下，最多可以有 100 万个输入排队等待异步执行，因此当您有大量输入需要处理时，异步方法是更好的选择。

函数调用还受到“速率”限制，异步调用的速率更高。作为基准，Modal 支持 200/s 速率的同步调用和 1,500/s 速率的异步调用。

如果函数调用超出任何这些限制，它将被拒绝并显示 [`ResourceExhaustedError`](/docs/sdk/py/latest/exception#resourceexhaustederror)。在某些情况下，Modal SDK 将处理此错误并通过退避重试，从而增加延迟。异常也可能传播到用户代码。

### 耐用性
通过异步方法发送的输入更加持久。异步函数调用是“即发即忘”的，如果调用进程退出，它将继续运行，但同步调用将在调用者挂断后两分钟内取消。

异步调用的结果有效负载将存储 7 天，但输入有效负载将在调用成功完成后被丢弃。同步调用在发送回调用者后不会存储在 Modal 的系统中。

### 延迟

因为它们的处理更持久，所以异步调用具有更高的延迟。对于许多计算密集型应用程序来说，差异可以忽略不计，但对延迟敏感的应用程序应该更喜欢同步调用方法。

请注意，同步 I/O 系统仍然会施加一些开销来支持其有状态输入队列。当请求延迟非常严重时，最好使用 Modal 的 [Server](/docs/guide/servers) 原语。

## 单一与批量
多种调用方法接受“批量”输入，而不是单个输入有效负载。这些方法抽象了高效可靠地向 Modal 发送多个输入所涉及的机制。

请注意，批处理中的每个输入仍将单独“处理”：这是与[动态批处理](/docs/guide/dynamic-batching)不同的概念。

## 调用方法

主要的 [`modal.Function`](/docs/sdk/py/latest/Function) 调用方法在 2x2 矩阵中占据以下位置：

|          |同步|异步 |
| -------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
|单数| [`Function.remote()`](/docs/sdk/py/latest/Function#remote) | [`Function.spawn()`](/docs/sdk/py/latest/Function#spawn) |
|批量| [`Function.map()`](/docs/sdk/py/latest/Function#map) | [`Function.spawn_map()`](/docs/sdk/py/latest/Function#spawn_map) |

### `Function.remote`
使用 [`Function.remote()`](/docs/sdk/py/latest/Function#remote) 调用函数会进行同步调用，发送输入负载并等待远程进程完成后再返回。它是在 Modal 上运行计算的最基本方法，因为它的语义最接近本地函数调用：

```python
@app.function()
def f(x: int) -> int:
    return x ** 2


@app.local_entrypoint()
def main():
    res = f.remote(2)
    assert res == 4
```

相关的 [`Function.remote_gen()`](/docs/sdk/py/latest/Function#remote_gen) 方法也同步发送输入，但当远程 Function 是一个将结果返回给调用者的生成器时，它会起作用：

```python
@app.function()
def g(x: int) -> int:
    for n in range(4):
        yield x ** n

@app.local_entrypoint()
def main():
    res = g.remote_gen(2)
    assert list(res) == [1, 2, 4, 8]
```

### `Function.spawn`

异步 [`Function.spawn()`](/docs/sdk/py/latest/Function#spawn) 方法将其输入发送到 Function 并立即返回表示该输入的 [`modal.FunctionCall`](/docs/sdk/py/latest/FunctionCall) 对象。

您可以通过调用 [`FunctionCall.get()`](/docs/sdk/py/latest/FunctionCall#get) 检索结果：

```python
def spawn_and_fetch(x):
    fc = f.spawn(x)
    return fc.get()
```

默认情况下，[`FunctionCall.get()`](/docs/sdk/py/latest/FunctionCall#get) 将阻塞，直到结果可用。这与同步调用类似，尽管它牺牲了一些延迟来换取可扩展性和持久性。您还可以传递超时来实现轮询模式：

```python
def spawn_and_poll(x):
    fc = f.spawn(x)
    while True:
        try:
            return fc.get(timeout=1)
        except TimeoutError:
            print("Not finished yet")
```
对于长时间运行的函数，您可能不希望调用进程等到结果可用。为了实现这一点，您可以存储 FunctionCall 的对象 ID 并使用它在另一个上下文中获取结果：

```python
def spawn_input(x):
    fc = f.spawn(x)
    return fc.object_id

def fetch_result(fc_id):
    fc = modal.FunctionCall.from_id(fc_id)
    return fc.get()
```

由于它提供了更高的可扩展性和耐用性，对于计算密集型应用程序，尤其是那些需要高扇出或复杂编排的应用程序，[`Function.spawn()`](/docs/sdk/py/latest/Function#spawn) 通常是比 [`Function.remote()`](/docs/sdk/py/latest/Function#remote) 更好的选择。

### `Function.map`

批处理的 [`Function.map()`](/docs/sdk/py/latest/Function#map) 方法可以通过在单次调用中使用可迭代的输入来轻松利用 Modal 的水平可扩展性：

```python
@app.function()
def f(x: int) -> int:
    return x ** 2

@app.local_entrypoint()
def main():
    res = f.map(range(1, 5))
    assert list(res) == [1, 4, 9, 16]
```

Modal 将启动多个容器来并行处理地图。
[`Function.map()`](/docs/sdk/py/latest/Function#map) 调用是同步的，这会影响其可扩展性。输入提交受[上文](#scalability) 提到的速率限制的约束，每次调用最多可以同时运行 1,000 个输入。为了方便起见，Modal SDK 在内部处理系统背压，以避免在运行地图时触发输入提交率或输入队列深度的限制。但这些限制可能会阻止 [`Function.map()`](/docs/sdk/py/latest/Function#map) 调用立即扩展和利用可用容器容量。

[`Function.starmap()`](/docs/sdk/py/latest/Function#starmap) 方法具有等效的语义，但它消耗一个可迭代对象，其中每个条目都是一个*参数序列*，从而有效地并行执行 `[f.remote(*args) for args in input_list]`。

### `Function.spawn_map`

[`Function.spawn_map()`](/docs/sdk/py/latest/Function#spawn_map) 方法将 [`Function.spawn()`](/docs/sdk/py/latest/Function#spawn) 的异步语义与 [`Function.map`](/docs/sdk/py/latest/Function#map) 的批处理语义相结合。与 [`Function.map`](/docs/sdk/py/latest/Function#map) 一样，它将 Function 应用于可迭代输入中的每个条目：

```python
def load_inputs(filenames):
    for fname in filenames:
        yield load(fname)

def spawn_batch(filenames):
    f.spawn_map(load_inputs(filenames))
```
由于异步调用的平台限制较高，[`Function.spawn_map`](/docs/sdk/py/latest/Function#spawn_map) 会尽快发送整个可迭代的输入，从而最大限度地利用 Modal 的弹性计算。

到目前为止，[`Function.spawn_map()`](/docs/sdk/py/latest/Function#spawn_map) 不会返回 FunctionCall 句柄，因此当前仅当 Function 具有副作用（例如将其结果写入持久存储）时才有用。今后这一点将会得到改善。

### `Function.local`

与其他方法不同，[`Function.local()`](/docs/sdk/py/latest/Function#local) 始终在与调用者相同的环境中执行（无论是在您的系统上还是在 Modal 容器内）。调用 [`Function.local()`](/docs/sdk/py/latest/Function#local) 相当于直接调用解包后的底层函数；任何模态配置都不会应用。