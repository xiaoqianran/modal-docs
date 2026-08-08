<!-- modal-docs: machine-translated zh-CN from English source -->

# 队列

模态队列为您的模态应用程序提供分布式 FIFO 队列。

```python runner:ModalRunner retry:2
import modal

app = modal.App()
queue = modal.Queue.from_name("simple-queue", create_if_missing=True)


def producer(x):
    queue.put(x)  # adding a value


@app.function()
def consumer():
    return queue.get()  # retrieving a value


@app.local_entrypoint()
def main(x="some object"):
    # produce and consume tasks from local or remote code
    producer(x)
    print(consumer.remote())
```

本页是使用模态队列的高级指南。
有关 `modal.Queue` 对象的参考文档，请参阅
[本页](/docs/sdk/py/latest/Queue)。
有关 `modal queue` CLI 命令的参考文档，请参阅
[本页](/docs/cli/latest/queue)。

## 模态队列是云中的 Python 队列

就像[Python `Queue`s](https://docs.python.org/3/library/queue.html)，
模态队列是多生产者、多消费者先进先出 (FIFO) 队列。

当您想要处理任务或流程时，队列特别有用
异步数据，或者需要在不同之间传递消息时
分布式系统的组件。

队列在最后一次 `put` 操作后 24 小时内被清除，并由
复制的内存数据库，因此可能存在持久性，但不能保证。
因此，`Queue`最适合用于活动功能和
不依赖持久存储。

如果您需要队列对象的持久性，请联系[请联系](mailto:support@modal.com)。

## 队列按键分区

队列通过字符串键分为单独的 FIFO 分区。默认情况下，一个
使用分区（对应于空键）。
单个`Queue`最多可以包含100,000个分区，每个分区最多5,000个
项目。每个项目最多可达 1 MiB。这些限制也适用于默认
分区。

每个分区都有独立的TTL，默认24小时。
较低的 TTL 可以通过 `put` 中的 `partition_ttl` 参数指定，或者
`put_many` 方法。

```python
with modal.Queue.ephemeral() as q:
    q.put("some value")  # first in
    q.put(123)

    assert q.get() == "some value"  # first out
    assert q.get() == 123

    q.put(0)
    q.put(1, partition="foo")
    q.put(2, partition="bar")

    # Default and "foo" partition are ignored by the get operation.
    assert q.get(partition="bar") == 2

    # Set custom 10s expiration time on "foo" partition.
    q.put(3, partition="foo", partition_ttl=10)

    # Iterate through items in place (read immutably)
    q.put(1)
    assert [v for v in q.iterate()] == [0, 1]
```

## 您可以同步或异步、阻塞或非阻塞访问模态队列

队列默认是同步且阻塞的。消费者会阻塞并等待
在空队列上，生产者将阻塞并等待满队列，两者都带有 `Optional`，可配置 `timeout`。如果`timeout`是`None`，
他们将无限期地等待。如果提供了 `timeout`，`get` 方法将引发
[`queue.Empty`](https://docs.python.org/3/library/queue.html#queue.Empty)
异常和 `put` 方法将会引发
[`queue.Full`](https://docs.python.org/3/library/queue.html#queue.Full)
异常，均来自 Python 标准库。

通过将 `block` 参数设置为 `False`，可以使 `get` 和 `put` 方法成为非阻塞方法。
他们引发 `queue` 异常，而不等待 `timeout`。

队列存储在云端，因此所有交互都需要通过网络进行通信。
除了 `timeout` 之外，这会给调用增加一些额外的延迟，大约几十毫秒。
为了避免这种延迟影响应用程序延迟，您可以与队列异步交互
通过添加 `.aio` 函数后缀来访问方法。

```python notest
@app.local_entrypoint()
async def main(value=None):
    await my_queue.put.aio(value or 200)
    assert await my_queue.get.aio() == value
```

有关更多信息，请参阅[异步函数](/docs/guide/async) 指南
信息。

## 模态队列*完全*不是 Python 队列

Python 队列可以具有任何类型的值。

模态队列可以存储任何可序列化类型的 Python 对象。

对象使用[`cloudpickle`](https://github.com/cloudpipe/cloudpickle)进行序列化，
因此精确的支持是从该库继承的。 `cloudpickle` 可以序列化令人惊讶的各种对象，
像 `lambda` 函数甚至 Python 模块，但它无法序列化一些不序列化的东西
序列化确实很有意义，就像实时系统资源（套接字、可写文件描述符）一样。

请注意，您需要在环境中安装定义类型的库
您可以在其中检索对象以便可以将其反序列化。