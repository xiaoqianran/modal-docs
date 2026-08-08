<!-- modal-docs: machine-translated zh-CN from English source -->

# 队列

```python
class Queue(modal.object.Object)
```

Modal 应用程序中数据流的分布式 FIFO 队列。

队列可以包含任何可通过 `cloudpickle` 序列化的对象，包括 Modal 对象。

默认情况下，`Queue`对象充当单个 FIFO 队列，支持放置和获取（阻塞和非阻塞）。

**使用**

```python
from modal import Queue

# Create an ephemeral queue which is anonymous and garbage collected
with Queue.ephemeral() as my_queue:
    # Putting values
    my_queue.put("some value")
    my_queue.put(123)

    # Getting values
    assert my_queue.get() == "some value"
    assert my_queue.get() == 123

    # Using partitions
    my_queue.put(0)
    my_queue.put(1, partition="foo")
    my_queue.put(2, partition="bar")

    # Default and "foo" partition are ignored by the get operation.
    assert my_queue.get(partition="bar") == 2

    # Set custom 10s expiration time on "foo" partition.
    my_queue.put(3, partition="foo", partition_ttl=10)

    # Iterate through items in place (read immutably)
    my_queue.put(1)
    assert [v for v in my_queue.iterate()] == [0, 1]

# You can also create persistent queues that can be used across apps
queue = Queue.from_name("my-persisted-queue", create_if_missing=True)
queue.put(42)
assert queue.get() == 42
```

