<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙盒

Sandbox代表一个Modal Sandbox，可以运行命令并管理
远程进程的输入/输出流。与沙箱交互完成后，
我们建议调用 \[Sandbox.Detach] 来断开客户端与沙箱的连接并
清理与连接关联的所有资源。

```go
type Sandbox struct {
	SandboxID            string
	Stdin                io.WriteCloser
	Stdout               io.ReadCloser
	Stderr               io.ReadCloser
	Filesystem           *SandboxFilesystem // Filesystem provides high-level filesystem operations for this Sandbox.
	ExperimentalSidecars SidecarService     // ExperimentalSidecars provides operations on Sandbox Sidecar containers. EXPERIMENTAL: the API is subject to change.
}
```

## 创建

*通过`client.Sandboxes`访问*

```go
Create(ctx context.Context, app *App, image *Image, params *SandboxCreateParams) (*Sandbox, error)
```

创建使用指定的图像和选项在应用程序中创建一个新的沙箱。

**参数** (`SandboxCreateParams`)

SandboxCreateParams 是用于创建模态沙箱的选项。

* `CPU` (`float64`)：部分物理核心中的 CPU 请求。* `CPULimit` (`float64`)：分数物理 CPU 核心的硬限制。零意味着没有限制。
* `MemoryMiB` (`int`)：MiB 中的内存请求。
* `MemoryLimitMiB` (`int`)：MiB 中的硬内存限制。零意味着没有限制。
* `GPU` (`string`)：沙盒的 GPU 预留（例如“A100”、“T4:2”、“A100-80GB:4”）。
* `Timeout` (`time.Duration`)：沙盒的最长生命周期。默认为 5 分钟。如果您通过零，您将获得默认的 5 分钟。
* `IdleTimeout` (`time.Duration`)：沙盒在终止之前可以空闲的时间。
* `Workdir` (`string`)：沙盒的工作目录。
* `Command` (`[]string`)：启动时在沙盒中运行的命令。
* `Env` (`map[string]string`): 在沙盒中设置的环境变量。
* `Secrets` (`[]*Secret`)：作为环境变量注入沙箱的秘密。
* `Volumes` (`map[string]*Volume`)：卷的挂载点。
* `CloudBucketMounts` (`map[string]*CloudBucketMount`)：云存储桶的挂载点。
* `PTY` (`bool`)：为沙盒入口点命令启用 PTY。启用后，所有输出（进程中的 stdout 和 stderr）都会多路复用到 stdout，并且 stderr 流实际上为空。
* `EncryptedPorts` (`[]int`)：通过 TLS 加密隧道进入沙箱的加密端口列表。* `H2Ports` (`[]int`)：使用 HTTP/2 隧道进入沙盒的加密端口列表。
* `UnencryptedPorts` (`[]int`)：无需加密即可隧道进入沙盒的端口列表。
* `BlockNetwork` (`bool`): 是否阻止沙箱的所有网络访问。
* `OutboundCIDRAllowlist` (`*Allowlist`): 允许沙箱访问的CIDR。非 nil 启用白名单模式； nil 表示开放访问。不能与 BlockNetwork 一起使用。
* `OutboundDomainAllowlist` (`*Allowlist`): 允许沙箱访问的域名（支持通配符前缀，如\*.example.com）。非 nil 启用白名单模式； nil 表示开放访问。不能与 BlockNetwork 一起使用。
* `InboundCIDRAllowlist` (`[]string`)：允许入站连接到沙盒的 CIDR 列表（隧道和连接令牌）。如果为空，则允许所有 IP。
* `I6PN` (`bool`)：启用私有 IPv6 网络 (i6pn)，以便同一工作区中的沙箱可以通过其 i6pn.modal.local 地址相互访问。将组中的每个沙盒固定到同一特定区域。不能与 BlockNetwork 一起使用。
* `Cloud` (`string`)：运行沙箱的云提供商。
* `Regions` (`[]string`)：运行沙盒的区域。
* `Verbose` (`bool`)：启用详细日志记录。* `Proxy` (`*Proxy`)：引用在此沙箱前面使用的模态代理。
* `ReadinessProbe` (`*Probe`)：用于确定沙盒何时准备就绪的探针。
* `Name` (`string`)：沙盒的可选名称。在应用程序中是独一无二的。
* `Tags` (`map[string]string`)：附加到沙盒的标签。可通过 SandboxList 进行过滤。
* `ExperimentalOptions` (`map[string]any`): 实验选项
* `CustomDomain` (`string`): 如果非空，则到此沙箱的连接将是此域的子域而不是默认的。这需要 Modal 事先手动设置，并且仅适用于企业客户。
* `IncludeOidcIdentityToken` (`bool`)：如果为 true，沙箱将收到一个 MODAL\_IDENTITY\_TOKEN env var，用于基于 OIDC 的身份验证（例如，发送到 AWS、GCP）。
## 实验性创建

