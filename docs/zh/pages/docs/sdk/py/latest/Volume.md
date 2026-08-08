<!-- modal-docs: machine-translated zh-CN from English source -->

# 音量

```python
class Volume(modal.object.Object)
```

一种可写卷，可用于在一个或多个 Modal 函数之间共享文件。

卷的内容作为文件系统公开。您可以使用它在不同功能之间共享数据，或者
在同一函数的多个实例中保持持久状态。

与网络文件系统不同，您需要显式地重新加载卷才能查看自挂载以来所做的更改。
同样，您需要显式提交对卷所做的任何更改才能使更改可见
在当前容器之外。

支持并发修改，但应避免同一文件的并发修改！最后写入
在并发修改同一文件的情况下获胜 - 最后一个写入者在提交时没有的任何数据
更改将会丢失！

因此，卷通常不太适合需要并发修改的用例
相同的文件（也不支持分布式文件锁定）。

仅当卷没有打开的文件时才能重新加载卷 - 尝试使用打开的文件重新加载
将导致错误。

**使用**

```python
import modal

app = modal.App()
volume = modal.Volume.from_name("my-persisted-volume", create_if_missing=True)

@app.function(volumes={"/root/foo": volume})
def f():
    with open("/root/foo/bar.txt", "w") as f:
        f.write("hello")
    volume.commit()  # Persist changes

@app.function(volumes={"/root/foo": volume})
def g():
    volume.reload()  # Fetch latest changes
    with open("/root/foo/bar.txt", "r") as f:
        print(f.read())
```

## 水合物

```python
hydrate(self, client=None)
```
将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作
需要时会懒洋洋地补充水分。主要用例是当您需要时
访问对象元数据，例如其 ID。

*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 对象

```python
objects: VolumeManager
```

具有用于管理命名卷对象的方法的命名空间。

### 对象.create

```python
create(self, name, *, version=None, allow_existing=False, environment_name=None,
    client=None, experimental_options=None)
```

在工作区环境中创建一个新的命名卷。

这不会返回本地句柄；创建后使用 `modal.Volume.from_name` 查找 Volume。

v1.1.2 中添加。**参数**

<Parameter name="name" type="str" description="Name for the new Volume." />
<Parameter name="version" type="int | None" defaultValue="None" description="Optional VolumeFS backend version (1 or 2); experimental." />
<Parameter name="allow_existing" type="bool" defaultValue="False" description="If True, do nothing when a Volume with this name already exists." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to create in; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T41⟧ when omitted." />
<Parameter name="experimental_options" type="dict[str, Any] | None" defaultValue="None" description="Experimental options to create Volume with." />

**使用**

```python notest
modal.Volume.objects.create("my-volume")
```

将在活动环境中创建卷，或者可以指定另一个卷：

```python notest
modal.Volume.objects.create("my-volume", environment_name="dev")
```

默认情况下，如果卷已存在，则会引发错误； `allow_existing=True` 使这种情况成为无操作：

```python notest
modal.Volume.objects.create("my-volume", allow_existing=True)
```

请注意，此方法不会返回 Volume 的本地实例。您可以使用
`modal.Volume.from_name` 创建后执行查找。

### 对象.list

```python
list(self, *, max_objects=None, created_before=None, environment_name="",
    client=None)
```

将工作区环境中的命名卷列为水合句柄。

结果按最新到最旧的顺序排列。默认情况下，返回所有匹配的卷。

v1.1.2 中添加。

**参数**

<Parameter name="max_objects" type="int | None" defaultValue="None" description="Maximum number of Volumes to return." />
<Parameter name="created_before" type="datetime | str | None" defaultValue="None" description="Only include Volumes created before this time (datetime or ISO date string)." />
<Parameter name="environment_name" type="str" defaultValue="&quot;&quot;" description="Environment to list from; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T44⟧ when omitted." />

**退货**

列表中每个命名卷的水合 `Volume` 对象。

**使用**

```python
volumes = modal.Volume.objects.list()
print([v.name for v in volumes])
```

将从活动环境中检索卷，或者可以指定另一个卷：

```python notest
dev_volumes = modal.Volume.objects.list(environment_name="dev")
```

默认情况下，将返回所有命名卷（从最新到最旧）。也可以限制
结果数并按创建日期过滤：

```python
volumes = modal.Volume.objects.list(max_objects=10, created_before="2025-01-01")
```

### 对象.删除

