<!-- modal-docs: machine-translated zh-CN from English source -->

# 边车容器

SidecarContainer 是在 Sandbox 中运行的 Sidecar 容器的句柄。

```go
type SidecarContainer struct {
	ContainerID   string             // ContainerID is the fully qualified container ID.
	ContainerName string             // ContainerName is the logical name of the container within the Sandbox.
	Filesystem    *SandboxFilesystem // Filesystem provides high-level filesystem operations for this container.
}
```

## 执行

```go
Exec(ctx context.Context, command []string, params *SidecarExecParams) (*ContainerProcess, error)
```

Exec 在 sidecar 容器中运行命令并返回进程句柄。

**参数** (`SidecarExecParams`)

SidecarExecParams 保存 `SidecarContainer.Exec` 的选项。

* `Stdout` (`StdioBehavior`): Stdout 定义是否通过管道传输或忽略标准输出。
* `Stderr` (`StdioBehavior`): Stderr 定义是管道还是忽略标准错误。
* `Workdir` (`string`): Workdir 是运行命令的工作目录。* `Timeout` (`time.Duration`): Timeout是命令执行的超时时间。默认为 0（无超时）。
* `Env` (`map[string]string`): 为命令设置的环境变量。
* `Secrets` (`[]*Secret`)：作为命令的环境变量注入的秘密。
* `PTY` (`bool`): PTY 定义是否为命令启用 PTY。启用后，所有输出（进程中的 stdout 和 stderr）都会多路复用到 stdout，并且 stderr 流实际上为空。

## 挂载图像

```go
MountImage(ctx context.Context, path string, image *Image, params *SidecarMountImageParams) error
```

MountImage 在此 Sidecar 容器的文件系统中的路径上安装 Image。

如果 image 为零，则安装一个空目录。

**参数** (`SidecarMountImageParams`)

SidecarMountImageParams 包含 `SidecarContainer.MountImage` 的选项。
* `ExperimentalEncryptionKey` (`[]byte`)：ExperimentalEncryptionKey 是客户提供的用于解密图像的加密密钥。使用加密快照的相同密钥。

## 民意调查

```go
Poll(ctx context.Context, _ *SidecarPollParams) (*int, error)
```

轮询检查 sidecar 容器是否已完成运行。
如果容器仍在运行，则返回 nil，否则返回退出代码。

**参数** (`SidecarPollParams`)

SidecarPollParams 保存 `SidecarContainer.Poll` 的选项。

*没有可配置选项。*

## 重新加载卷

```go
ReloadVolumes(ctx context.Context, params *SidecarReloadVolumesParams) error
```

ReloadVolumes 重新加载此 sidecar 容器中安装的所有卷。

阻塞直到重新加载完成，或者在超时时返回 TimeoutError （
重新加载仍可能在后台完成）。

**参数** (`SidecarReloadVolumesParams`)

SidecarReloadVolumesParams 是 `SidecarContainer.ReloadVolumes` 的选项。

* `Timeout` (`time.Duration`)：超时限制调用等待的时间。默认为 55 秒。

## 快照目录

```go
SnapshotDirectory(ctx context.Context, path string, params *SidecarSnapshotDirectoryParams) (*Image, error)
```

SnapshotDirectory 从正在运行的 Sidecar 容器中的目录创建快照并创建新的 Image。

该图像可以在任何接受图像的地方使用，包括作为安装或
作为另一个容器的基础文件系统。

如果 params 为零，则生成的图像将作为硬图像保留 30 天
截止时间是从创建开始测量的，并且调用有 55 秒的超时时间。
有关两者的控制，请参阅`SidecarSnapshotDirectoryParams`。

**参数** (`SidecarSnapshotDirectoryParams`)

SidecarSnapshotDirectoryParams 包含 `SidecarContainer.SnapshotDirectory` 的选项。

* `Timeout` (`time.Duration`)：超时是快照调用的总体预算。零表示默认值（55 秒）。如果在快照完成之前时间已过，则返回 TimeoutError。
* `TTL` (`time.Duration`)：TTL 是结果图像的生命周期。零（或省略）表示使用默认的 30 天，作为从创建开始测量的硬截止时间。正值设置自定义生命周期；亚秒值被拒绝。通过`NoExpiryTTL`无限期保留图像。参见`NoExpiryTTL`。
* `ExperimentalEncryptionKey` (`[]byte`)：ExperimentalEncryptionKey 是客户提供的加密密钥，用于加密生成的快照。安装映像时需要相同的密钥。 Modal 不保留密钥。