*通过`client.Sandboxes`访问*

```go
ExperimentalCreate(ctx context.Context, app *App, image *Image, params *SandboxCreateParams) (*Sandbox, error)
```

ExperimentalCreate 使用实验性 V2 后端创建一个新的 Sandbox。

支持的功能包括执行、加密隧道、等待/轮询/终止、
CPU和内存配置、区域放置、卷、云存储桶
安装（通过 Secret 或 OidcAuthRoleArn 使用静态凭证）、OIDC 身份
令牌、代理和文件系统快照。

内存快照、GPU 和自定义域等功能不是
支持。

List 当前不返回使用此方法创建的 V2 沙箱。一个
名为Sandbox的可以通过ExperimentalFromName来查找；否则存储
Sandbox.SandboxID 并使用 FromID 重新附加。

**参数** (`SandboxCreateParams`)

SandboxCreateParams 是用于创建模态沙箱的选项。

* `CPU` (`float64`)：部分物理核心中的 CPU 请求。
* `CPULimit` (`float64`)：分数物理 CPU 核心的硬限制。零意味着没有限制。
* `MemoryMiB` (`int`)：MiB 中的内存请求。
* `MemoryLimitMiB` (`int`)：MiB 中的硬内存限制。零意味着没有限制。
* `GPU` (`string`)：沙箱的 GPU 预留（例如“A100”、“T4:2”、“A100-80GB:4”）。
* `Timeout` (`time.Duration`)：沙盒的最长生命周期。默认为 5 分钟。如果您通过零，您将获得默认的 5 分钟。
* `IdleTimeout` (`time.Duration`)：沙箱在终止之前可以空闲的时间。
* `Workdir` (`string`)：沙盒的工作目录。
* `Command` (`[]string`)：启动时在沙盒中运行的命令。
* `Env` (`map[string]string`): 在沙盒中设置的环境变量。
* `Secrets` (`[]*Secret`)：作为环境变量注入沙箱的秘密。
* `Volumes` (`map[string]*Volume`)：卷的挂载点。* `CloudBucketMounts` (`map[string]*CloudBucketMount`)：云桶的挂载点。
* `PTY` (`bool`)：为沙盒入口点命令启用 PTY。启用后，所有输出（进程中的 stdout 和 stderr）都会多路复用到 stdout，并且 stderr 流实际上为空。
* `EncryptedPorts` (`[]int`)：通过 TLS 加密隧道进入沙箱的加密端口列表。
* `H2Ports` (`[]int`)：使用 HTTP/2 隧道进入沙箱的加密端口列表。
* `UnencryptedPorts` (`[]int`)：在不加密的情况下隧道进入沙箱的端口列表。
* `BlockNetwork` (`bool`): 是否阻止沙箱的所有网络访问。
* `OutboundCIDRAllowlist` (`*Allowlist`): 允许沙盒访问的CIDR。非 nil 启用白名单模式； nil 表示开放访问。不能与 BlockNetwork 一起使用。
* `OutboundDomainAllowlist` (`*Allowlist`): 允许沙箱访问的域名（支持通配符前缀，如\*.example.com）。非 nil 启用白名单模式； nil 表示开放访问。不能与 BlockNetwork 一起使用。
* `InboundCIDRAllowlist` (`[]string`)：允许入站连接到沙盒的 CIDR 列表（隧道和连接令牌）。如果为空，则允许所有 IP。* `I6PN` (`bool`)：启用私有 IPv6 网络 (i6pn)，以便同一工作区中的沙箱可以通过其 i6pn.modal.local 地址相互访问。将组中的每个沙盒固定到同一特定区域。不能与 BlockNetwork 一起使用。
* `Cloud` (`string`)：运行沙箱的云提供商。
* `Regions` (`[]string`)：运行沙盒的区域。
* `Verbose` (`bool`)：启用详细日志记录。
* `Proxy` (`*Proxy`)：引用在此沙箱前面使用的模态代理。
* `ReadinessProbe` (`*Probe`)：用于确定沙箱何时准备就绪的探针。
* `Name` (`string`)：沙箱的可选名称。在应用程序中是独一无二的。
* `Tags` (`map[string]string`)：附加到沙箱的标签。可通过 SandboxList 进行过滤。
* `ExperimentalOptions` (`map[string]any`): 实验选项
* `CustomDomain` (`string`): 如果非空，则到此沙箱的连接将是此域的子域而不是默认的。这需要 Modal 事先手动设置，并且仅适用于企业客户。
* `IncludeOidcIdentityToken` (`bool`)：如果为 true，沙箱将收到一个 MODAL\_IDENTITY\_TOKEN env var，用于基于 OIDC 的身份验证（例如，发送到 AWS、GCP）。