```python
delete(self, name, *, allow_missing=False, environment_name=None, client=None)
```

完全删除指定卷（不是单个文件）。

删除是不可逆的，并且会影响使用该卷的任何应用程序。

v1.1.2 中添加。

**参数**

<Parameter name="name" type="str" description="Name of the Volume to delete." />
<Parameter name="allow_missing" type="bool" defaultValue="False" description="If True, do nothing when the Volume does not exist." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to delete from; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T46⟧ when omitted." />

**使用**```python notest
await modal.Volume.objects.delete("my-volume")
```

卷将从活动环境中删除，或者可以指定另一个卷：

```python notest
await modal.Volume.objects.delete("my-volume", environment_name="dev")
```

## 姓名

```python
name(self)
```

## 带有\_mount\_选项

```python
with_mount_options(self, *, read_only=None, sub_path=None)
```

配置安装此卷时使用的选项。

请注意，这些选项不是与卷本身一起存储的属性 - 它们可以单独配置
对于每个卷-容器关联。

**参数**

<Parameter name="read_only" type="bool | None" defaultValue="None" description="Set this to True to make the Volume read only from within containers." />
<Parameter name="sub_path" type="str | PurePosixPath | None" defaultValue="None" description="Only mount this sub_path directory from the Volume. If the directory doesn&#x27;t exist in the Volume, it will be created when the container starts up." />

**退货**

应用了安装选项的`Volume`手柄。

**使用**

要以只读模式安装卷：

```python
import modal

volume = modal.Volume.from_name("my-volume")

@app.function(volumes={"/mnt": volume.with_mount_options(read_only=True)})
def f():
    return os.mkdir("/mnt/foo")  # not possible!
```

要使用 sub\_path 仅挂载卷的一部分：

```python
import modal

volume = modal.Volume.from_name("my-volume")

@app.function(volumes={"/user_data": volume.with_mount_options(sub_path="/users/my_user")})
def f():
    return os.listdir("/user_data")  # lists data from /users/my_user
```

## 来自\_name

```python
from_name(name, *, environment_name=None, create_if_missing=False, version=None,
    create_options=None, client=None)
```
按名称引用卷，可以选择首先在服务器上创建它。

Hydration 是惰性的：第一次使用句柄时从 Modal 获取元数据。

**参数**

<Parameter name="name" type="str" description="Deployment name of the Volume." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to resolve the name in; defaults to the active environment." />
<Parameter name="create_if_missing" type="bool" defaultValue="False" description="If True, create the Volume when it does not already exist." />
<Parameter name="version" type="&quot;modal_proto.api_pb2.VolumeFsVersion.ValueType | None&quot;" defaultValue="None" description="Optional VolumeFS backend version; must match an existing Volume when set." />
<Parameter name="create_options" type="&quot;VolumeCreateOptions | None&quot;" defaultValue="None" description="Applied when creating the Volume. If an existing Volume, validates options are consistent." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for loading; defaults to ⟦T48⟧ when omitted." />

**退货**

`Volume` 手柄（可能尚未吸水）。

**使用**

```python
vol = modal.Volume.from_name("my-volume", create_if_missing=True)

app = modal.App()

@app.function(volumes={"/data": vol})
def f():
    pass
```

## 来自\_id

```python
from_id(volume_id, client=None)
```

从 id 构造一个 Volume 并查找 Volume 元数据。

这是一种延迟对局部进行补水的惰性方法
具有来自 Modal 服务器的元数据的对象，直到第一个
实际使用的时间。

可以使用 `.object_id` 访问 Volume 对象的 ID。

**参数**<Parameter name="volume_id" type="str" description="Volume object ID to attach to." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for loading; defaults to ⟦T51⟧ when omitted." />

**退货**

`Volume` 手柄（可能尚未吸水）。

**使用**

```python notest
@app.function()
def my_worker(volume_id: str):
    vol = modal.Volume.from_id(volume_id)
    for entry in vol.listdir("/"):
        print(entry.path)

with modal.Volume.ephemeral() as vol:
    my_worker.remote(vol.object_id)
```

## 短暂的

```python
ephemeral(cls, client=None, environment_name=None, version=None,
    create_options=None)
```

创建一个在上下文管理器的持续时间内存在的匿名卷。

**参数**