## 快照文件系统

```go
SnapshotFilesystem(ctx context.Context, params *SidecarSnapshotFilesystemParams) (*Image, error)
```

SnapshotFilesystem 将此 Sidecar 容器的文件系统快照到镜像中。

**参数** (`SidecarSnapshotFilesystemParams`)

SidecarSnapshotFilesystemParams 配置`SidecarContainer.SnapshotFilesystem` 调用。

* `Timeout` (`time.Duration`)：超时是快照调用的总体预算。零表示默认值（55 秒）。
* `TTL` (`time.Duration`)：TTL 是结果图像的生命周期。零表示 30 天；通过`NoExpiryTTL`无限期保留图像。

## 终止

```go
Terminate(ctx context.Context, params *SidecarTerminateParams) (int, error)
```

Terminate 停止 sidecar 容器。

返回的退出代码仅在 Wait 为 true 时才有意义。

**参数** (`SidecarTerminateParams`)

SidecarTerminateParams 包含 `SidecarContainer.Terminate` 的选项。

* `Wait` (`bool`): 等待，当为true时，将等待sidecar容器终止。

## 卸载图像

```go
UnmountImage(ctx context.Context, path string, _ *SidecarUnmountImageParams) error
```

UnmountImage 从此 Sidecar 容器的文件系统中的路径中删除镜像挂载。

**参数** (`SidecarUnmountImageParams`)

SidecarUnmountImageParams 保存 `SidecarContainer.UnmountImage` 的选项。*没有可配置选项。*

## 等等

```go
Wait(ctx context.Context, _ *SidecarWaitParams) (int, error)
```

Wait 会阻塞，直到 sidecar 容器退出，并返回其退出代码。

**参数** (`SidecarWaitParams`)

SidecarWaitParams 保存 `SidecarContainer.Wait` 的选项。

*没有可配置选项。*

## SidecarContainer.Filesystem

文件系统为此容器提供高级文件系统操作。

### 从本地复制

```go
CopyFromLocal(ctx context.Context, localPath, remotePath string, params *SandboxFilesystemCopyFromLocalParams) error
```

CopyFromLocal 将本地文件复制到沙箱中。

RemotePath 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。

如果父组件为 `SandboxFilesystemNotADirectoryError`，则返回
RemotePath 不是目录， `SandboxFilesystemIsADirectoryError` 如果
RemotePath 指向一个目录，`SandboxFilesystemPermissionError` if
写入权限被拒绝，或者如果 localPath 不存在，则出现 \*os.PathError
存在、是目录或无法读取。

**参数** (`SandboxFilesystemCopyFromLocalParams`)

SandboxFilesystemCopyFromLocalParams 保存 `SandboxFilesystem.CopyFromLocal` 的可选参数。

*没有可配置选项。*

### 复制到本地

```go
CopyToLocal(ctx context.Context, remotePath, localPath string, params *SandboxFilesystemCopyToLocalParams) (retErr error)
```

CopyToLocal 将文件从沙盒复制到本地路径。

RemotePath 必须是沙盒中文件的绝对路径。
如果需要，将创建 localPath 的父目录。本地文件是
如果已经存在则覆盖。如果远程路径不存在则返回`SandboxFilesystemNotFoundError`，
`SandboxFilesystemIsADirectoryError` 如果远程路径指向一个目录，
`SandboxFilesystemFileTooLargeError` 如果文件超出读取大小限制，
或 `SandboxFilesystemPermissionError` 如果读取权限被拒绝。

**参数** (`SandboxFilesystemCopyToLocalParams`)

SandboxFilesystemCopyToLocalParams 保存 `SandboxFilesystem.CopyToLocal` 的可选参数。

*没有可配置选项。*

### 列表文件

```go
ListFiles(ctx context.Context, remotePath string, params *SandboxFilesystemListFilesParams) ([]FileInfo, error)
```

ListFiles 列出 Sandbox 目录中的文件和目录。

RemotePath 必须是沙箱中目录的绝对路径。
返回按名称排序的 `FileInfo` 对象切片。