## 来自 ID

*通过`client.Sandboxes`访问*

```go
FromID(ctx context.Context, sandboxID string, params *SandboxFromIDParams) (*Sandbox, error)
```

FromID 从 ID 返回正在运行的 Sandbox 对象。

**参数** (`SandboxFromIDParams`)

SandboxFromIDParams 是 SandboxService.FromID 的选项。

*没有可配置选项。*

## 来自姓名*通过`client.Sandboxes`访问*

```go
FromName(ctx context.Context, appName, name string, params *SandboxFromNameParams) (*Sandbox, error)
```

FromName 从已部署的应用程序中按名称获取正在运行的沙箱。

如果未找到具有给定名称的正在运行的沙箱，则引发 NotFoundError。
沙箱的名称是传递给 `App.CreateSandbox` 的 `Name` 参数。

**参数** (`SandboxFromNameParams`)

SandboxFromNameParams 是用于按名称查找已部署的 Sandbox 对象的选项。

* `Environment` (`string`)

## 实验来自名称

*通过`client.Sandboxes`访问*

```go
ExperimentalFromName(ctx context.Context, appName, name string, params *SandboxExperimentalFromNameParams) (*Sandbox, error)
```

ExperimentalFromName 从已部署的应用程序中按名称获取正在运行的 V2 沙箱，
即通过 ExperimentalCreate 创建的沙箱。

实验性：API 可能会发生变化。

**参数** (`SandboxExperimentalFromNameParams`)
SandboxExperimentalFromNameParams 是 SandboxService.ExperimentalFromName 的选项。

* `Environment` (`string`)

## 列表

*通过`client.Sandboxes`访问*

```go
List(ctx context.Context, params *SandboxListParams) (iter.Seq2[*Sandbox, error], error)
```

列表列出了当前环境（或提供的应用程序 ID）的沙箱，可以选择按标签进行过滤。

**参数** (`SandboxListParams`)

SandboxListParams 是列出沙箱的选项。

* `AppID` (`string`): 按App ID过滤
* `Tags` (`map[string]string`)：仅包含具有所有这些标签的沙箱
* `Environment` (`string`): 覆盖此请求的环境

## 实验列表

*通过`client.Sandboxes`访问*

```go
ExperimentalList(ctx context.Context, params *SandboxExperimentalListParams) (iter.Seq2[*Sandbox, error], error)
```ExperimentalList 列出了应用程序中的 V2 沙箱，即通过以下方式创建的沙箱
实验创建。如果指定了标签，则只有具有所有这些标签的沙箱
标签被返回。

实验性：API 可能会发生变化。

**参数** (`SandboxExperimentalListParams`)

SandboxExperimentalListParams 是 SandboxService.ExperimentalList 的选项。

* `AppID` (`string`)：列出沙箱的应用程序。
* `Tags` (`map[string]string`)：仅包含具有所有这些标签的沙箱。