<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T53⟧ when omitted." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment for the ephemeral Volume; defaults to the active environment." />
<Parameter name="version" type="&quot;modal_proto.api_pb2.VolumeFsVersion.ValueType | None&quot;" defaultValue="None" description="Optional VolumeFS backend version for the ephemeral Volume." />
<Parameter name="create_options" type="&quot;VolumeCreateOptions | None&quot;" defaultValue="None" description="Options applied when creating the ephemeral Volume." />

**使用**

```python
import modal

with modal.Volume.ephemeral() as vol:
    assert vol.listdir("/") == []
```

```python notest
async with modal.Volume.ephemeral() as vol:
    assert await vol.listdir("/") == []
```

## 信息

```python
info(self)
```

返回有关 Volume 对象的信息。

## 提交

```python
commit(self)
```

提交对已安装卷的更改。

如果成功，所做的更改现在将持久保存在持久存储中，并可供其他容器访问
音量。

## 重新加载

```python
reload(self)
```

使卷的最新提交状态在运行的容器中可用。
任何未提交的卷更改（例如新文件或修改的文件）可能会在以下情况下隐式提交：
重新加载。

如果该卷有打开的文件，则重新加载将会失败。

## 迭代目录

```python
iterdir(self, path, *, recursive=True)
```

迭代卷中目录中的所有文件。

传递目录路径会列出该目录中的所有文件。对于文件路径，仅返回该路径
文件的描述。如果`recursive`设置为True，则列出该路径下的所有文件和文件夹
递归地。

## 列表目录

```python
listdir(self, path, *, recursive=False)
```

列出 modal.Volume 中路径前缀下的所有文件。传递目录路径会列出该目录中的所有文件。对于文件路径，仅返回该路径
文件的描述。如果`recursive`设置为True，则列出该路径下的所有文件和文件夹
递归地。

## 读取\_文件

```python
read_file(self, path)
```

从 modal.Volume 读取文件。

注意 - 此函数主要用于在模态应用程序之外使用。
有关从模态卷下载文件的更多信息，请参阅
[指南](https://modal.com/docs/guide/volumes)。

**参数**

<Parameter name="path" type="str" description="Path to the file inside the Volume." />

**使用**

```python notest
vol = modal.Volume.from_name("my-modal-volume")
data = b""
for chunk in vol.read_file("1mb.csv"):
    data += chunk
print(len(data))  # == 1024 * 1024
```

## 删除\_file

```python
remove_file(self, path, recursive=False)
```

从卷中删除文件或目录。

## 复制\_文件

```python
copy_files(self, src_paths, dst_path, recursive=False)
```

将卷内的文件从 src\_paths 复制到 dst\_path。
复制操作的语义遵循 UNIX cp 命令的语义。
`src_paths`参数是一个列表。如果你想复制单个文件，你应该传递一个带有
单一元素。

`src_paths` 和 `dst_path` 应指卷*内部*所需的位置。你不需要前置
卷安装路径。

请注意，如果卷已安装在 Modal 函数上，则应使用正常的文件系统操作
比如 `os.rename()` 然后`commit()` 音量。当你没有时，`copy_files()`方法很有用
作为文件系统安装的卷，例如在本地计算机上运行脚本时。

**参数**

<Parameter name="src_paths" type="Sequence[str]" description="Source paths inside the Volume (list of one or more paths)." />
<Parameter name="dst_path" type="str" description="Destination path inside the Volume (file or directory, following `⟦T62⟧` semantics)." />
<Parameter name="recursive" type="bool" defaultValue="False" description="Whether to copy directories recursively (V2 volumes only)." />

**使用**

```python notest
vol = modal.Volume.from_name("my-modal-volume")

vol.copy_files(["bar/example.txt"], "bar2")
vol.copy_files(["bar/example.txt"], "bar/example2.txt")
```

## 批量\_上传

```python
batch_upload(self, force=False)
```

启动批量上传到卷。

要允许覆盖现有文件，请将 `force` 设置为 `True`（您不能使用 覆盖现有目录
无论如何上传文件）。

**参数**

<Parameter name="force" type="bool" defaultValue="False" description="If True, allow overwriting existing files with uploads (not directories)." />

**使用**

```python notest
vol = modal.Volume.from_name("my-modal-volume")

with vol.batch_upload() as batch:
    batch.put_file("local-path.txt", "/remote-path.txt")
    batch.put_directory("/local/directory/", "/remote/directory")
    batch.put_file(io.BytesIO(b"some data"), "/foobar")
```

## 重命名

```python
rename(old_name, new_name, *, client=None, environment_name=None)
```