如果路径不存在则返回`SandboxFilesystemNotFoundError`，
`SandboxFilesystemNotADirectoryError` 如果路径不是目录，
或 `SandboxFilesystemPermissionError` 如果读取权限被拒绝。

**参数** (`SandboxFilesystemListFilesParams`)

SandboxFilesystemListFilesParams 保存 `SandboxFilesystem.ListFiles` 的可选参数。

*没有可配置选项。*

### 建立目录

```go
MakeDirectory(ctx context.Context, remotePath string, params *SandboxFilesystemMakeDirectoryParams) error
```

MakeDirectory 在沙箱中创建一个新目录。

RemotePath 必须是沙盒中的绝对路径。

当 params.CreateParents 为 true 时（params 为 nil 时默认），任何
创建了缺少的父目录并且调用是幂等的（成功
如果该目录已经存在）。如果为 false，则直接父级必须
已存在且路径不得已存在。如果父级不存在则返回 `SandboxFilesystemNotFoundError` 并且
CreateParents 为 false，`SandboxFilesystemPathAlreadyExistsError` 如果
路径已经存在，`SandboxFilesystemNotADirectoryError` 如果路径
组件不是目录，`SandboxFilesystemPermissionError`如果
不允许创建，或者 `InvalidError` 如果安装不允许
支持这个操作。

**参数** (`SandboxFilesystemMakeDirectoryParams`)

SandboxFilesystemMakeDirectoryParams 保存 `SandboxFilesystem.MakeDirectory` 的可选参数。

* `CreateParents` (`*bool`): CreateParents 控制是否自动创建缺失的父目录。当 nil 时默认为 true。

### 读取字节

```go
ReadBytes(ctx context.Context, remotePath string, params *SandboxFilesystemReadParams) ([]byte, error)
```

ReadBytes 从沙盒中读取文件并以字节形式返回其内容。

RemotePath 必须是沙盒中文件的绝对路径。
如果路径不存在则返回`SandboxFilesystemNotFoundError`，
`SandboxFilesystemIsADirectoryError` 如果路径指向一个目录，
`SandboxFilesystemFileTooLargeError` 如果文件超出读取大小限制，
或 `SandboxFilesystemPermissionError` 如果读取权限被拒绝。

**参数** (`SandboxFilesystemReadParams`)

SandboxFilesystemReadParams 保存 `SandboxFilesystem.ReadBytes` 和 `SandboxFilesystem.ReadText` 的可选参数。

*没有可配置选项。*

### 阅读文本

```go
ReadText(ctx context.Context, remotePath string, params *SandboxFilesystemReadParams) (string, error)
```

ReadText 从沙盒中读取文件并以 UTF-8 字符串形式返回其内容。

RemotePath 必须是沙盒中文件的绝对路径。

如果路径不存在则返回`SandboxFilesystemNotFoundError`，
`SandboxFilesystemIsADirectoryError` 如果路径指向一个目录，`SandboxFilesystemFileTooLargeError` 如果文件超出读取大小限制，
或 `SandboxFilesystemPermissionError` 如果读取权限被拒绝。

**参数** (`SandboxFilesystemReadParams`)

SandboxFilesystemReadParams 保存 `SandboxFilesystem.ReadBytes` 和 `SandboxFilesystem.ReadText` 的可选参数。

*没有可配置选项。*

### 删除

```go
Remove(ctx context.Context, remotePath string, params *SandboxFilesystemRemoveParams) error
```

删除沙箱中的文件或目录。

RemotePath 必须是沙盒中的绝对路径。当remotePath是一个
目录和 params.Recursive 为 false（当 params 为 nil 时默认），
仅当它为空时才会被删除。当 Recursive 为 true 时，目录和所有
其内容被删除。并非所有安装都支持递归删除。

如果路径不存在则返回`SandboxFilesystemNotFoundError`，
`SandboxFilesystemDirectoryNotEmptyError` 如果 Recursive 为 false 并且
目录不为空，如果删除则为 `SandboxFilesystemPermissionError`
不允许，或者 `InvalidError` 如果安装不支持此操作。

**参数** (`SandboxFilesystemRemoveParams`)

SandboxFilesystemRemoveParams 保存 `SandboxFilesystem.Remove` 的可选参数。