## 创建连接令牌

```go
CreateConnectToken(ctx context.Context, params *SandboxCreateConnectTokenParams) (*SandboxCreateConnectCredentials, error)
```

CreateConnectToken 创建一个用于与沙箱建立 HTTP 连接的令牌。

**参数** (`SandboxCreateConnectTokenParams`)

SandboxCreateConnectTokenParams 是 CreateConnectToken 的可选参数。
* `UserMetadata` (`string`)：可选的用户提供的元数据字符串，在将请求转发到沙箱时将由代理添加到标头中。
* `Port` (`int`)：使用此令牌时请求路由到的容器端口。默认为 8080。

## 分离

```go
Detach() error
```

Detach 断开与正在运行的沙箱的连接

## 执行

```go
Exec(ctx context.Context, command []string, params *SandboxExecParams) (*ContainerProcess, error)
```

Exec 在沙箱中运行命令并返回进程句柄。

**参数** (`SandboxExecParams`)

SandboxExecParams 定义在沙箱中执行命令的选项。

* `Stdout` (`StdioBehavior`): Stdout 定义是否通过管道传输或忽略标准输出。* `Stderr` (`StdioBehavior`): Stderr 定义是管道还是忽略标准错误。
* `Workdir` (`string`): Workdir 是运行命令的工作目录。
* `Timeout` (`time.Duration`): Timeout是命令执行的超时时间。默认为 0（无超时）。
* `Env` (`map[string]string`): 为命令设置的环境变量。
* `Secrets` (`[]*Secret`)：作为命令的环境变量注入的秘密。
* `PTY` (`bool`): PTY 定义是否为命令启用 PTY。启用后，所有输出（进程中的 stdout 和 stderr）都会多路复用到 stdout，并且 stderr 流实际上为空。

## 获取标签

```go
GetTags(ctx context.Context, params *SandboxGetTagsParams) (map[string]string, error)
```
GetTags 从服务器获取当前附加到此沙箱的任何标签（键值对）。

**参数** (`SandboxGetTagsParams`)

SandboxGetTagsParams 是 Sandbox.GetTags 的选项。

*没有可配置选项。*

## 挂载图像

```go
MountImage(ctx context.Context, path string, image *Image, params *SandboxMountImageParams) error
```

MountImage 在沙箱文件系统中的路径上安装图像。

如果 image 为零，则安装一个空目录。

**参数** (`SandboxMountImageParams`)

SandboxMountImageParams 是 Sandbox.MountImage 的选项。

* `ExperimentalEncryptionKey` (`[]byte`)：ExperimentalEncryptionKey 是客户提供的用于解密图像的加密密钥。使用加密快照的相同密钥。

## 民意调查

```go
Poll(ctx context.Context, params *SandboxPollParams) (*int, error)
```

轮询检查沙盒是否已完成运行。
如果沙箱仍在运行，则返回 nil，否则返回退出代码。

**参数** (`SandboxPollParams`)

SandboxPollParams 是 Sandbox.Poll 的选项。

*没有可配置选项。*

## 重新加载卷

```go
ReloadVolumes(ctx context.Context, params *SandboxReloadVolumesParams) error
```

ReloadVolumes 重新加载沙箱中安装的所有卷。

阻塞直到卷被重新加载，受超时限制（55
默认秒；请参阅\[SandboxReloadVolumesParams]）。如果重新加载没有
在该窗口内完成，返回 TimeoutError；注意重新加载
仍可能在后台完成。

**参数** (`SandboxReloadVolumesParams`)
SandboxReloadVolumesParams 是 Sandbox.ReloadVolumes 的选项。

* `Timeout` (`time.Duration`)：超时限制调用等待重新加载完成的时间。默认为 55 秒。如果重新加载未在此窗口内完成，则调用将被取消并返回 TimeoutError。

## 设置标签

```go
SetTags(ctx context.Context, tags map[string]string, params *SandboxSetTagsParams) error
```

SetTags 在沙盒上设置键值标签。标签可用于过滤 SandboxList 中的结果。

**参数** (`SandboxSetTagsParams`)

SandboxSetTagsParams 是 Sandbox.SetTags 的选项。

