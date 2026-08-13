<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数调用

```python
class FunctionCall(typing.Generic, modal.object.Object)
```

对已执行函数调用的引用。

在 Modal 函数上使用 `.spawn(...)` 构造，具有相同的
函数通常采用的参数。充当参考
一个正在进行的函数调用，可以传递并用于
稍后轮询或获取函数结果。

概念上类似于其他上下文和语言中的 Future/Promise/AsyncResult。

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
logs: FunctionCallLogsManager
```

单个`FunctionCall`的访问日志。

使用[`fetch()`](#logsfetch)
从 UTC 时间范围读取日志，[`tail()`](#logstail)
读取最新日志，以及 [`stream()`](#logsstream)
在新日志到达时对其进行跟踪。

**另见**

* [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs):
  CLI 访问应用程序的日志。

### 日志.stream

```python
stream(self, timeout=None)
```

流式传输新的 FunctionCall 日志，直到达到超时。
超时指定终止流之前日志条目之间等待的秒数。
当观察到 FunctionCall 完成时，此方法将停止，
或者达到超时时。尽最大努力进行完成检查；如果完成
无法确定，流将继续，直到达到超时。

**参数**

<Parameter name="timeout" type="float | None" defaultValue="None" description="Number of seconds to wait between log entries before terminating the stream. By default, this will block until it is interrupted." />

**产量**

`LogEntry` 物体到达时。

**使用**

```python notest
function = modal.Function.from_name("my-app", "train")
call = function.spawn()

for entry in call.logs.stream():
    print(entry.message, end="")
```

### 日志.tail

```python
tail(self, entries=100, *, source=None)
```

获取最新的 FunctionCall 日志。

**参数**

<Parameter name="entries" type="int" defaultValue="100" description="The number of log entries to return." />
<Parameter name="source" type="LogSource | None" defaultValue="None" description="Filter by source: &#x27;stdout&#x27;, &#x27;stderr&#x27;, or &#x27;system&#x27;." />

**产量**

`LogEntry` 按时间顺序排列的对象。

**使用**

```python notest
function = modal.Function.from_name("my-app", "train")
call = function.spawn()

for entry in call.logs.tail(entries=10):
    print(entry.timestamp, entry.message, end="")
```### 日志.fetch

```python
fetch(self, *, since=None, until=None, source=None, search_text="")
```

获取与日期范围和过滤器相对应的所有关联日志。

**参数**

<Parameter name="since" type="datetime | None" defaultValue="None" description="Start date to fetch logs from. Must be in UTC or timezone-naive, which is interpreted as local time. By default, this will fetch logs from the start of the function call." />
<Parameter name="until" type="datetime | None" defaultValue="None" description="Defaults to current date if None. Must be in UTC or timezone-naive, which is interpreted as local time." />
<Parameter name="source" type="LogSource | None" defaultValue="None" description="Filter by source: &#x27;stdout&#x27;, &#x27;stderr&#x27;, or &#x27;system&#x27;." />
<Parameter name="search_text" type="str" defaultValue="&quot;&quot;" description="Filter by search text." />

**产量**

`LogEntry` 按时间顺序排列的对象。

**使用**

```python notest
function = modal.Function.from_name("my-app", "train")
call = function.spawn()

for entry in call.logs.fetch():
    print(entry.timestamp, entry.message, end="")
```

## num\_inputs

```python
num_inputs(self)
```

获取函数调用中的输入数量。

**退货**

此函数调用包含多少个输入（例如 `1` 对应 `.spawn()`，更多对应 `.spawn_map()`）。

## 得到

```python
get(self, timeout=None, *, index=0)
```

获取函数调用的第索引输入的结果。

`.spawn()` 调用只有一个输出，因此仅指定 `index=0` 才有效。
当您的函数有多个输出（例如通过 `.spawn_map()`）时，非零索引非常有用。
该函数默认无限期等待。它需要一个可选的
`timeout` 参数，指定等待的最大秒数，
可以设置为 `0` 以立即轮询输出。

返回的协程不是取消安全的。

**参数**

<Parameter name="timeout" type="float | None" defaultValue="None" description="Maximum seconds to wait for a result, or ⟦T37⟧ to wait indefinitely." />
<Parameter name="index" type="int" defaultValue="0" description="Which input&#x27;s result to retrieve (typically ⟦T38⟧ for ⟦T39⟧)." />

**退货**

该输入的反序列化返回值。

## 迭代器

```python
iter(self, *, start=0, end=None)
```

按顺序迭代函数调用的结果。

（可选）指定要迭代的范围 \[start, end)。

如果未提供 `end`，它将迭代所有结果。

**参数**

<Parameter name="start" type="int" defaultValue="0" description="First input index to include (inclusive)." />
<Parameter name="end" type="int | None" defaultValue="None" description="One past the last index to include, or ⟦T41⟧ for all remaining inputs." />

**产量**每个结果值均按索引顺序排列。

**使用**

```python
@app.function()
def my_func(a):
    return a ** 2


@app.local_entrypoint()
def main():
    fc = my_func.spawn_map([1, 2, 3, 4])
    assert list(fc.iter()) == [1, 4, 9, 16]
    assert list(fc.iter(start=1, end=3)) == [4, 9]
```

## 获取\_call\_graph

```python
get_call_graph(self)
```

获取有关此 FunctionCall 所属输入图的信息。

注意：调用图数据不是实时填充的，它的捕获是尽力而为的。
我们不建议在关键用例中依赖此方法。

有关信息，请参阅 [`modal.types`](/docs/sdk/py/latest/types) 参考
关于返回值。

**退货**

描述调用图的`InputInfo`节点列表。

## 取消

```python
cancel(self, terminate_containers=False)
```

取消 FunctionCall 并终止其输入而不重试。

**参数**

<Parameter name="terminate_containers" type="bool" defaultValue="False" description="If True, terminate the containers running the cancelled inputs. Any other inputs running concurrently on those containers will be rescheduled." />

## 来自\_id

```python
from_id(cls, function_call_id, client=None)
```
从现有 ID 实例化 FunctionCall 对象。

注意，此方法只需重新实例化`FunctionCall`即可
如果您不再有权访问从 `Function.spawn` 返回的原始对象。

**参数**

<Parameter name="function_call_id" type="str" description="Object ID of an existing function call (e.g. from ⟦T46⟧)." />
<Parameter name="client" type="&quot;modal.client.Client | None&quot;" defaultValue="None" description="Modal client to use; defaults to ⟦T47⟧ when omitted." />

**退货**

给定 ID 的 `FunctionCall` 句柄。

**使用**

```python notest
# Spawn a FunctionCall and keep track of its object ID
fc = my_func.spawn()
fc_id = fc.object_id

# Later, use the ID to re-instantiate the FunctionCall object
fc = FunctionCall.from_id(fc_id)
result = fc.get()
```

## 聚集

```python
gather(*function_calls)
```

等待所有 Modal FunctionCall 对象都有结果后再返回。

接受由 `Function.spawn()` 返回的可变数量的 `FunctionCall` 对象。

从第一次失败的函数调用引发异常。

*在 v0.73.69 中添加*：此方法替换了已弃用的 `modal.functions.gather` 函数。

**参数**

<Parameter name="*function_calls" type="&quot;_FunctionCall[T]&quot;" description="⟦T52⟧ instances to wait on (same order as the returned sequence)." />

**退货**

结果与 `function_calls` 的顺序相同（如 `asyncio.gather`）。

**使用**

```python notest
fc1 = slow_func_1.spawn()
fc2 = slow_func_2.spawn()

result_1, result_2 = modal.FunctionCall.gather(fc1, fc2)
```