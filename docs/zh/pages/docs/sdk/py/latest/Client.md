<!-- modal-docs: machine-translated zh-CN from English source -->

# 客户端

```python
class Client(object)
```

## 已关闭

```python
is_closed(self)
```

检查客户端是否关闭。

**退货**

如果客户端已关闭，则为 True，否则为 False。

## 你好

```python
hello(self)
```

连接服务器并获取版本信息；针对各种故障提出适当的错误。

**使用**

```python
client = modal.Client.from_env()
client.hello()
```

## 来自\_credentials

```python
from_credentials(cls, token_id, token_secret)
```

基于token凭证的构造函数；对于代表第三方用户管理 Modal 很有用。

当需要显式管理客户端的生命周期时也很有用
（例如，在分叉子流程中运行 Modal 时）- 请参阅
[故障排除](/docs/guide/troubleshooting#connection-issues-in-forked-processes)。

**参数**

<Parameter name="token_id" type="str" description="API token ID." />
<Parameter name="token_secret" type="str" description="API token secret." />

**退货**

经过身份验证的`Client`，其连接已打开。

**使用**

```python notest
client = modal.Client.from_credentials("my_token_id", "my_token_secret")

modal.Sandbox.create("echo", "hi", client=client, app=app)
```

## 获取\_输入\_平面\_元数据

```python
get_input_plane_metadata(self, input_plane_region)
```

获取输入平面的元数据。

**参数**

<Parameter name="input_plane_region" type="str" description="The region of the input plane." />

**退货**

输入平面的元数据作为标头/值元组的列表。