* `Recursive` (`bool`): Recurisve 控制是否递归删除已删除目录的内容。当 nil 时默认为 false。

### 统计

```go
Stat(ctx context.Context, remotePath string, params *SandboxFilesystemStatParams) (*FileInfo, error)
```

Stat 返回沙箱中单个文件、目录或符号链接的元数据。

RemotePath 必须是沙盒中的绝对路径。如果remotePath是符号链接，返回的 `FileInfo` 描述了符号链接本身，而不是
它指向的目标。

如果路径不存在则返回`SandboxFilesystemNotFoundError`，
`SandboxFilesystemNotADirectoryError` 如果路径的非叶组件
不是目录，或者 `SandboxFilesystemPermissionError` 如果是路径
组件不可搜索。

**参数** (`SandboxFilesystemStatParams`)

SandboxFilesystemStatParams 保存 `SandboxFilesystem.Stat` 的可选参数。

*没有可配置选项。*

### 观看

```go
Watch(
	ctx context.Context,
	remotePath string,
	params *SandboxFilesystemWatchParams,
) (iter.Seq2[FileWatchEvent, error], error)
```

观察沙盒中的路径以了解文件系统更改。

RemotePath 必须是沙盒中的绝对路径。如果它指向一个
文件，报告该文件的事件。如果它指向一个目录，
报告直接位于其中的条目的事件。设置params.Recursive
还接收所有嵌套子目录的事件。如果remotePath是
符号链接，它遵循已解析下的事件引用路径
目标。

当发生变化时，返回的 `iter.Seq2` 会产生 `FileWatchEvent` 值，
直到超时时间过去，调用者从范围循环中中断，ctx 为
取消，或者沙盒被终止。远程观看过程不是
直到迭代开始为止，因此序列永远不会超过
什么也不启动。

设置 params.Filter 以限制发出哪些事件类型。零过滤器
允许所有类型；空切片会抑制所有事件。

零 params.Timeout 无限期地监视，而零 params.Timeout
立即返回，无需等待事件。否则持续时间为
四舍五入到整秒，当它过去时迭代器停止
而不返回错误。

传递 nil 参数作为默认值（无过滤器、非递归、无超时）。

如果remotePath不存在则返回`SandboxFilesystemNotFoundError`，
`SandboxFilesystemPermissionError` 如果手表访问被拒绝，或者
`InvalidError` 如果文件系统不支持观看。

**参数** (`SandboxFilesystemWatchParams`)

SandboxFilesystemWatchParams 保存 `SandboxFilesystem.Watch` 的可选参数。

* `Filter` (`[]FileWatchEventType`)
* `Recursive` (`bool`)
* `Timeout` (`*time.Duration`)：超时是观看的最大时长。零超时无限期地监视，而零超时立即返回而不等待事件。持续时间向下舍入到最接近的整数秒数。

### 写入字节

```go
WriteBytes(ctx context.Context, data []byte, remotePath string, params *SandboxFilesystemWriteParams) error
```

WriteBytes 将二进制内容写入沙箱中的文件。

RemotePath 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。

如果父组件为 `SandboxFilesystemNotADirectoryError`，则返回
RemotePath 不是目录， `SandboxFilesystemIsADirectoryError` 如果RemotePath 指向一个目录，或者`SandboxFilesystemPermissionError`
如果写权限被拒绝。

**参数** (`SandboxFilesystemWriteParams`)

SandboxFilesystemWriteParams 保存 `SandboxFilesystem.WriteBytes` 和 `SandboxFilesystem.WriteText` 的可选参数。

*没有可配置选项。*

### 写入文本

```go
WriteText(ctx context.Context, data string, remotePath string, params *SandboxFilesystemWriteParams) error
```

WriteText 将 UTF-8 文本写入沙箱中的文件。

RemotePath 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。

如果父组件为 `SandboxFilesystemNotADirectoryError`，则返回
RemotePath 不是目录， `SandboxFilesystemIsADirectoryError` 如果
RemotePath 指向一个目录，或者`SandboxFilesystemPermissionError`
如果写权限被拒绝。

**参数** (`SandboxFilesystemWriteParams`)
SandboxFilesystemWriteParams 保存 `SandboxFilesystem.WriteBytes` 和 `SandboxFilesystem.WriteText` 的可选参数。

*没有可配置选项。*