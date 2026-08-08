<!-- modal-docs: machine-translated zh-CN from English source -->

# 秘密

```python
class Secret(modal.object.Object)
```

Secrets 提供了图像环境变量的字典。

秘密是添加凭据和其他敏感信息的安全方式
到您的函数运行所在的容器。您可以在其上创建和编辑机密
[仪表板](https://modal.com/secrets)，或通过 Python 代码编程。

更多信息请参阅[秘密指南页面](https://modal.com/docs/guide/secrets)。

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作
需要时会懒洋洋地补充水分。主要用例是当您需要时访问对象元数据，例如其 ID。

*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 对象

```python
objects: SecretManager
```

具有用于管理命名 Secret 对象的方法的命名空间。

### 对象.create

```python
create(self, name, env_dict, *, allow_existing=False, environment_name=None,
    client=None)
```

在工作区环境中创建一个名为 Secret 的新名称。

这不会返回本地句柄；创建后使用`modal.Secret.from_name`查找Secret。

v1.1.2 中添加。

**参数**

<Parameter name="name" type="str" description="Name for the new Secret." />
<Parameter name="env_dict" type="dict[str, str]" description="Environment variable keys and values stored in the Secret." />
<Parameter name="allow_existing" type="bool" defaultValue="False" description="If True, do nothing when a Secret with this name already exists (existing values are kept)." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to create in; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T27⟧ when omitted." />

**使用**

```python notest
contents = {"MY_KEY": "my-value", "MY_OTHER_KEY": "my-other-value"}
modal.Secret.objects.create("my-secret", contents)
```

将在活动环境中创建机密，或者可以指定另一个机密：

```python notest
modal.Secret.objects.create("my-secret", contents, environment_name="dev")
```

默认情况下，如果 Secret 已存在，则会引发错误，但传递
在这种情况下，`allow_existing=True`将使创建尝试成为无操作。
如果`env_dict`数据与现有的Secret不同，它将被忽略。

```python notest
modal.Secret.objects.create("my-secret", contents, allow_existing=True)
```

请注意，此方法不会返回 Secret 的本地实例。您可以使用
`modal.Secret.from_name` 创建后执行查找。

### 对象.list

```python
list(self, *, max_objects=None, created_before=None, environment_name="",
    client=None)
```

将工作区环境中的命名 Secret 作为水合句柄列出。

结果按最新到最旧的顺序排列。默认情况下，返回所有匹配的 Secret。

v1.1.2 中添加。

**参数**

<Parameter name="max_objects" type="int | None" defaultValue="None" description="Maximum number of Secrets to return." />
<Parameter name="created_before" type="datetime | str | None" defaultValue="None" description="Only include Secrets created before this time (datetime or ISO date string)." />
<Parameter name="environment_name" type="str" defaultValue="&quot;&quot;" description="Environment to list from; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T31⟧ when omitted." />

**退货**

列表中每个命名 Secret 的水合 `Secret` 对象。

**用法**```python
secrets = modal.Secret.objects.list()
print([s.name for s in secrets])
```

将从活动环境中检索机密，或者可以指定另一个机密：

```python notest
dev_secrets = modal.Secret.objects.list(environment_name="dev")
```

默认情况下，将返回所有命名的 Secret，从最新到最旧。也可以限制
结果数并按创建日期过滤：

```python
secrets = modal.Secret.objects.list(max_objects=10, created_before="2025-01-01")
```

### 对象.删除

```python
delete(self, name, *, allow_missing=False, environment_name=None, client=None)
```

完全删除已命名的 Secret。

删除是不可逆的，并且会影响任何使用此密钥的应用程序。

v1.1.2 中添加。

**参数**

<Parameter name="name" type="str" description="Name of the Secret to delete." />
<Parameter name="allow_missing" type="bool" defaultValue="False" description="If True, do nothing when the Secret does not exist." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to delete from; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T33⟧ when omitted." />

**使用**

```python notest
await modal.Secret.objects.delete("my-secret")
```

将从活动环境中删除机密，或者可以指定另一个机密：

```python notest
await modal.Secret.objects.delete("my-secret", environment_name="dev")
```

## 姓名

```python
name(self)
```

## 来自\_dict

```python
from_dict(env_dict={})
```
从环境变量名称到字符串值的字典创建一个 Secret。

值可能是`None`；这些密钥在 Secret 中被省略。

**参数**

<Parameter name="env_dict" type="dict[str, str | None]" defaultValue="&#123;&#125;" description="Mapping of variable names to values (or `⟦T35⟧` to skip a key)." />

**退货**

由给定键值对支持的惰性 `Secret` 句柄。

**使用**

```python
@app.function(secrets=[modal.Secret.from_dict({"FOO": "bar"})])
def run():
    print(os.environ["FOO"])
```

## 来自\_local\_environ

```python
from_local_environ(env_keys)
```

从当前进程环境构建 Secret（仅限本地运行）。

在远程执行中，返回一个空 Secret。

**参数**

<Parameter name="env_keys" type="list[str]" description="Names of environment variables to copy into the Secret." />

**退货**

包含已解析变量的`Secret`（如果不是本地变量，则为空）。

## 来自\_dotenv

```python
from_dotenv(path=None, *, filename=".env", client=None)
```将环境变量从 `.env` 文件加载到 Secret 中。

如果没有 `path`，则从当前工作目录（而不是调用者的文件路径）进行搜索。
设置 `path` 后，从该文件或目录向上查找 `filename`。

**参数**

<Parameter name="path" type="" defaultValue="None" description="File or directory to search from; omit to search from the process cwd." />
<Parameter name="filename" type="" defaultValue="&quot;.env&quot;" description="Name of the env file to find (default `⟦T42⟧`)." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client used when hydrating the Secret." />

**退货**

惰性 `Secret` 句柄，其值从已解析的 `.env` 文件加载。

**使用**

```python
@app.function(secrets=[modal.Secret.from_dotenv(__file__)])
def run():
    print(os.environ["USERNAME"])  # Assumes USERNAME is defined in your .env file
```

```python
@app.function(secrets=[modal.Secret.from_dotenv(filename=".env-dev")])
def run():
    ...
```

## 来自\_name

```python
from_name(name, *, environment_name=None, required_keys=[], client=None)
```

按名称引用已部署的 Secret。

在使用 Secret 之前，水合作用是缓慢的。

**参数**

<Parameter name="name" type="str" description="Deployment name of the Secret." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to resolve the name in; defaults to the active environment." />
<Parameter name="required_keys" type="list[str]" defaultValue="[]" description="If non-empty, the server asserts these keys exist on the Secret." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for loading; defaults to ⟦T45⟧ when omitted." />

**退货**

`Secret` 手柄（可能尚未吸水）。

**使用**

```python
secret = modal.Secret.from_name("my-secret")

@app.function(secrets=[secret])
def run():
    ...
```

## 信息

```python
info(self)
```

返回有关 Secret 对象的信息。
## 更新

```python
update(self, env_dict)
```

更新此 Secret，添加或覆盖键值对。

与 dict.update() 一样，这会将 `env_dict` 合并到现有的 Secret 中。
`env_dict` 中未提及的键保持不变。