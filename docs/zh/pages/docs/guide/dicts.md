<!-- modal-docs: machine-translated zh-CN from English source -->

# 字典

Modal Dicts 为您的 Modal 应用程序提供分布式键值存储。

```python runner:ModalRunner
import modal

app = modal.App()
kv = modal.Dict.from_name("kv", create_if_missing=True)


@app.local_entrypoint()
def main(key="cloud", value="dictionary", put=True):
    if put:
        kv[key] = value
    print(f"{key}: {kv[key]}")
```

本页是使用模态字典的高级指南。
有关 `modal.Dict` 对象的参考文档，请参阅
[本页](/docs/sdk/py/latest/Dict)。
有关 `modal dict` CLI 命令的参考文档，请参阅
[本页](/docs/cli/latest/dict)。

## Modal 字典是云中的 Python 字典

字典为您的模态应用程序提供分布式键值存储。
与标准 Python 字典非常相似，Dict 可以让您存储和检索
使用键的值。然而，与常规字典不同，Modal 中的 Dict 是
可从任何地方同时、并行地访问。

```python
# create a remote Dict
dictionary = modal.Dict.from_name("my-dict", create_if_missing=True)


dictionary["key"] = "value"  # set a value from anywhere
value = dictionary["key"]    # get a value from anywhere
```

字典是持久化的，这意味着字典中的数据是
即使在重新部署应用程序后也可以进行存储和检索。

## 您可以异步访问 Modal Dicts

模态字典存在于云端，这意味着读取和写入
通过网络反对他们。这有一些不可避免的延迟开销，
相对于仅仅从记忆中读取，需要几十毫秒。
通过 `["key"]` 式索引从 Dict 读取是同步的，
这意味着应用程序通常会直接感受到延迟。
但与所有 Modal 对象一样，您也可以与 Dict 异步交互
通过在方法上添加 `.aio` 后缀——在本例中为 `put` 和 `get`，
它们是基于括号的索引的同义词。
只需将 `async` 关键字添加到您的 `local_entrypoint` 或远程函数中
和 `await` 方法调用。

```python runner:ModalRunner
import modal

app = modal.App()
dictionary = modal.Dict.from_name("async-dict", create_if_missing=True)


@app.local_entrypoint()
async def main():
    await dictionary.put.aio("key", "value")  # setting a value asynchronously
    assert await dictionary.get.aio("key")   # getting a value asynchronously
```

有关更多信息，请参阅[异步函数](/docs/guide/async) 指南
信息。

## 模态字典*完全*不是 Python 字典

Python 字典可以具有任何可哈希类型的键和任何类型的值。

您可以将任何可序列化类型的 Python 对象存储在 Dict 中作为键或值。

对象使用[`cloudpickle`](https://github.com/cloudpipe/cloudpickle)进行序列化，
因此精确的支持是从该库继承的。 `cloudpickle` 可以序列化令人惊讶的各种对象，
像 `lambda` 函数甚至 Python 模块，但它无法序列化一些不序列化的东西
序列化确实很有意义，就像实时系统资源（套接字、可写文件描述符）一样。

请注意，您需要在环境中安装定义类型的库
您可以在其中检索对象以便可以将其反序列化。

与普通的 Python 字典不同，可变值类型的更新不会
除非显式放置更新的对象，否则会反映在其他容器中
回到字典中。因此，诸如链式更新之类的模式
(`my_dict["outer_key"]["inner_key"] = value`) 不能以与
他们会用当地的字典。

目前，每个对象的大小限制为 100 MiB，最大条目数
每次更新为 10,000。对于较小的对象（小于 5 MiB），建议使用 Dicts。
Dict 中的每个对象将在 7 天不活动（无读取或写入）后过期。

字典还提供锁定原语。参见
[此博文](/blog/cache-dict-launch) 了解详细信息。