*没有可配置选项。*

## 快照目录

```go
SnapshotDirectory(ctx context.Context, path string, params *SandboxSnapshotDirectoryParams) (*Image, error)
```

SnapshotDirectory 从正在运行的沙箱中的目录创建快照并创建新映像。

如果 params 为零，则生成的图像将作为硬图像保留 30 天
截止时间是从创建开始测量的，并且调用有 55 秒的超时时间。
请参阅 \[SandboxSnapshotDirectoryParams] 以了解对两者的控制。

**参数** (`SandboxSnapshotDirectoryParams`)

SandboxSnapshotDirectoryParams 配置 \[Sandbox.SnapshotDirectory] 调用。

* `Timeout` (`time.Duration`)：超时是快照调用的总体预算。零表示默认值（55 秒）。如果在快照完成之前超时，则会返回 TimeoutError。
* `TTL` (`time.Duration`)：TTL 是结果图像的生命周期。零（或省略）表示使用默认的 30 天，作为从创建开始测量的硬截止时间。正值设置自定义生命周期；亚秒值被拒绝。通过 \[NoExpiryTTL] 无限期保留图像。请参阅\[NoExpiryTTL]。
* `ExperimentalEncryptionKey` (`[]byte`)：ExperimentalEncryptionKey 是客户提供的加密密钥，用于加密生成的快照。安装映像时需要相同的密钥。 Modal 不保留密钥。

## 快照文件系统

```go
SnapshotFilesystem(ctx context.Context, params *SandboxSnapshotFilesystemParams) (*Image, error)
```

SnapshotFilesystem 拍摄沙盒文件系统的快照。
返回一个 Image 对象，该对象可用于生成具有相同文件系统的新 Sandbox。

如果 params 为零，则生成的图像将作为硬图像保留 30 天
截止时间是从创建开始测量的，并且调用有 55 秒的超时时间。
请参阅 \[SandboxSnapshotFilesystemParams] 以了解对两者的控制。

**参数** (`SandboxSnapshotFilesystemParams`)

SandboxSnapshotFilesystemParams 配置 \[Sandbox.SnapshotFilesystem] 调用。

* `Timeout` (`time.Duration`)：超时是快照调用的总体预算。零表示默认值（55 秒）。如果在快照完成之前超时，则会返回 TimeoutError。
* `TTL` (`time.Duration`)：TTL 是结果图像的生命周期。零（或省略）表示使用默认的 30 天，作为从创建开始测量的硬截止时间。正值设置自定义生命周期；亚秒值被拒绝。通过 \[NoExpiryTTL] 无限期保留图像。请参阅\[NoExpiryTTL]。

## 终止

```go
Terminate(ctx context.Context, params *SandboxTerminateParams) (int, error)
```

终止会停止沙箱。

**参数** (`SandboxTerminateParams`)

SandboxTerminateParams 是终止选项。

* `Wait` (`bool`): Wait，当为true时，将等待Sandbox终止并返回退出代码。

## 隧道

```go
Tunnels(ctx context.Context, timeout time.Duration, params *SandboxTunnelsParams) (map[int]*Tunnel, error)
```

隧道获取沙盒的隧道元数据。
如果超时后隧道不可用，则返回 SandboxTimeoutError。
返回由容器端口作为键控的隧道对象的映射。

**参数** (`SandboxTunnelsParams`)

SandboxTunnelsParams 是 Sandbox.Tunnels 的选项。

*没有可配置选项。*

## 卸载图像

```go
UnmountImage(ctx context.Context, path string, params *SandboxUnmountImageParams) error
```

UnmountImage 从 Sandbox 文件系统中的路径中删除映像挂载。

**参数** (`SandboxUnmountImageParams`)

SandboxUnmountImageParams 是 Sandbox.UnmountImage 的选项。

*没有可配置选项。*

## 更新网络策略

```go
UpdateNetworkPolicy(ctx context.Context, params *SandboxUpdateNetworkPolicyParams) error
```

UpdateNetworkPolicy 更新正在运行的沙箱的出站网络策略。
新策略不再允许的已建立连接将被终止。

**参数** (`SandboxUpdateNetworkPolicyParams`)

