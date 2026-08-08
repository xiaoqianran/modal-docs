<!-- modal-docs: machine-translated zh-CN from English source -->

# 字典

```python
class Dict(modal.object.Object)
```

用于在模态应用程序中存储的分布式字典。

字典内容本质上可以是任何对象，只要它们可以被序列化
`cloudpickle`。这包括其他模态对象。如果写作和阅读不同
环境（例如，本地写入和远程读取），有必要拥有
定义双方安装的数据类型的库，具有兼容的版本。
此外，cloudpickle 序列化不能保证是确定性的，因此
通常建议使用原始类型作为键。

**字典及其项目的生命周期**

单个 Dict 条目将在 7 天不活动（无读取或写入）后过期。的
字典条目被写入持久存储。

旧版词典（2025 年 5 月 20 日之前创建）的条目在创建后 30 天后仍然会过期。
最后添加。此外，内容存储在 Modal 服务器的内存中，可能会丢失
由于服务器意外重启。最终，这些词典将完全日落。

**使用**

```python
from modal import Dict

my_dict = Dict.from_name("my-persisted_dict", create_if_missing=True)

my_dict["some key"] = "some value"
my_dict[123] = 456

assert my_dict["some key"] == "some value"
assert my_dict[123] == 456
```

`Dict`类提供了一些通常完成的操作的方法
在 Python 中使用运算符，例如 `Dict.put` 和 `Dict.contains`。优点
这些方法的优点是可以通过使用在异步上下文中安全地调用它们
方法上的 `.aio` 后缀，而它们基于运算符的类似物将始终
同步运行并阻止事件循环。