更多示例请参阅[指南](https://modal.com/docs/guide/dicts-and-queues#modal-queues)。

**队列分区**

指定分区键可以访问同一 `Queue` 对象中的其他独立 FIFO 分区。
在任意两个分区中，put 和 gets 是完全独立的。
例如，对一个分区的 put 操作不会影响对任何其他分区的 get 操作。

当未指定分区键（默认情况下）时，puts 和 gets 将在默认分区上操作。
该默认分区也与所有其他分区隔离。
请参阅下面的“用法”部分，了解使用分区的示例。

**队列及其分区的生命周期**

默认情况下，每个分区会在最后一次 `put` 操作后 24 小时被清除。
可以通过 `put` 或 `put_many` 方法中的 `partition_ttl` 参数指定较低的 TTL。
每个分区的到期时间都是独立处理的。
因此，`Queue`最适合用于活动功能之间的通信，而不是依赖于持久性功能
存储。

应用程序完成时或停止应用程序后，任何关联的 `Queue` 对象都会被清除。
它的所有分区都将被清除。

**限制**

单个 `Queue` 最多可包含 100,000 个分区，每个分区最多可包含 5,000 个项目。每个项目最多可达
1 MiB。

分区键必须非空且不得超过 64 字节。

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作需要时会懒洋洋地补充水分。主要用例是当您需要时
访问对象元数据，例如其 ID。

*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 对象

```python
objects: QueueManager
```

具有用于管理命名队列对象的方法的命名空间。

### 对象.create

```python
create(self, name, *, allow_existing=False, environment_name=None, client=None)
```

在工作区环境中创建一个新的命名队列。

这不会返回本地句柄；创建后使用`modal.Queue.from_name`查找队列。

v1.1.2 中添加。

**参数**

<Parameter name="name" type="str" description="Name for the new Queue." />
<Parameter name="allow_existing" type="bool" defaultValue="False" description="If True, do nothing when a Queue with this name already exists." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to create in; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T45⟧ when omitted." />

**使用**

```python notest
modal.Queue.objects.create("my-queue")
```

队列将在活动环境中创建，或者可以指定另一个队列：

```python notest
modal.Queue.objects.create("my-queue", environment_name="dev")
```
默认情况下，如果队列已存在，则会引发错误； `allow_existing=True` 使这种情况成为无操作：

```python notest
modal.Queue.objects.create("my-queue", allow_existing=True)
```

请注意，此方法不会返回队列的本地实例。您可以使用
`modal.Queue.from_name` 创建后执行查找。

### 对象.list

```python
list(self, *, max_objects=None, created_before=None, environment_name="",
    client=None)
```

将工作区环境中的命名队列列为水合句柄。

结果按最新到最旧的顺序排列。默认情况下，返回所有匹配的队列。

v1.1.2 中添加。

**参数**

<Parameter name="max_objects" type="int | None" defaultValue="None" description="Maximum number of Queues to return." />
<Parameter name="created_before" type="datetime | str | None" defaultValue="None" description="Only include Queues created before this time (datetime or ISO date string)." />
<Parameter name="environment_name" type="str" defaultValue="&quot;&quot;" description="Environment to list from; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T48⟧ when omitted." />

**退货**

列表中每个命名队列的水合 `Queue` 对象。

**使用**

```python
queues = modal.Queue.objects.list()
print([q.name for q in queues])
```将从活动环境中检索队列，或者可以指定另一个队列：

```python notest
dev_queues = modal.Queue.objects.list(environment_name="dev")
```

默认情况下，将返回所有命名队列，从最新到最旧。也可以限制
结果数并按创建日期过滤：

```python
queues = modal.Queue.objects.list(max_objects=10, created_before="2025-01-01")
```

### 对象.删除

```python
delete(self, name, *, allow_missing=False, environment_name=None, client=None)
```

完全删除指定队列（不是单个消息或分区）。

删除是不可逆的，并且会影响使用此队列的任何应用程序。

v1.1.2 中添加。

**参数**

<Parameter name="name" type="str" description="Name of the Queue to delete." />
<Parameter name="allow_missing" type="bool" defaultValue="False" description="If True, do nothing when the Queue does not exist." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to delete from; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T50⟧ when omitted." />

**使用**

```python notest
await modal.Queue.objects.delete("my-queue")
```

队列将从活动环境中删除，或者可以指定另一个队列：

```python notest
await modal.Queue.objects.delete("my-queue", environment_name="dev")
```

## 姓名

```python
name(self)
```

## 验证\_partition\_key

```python
validate_partition_key(partition)
```

## 短暂的
```python
ephemeral(cls, client=None, environment_name=None)
```

创建一个在上下文管理器的持续时间内存在的匿名队列。

**参数**

<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T51⟧ when omitted." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment for the ephemeral Queue; defaults to the active environment." />

**使用**

```python
from modal import Queue

with Queue.ephemeral() as q:
    q.put(123)
```

```python notest
async with Queue.ephemeral() as q:
    await q.put.aio(123)
```

## 来自\_name

```python
from_name(name, *, environment_name=None, create_if_missing=False, client=None)
```

引用一个命名队列，可以选择首先在服务器上创建它。

Hydration 是惰性的：第一次使用句柄时从 Modal 获取元数据。

**参数**

<Parameter name="name" type="str" description="Deployment name of the Queue." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to resolve the name in; defaults to the active environment." />
<Parameter name="create_if_missing" type="bool" defaultValue="False" description="If True, create the Queue when it does not already exist." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for loading; defaults to ⟦T52⟧ when omitted." />

**退货**

`Queue` 手柄（可能尚未吸水）。

**使用**

```python
q = modal.Queue.from_name("my-queue", create_if_missing=True)
q.put(123)
```

## 来自\_id

```python
from_id(queue_id, client=None)
```

从 id 构造一个队列并查找队列元数据。这是一种延迟对局部进行补水的惰性方法
具有来自 Modal 服务器的元数据的对象，直到第一个
实际使用的时间。

可以使用`.object_id`访问队列对象的ID。

**参数**

<Parameter name="queue_id" type="str" description="Queue object ID to attach to." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for loading; defaults to ⟦T55⟧ when omitted." />

**退货**

`Queue` 手柄（可能尚未吸水）。

**使用**

```python notest
@app.function()
def my_consumer(queue_id: str):
    queue = modal.Queue.from_id(queue_id)
    queue.put("Hello from remote function!")

with modal.Queue.ephemeral() as q:
    my_consumer.remote(q.object_id)
    print(q.get())  # "Hello from remote function!"
```

## 信息

```python
info(self)
```

返回有关 Queue 对象的信息。

## 清除

```python
clear(self, *, partition=None, all=False)
```

清除单个分区或所有分区的内容。

警告：这是破坏性操作，将不可撤销地删除数据。

**参数**

<Parameter name="partition" type="str | None" defaultValue="None" description="Partition to clear; omit with ⟦T57⟧ to clear every partition." />
<Parameter name="all" type="bool" defaultValue="False" description="If True, clear all partitions (⟦T58⟧ must not be set)." />

**使用**

```python
q = modal.Queue.from_name("my-queue", create_if_missing=True)
q.clear()
```

## 得到

```python
get(self, block=True, timeout=None, *, partition=None)
```

删除并返回队列中的下一个对象。
如果`block`是`True`（默认）并且队列为空，`get`将无限期地等待
一个对象，或者直到`timeout`（如果指定）。引发本机 `queue.Empty` 异常
如果达到`timeout`。

如果`block`是`False`，如果队列为空，`get`立即返回`None`。 `timeout` 是
在这种情况下被忽略。

**参数**

<Parameter name="block" type="bool" defaultValue="True" description="If True, wait for an item; if False, return `⟦T70⟧` immediately when empty." />
<Parameter name="timeout" type="float | None" defaultValue="None" description="Seconds to wait when blocking; ignored when `⟦T71⟧` is False." />
<Parameter name="partition" type="str | None" defaultValue="None" description="FIFO partition to read from; uses the default partition when omitted." />

## 获取\_many

```python
get_many(self, n_values, block=True, timeout=None, *, partition=None)
```

从队列中删除并返回最多 `n_values` 个对象。

如果队列中的项目少于`n_values`，则返回全部。

如果`block`是`True`（默认）并且队列为空，则`get_many`等待至少一个对象存在，或者直到`timeout`（如果指定）。如果满足以下条件，则提高 stdlib 的 `queue.Empty`
在任何项目到达之前已达到超时。

如果`block`是`False`，则当队列为空时立即返回一个空列表。 `timeout`
在这种情况下将被忽略。

**参数**

<Parameter name="n_values" type="int" description="Maximum number of items to remove and return." />
<Parameter name="block" type="bool" defaultValue="True" description="If True, wait until at least one item is available (or until ⟦T82⟧); if False, return immediately when empty." />
<Parameter name="timeout" type="float | None" defaultValue="None" description="Seconds to wait when blocking; ignored when `⟦T83⟧` is False." />
<Parameter name="partition" type="str | None" defaultValue="None" description="FIFO partition to read from; uses the default partition when omitted." />

## 把

```python
put(self, v, block=True, timeout=None, *, partition=None, partition_ttl=24 *
    3600)
```

将一个对象添加到队列末尾。

如果`block`是`True`并且队列已满，此方法将无限期重试或
直到`timeout`（如果指定）。如果达到 `timeout`，则引发 stdlib 的 `queue.Full` 异常。
如果阻塞，不建议省略`timeout`，因为操作可能会无限期等待。
如果 `block` 是 `False`，则如果队列已满，此方法会立即引发 `queue.Full`。 `timeout` 是
在这种情况下被忽略。

**参数**

<Parameter name="v" type="Any" description="Value to enqueue (must be serializable)." />
<Parameter name="block" type="bool" defaultValue="True" description="If True, wait for capacity; if False, fail immediately when full." />
<Parameter name="timeout" type="float | None" defaultValue="None" description="Max seconds to wait when blocking." />
<Parameter name="partition" type="str | None" defaultValue="None" description="FIFO partition to write to; uses the default partition when omitted." />
<Parameter name="partition_ttl" type="int" defaultValue="24 * 3600" description="Seconds after the last activity before this partition may be cleared (default 24 hours)." />

## 放入\_many

```python
put_many(self, vs, block=True, timeout=None, *, partition=None, partition_ttl=24
    * 3600)
```

将多个对象添加到队列末尾。

如果`block`是`True`并且队列已满，此方法将无限期重试或
直到`timeout`（如果指定）。如果达到 `timeout`，则引发 stdlib 的 `queue.Full` 异常。
如果阻塞，不建议省略`timeout`，因为操作可能会无限期等待。如果 `block` 是 `False`，则如果队列已满，此方法会立即引发 `queue.Full`。 `timeout` 是
在这种情况下被忽略。

**参数**

<Parameter name="vs" type="list[Any]" description="Values to enqueue (each must be serializable)." />
<Parameter name="block" type="bool" defaultValue="True" description="If True, wait for capacity; if False, fail immediately when full." />
<Parameter name="timeout" type="float | None" defaultValue="None" description="Max seconds to wait when blocking." />
<Parameter name="partition" type="str | None" defaultValue="None" description="FIFO partition to write to; uses the default partition when omitted." />
<Parameter name="partition_ttl" type="int" defaultValue="24 * 3600" description="Seconds after the last activity before this partition may be cleared (default 24 hours)." />

## 长度

```python
len(self, *, partition=None, total=False)
```

返回队列分区中的对象数量。

**参数**

<Parameter name="partition" type="str | None" defaultValue="None" description="Partition to measure; omit for the default partition." />
<Parameter name="total" type="bool" defaultValue="False" description="If True, return the combined length of all partitions (do not pass ⟦T104⟧)." />

**退货**

项目计数（非常大时由服务器限制）。

## 迭代

```python
iterate(self, *, partition=None, item_poll_timeout=0.0)
```

迭代队列中的项目而不进行突变。

指定`item_poll_timeout`来控制迭代器在放弃之前应该等待下一次的时间。

**参数**

<Parameter name="partition" type="str | None" defaultValue="None" description="Partition to scan; uses the default partition when omitted." />
<Parameter name="item_poll_timeout" type="float" defaultValue="0.0" description="How long to wait for another item before stopping the iterator." />