SandboxUpdateNetworkPolicyParams 是 Sandbox.UpdateNetworkPolicy 的选项。

每个维度都是独立的： nil *Allowlist 离开该维度
不变，而非零值取代它（空条目阻止所有
出口；允许所有条目（例如“0.0.0.0/0”或“*”允许所有内容）。

目前，必须提供两个维度（底层传输不
尚不支持部分更新）。这一要求将在一段时间内放宽
未来的版本。

* `OutboundCIDRAllowlist` (`*Allowlist`)
* `OutboundDomainAllowlist` (`*Allowlist`)

## 等等

```go
Wait(ctx context.Context, params *SandboxWaitParams) (int, error)
```

Wait 会阻塞，直到沙箱退出，并返回其退出代码。

**参数** (`SandboxWaitParams`)

SandboxWaitParams 是 Sandbox.Wait 的选项。

*没有可配置选项。*

## 等待准备就绪

```go
WaitUntilReady(ctx context.Context, timeout time.Duration, params *SandboxWaitUntilReadyParams) error
```

WaitUntilReady 会阻塞，直到沙箱就绪探针报告就绪。

**参数** (`SandboxWaitUntilReadyParams`)

SandboxWaitUntilReadyParams 是 Sandbox.WaitUntilReady 的选项。

*没有可配置选项。*

## Sandbox.ExperimentalSidecars

ExperimentalSidecars 提供对 Sandbox Sidecar 容器的操作。

实验性：API 可能会发生变化。

### 创建

```go
Create(ctx context.Context, name string, image *Image, params *SidecarCreateParams) (*SidecarContainer, error)
```
创建在沙盒中启动一个新的 sidecar 容器。图像必须
在传递给 Create 之前已通过调用 \[Image.Build] 进行构建。

**参数** (`SidecarCreateParams`)

SidecarCreateParams 保存用于创建 sidecar 容器的选项。

* `Command` (`[]string`)：启动时在 sidecar 容器中运行的命令。
* `Env` (`map[string]string`): Env 是在 sidecar 容器中设置的环境变量。
* `Secrets` (`[]*Secret`)：作为环境变量注入 sidecar 容器的秘密。
* `Workdir` (`string`): Workdir 设置 sidecar 容器的工作目录。

### 获取

```go
Get(ctx context.Context, name string, params *SidecarGetParams) (*SidecarContainer, error)
```Get 按名称返回 sidecar 容器。

**参数** (`SidecarGetParams`)

SidecarGetParams 包含用于按名称检索 sidecar 的选项。

* `IncludeTerminated` (`bool`)

### 列表

```go
List(ctx context.Context, params *SidecarListParams) ([]*SidecarContainer, error)
```

List 返回所有 sidecar 容器（不包括主容器）。

**参数** (`SidecarListParams`)

SidecarListParams 包含列出 sidecar 的选项。

* `IncludeTerminated` (`bool`)

## 沙箱.文件系统

文件系统为此沙箱提供高级文件系统操作。

### 从本地复制

```go
CopyFromLocal(ctx context.Context, localPath, remotePath string, params *SandboxFilesystemCopyFromLocalParams) error
```

CopyFromLocal 将本地文件复制到沙箱中。

RemotePath 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。

如果父组件是，则返回 \[SandboxFilesystemNotADirectoryError]
RemotePath 不是目录，\[SandboxFilesystemIsADirectoryError] 如果
remotePath 指向一个目录，\[SandboxFilesystemPermissionError] 如果
写入权限被拒绝，或者如果 localPath 不存在，则出现 \*os.PathError
存在、是目录或无法读取。

**参数** (`SandboxFilesystemCopyFromLocalParams`)

SandboxFilesystemCopyFromLocalParams 保存 \[SandboxFilesystem.CopyFromLocal] 的可选参数。

*没有可配置选项。*

### 复制到本地

```go
CopyToLocal(ctx context.Context, remotePath, localPath string, params *SandboxFilesystemCopyToLocalParams) (retErr error)
```

CopyToLocal 将文件从沙盒复制到本地路径。

RemotePath 必须是沙盒中文件的绝对路径。
如果需要，将创建 localPath 的父目录。本地文件是
如果已经存在则覆盖。