更多示例请参阅[指南](https://modal.com/docs/guide/dicts-and-queues#modal-dicts)。

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作
需要时会懒洋洋地补充水分。主要用例是当您需要时
访问对象元数据，例如其 ID。*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 对象

```python
objects: DictManager
```

具有用于管理命名 Dict 对象的方法的命名空间。

### 对象.create

```python
create(self, name, *, allow_existing=False, environment_name=None, client=None)
```

在工作区环境中创建一个新的名为 Dict 的文件。

这不会返回本地句柄；创建后使用`modal.Dict.from_name`查找Dict。

v1.1.2 中添加。

**参数**

<Parameter name="name" type="str" description="Name for the new Dict." />
<Parameter name="allow_existing" type="bool" defaultValue="False" description="If True, do nothing when a Dict with this name already exists." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to create in; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T42⟧ when omitted." />

**使用**

```python notest
modal.Dict.objects.create("my-dict")
```

将在活动环境中创建字典，或者可以指定另一个字典：

```python notest
modal.Dict.objects.create("my-dict", environment_name="dev")
```

默认情况下，如果 Dict 已经存在，则会引发错误； `allow_existing=True` 使这种情况成为无操作：

```python notest
modal.Dict.objects.create("my-dict", allow_existing=True)
```

请注意，此方法不会返回 Dict 的本地实例。您可以使用
`modal.Dict.from_name` 创建后执行查找。

### 对象.list

```python
list(self, *, max_objects=None, created_before=None, environment_name="",
    client=None)
```

将工作区环境中的命名字典列为水合句柄。

结果按最新到最旧的顺序排列。默认情况下，返回所有匹配的字典。

v1.1.2 中添加。

**参数**

<Parameter name="max_objects" type="int | None" defaultValue="None" description="Maximum number of Dicts to return." />
<Parameter name="created_before" type="datetime | str | None" defaultValue="None" description="Only include Dicts created before this time (datetime or ISO date string)." />
<Parameter name="environment_name" type="str" defaultValue="&quot;&quot;" description="Environment to list from; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T45⟧ when omitted." />

**退货**

列表中每个命名 Dict 的水合 `Dict` 对象。

**使用**

```python
dicts = modal.Dict.objects.list()
print([d.name for d in dicts])
```

将从活动环境中检索字典，或者可以指定另一个字典：

```python notest
dev_dicts = modal.Dict.objects.list(environment_name="dev")
```

默认情况下，将返回所有命名字典（从最新到最旧）。也可以限制结果数并按创建日期过滤：

```python
dicts = modal.Dict.objects.list(max_objects=10, created_before="2025-01-01")
```

### 对象.删除

```python
delete(self, name, *, allow_missing=False, environment_name=None, client=None)
```

完全删除指定的 Dict（不是单个键）。

删除是不可逆的，并且会影响任何使用此字典的应用程序。

v1.1.2 中添加。

**参数**

<Parameter name="name" type="str" description="Name of the Dict to delete." />
<Parameter name="allow_missing" type="bool" defaultValue="False" description="If True, do nothing when the Dict does not exist." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to delete from; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T47⟧ when omitted." />

**使用**

```python notest
await modal.Dict.objects.delete("my-dict")
```

字典将从活动环境中删除，或者可以指定另一个字典：

```python notest
await modal.Dict.objects.delete("my-dict", environment_name="dev")
```

## 姓名

```python
name(self)
```

Dict 对象的名称。

**使用**

```python
d = modal.Dict.from_name("my-dict")
print(d.name)
```

## 短暂的

```python
ephemeral(cls, *, client=None, environment_name=None)
```

创建一个在上下文管理器的持续时间内存在的匿名字典。

**参数**

<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T48⟧ when omitted." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment for the ephemeral Dict; defaults to the active environment." />

**使用**

```python
from modal import Dict

with Dict.ephemeral() as d:
    d["foo"] = "bar"
```

```python notest
async with Dict.ephemeral() as d:
    await d.put.aio("foo", "bar")
```

## 来自\_name

```python
from_name(name, *, environment_name=None, create_if_missing=False, client=None)
```
引用一个命名的 Dict，可以选择首先在服务器上创建它。

Hydration 是惰性的：第一次使用句柄时从 Modal 获取元数据。

**参数**

<Parameter name="name" type="str" description="Deployment name of the Dict." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to resolve the name in; defaults to the active environment." />
<Parameter name="create_if_missing" type="bool" defaultValue="False" description="If True, create the Dict when it does not already exist." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for loading; defaults to ⟦T49⟧ when omitted." />

**退货**

`Dict` 手柄（可能尚未吸水）。

**使用**

```python
d = modal.Dict.from_name("my-dict", create_if_missing=True)
d[123] = 456
```

## 来自\_id

```python
from_id(dict_id, client=None)
```

从 id 构造一个 Dict 并查找 Dict 元数据。

这是一种延迟对局部进行补水的惰性方法
具有来自 Modal 服务器的元数据的对象，直到第一个
实际使用的时间。

可以使用`.object_id`访问Dict对象的ID。

**参数**

<Parameter name="dict_id" type="str" description="Dict object ID to attach to." /><Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for loading; defaults to ⟦T52⟧ when omitted." />

**退货**

`Dict` 手柄（可能尚未吸水）。

**使用**

```python notest
@app.function()
def my_worker(dict_id: str):
    d = modal.Dict.from_id(dict_id)
    d["key"] = "Hello from remote function!"

with modal.Dict.ephemeral() as d:
    my_worker.remote(d.object_id)
    print(d["key"])  # "Hello from remote function!"
```

## 信息

```python
info(self)
```

返回有关 Dict 对象的信息。

## 清除

```python
clear(self)
```

从字典中删除所有项目。

## 得到

```python
get(self, key, default=None)
```

获取与键关联的值。

如果 key 不存在，则返回 `default`。

## 包含

```python
contains(self, key)
```

如果存在密钥则返回。

## 长度

```python
len(self)
```

返回字典的长度。

注意：这是一个昂贵的操作，最多返回 100,000。

## 更新

```python
update(self, other=None, **kwargs)
```

使用附加项目更新字典。

## 把

```python
put(self, key, value, *, skip_if_exists=False)
```

将特定的键值对添加到 Dict 中。
如果添加了键值对，则返回 True；如果没有添加，则返回 False，因为键已存在，并且
`skip_if_exists`已设定。

## 流行音乐

```python
pop(self, key, default=_NO_DEFAULT)
```

从 Dict 中删除一个键，如果存在则返回该值。

如果未找到密钥，则返回默认值（如果提供），否则引发 KeyError。

## 键

```python
keys(self)
```

返回此 Dict 中键的迭代器。

请注意（与 Python 字典不同）返回值是一个简单的迭代器，
并且结果是无序的。

## 值

```python
values(self)
```

返回对此 Dict 中的值的迭代器。

请注意（与 Python 字典不同）返回值是一个简单的迭代器，
并且结果是无序的。

## 项目

```python
items(self)
```

返回此 Dict 中的 (key, value) 元组的迭代器。

请注意（与 Python 字典不同）返回值是一个简单的迭代器，
并且结果是无序的。