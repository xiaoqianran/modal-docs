<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数

```python
class Function(typing.Generic, modal.object.Object)
```

函数是 Modal 上无服务器执行的基本单元。

一般来说，你不会直接构造一个`Function`。相反，使用
`App.function()` 装饰器，用于向您的应用程序注册您的 Python 函数。

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作
需要时会懒洋洋地补充水分。主要用例是当您需要时
访问对象元数据，例如其 ID。

*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 日志

```python
logs: FunctionLogsManager
````Function` 的访问日志。

使用[`fetch()`](#logsfetch)
从 UTC 时间范围读取日志，[`tail()`](#logstail)
读取最新日志，以及 [`stream()`](#logsstream)
在新日志到达时对其进行跟踪。

**另见**

* [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs):
  CLI 访问应用程序的日志。

### 日志.fetch

```python
fetch(self, *, since, until=None, source=None, search_text="")
```

获取与日期范围和过滤器相对应的函数日志。

**参数**

<Parameter name="since" type="datetime" description="Start date to fetch logs from. Must be in UTC or timezone-naive, which is interpreted as local time." />
<Parameter name="until" type="datetime | None" defaultValue="None" description="Defaults to current date if None. Must be in UTC or timezone-naive, which is interpreted as local time." />
<Parameter name="source" type="LogSource | None" defaultValue="None" description="Filter by source: &#x27;stdout&#x27;, &#x27;stderr&#x27;, or &#x27;system&#x27;." />
<Parameter name="search_text" type="str" defaultValue="&quot;&quot;" description="Filter by search text." />

**产量**

`LogEntry` 按时间顺序排列的对象。

**使用**

```python notest
function = modal.Function.from_name("my-app", "train")

for entry in function.logs.fetch(
    since=datetime.now() - timedelta(hours=4),
    source="stdout",
):
    print(entry.message, end="")
```

### 日志.tail

```python
tail(self, entries=100, *, source=None)
```

获取最新的函数日志。

**参数**

<Parameter name="entries" type="int" defaultValue="100" description="The number of log entries to return." />
<Parameter name="source" type="LogSource | None" defaultValue="None" description="Filter by source: &#x27;stdout&#x27;, &#x27;stderr&#x27;, or &#x27;system&#x27;." />

**产量**

`LogEntry` 按时间顺序排列的对象。

**使用**

```python notest
function = modal.Function.from_name("my-app", "train")

for entry in function.logs.tail(20):
    print(entry.message, end="")
```
### 日志.stream

```python
stream(self, timeout=None)
```

流式传输新的函数日志，直到达到超时。

**参数**

<Parameter name="timeout" type="float | None" defaultValue="None" description="Number of seconds to wait between log entries before terminating the stream. By default, this will block until it is interrupted." />

**产量**

`LogEntry` 物体到达时。

**使用**

```python notest
function = modal.Function.from_name("my-app", "train")

for entry in function.logs.stream(timeout=60):
    print(entry.message, end="")
```

## 更新\_自动缩放器

```python
update_autoscaler(self, *, min_containers=None, max_containers=None,
    buffer_containers=None, scaledown_window=None)
```

覆盖此函数的当前自动缩放器行为。

未指定的参数将保留其当前值，即静态值
来自函数装饰器，或来自先前调用此方法的覆盖值。

包含此功能的应用程序的后续部署会将自动缩放器重置回
它的静态配置。

**参数**

<Parameter name="min_containers" type="int | None" defaultValue="None" description="Minimum number of containers to keep running." />
<Parameter name="max_containers" type="int | None" defaultValue="None" description="Maximum concurrent containers." />
<Parameter name="buffer_containers" type="int | None" defaultValue="None" description="Extra containers to keep warm beyond current demand." />
<Parameter name="scaledown_window" type="int | None" defaultValue="None" description="Maximum duration (in seconds) idle containers wait before scaling down." />**退货**

包含当前自动缩放器设置的`FunctionAutoscalerSettings`数据类
调用后此函数的。

**使用**

```python notest
f = modal.Function.from_name("my-app", "function")

# Always have at least 2 containers running, with an extra buffer when the Function is active
f.update_autoscaler(min_containers=2, buffer_containers=1)

# Limit this Function to avoid spinning up more than 5 containers
f.update_autoscaler(max_containers=5)

# Extend the scaledown window to increase the amount of time that idle containers stay alive
f.update_autoscaler(scaledown_window=300)
```

## 来自\_name

```python
from_name(cls, app_name, name, *, version=None, environment_name=None,
    client=None)
```

通过名称引用已部署应用程序中的函数。

这是一种延迟给局部补水的惰性方法
具有来自 Modal 服务器的元数据的对象，直到第一个
实际使用的时间。

**参数**

<Parameter name="app_name" type="str" description="Name of the deployed App." />
<Parameter name="name" type="str" description="Name of the Function within that App. For class methods, use ⟦T46⟧ instead." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to look up the App in; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T47⟧ when omitted." />

**退货**

懒惰的 `Function` 手柄。

**使用**

```python
f = modal.Function.from_name("other-app", "function")
```

`version` 参数允许您调用版本固定函数：

```python
f_v3 = modal.Function.from_name("other-app", "function", version=3)
```

## 获取\_web\_url

```python
get_web_url(self)
```

用于通过 HTTP 寻址 Web 功能的 URL。

**退货**
Web 端点的 HTTPS URL，如果此函数不是 Web 端点，则为 `None`。

## 带有\_选项

```python
with_options(self, *, cpu=None, memory=None, gpu=None, env=None, secrets=None,
    volumes={}, retries=None, max_containers=None, buffer_containers=None,
    scaledown_window=None, timeout=None, region=None, cloud=None,
    routing_region=None)
```

使用特定于调用的值动态覆盖静态函数配置。

此方法返回一个具有动态配置的新 Function 实例。的调用
新函数将在不同的容器池中运行，并独立于
基本功能（以及其他动态配置）。

请注意，无法使用此方法“取消设置”选项（即，如果在
`@app.cls()`装饰器，在这里传递`gpu=None`不会创建仅CPU实例）。
此外，像 `volumes` 和 `secrets` 这样的容器参数将*替换*基础
配置或任何以前使用此方法而不是扩展它。

**用途：**

您可以在查找已部署的 Function 后使用此方法：

```python notest
fn = modal.Function.from_name("my_app", "fn").with_options(gpu="H100")
fn.remote()  # will run on a H100 GPU
```

或者通过引用同一应用程序中定义的另一个函数：

```python notest
@app.function()
def fn():
    ...

# From a local entrypoint or another Function
fn.with_options(gpu="H100").remote()  # Uses an H100 GPU
fn.remote()  # Uses the static configuration with no GPU
```

## 与\_并发

```python
with_concurrency(self, *, max_inputs, target_inputs=None)
```

使用特定于调用的输入并发覆盖静态 Function 配置。

返回一个新的 Function 实例，该实例被动态配置为像 Function 一样使用
`@modal.concurrent` 装饰器。该实例将独立于基本函数自动缩放。

## 与\_batching

```python
with_batching(self, *, max_batch_size, wait_ms)
```

使用特定于调用的动态批处理覆盖静态函数配置。

返回一个新的 Function 实例，该实例被动态配置为像 Function 一样使用
`@modal.batched` 装饰器。该实例将独立于基本函数自动缩放。

## 远程

```python
remote(self, *args, **kwargs)
```

远程调用该函数，使用给定参数执行该函数并返回执行结果。

**参数**

<Parameter name="*args" type="P.args" description="Positional arguments forwarded to the deployed function." />
<Parameter name="**kwargs" type="P.kwargs" description="Keyword arguments forwarded to the deployed function." />

**退货**

远程函数返回的值。

## 远程\_gen

```python
remote_gen(self, *args, **kwargs)
```

远程调用生成器，使用给定的参数执行它。

**参数**

<Parameter name="*args" type="" description="Positional arguments forwarded to the deployed generator function." />
<Parameter name="**kwargs" type="" description="Keyword arguments forwarded to the deployed generator function." />

**产量**

远程生成器产生的值。

##本地

```python
local(self, *args, **kwargs)
```

在本地调用该函数，使用给定参数执行该函数并返回执行结果。

该函数将在与调用者相同的环境中执行，就像调用底层函数一样
直接用Python。特别是，只有调用者环境中可用的秘密才可用
通过环境变量。

**参数**

<Parameter name="*args" type="P.args" description="Positional arguments passed to the underlying Python callable." />
<Parameter name="**kwargs" type="P.kwargs" description="Keyword arguments passed to the underlying Python callable." />

**退货**
本地调用（或异步函数的协程）的返回值。

## 生成

```python
spawn(self, *args, **kwargs)
```

使用给定参数调用函数，而不等待结果。

概念上类似于 `multiprocessing.pool.apply_async`，或其他上下文中的未来/承诺。

**参数**

<Parameter name="*args" type="P.args" description="Positional arguments forwarded to the remote function." />
<Parameter name="**kwargs" type="P.kwargs" description="Keyword arguments forwarded to the remote function." />

**退货**

一个 [`modal.FunctionCall`](https://modal.com/docs/sdk/py/latest/FunctionCall) 对象
稍后可以轮询或等待使用
[`.get(timeout=...)`](https://modal.com/docs/sdk/py/latest/FunctionCall#get)。

## 获取\_raw\_f

```python
get_raw_f(self)
```

返回此模态函数包装的内部 Python 对象。

**退货**

注册到Modal的原始函数对象。

## 获取当前统计信息

```python
get_current_stats(self)
```返回一个 `FunctionStats` 对象，描述当前函数的队列和运行程序计数。

**退货**

积压、运行者和运行输入的快照计数。

## 地图

```python
map(self, *input_iterators, kwargs={}, order_outputs=True,
    return_exceptions=False, wrap_returned_exceptions=None)
```

一组输入上的并行映射。

为基础函数的每个位置参数传递一个可迭代对象。结果产生为
可迭代（同步）或异步迭代器（`map.aio`）。

如果应用于 `@app.function`，`map()` 每个输入和输出顺序匹配都会返回一个结果
默认输入顺序。设置 `order_outputs=False` 按完成顺序发出结果。

`return_exceptions` 可以将失败聚合到结果流中而不是引发。

**参数**

<Parameter name="*input_iterators" type="typing.Iterable[Any]" description="One iterator per mapped positional parameter on the function." />
<Parameter name="kwargs" type="" defaultValue="&#123;&#125;" description="Extra keyword arguments forwarded to every invocation." />
<Parameter name="order_outputs" type="bool" defaultValue="True" description="If True, preserve input order in outputs; if False, use completion order." />
<Parameter name="return_exceptions" type="bool" defaultValue="False" description="If True, failed inputs appear as exceptions in the result stream instead of raising." />
<Parameter name="wrap_returned_exceptions" type="bool | None" defaultValue="None" description="Deprecated; no longer has any effect." />

**使用**

```python
@app.function()
def my_func(a):
    return a ** 2


@app.local_entrypoint()
def main():
    assert list(my_func.map([1, 2, 3, 4])) == [1, 4, 9, 16]
```

```python
@app.function()
def my_func(a):
    if a == 2:
        raise Exception("ohno")
    return a ** 2


@app.local_entrypoint()
def main():
    print(list(my_func.map(range(3), return_exceptions=True)))
```
## 星图

```python
starmap(self, input_iterator, *, kwargs={}, order_outputs=True,
    return_exceptions=False, wrap_returned_exceptions=None)
```

与 `map` 类似，但每个输入项都被解包为多个位置参数。

`input_iterator` 的每个元素应该是一个序列（例如元组），长度等于
函数的数量。

**参数**

<Parameter name="input_iterator" type="typing.Iterable[typing.Sequence[Any]]" description="Iterable of argument tuples to unpack into each call." />
<Parameter name="kwargs" type="" defaultValue="&#123;&#125;" description="Extra keyword arguments forwarded to every invocation." />
<Parameter name="order_outputs" type="bool" defaultValue="True" description="If True, preserve input order in outputs; if False, use completion order." />
<Parameter name="return_exceptions" type="bool" defaultValue="False" description="If True, failed inputs appear as exceptions in the result stream instead of raising." />
<Parameter name="wrap_returned_exceptions" type="bool | None" defaultValue="None" description="Deprecated; no longer has any effect." />

**使用**

```python
@app.function()
def my_func(a, b):
    return a + b


@app.local_entrypoint()
def main():
    assert list(my_func.starmap([(1, 2), (3, 4)])) == [3, 7]
```

## 对于\_each

```python
for_each(self, *input_iterators, kwargs={}, ignore_exceptions=False)
```

对所有输入执行该函数并等待完成，丢弃返回值。

与 `.map()` 类似，但您不需要迭代结果来驱动工作 - Modal 会处理每个输入。

**参数**

<Parameter name="*input_iterators" type="" description="One iterator per mapped positional parameter on the function." />
<Parameter name="kwargs" type="" defaultValue="&#123;&#125;" description="Extra keyword arguments forwarded to every invocation." />
<Parameter name="ignore_exceptions" type="bool" defaultValue="False" description="If True, failures are swallowed instead of propagating." />

## 生成\_map

```python
spawn_map(self, *input_iterators, kwargs={})
```

在一组输入上生成并行执行，一旦创建输入就退出（无需等待
以便地图完成）。

在被映射的函数中，每个参数采用一个迭代器参数。

未来的更新将支持结果的编程检索。

**参数**

<Parameter name="*input_iterators" type="" description="One iterator per mapped positional parameter on the function." />
<Parameter name="kwargs" type="" defaultValue="&#123;&#125;" description="Extra keyword arguments forwarded to every invocation." />

**使用**

```python
@app.function()
def my_func(a):
    return a ** 2


@app.local_entrypoint()
def main():
    my_func.spawn_map([1, 2, 3, 4])
```