如果远程路径不存在，则返回 \[SandboxFilesystemNotFoundError]，
\[SandboxFilesystemIsADirectoryError] 如果远程路径指向一个目录，
\[SandboxFilesystemFileTooLargeError] 如果文件超出读取大小限制，
或 \[SandboxFilesystemPermissionError] 如果读取权限被拒绝。

**参数** (`SandboxFilesystemCopyToLocalParams`)
SandboxFilesystemCopyToLocalParams 保存 \[SandboxFilesystem.CopyToLocal] 的可选参数。

*没有可配置选项。*

### 列表文件

```go
ListFiles(ctx context.Context, remotePath string, params *SandboxFilesystemListFilesParams) ([]FileInfo, error)
```

ListFiles 列出 Sandbox 目录中的文件和目录。

RemotePath 必须是沙盒中目录的绝对路径。
返回按名称排序的 \[FileInfo] 对象的切片。

如果路径不存在，则返回 \[SandboxFilesystemNotFoundError]，
\[SandboxFilesystemNotADirectoryError] 如果路径不是目录，
或 \[SandboxFilesystemPermissionError] 如果读取权限被拒绝。

**参数** (`SandboxFilesystemListFilesParams`)

SandboxFilesystemListFilesParams 保存 \[SandboxFilesystem.ListFiles] 的可选参数。

*没有可配置选项。*

### 建立目录

```go
MakeDirectory(ctx context.Context, remotePath string, params *SandboxFilesystemMakeDirectoryParams) error
```

MakeDirectory 在沙箱中创建一个新目录。

RemotePath 必须是沙箱中的绝对路径。

当 params.CreateParents 为 true 时（params 为 nil 时默认），任何
创建了缺少的父目录并且调用是幂等的（成功
如果该目录已经存在）。如果为 false，则直接父级必须
已存在且路径不得已存在。

如果父级不存在，则返回 \[SandboxFilesystemNotFoundError]
CreateParents 为 false，\[SandboxFilesystemPathAlreadyExistsError] 如果
路径已存在，\[SandboxFilesystemNotADirectoryError] 如果路径
组件不是目录，\[SandboxFilesystemPermissionError] 如果
不允许创建，或者 \[InvalidError] 如果安装不允许
支持这个操作。

**参数** (`SandboxFilesystemMakeDirectoryParams`)

SandboxFilesystemMakeDirectoryParams 保存 \[SandboxFilesystem.MakeDirectory] 的可选参数。

* `CreateParents` (`*bool`): CreateParents 控制是否自动创建缺失的父目录。当 nil 时默认为 true。

### 读取字节

```go
ReadBytes(ctx context.Context, remotePath string, params *SandboxFilesystemReadParams) ([]byte, error)
```

ReadBytes 从沙盒中读取文件并以字节形式返回其内容。

RemotePath 必须是沙盒中文件的绝对路径。

如果路径不存在，则返回 \[SandboxFilesystemNotFoundError]，
\[SandboxFilesystemIsADirectoryError] 如果路径指向目录，
\[SandboxFilesystemFileTooLargeError] 如果文件超出读取大小限制，
或 \[SandboxFilesystemPermissionError] 如果读取权限被拒绝。

**参数** (`SandboxFilesystemReadParams`)

SandboxFilesystemReadParams 保存 \[SandboxFilesystem.ReadBytes] 和 \[SandboxFilesystem.ReadText] 的可选参数。

*没有可配置选项。*
### 阅读文本

```go
ReadText(ctx context.Context, remotePath string, params *SandboxFilesystemReadParams) (string, error)
```

ReadText 从 Sandbox 中读取文件并以 UTF-8 字符串形式返回其内容。

RemotePath 必须是沙盒中文件的绝对路径。

如果路径不存在，则返回 \[SandboxFilesystemNotFoundError]，
\[SandboxFilesystemIsADirectoryError] 如果路径指向目录，
\[SandboxFilesystemFileTooLargeError] 如果文件超出读取大小限制，
或 \[SandboxFilesystemPermissionError] 如果读取权限被拒绝。

**参数** (`SandboxFilesystemReadParams`)

