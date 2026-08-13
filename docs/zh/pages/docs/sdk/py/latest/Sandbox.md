<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙盒

```python
class Sandbox(modal.object.Object)
```

`Sandbox` 对象可让您与正在运行的沙箱交互。这个API与Python的类似
[asyncio.subprocess.Process](https://docs.python.org/3/library/asyncio-subprocess.html#asyncio.subprocess.Process)。

请参阅[指南](https://modal.com/docs/guide/sandbox)了解如何生成和使用沙箱。

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作
需要时会懒洋洋地补充水分。主要用例是当您需要时
访问对象元数据，例如其 ID。

*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 创建

```python
create(*args, app=None, name=None, tags=None, image=None, env=None,
    secrets=None, network_file_systems={}, timeout=300, idle_timeout=None,
    workdir=None, gpu=None, cloud=None, region=None, cpu=None, memory=None,
    block_network=False, outbound_cidr_allowlist=None,
    outbound_domain_allowlist=None, inbound_cidr_allowlist=None, volumes={},
    pty=False, encrypted_ports=[], h2_ports=[], unencrypted_ports=[],
    custom_domain=None, proxy=None, include_oidc_identity_token=False,
    readiness_probe=None, verbose=False, experimental_options=None,
    _experimental_enable_snapshot=False, client=None, environment_name=None,
    pty_info=None, cidr_allowlist=None)
```创建一个新的沙箱来运行不受信任的任意代码。

Sandbox对应的容器将被异步创建。

**参数**

<Parameter name="*args" type="str" description="Set the CMD of the Sandbox, overriding any CMD of the container image." />
<Parameter name="app" type="&quot;modal.app._App | None&quot;" defaultValue="None" description="Associate the sandbox with an app. Required unless creating from a container." />
<Parameter name="name" type="str | None" defaultValue="None" description="Optionally give the sandbox a name. Unique within an app." />
<Parameter name="tags" type="dict[str, str] | None" defaultValue="None" description="Tags to assign to the Sandbox." />
<Parameter name="image" type="_Image | None" defaultValue="None" description="The image to run as the container for the sandbox." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables to set in the Sandbox." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets to inject into the Sandbox as environment variables." />
<Parameter name="network_file_systems" type="dict[str | os.PathLike, _NetworkFileSystem]" defaultValue="&#123;&#125;" description="Network file systems to mount into the sandbox." />
<Parameter name="timeout" type="int" defaultValue="300" description="Maximum lifetime of the sandbox in seconds." />
<Parameter name="idle_timeout" type="int | None" defaultValue="None" description="The amount of time in seconds that a sandbox can be idle before being terminated." />
<Parameter name="workdir" type="str | None" defaultValue="None" description="Working directory of the sandbox." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU reservation for the sandbox." />
<Parameter name="cloud" type="str | None" defaultValue="None" description="Cloud provider for the sandbox." />
<Parameter name="region" type="str | Sequence[str] | None" defaultValue="None" description="Region or regions to run the sandbox on." />
<Parameter name="cpu" type="float | tuple[float, float] | None" defaultValue="None" description="Specify, in fractional CPU cores, how many CPU cores to request. Or, pass (request, limit) to additionally specify a hard limit in fractional CPU cores. CPU throttling will prevent a container from exceeding its specified limit." />
<Parameter name="memory" type="int | tuple[int, int] | None" defaultValue="None" description="Specify, in MiB, a memory request which is the minimum memory required. Or, pass (request, limit) to additionally specify a hard limit in MiB." />
<Parameter name="block_network" type="bool" defaultValue="False" description="Whether to block network access." />
<Parameter name="outbound_cidr_allowlist" type="Sequence[str] | None" defaultValue="None" description="List of CIDRs the sandbox is allowed to access. If None, all CIDRs are allowed." />
<Parameter name="outbound_domain_allowlist" type="Sequence[str] | None" defaultValue="None" description="List of domain names the sandbox is allowed to access. Supports wildcard prefixes (`⟦T62⟧⟦T63⟧⟦T64⟧⟦T65⟧Sandbox._experimental_set_outbound_network_policy`." />
<Parameter name="inbound_cidr_allowlist" type="Sequence[str] | None" defaultValue="None" description="List of CIDRs allowed to connect inbound to the sandbox (tunnels and connection tokens). If None, all CIDRs are allowed." />
<Parameter name="volumes" type="dict[str | os.PathLike, _Volume | _CloudBucketMount]" defaultValue="&#123;&#125;" description="Mount points for Modal Volumes and CloudBucketMounts." />
<Parameter name="pty" type="bool" defaultValue="False" description="Enable a PTY for the Sandbox entrypoint command. When enabled, all output (stdout and stderr from the process) is multiplexed into stdout, and the stderr stream is effectively empty." />
<Parameter name="encrypted_ports" type="Sequence[int]" defaultValue="[]" description="List of ports to tunnel into the sandbox. Encrypted ports are tunneled with TLS." />
<Parameter name="h2_ports" type="Sequence[int]" defaultValue="[]" description="List of encrypted ports to tunnel into the sandbox, using HTTP/2." />
<Parameter name="unencrypted_ports" type="Sequence[int]" defaultValue="[]" description="List of ports to tunnel into the sandbox without encryption." />
<Parameter name="custom_domain" type="str | None" defaultValue="None" description="Allow connections to the Sandbox via a subdomain of this parent rather than a default Modal domain." />
<Parameter name="proxy" type="_Proxy | None" defaultValue="None" description="Reference to a Modal Proxy to use in front of this Sandbox." />
<Parameter name="include_oidc_identity_token" type="bool" defaultValue="False" description="If True, the sandbox will receive a MODAL_IDENTITY_TOKEN env var for OIDC-based auth." />
<Parameter name="readiness_probe" type="Probe | None" defaultValue="None" description="Probe used to determine when the sandbox has become ready." />
<Parameter name="verbose" type="bool" defaultValue="False" description="Enable verbose logging for sandbox operations." />
<Parameter name="experimental_options" type="dict[str, Any] | None" defaultValue="None" description="Experimental options to pass to the sandbox." />
<Parameter name="_experimental_enable_snapshot" type="bool" defaultValue="False" description="Enable memory snapshots." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal Client to use for the sandbox." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="*DEPRECATED* Optionally override the default environment" />
<Parameter name="pty_info" type="api_pb2.PTYInfo | None" defaultValue="None" description="*DEPRECATED* Use ⟦T66⟧ instead. ⟦T67⟧ will override ⟦T68⟧." />
<Parameter name="cidr_allowlist" type="Sequence[str] | None" defaultValue="None" description="*DEPRECATED* Use outbound_cidr_allowlist instead." />

**退货**

代表创建的沙箱的`Sandbox`对象，可用于与沙箱交互。

**加薪**

* `AlreadyExistsError`：如果已存在同名沙箱。

**使用**

```python
app = modal.App.lookup('sandbox-hello-world', create_if_missing=True)
sandbox = modal.Sandbox.create("echo", "hello world", app=app)
print(sandbox.stdout.read())
sandbox.wait()
```

## 分离

```python
detach(self)
```
断开客户端与沙箱的连接并清理与该连接相关的资源。

确保仅在与沙箱交互完成后才调用 `detach`。拨打`detach`后，
任何使用 Sandbox 对象的操作都不再保证有效。如果你想继续互动
对于正在运行的沙箱，使用 `Sandbox.from_id` 获取新的沙箱对象。

## 来自\_name

```python
from_name(app_name, name, *, environment_name=None, client=None)
```

从已部署的应用程序中按名称获取正在运行的沙箱。

沙箱的名称是传递给 `Sandbox.create` 的 `name` 参数。

**参数**

<Parameter name="app_name" type="str" description="Name of the deployed app to look up the sandbox under." />
<Parameter name="name" type="str" description="Sandbox name to resolve." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Optional environment name for the lookup; defaults to the configured environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for the RPC; defaults to ⟦T76⟧ when omitted." />

**退货**用于运行沙箱的`Sandbox`句柄。

**加薪**

* `NotFoundError`：如果不存在具有给定名称的正在运行的沙箱。

## 来自\_id

```python
from_id(sandbox_id, client=None)
```

根据 id 构造沙箱并查找沙箱结果。

可以使用`.object_id`访问沙箱对象的ID。

**参数**

<Parameter name="sandbox_id" type="str" description="Sandbox object ID to attach to." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for the lookup; defaults to the environment client when omitted." />

**退货**

一个 `Sandbox` 句柄，其中包含从服务器填充的任何可用结果元数据。

## 获取\_标签

```python
get_tags(self)
```

从服务器获取当前附加到此沙箱的任何标签（键值对）。

**退货**

标签作为从标签名称到标签值的映射。

## 设置\_标签

```python
set_tags(self, tags, *, client=None)
```
在沙盒上设置标签（键值对）。标签可用于过滤`Sandbox.list`中的结果。

设置标签会替换沙箱的整个标签集；传递一个空字典会清除所有标签。

**参数**

<Parameter name="tags" type="dict[str, str]" description="Tag names and values to set on this sandbox." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Deprecated. Prefer setting the client when creating or re-attaching to the sandbox." />

## 快照\_文件系统

```python
snapshot_filesystem(self, timeout=55, *, ttl=30 * 24 * 3600)
```

快照沙箱的文件系统。

**参数**

<Parameter name="timeout" type="int" defaultValue="55" description="Maximum time in seconds to wait for the snapshot operation. If the snapshot does not return within that window, the call is cancelled and ⟦T82⟧ is raised." />
<Parameter name="ttl" type="int | None" defaultValue="30 * 24 * 3600" description="The resulting Image is retained for ⟦T83⟧ seconds (default: 30 days). Pass ⟦T84⟧ to retain the image indefinitely." />

**退货**

一个 [`Image`](https://modal.com/docs/sdk/py/latest/Image) 对象，可用于生成新对象
具有相同文件系统的沙箱。

##挂载\_image

```python
mount_image(self, path, image, *, _experimental_encryption_key=None)
```

将镜像挂载到正在运行的沙箱中的指定路径。`path` 应该是一个**不是**根路径（`/`）的目录。如果路径不存在
它将被创建。如果存在且包含数据，则替换之前的目录
由山。

`image`参数支持任何具有对象ID的图像，包括：

* 使用`image.build()`构建的图像
* 通过 ID 引用的图像，例如`Image.from_id(...)`
* 文件系统/目录快照，例如由`.snapshot_directory()`或`.snapshot_filesystem()`创建
* 使用`Image.from_scratch()`创建的空图像

**参数**

<Parameter name="path" type="PurePosixPath | str" description="Absolute mount point directory inside the sandbox (not ⟦T94⟧)." />
<Parameter name="image" type="_Image" description="Image to mount at ⟦T95⟧ (must be built, referenced by ID, or snapshot-based as described above)." />

**使用**

```py notest
user_project_snapshot: Image = sandbox_session_1.snapshot_directory("/user_project")

# You can later mount this snapshot to another Sandbox:
sandbox_session_2 = modal.Sandbox.create(...)
sandbox_session_2.mount_image("/user_project", user_project_snapshot)
sandbox_session_2.filesystem.list_files("/user_project")
```

## 卸载\_image

```python
unmount_image(self, path)
```

从正在运行的沙箱中卸载以前安装的映像。

`path` 必须是传递给 `.mount_image()` 的确切安装点。
卸载后，该路径下的底层沙箱文件系统变为
再次可见。

**参数**

<Parameter name="path" type="PurePosixPath | str" description="Absolute mount point directory to unmount." />

## 快照\_目录

```python
snapshot_directory(self, path, *, timeout=55, ttl=30 * 24 * 3600,
    _experimental_encryption_key=None)
```

对正在运行的沙箱中的目录进行快照，用其内容创建一个新图像。

`timeout` 如果快照未在该窗口内返回，则调用被取消
`modal.exception.TimeoutError` 被提升。

`ttl` 生成的图像保留 `ttl` 秒（默认值：30 天）
通过`ttl=None`无限期保留图像。

**参数**

<Parameter name="path" type="PurePosixPath | str" description="Absolute path of the directory inside the sandbox to snapshot." />

**退货**

包含目录内容的`Image`。

**使用**

```py notest
user_project_snapshot: Image = sandbox_session_1.snapshot_directory("/user_project")

# You can later mount this snapshot to another Sandbox:
sandbox_session_2 = modal.Sandbox.create(...)
sandbox_session_2.mount_image("/user_project", user_project_snapshot)
sandbox_session_2.filesystem.list_files("/user_project")
```

## 等待

```python
wait(self, raise_on_termination=True)
```等待沙箱完成运行。

**参数**

<Parameter name="raise_on_termination" type="bool" defaultValue="True" description="If True, raise when the sandbox is terminated externally." />

## 等待\_直到\_准备好

```python
wait_until_ready(self, *, timeout=300)
```

等待沙箱就绪探针报告沙箱已就绪。

沙箱必须配置`readiness_probe`才能使用此方法。

**参数**

<Parameter name="timeout" type="int" defaultValue="300" description="Maximum time in seconds to wait for readiness." />

**使用**

```py notest
app = modal.App.lookup('sandbox-wait-until-ready', create_if_missing=True)
sandbox = modal.Sandbox.create(
    "python3", "-m", "http.server", "8080",
    readiness_probe=modal.Probe.with_tcp(8080),
    app=app,
)
sandbox.wait_until_ready()
```

## 隧道

```python
tunnels(self, timeout=50)
```

获取沙箱的隧道元数据。

注意：在客户端 [v0.64.153](https://modal.com/docs/sdk/py/changelog#064153-2024-09-30) 之前，此
返回`TunnelData`对象的列表。

**参数**

<Parameter name="timeout" type="int" defaultValue="50" description="Maximum time in seconds to wait for tunnel metadata when not already cached." />

**退货**

将容器端口映射到`Tunnel`元数据的字典。

**加薪**

* `SandboxTimeoutError`：如果超时后隧道不可用。

## 创建\_connect\_token
```python
create_connect_token(self, user_metadata=None, port=8080)
```

创建用于与沙箱建立 HTTP 连接的令牌。

接受可选的 user\_metadata 字符串或字典来与令牌关联。这个元数据
将请求转发到沙箱时，将由代理添加到标头中。
还接受请求将被路由到的端口。

**参数**

<Parameter name="user_metadata" type="str | dict[str, Any] | None" defaultValue="None" description="Optional JSON-serializable metadata or string stored with the connect token." />
<Parameter name="port" type="int" defaultValue="8080" description="Optional container port that requests are routed to when using this token." />

**退货**

用于通过 HTTP 连接到沙箱的 URL 和令牌凭据。

## 重新加载\_volumes

```python
reload_volumes(self, *, timeout=55)
```

重新加载沙箱中安装的所有卷。

v1.1.0 中添加。

阻塞直到重新加载完成，或者在超时时引发`modal.exception.TimeoutError`（重新加载可能仍会在后台完成）。

**参数**

<Parameter name="timeout" type="int" defaultValue="55" description="Defaults to 55 seconds." />

## 终止

```python
terminate(self, *, wait=False)
```

终止沙盒执行。

如果沙箱已经完成运行，则这是无操作。

**参数**

<Parameter name="wait" type="bool" defaultValue="False" description="If True, block until termination completes and return the exit code." />

**退货**

`wait`为True时的沙箱退出代码；否则无。

## 民意调查

```python
poll(self)
```

检查沙盒是否已完成运行。

**退货**

`None` 如果沙盒仍在运行，否则退出代码。

## 执行

```python
exec(self, *args, stdout=StreamType.PIPE, stderr=StreamType.PIPE, timeout=None,
    workdir=None, env=None, secrets=None, text=True, bufsize=-1, pty=False,
    _pty_info=None, pty_info=None)
```

在沙箱中执行命令并返回 ContainerProcess 句柄。

参见[`ContainerProcess`](https://modal.com/docs/sdk/py/latest/container_process#containerprocess)
文档以获取更多信息。

**参数**

<Parameter name="*args" type="str" description="Command and arguments to run inside the sandbox." />
<Parameter name="stdout" type="StreamType" defaultValue="StreamType.PIPE" description="Where to connect the process stdout stream." />
<Parameter name="stderr" type="StreamType" defaultValue="StreamType.PIPE" description="Where to connect the process stderr stream." />
<Parameter name="timeout" type="int | None" defaultValue="None" description="Optional timeout in seconds for the exec session." />
<Parameter name="workdir" type="str | None" defaultValue="None" description="Working directory for the command; must be absolute if set." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables to set during command execution." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets to inject as environment variables during command execution." />
<Parameter name="text" type="bool" defaultValue="True" description="If True, decode streams as text; if False, yield bytes." />
<Parameter name="bufsize" type="Literal[-1, 1]" defaultValue="-1" description="Control line-buffered output. `⟦T112⟧⟦T113⟧⟦T114⟧⟦T115⟧⟦T116⟧` is True)." />
<Parameter name="pty" type="bool" defaultValue="False" description="Enable a PTY for the command. When enabled, all output (stdout and stderr from the process) is multiplexed into stdout, and the stderr stream is effectively empty." />
<Parameter name="_pty_info" type="api_pb2.PTYInfo | None" defaultValue="None" description="*DEPRECATED* Use ⟦T117⟧ instead. ⟦T118⟧ will override ⟦T119⟧." />
<Parameter name="pty_info" type="api_pb2.PTYInfo | None" defaultValue="None" description="*DEPRECATED* Use ⟦T120⟧ instead. ⟦T121⟧ will override ⟦T122⟧." />

**退货**

运行命令的 `ContainerProcess` 句柄（文本或字节取决于 `text`）。

**使用**

```python fixture:sandbox
process = sandbox.exec("bash", "-c", "for i in $(seq 1 3); do echo foo $i; sleep 0.1; done")
for line in process.stdout:
    print(line)
```

## 文件系统

```python
filesystem: SandboxFilesystem
```

沙箱文件系统 API 的命名空间。

### filesystem.copy\_from\_local

```python
copy_from_local(self, local_path, remote_path)
```

将本地文件复制到沙箱中。

`remote_path` 必须是沙盒中文件的绝对路径。
如果需要，会创建 `remote_path` 的父目录。
如果远程文件已存在，则将其覆盖。

**参数**

<Parameter name="local_path" type="str | os.PathLike" description="Path to the file on the local machine." />
<Parameter name="remote_path" type="str" description="Absolute path to the file in the Sandbox." />

**加薪**

* `SandboxFilesystemNotADirectoryError`：`remote_path`的父路径组件不是目录。* `SandboxFilesystemIsADirectoryError`: `remote_path` 指向一个目录。
* `SandboxFilesystemPermissionError`：沙箱中的写入权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。
* `FileNotFoundError`: `local_path` 不存在。
* `IsADirectoryError`: `local_path` 是一个目录。
* `PermissionError`：不允许阅读`local_path`。

**使用**

```python fixture:sandbox fixture:tmpdir
import tempfile
from pathlib import Path

local_path = Path(tempfile.mktemp())
local_path.write_text("Hello, world!\n")
sandbox.filesystem.copy_from_local(local_path, "/tmp/hello.txt")
```

### filesystem.copy\_to\_local

```python
copy_to_local(self, remote_path, local_path)
```

将文件从沙箱复制到本地路径。

`remote_path` 必须是沙箱中文件的绝对路径。
如果需要，会创建 `local_path` 的父目录。
如果本地文件已存在，则覆盖该文件。

**加薪**

* `SandboxFilesystemNotFoundError`: 远程路径不存在。
* `SandboxFilesystemIsADirectoryError`：远程路径指向一个目录。
* `SandboxFilesystemPermissionError`：沙箱中的读取权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。
* `IsADirectoryError`: `local_path` 指向一个目录。
* `NotADirectoryError`：`local_path`父级的组件不是目录。
* `PermissionError`：不允许写`local_path`。

**使用**

```python fixture:sandbox fixture:tmpdir
sandbox.filesystem.write_text("Hello, world!\n", "/tmp/hello.txt")
sandbox.filesystem.copy_to_local("/tmp/hello.txt", "/tmp/local-hello.txt")
```

### filesystem.list\_files

```python
list_files(self, remote_path)
```

列出 Sandbox 目录中的文件和目录。

**参数**

<Parameter name="remote_path" type="str" description="Absolute path to the directory in the Sandbox." />

**退货**

描述每个条目的 `FileInfo` 对象列表。

**加薪**

* `SandboxFilesystemNotFoundError`: 路径不存在。
* `SandboxFilesystemNotADirectoryError`：路径不是目录。
* `SandboxFilesystemPermissionError`：读取权限被拒绝。* `SandboxFilesystemError`：命令因任何其他原因失败。

**使用**

```python fixture:sandbox
entries = sandbox.filesystem.list_files("/tmp")
for entry in entries:
    print(entry.name, entry.type, entry.size)
```

### 文件系统.make\_directory

```python
make_directory(self, remote_path, *, create_parents=True)
```

在沙箱中创建一个新目录。

`remote_path` 必须是沙盒中的绝对路径。

当 `create_parents` 为 `True`（默认值）时，将创建任何缺失的父目录并调用
幂等（如果目录已存在，则静默成功）。当`create_parents`为`False`时，
直接父目录必须已存在，并且路径不得已存在。

**参数**

<Parameter name="remote_path" type="str" description="Absolute path of the directory to create in the Sandbox." />
<Parameter name="create_parents" type="bool" defaultValue="True" description="When `⟦T161⟧`, create missing parents and succeed if the directory already exists." />

**加薪**

* `SandboxFilesystemNotFoundError`：父目录不存在，`create_parents`为假。
* `SandboxFilesystemPathAlreadyExistsError`: 路径已经存在。
* `SandboxFilesystemNotADirectoryError`：路径组件不是目录。
* `SandboxFilesystemPermissionError`：不允许创作。
* `InvalidError`：安装座不支持该操作。
* `SandboxFilesystemError`：命令因任何其他原因失败。

**使用**

```python fixture:sandbox
sandbox.filesystem.make_directory("/tmp/a/b/c")
```

### 文件系统.read\_bytes

```python
read_bytes(self, remote_path)
```

从沙盒中读取文件并以字节形式返回其内容。

`remote_path` 必须是沙盒中文件的绝对路径。

**参数**

<Parameter name="remote_path" type="str" description="Absolute path to the file in the Sandbox." />

**退货**

从文件中读取的原始字节。

**加薪**

* `SandboxFilesystemNotFoundError`: 路径不存在。
* `SandboxFilesystemIsADirectoryError`：路径指向一个目录。
* `SandboxFilesystemPermissionError`：读取权限被拒绝。* `SandboxFilesystemError`：命令因任何其他原因失败。

**使用**

```python fixture:sandbox
sandbox.filesystem.write_bytes(b"Hello, world!\n", "/tmp/hello.bin")
contents = sandbox.filesystem.read_bytes("/tmp/hello.bin")
print(contents.decode("utf-8"))
```

### 文件系统.read\_text

```python
read_text(self, remote_path)
```

从沙盒中读取文件并将其内容作为 UTF-8 字符串返回。

`remote_path` 必须是沙盒中文件的绝对路径。

**参数**

<Parameter name="remote_path" type="str" description="Absolute path to the file in the Sandbox." />

**退货**

文件内容解码为 UTF-8。

**加薪**

* `SandboxFilesystemNotFoundError`: 路径不存在。
* `SandboxFilesystemIsADirectoryError`：路径指向一个目录。
* `SandboxFilesystemPermissionError`：读取权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。

**使用**

```python fixture:sandbox
sandbox.filesystem.write_text("Hello, world!\n", "/tmp/hello.txt")
contents = sandbox.filesystem.read_text("/tmp/hello.txt")
print(contents)
```

### 文件系统.删除

```python
remove(self, remote_path, *, recursive=False)
```

删除沙箱中的文件或目录。

当`remote_path`是目录且`recursive`是`False`时（
默认），仅当它为空时才将其删除。当`recursive`为`True`时，
删除该目录及其所有内容。

并非所有安装都支持递归目录删除。
特别是`CloudBucketMount`不支持。安
在这种情况下，`InvalidError` 会被提升。

**参数**

<Parameter name="remote_path" type="str" description="Absolute path to the file in the Sandbox." />
<Parameter name="recursive" type="bool" defaultValue="False" description="When `⟦T186⟧`, remove the directory and all its contents." />

**加薪**

* `SandboxFilesystemNotFoundError`: 远程路径不存在。
* `SandboxFilesystemDirectoryNotEmptyError`: `recursive` 为 `False` 并且目录不为空。
* `SandboxFilesystemPermissionError`：沙箱中的读取权限被拒绝。
* `InvalidError`：安装座不支持该操作。
* `SandboxFilesystemError`：命令因任何其他原因失败。

**用法**要删除文件：

```python fixture:sandbox
sandbox.filesystem.write_bytes(b"Hello, world!\n", "/tmp/hello.bin")
sandbox.filesystem.remove("/tmp/hello.bin")
```

要删除目录及其所有内容：

```python fixture:sandbox
sandbox.filesystem.make_directory("/tmp/mydir/subdir")
sandbox.filesystem.remove("/tmp/mydir", recursive=True)
```

### 文件系统.stat

```python
stat(self, remote_path)
```

返回沙箱中单个文件、目录或符号链接的元数据。

`remote_path` 必须是沙盒中的绝对路径。如果 `remote_path` 是符号链接，则返回
`FileInfo` 对象描述符号链接，而不是它指向的目标。

**加薪**

* `SandboxFilesystemNotFoundError`: 路径不存在。
* `SandboxFilesystemNotADirectoryError`：路径的非叶组件不是目录。
* `SandboxFilesystemPermissionError`：路径的某个组件不可搜索。
* `SandboxFilesystemError`：命令因任何其他原因失败。

**使用**

```python fixture:sandbox
sandbox.filesystem.write_text("Hello, world!\n", "/tmp/hello.txt")
info = sandbox.filesystem.stat("/tmp/hello.txt")
print(info.size, info.permissions, info.modified_time)
```

### 文件系统.watch

```python
watch(self, remote_path, *, filter=None, recursive=False, timeout=None)
```
观察沙盒中的路径以了解文件系统更改。

`remote_path` 必须是沙箱中的绝对路径。如果它指向
对于某个文件，会报告该文件的事件。如果它指向一个
目录，报告直接位于其中的条目的事件。套装
`recursive=True` 还接收所有嵌套子目录的事件。
如果 `remote_path` 是符号链接，则跟随它并进行事件引用
已解析目标下的路径。

当变化发生时产生 `FileWatchEvent` 对象，直到
`timeout` 秒过去，迭代器关闭，或者沙箱
被终止。

可以选择限制向包含的事件发出的事件类型在`filter`。默认过滤器`None`允许所有事件类型。

`timeout` 以秒为单位。 `None`表示无限期观看。当
`timeout`过去，迭代器停止而不引发异常。

**加薪**

* `SandboxFilesystemNotFoundError`: `remote_path` 不存在。
* `SandboxFilesystemPermissionError`：手表访问被拒绝。
* `InvalidError`: `remote_path`处的文件系统不支持
  观看。
* `SandboxFilesystemError`：命令因任何其他原因失败。

**使用**

```python notest
for event in sandbox.filesystem.watch(
    "/tmp/foo",
    recursive=True,
    filter=[FileWatchEventType.Create],
    timeout=60,
):
    if any(p.endswith(".done") for p in event.paths):
        break
```

### filesystem.write\_bytes

```python
write_bytes(self, data, remote_path)
```

将二进制内容写入沙箱中的文件。

`remote_path` 必须是沙盒中文件的绝对路径。
如果需要，会创建 `remote_path` 的父目录。
如果远程文件已存在，则将其覆盖。

**参数**

<Parameter name="data" type="bytes | bytearray | memoryview" description="Bytes to write." />
<Parameter name="remote_path" type="str" description="Absolute path to the file in the Sandbox." />

**加薪**

* `TypeError`：`data` 不是类似字节的。
* `SandboxFilesystemNotADirectoryError`：父路径组件不是目录。
* `SandboxFilesystemIsADirectoryError`：`remote_path`指向一个目录。
* `SandboxFilesystemPermissionError`：写权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。

**使用**

```python fixture:sandbox
sandbox.filesystem.write_bytes(b"Hello, world!\n", "/tmp/hello.bin")
```

### filesystem.write\_text

```python
write_text(self, data, remote_path)
```

将 UTF-8 文本写入沙箱中的文件。

`remote_path` 必须是沙盒中文件的绝对路径。
如果需要，会创建 `remote_path` 的父目录。
如果远程文件已存在，则将其覆盖。

**参数**<Parameter name="data" type="str" description="Text to write (encoded as UTF-8)." />
<Parameter name="remote_path" type="str" description="Absolute path to the file in the Sandbox." />

**加薪**

* `TypeError`: `data` 不是字符串。
* `SandboxFilesystemNotADirectoryError`：父路径组件不是目录。
* `SandboxFilesystemIsADirectoryError`: `remote_path` 指向一个目录。
* `SandboxFilesystemPermissionError`: 写权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。

**使用**

```python fixture:sandbox
sandbox.filesystem.write_text("Hello, world!\n", "/tmp/hello.txt")
```

## 打开

```python
open(self, path, mode="r")
```

\[Alpha] 在沙箱中打开文件并返回 FileIO 句柄。

**已弃用 (2026-03-09)：** 使用 `Sandbox.filesystem` API 来提高可靠性。

参见[`FileIO`](https://modal.com/docs/sdk/py/latest/file_io#fileio)
文档以获取更多信息。

**参数**

<Parameter name="path" type="str" description="Absolute path of the file inside the sandbox." />
<Parameter name="mode" type="Union[_typeshed.OpenTextMode, _typeshed.OpenBinaryMode]" defaultValue="&quot;r&quot;" description="File open mode (text or binary), following built-in `⟦T237⟧` conventions." />

**退货**

用于读取或写入远程文件的`FileIO`句柄。

**使用**

```python notest
sb = modal.Sandbox.create(app=sb_app)
f = sb.open("/test.txt", "w")
f.write("hello")
f.close()
```

## ls
```python
ls(self, path)
```

\[Alpha] 列出沙箱中目录的内容。

**已弃用 (2026-04-15)：** 使用 `Sandbox.filesystem.list_files()` 代替以提高可靠性。

**参数**

<Parameter name="path" type="str" description="Absolute directory path inside the sandbox." />

**退货**

目录中的条目名称作为字符串列表。

## 目录

```python
mkdir(self, path, parents=False)
```

\[Alpha] 在沙箱中创建一个新目录。

**已弃用 (2026-04-15)：** 使用 `Sandbox.filesystem.make_directory()` 代替以提高可靠性。

## rm

```python
rm(self, path, recursive=False)
```

\[Alpha] 删除沙箱中的文件或目录。

**已弃用 (2026-04-15)：** 使用 `Sandbox.filesystem.remove()` 代替以提高可靠性。

## 观看

```python
watch(self, path, filter=None, recursive=None, timeout=None)
```\[Alpha] 观察沙盒中的文件或目录的更改。

**已弃用 (2026-05-08)：** 使用 `Sandbox.filesystem.watch()` 代替以提高可靠性。

**参数**

<Parameter name="path" type="str" description="Absolute path to watch." />
<Parameter name="filter" type="builtins.list[FileWatchEventType] | None" defaultValue="None" description="Optional list of event types to include." />
<Parameter name="recursive" type="bool | None" defaultValue="None" description="Whether to watch subdirectories; None uses server defaults." />
<Parameter name="timeout" type="int | None" defaultValue="None" description="Optional timeout for the watch stream." />

**退货**

`FileWatchEvent` 值的异步迭代器。

## 标准输出

```python
stdout(self)
```

[`StreamReader`](https://modal.com/docs/sdk/py/latest/io_streams#streamreader)
对于沙箱的标准输出流。

**退货**

沙箱标准输出的流读取器。

## 标准错误

```python
stderr(self)
```

[`StreamReader`](https://modal.com/docs/sdk/py/latest/io_streams#streamreader)
对于沙盒的 stderr 流。

**退货**

沙箱 stderr 的流读取器。

## 标准输入

```python
stdin(self)
```

[`StreamWriter`](https://modal.com/docs/sdk/py/latest/io_streams#streamwriter)
对于沙箱的标准输入流。

**退货**

沙盒标准输入的流编写器。

## 返回码

```python
returncode(self)
```
如果沙箱进程已完成运行，则返回代码，否则`None`。

**退货**

沙箱进程完成时退出代码，否则无。

## 列表

```python
list(*, app_id=None, tags=None, client=None)
```

列出当前环境或应用程序 ID（如果指定）的所有沙箱。如果指定了标签，则仅
返回至少具有这些标签的沙箱。

**参数**

<Parameter name="app_id" type="str | None" defaultValue="None" description="If set, restrict results to sandboxes under this app ID." />
<Parameter name="tags" type="dict[str, str] | None" defaultValue="None" description="If set, only sandboxes containing at least these tags are returned." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for listing; defaults to ⟦T248⟧ when omitted." />

**退货**

一个异步生成器，生成 `Sandbox` 对象。