SandboxFilesystemReadParams 保存 \[SandboxFilesystem.ReadBytes] 和 \[SandboxFilesystem.ReadText] 的可选参数。

*没有可配置选项。*

### 删除

```go
Remove(ctx context.Context, remotePath string, params *SandboxFilesystemRemoveParams) error
```

删除沙箱中的文件或目录。

RemotePath 必须是沙箱中的绝对路径。当remotePath是一个
目录和 params.Recursive 为 false（当 params 为 nil 时默认），
仅当它为空时才会被删除。当 Recursive 为 true 时，目录和所有
其内容被删除。并非所有安装都支持递归删除。

如果路径不存在，则返回 \[SandboxFilesystemNotFoundError]，
\[SandboxFilesystemDirectoryNotEmptyError] 如果 Recursive 为 false 并且
目录不为空，\[SandboxFilesystemPermissionError] 如果删除是
不允许，或者 \[InvalidError] 如果安装不支持此操作。

**参数** (`SandboxFilesystemRemoveParams`)

SandboxFilesystemRemoveParams 保存 \[SandboxFilesystem.Remove] 的可选参数。

* `Recursive` (`bool`): Recurisve 控制是否递归删除已删除目录的内容。当 nil 时默认为 false。

### 统计

```go
Stat(ctx context.Context, remotePath string, params *SandboxFilesystemStatParams) (*FileInfo, error)
```

Stat 返回沙箱中单个文件、目录或符号链接的元数据。

RemotePath 必须是沙箱中的绝对路径。如果remotePath是
符号链接，返回的 \[FileInfo] 描述符号链接本身，而不是
它指向的目标。

如果路径不存在，则返回 \[SandboxFilesystemNotFoundError]，
\[SandboxFilesystemNotADirectoryError] 如果路径的非叶组件
不是目录，或者 \[SandboxFilesystemPermissionError] 如果是路径
组件不可搜索。

**参数** (`SandboxFilesystemStatParams`)

SandboxFilesystemStatParams 保存 \[SandboxFilesystem.Stat] 的可选参数。

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

RemotePath 必须是沙箱中的绝对路径。如果它指向一个
文件，报告该文件的事件。如果它指向一个目录，
报告直接位于其中的条目的事件。设置params.Recursive
还接收所有嵌套子目录的事件。如果remotePath是
符号链接，它遵循已解析下的事件引用路径
目标。

当发生更改时，返回的 \[iter.Seq2] 产生 \[FileWatchEvent] 值，
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

如果remotePath不存在，则返回\[SandboxFilesystemNotFoundError]，
\[SandboxFilesystemPermissionError] 如果监视访问被拒绝，或者
\[InvalidError] 如果文件系统不支持观看。

**参数** (`SandboxFilesystemWatchParams`)

SandboxFilesystemWatchParams 保存 \[SandboxFilesystem.Watch] 的可选参数。

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

如果父组件是，则返回 \[SandboxFilesystemNotADirectoryError]
RemotePath 不是目录，\[SandboxFilesystemIsADirectoryError] 如果
RemotePath 指向目录，或 \[SandboxFilesystemPermissionError]
如果写权限被拒绝。

**参数** (`SandboxFilesystemWriteParams`)

SandboxFilesystemWriteParams 保存 \[SandboxFilesystem.WriteBytes] 和 \[SandboxFilesystem.WriteText] 的可选参数。

*没有可配置选项。*

### 写入文本

```go
WriteText(ctx context.Context, data string, remotePath string, params *SandboxFilesystemWriteParams) error
```

WriteText 将 UTF-8 文本写入沙盒中的文件。
RemotePath 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。

如果父组件是，则返回 \[SandboxFilesystemNotADirectoryError]
RemotePath 不是目录，\[SandboxFilesystemIsADirectoryError] 如果
RemotePath 指向目录，或 \[SandboxFilesystemPermissionError]
如果写权限被拒绝。

**参数** (`SandboxFilesystemWriteParams`)

SandboxFilesystemWriteParams 保存 \[SandboxFilesystem.WriteBytes] 和 \[SandboxFilesystem.WriteText] 的可选参数。

*没有可配置选项。*