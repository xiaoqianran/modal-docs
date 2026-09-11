<!-- modal-docs: machine-translated zh-CN from English source -->

# Go SDK 发行说明

## 最新

### 0.10.1 (2026-09-10)

* 现在可以通过在 `.modal.toml` 中设置 `MODAL_SANDBOX_V2=1` 环境变量或 `sandbox_v2 = true` 配置文件配置来选择[性能更佳的沙箱后端](/blog/scaling-to-1-million-concurrent-sandboxes-in-seconds)。然后，沙箱将使用新的后端，无需更改任何代码。这将成为即将发布的版本中的默认行为；设置标志可以让您提前选择加入。
* 现在，客户端在连接空闲时释放与 Sandbox 主机的连接，并在后续操作时自动重新连接，因此不再需要调用 [`Sandbox.Detach()`](/docs/sdk/go/latest/Sandbox#detach) 进行资源清理。

### 0.10.0 (2026-08-27)

* 添加了 [`Function.Logs`](/docs/sdk/go/latest/Function#functionlogs) 和 [`FunctionCall.Logs`](/docs/sdk/go/latest/FunctionCall#functioncalllogs) API，用于获取该对象生成的当前和历史日志。 `Logs`命名空间公开了三种方法：使用 [`Fetch`](/docs/sdk/go/latest/Function#fetch) 进行基于时间的查询，使用 [`Tail`](/docs/sdk/go/latest/Function#tail) 返回最近的条目，或者[`Stream`](/docs/sdk/go/latest/Function#stream) 用于在条目到达时生成条目。
* [`Sandbox.Filesystem.CopyFromLocal`](/docs/sdk/go/latest/Sandbox#copyfromlocal) / [`WriteBytes`](/docs/sdk/go/latest/Sandbox#writebytes) / [`WriteText`](/docs/sdk/go/latest/Sandbox#filesystemwritetext) 现在将数据流式传输到沙箱，而不是针对每个块发出请求，从而使数据变得很大写入速度快约 2.5 倍。
* [`Function.UpdateAutoscaler`](/docs/sdk/go/latest/Function#updateautoscaler) 现在在应用更改后立即返回包含当前自动缩放器设置的结构。
* **中断：** 未导出的 `AuthTokenManager`、`NewAuthTokenManager`、`TokenAndExpiry` 和 `ValidateExecArgs`，它们本来不应该成为公共 API 的一部分。* **中断：** `FunctionUpdateAutoscalerParams.ScaledownWindow` 现在输入为 `*time.Duration`，而不是 `*uint32`。

## 0.9

### 0.9.0 (2026-07-09)

* [`Functions.FromName`](/docs/sdk/go/latest/Function#fromname) 和 [`Cls.FromName`](/docs/sdk/go/latest/Cls#fromname) 现在接受可选的 `Version` 参数来查找版本固定的 Function 或 Cls。
* [`Secrets.FromMap`](/docs/sdk/go/latest/Secret#frommap) 现在是惰性的，因此返回的 `Secret` 在第一次使用之前有一个空的 `SecretID`。通过将机密直接发送到沙箱并避免机密创建限制，可以改善 [`Sandbox.ExperimentalCreate`](/docs/sdk/go/latest/Sandbox#experimentalcreate) 和 [`Sandbox.Exec`](/docs/sdk/go/latest/Sandbox#exec) 的延迟。
* [`Function.WithOptions`](/docs/sdk/go/latest/Function#withoptions) 和 [`Cls.WithOptions`](/docs/sdk/go/latest/Cls#withoptions) 现在接受 `RoutingRegion` 选项来覆盖 Function 或 Cls 的输入和输出路由经过的区域。
* 添加了 [`Sandbox.Filesystem.Watch`](/docs/sdk/go/latest/Sandbox#filesystemwatch) 以监视沙箱中文件系统更改的路径。它生成 [`FileWatchEvent`](/docs/sdk/go/latest/FileWatchEvent) 对象并支持 `Recursive`、事件类型 `Filter` 和 `Timeout` 绑定。* **突破：** [`Sandbox.ReloadVolumes`](/docs/sdk/go/latest/Sandbox#reloadvolumes) 现在会阻塞，直到重新加载卷为止，并受到可通过 `SandboxReloadVolumesParams.Timeout` 配置的新超时（默认为 55 秒）的限制。如果重新加载未在该窗口内完成，则会引发 [`TimeoutError`](/docs/sdk/go/latest/Errors#timeouterror)。
* **突破：** 将 `VolumeMountOptions` 类型重命名为 `VolumeMountOptionsParams`。相应地更新 [`WithMountOptions(&VolumeMountOptions{...})`](/docs/sdk/go/latest/Volume#withmountoptions) 调用站点。
* **中断：** 将 `SandboxCreateParams` 中的 `OutboundCIDRAllowlist` 和 `OutboundDomainAllowlist` 从 `[]string` 更改为 [`*Allowlist`](/docs/sdk/go/latest/Allowlist)。非零 `*Allowlist` 启用白名单模式（即使`Entries`为空，也会阻止该类型的所有流量）； `nil` 表示开放获取。将 `OutboundCIDRAllowlist: []string{"10.0.0.0/8"}` 迁移到 `OutboundCIDRAllowlist: &Allowlist{Entries: []string{"10.0.0.0/8"}}`。

## 0.8

### 0.8.2 (2026-06-29)
* 添加了 [`Sandbox.UpdateNetworkPolicy`](/docs/sdk/go/latest/Sandbox#updatenetworkpolicy) 以更新正在运行的 Sandbox 的出站网络策略。 `OutboundCIDRAllowlist` 和 `OutboundDomainAllowlist` 都必须提供。

### 0.8.1 (2026-06-25)

* [`Sandbox.CreateConnectToken`](/docs/sdk/go/latest/Sandbox#createconnecttoken) 现在在其 params 结构上接受可选的 `Port` 参数，控制使用令牌时路由到哪个容器端口请求。默认为 8080。

### 0.8.0 (2026-06-10)

随着我们继续努力实现 1.0，此版本主要包含一些重大更改。* 添加了对命名图像的支持，类似于模态原生图像注册表，通过 [`Image.Publish`](/docs/sdk/go/latest/Image#publish) 和 [`Image.FromName`](/docs/sdk/go/latest/Image#fromname) 将图像构建与应用程序部署或沙箱创建解耦。
* 添加了对通过 [`SandboxCreateParams`](/docs/sdk/go/latest/Sandbox#create) 中的 `OutboundDomainAllowlist` 限制沙箱内部进程可以连接的 *域* 的支持。
* 添加了对 Functions 动态配置的支持：[`Function.WithOptions`](/docs/sdk/go/latest/Function#withoptions)、[`Function.WithConcurrency`](/docs/sdk/go/latest/Function#withconcurrency)、[`Function.WithBatching`](/docs/sdk/go/latest/Function#withbatching) 和[`Function.Instance`](/docs/sdk/go/latest/Function#instance)。
* 提高了为函数调用上传或下载大数据负载时的可靠性。
* 修复了向加载了 [`Image.FromID`](/docs/sdk/go/latest/Image#fromid) 的镜像添加 Dockerfile 命令可能无法使用解析后的镜像作为基础的错误。
* [`Sandbox.Exec`](/docs/sdk/go/latest/Sandbox#exec) 现在使用 [`InvalidError`](/docs/sdk/go/latest/Errors#invaliderror) 拒绝相对的 `Workdir` 客户端。
* [`Sandbox.Create`](/docs/sdk/go/latest/Sandbox#create) 和 [`Sandbox.Exec`](/docs/sdk/go/latest/Sandbox#exec) 现在，如果任何 `Secrets` 条目为零，则返回 [`InvalidError`](/docs/sdk/go/latest/Errors#invaliderror)。
* **突破：** Go SDK 现在从您的 [模态工作区设置](https://modal.com/settings/image-config) 读取 [图像生成器版本](https://modal.com/docs/guide/images#image-builder-updates)，就像 Python SDK 一样。此前，Go SDK 被硬编码为使用版本 `2024.10`。如果您的工作区配置使用不同的版本，您的图像将重建一次（然后像往常一样缓存），因此请注意升级后的首次运行可能需要比平时更长的时间。请注意，版本 `2025.06` 有许多专门针对沙箱工作流程的改进。
* **突破：** [`Sandbox.SnapshotFilesystem`](/docs/sdk/go/latest/Sandbox#snapshotfilesystem) 不再采用位置 `timeout` 参数。超时现在作为 `Timeout time.Duration` 存在于 params 结构中，使该方法与 [`Sandbox.SnapshotDirectory`](/docs/sdk/go/latest/Sandbox#snapshotdirectory) 同等。将 `sb.SnapshotFilesystem(ctx, 30*time.Second, params)` 迁移到 `sb.SnapshotFilesystem(ctx, &SandboxSnapshotFilesystemParams{Timeout: 30*time.Second, ...})`。
* **突破：** [`Sandbox.SnapshotFilesystem`](/docs/sdk/go/latest/Sandbox#snapshotfilesystem) 和 [`Sandbox.SnapshotDirectory`](/docs/sdk/go/latest/Sandbox#snapshotdirectory) 现在在其参数结构上接受显式 `TTL` 字段（`time.Duration`），控制如何保留生成的图像很长时间。两种方法均默认为 30 天。这是 `SnapshotFilesystem` 的默认更改，之前它无限期地保留图像。通过`TTL: modal.NoExpiryTTL`选择退出到期。
* **突破：** [`Sandbox.SnapshotDirectory`](/docs/sdk/go/latest/Sandbox#snapshotdirectory) 现在在其 params 结构上也有一个 `Timeout` 字段，默认值为 55 秒，这使其与文件系统快照相同。如果快照未在该窗口内返回，则会引发 [`TimeoutError`](/docs/sdk/go/latest/Errors#timeouterror)。超时可以设置为任意高，以保留不超时的旧行为。
* **突破：** [`Sandbox.Filesystem`](/docs/sdk/go/latest/Sandbox#sandboxfilesystem) 现在是一个字段而不是一个方法。将 `sb.Filesystem().ReadText(...)` 迁移到 `sb.Filesystem.ReadText(...)`。
* **中断：** [`Sandbox.FromID`](/docs/sdk/go/latest/Sandbox#fromid) 不再检查沙箱 ID 是否存在。您可以运行 [`Poll`](/docs/sdk/go/latest/Sandbox#poll) 来获取沙箱的状态。
* **重大突破：** 删除了已弃用的低级文件句柄 API：`Sandbox.Open` 和 `SandboxFile`。请使用 [Sandbox 文件系统 API](/docs/sdk/go/latest/Sandbox#sandboxfilesystem)：`sandbox.Filesystem`。* **中断：** 删除了已弃用的 `Volume.ReadOnly` 和 `Volume.IsReadOnly`。请改用 [`WithMountOptions(&VolumeMountOptions{ReadOnly: &t})`](/docs/sdk/go/latest/Volume#withmountoptions)。
* **突破：** 所有公共方法现在都以 `*XxxParams` 指针参数结尾，从而无需额外的签名改动即可实现未来选项的前向兼容性。通过 `nil` 接受默认值。受影响的方法：
  * [`FunctionCall.FromID`](/docs/sdk/go/latest/FunctionCall#fromid) → `FromID(ctx, id, *FunctionCallFromIDParams)`
  * [`Image.FromID`](/docs/sdk/go/latest/Image#fromid) → `FromID(ctx, id, *ImageFromIDParams)`
  * [`Image.FromRegistry`](/docs/sdk/go/latest/Image#fromregistry) → `FromRegistry(tag, *ImageFromRegistryParams)`，`*Secret`字段保留在`ImageFromRegistryParams`内（签名不变）
* [`Image.FromAwsEcr`](/docs/sdk/go/latest/Image#fromawsecr) → `FromAwsEcr(tag, secret, *ImageFromAwsEcrParams)` — `*Secret` 参数现在是 params 结构之前的位置参数
  * [`Image.FromGcpArtifactRegistry`](/docs/sdk/go/latest/Image#fromgcpartifactregistry) → `FromGcpArtifactRegistry(tag, secret, *ImageFromGcpArtifactRegistryParams)` — `*Secret` 参数现在是 params 结构之前的位置参数
  * [`Image.Build`](/docs/sdk/go/latest/Image#build) → `Build(ctx, app, *ImageBuildParams)`
  * [`Function.GetCurrentStats`](/docs/sdk/go/latest/Function#getcurrentstats) → `GetCurrentStats(ctx, *FunctionGetCurrentStatsParams)`
  * [`ContainerProcess.Wait`](/docs/sdk/go/latest/ContainerProcess#wait) → `Wait(ctx, *ContainerProcessWaitParams)`
  * [`Sandbox.FromID`](/docs/sdk/go/latest/Sandbox#fromid) → `FromID(ctx, id, *SandboxFromIDParams)`
  * [`Sandbox.Wait`](/docs/sdk/go/latest/Sandbox#wait) → `Wait(ctx, *SandboxWaitParams)`* [`Sandbox.WaitUntilReady`](/docs/sdk/go/latest/Sandbox#waituntilready) → `WaitUntilReady(ctx, timeout, *SandboxWaitUntilReadyParams)`
  * [`Sandbox.Tunnels`](/docs/sdk/go/latest/Sandbox#tunnels) → `Tunnels(ctx, timeout, *SandboxTunnelsParams)`
  * [`Sandbox.MountImage`](/docs/sdk/go/latest/Sandbox#mountimage) → `MountImage(ctx, path, image, *SandboxMountImageParams)`
  * [`Sandbox.UnmountImage`](/docs/sdk/go/latest/Sandbox#unmountimage) → `UnmountImage(ctx, path, *SandboxUnmountImageParams)`
  * [`Sandbox.SnapshotDirectory`](/docs/sdk/go/latest/Sandbox#snapshotdirectory) → `SnapshotDirectory(ctx, path, *SandboxSnapshotDirectoryParams)`
  * [`Sandbox.SnapshotFilesystem`](/docs/sdk/go/latest/Sandbox#snapshotfilesystem) → `SnapshotFilesystem(ctx, *SandboxSnapshotFilesystemParams)`
  * [`Sandbox.Poll`](/docs/sdk/go/latest/Sandbox#poll) → `Poll(ctx, *SandboxPollParams)`
  * [`Sandbox.SetTags`](/docs/sdk/go/latest/Sandbox#settags) → `SetTags(ctx, tags, *SandboxSetTagsParams)`
  * [`Sandbox.GetTags`](/docs/sdk/go/latest/Sandbox#gettags) → `GetTags(ctx, *SandboxGetTagsParams)`

## 0.7

### 0.7.6 (2026-05-21)
* 添加了 [Sandbox 文件系统 API](/docs/sdk/go/latest/Sandbox#sandboxfilesystem)，可通过 `sandbox.Filesystem()` 获取。文件系统 API 包含方法：
  * [`fs.WriteText`](/docs/sdk/go/latest/Sandbox#filesystemwritetext)：将 UTF-8 写入沙盒中的文件。
  * [`fs.WriteBytes`](/docs/sdk/go/latest/Sandbox#filesystemwritebytes)：将二进制内容写入沙箱中的文件。
  * [`fs.ReadText`](/docs/sdk/go/latest/Sandbox#filesystemreadtext)：从沙箱中读取文件并将其内容作为 UTF-8 字符串返回。
  * [`fs.ReadBytes`](/docs/sdk/go/latest/Sandbox#filesystemreadbytes): 从沙箱中读取文件并以字节形式返回其内容。
  * [`fs.MakeDirectory`](/docs/sdk/go/latest/Sandbox#filesystemmakedirectory): 在沙箱中创建一个新目录。
  * [`fs.ListFiles`](/docs/sdk/go/latest/Sandbox#filesystemlistfiles): 列出 Sandbox 目录中的文件和目录。
  * [`fs.Stat`](/docs/sdk/go/latest/Sandbox#filesystemstat): 返回沙箱中单个文件、目录或符号链接的元数据。
  * [`fs.CopyFromLocal`](/docs/sdk/go/latest/Sandbox#filesystemcopyfromlocal): 将本地文件复制到沙箱中。
  * [`fs.CopyToLocal`](/docs/sdk/go/latest/Sandbox#filesystemcopytolocal): 将文件从 Sandbox 复制到本地路径。
* [`fs.Remove`](/docs/sdk/go/latest/Sandbox#filesystemremove): 删除沙箱中的文件或目录。
* 添加了 [`Volume.WithMountOptions`](/docs/sdk/go/latest/Volume#withmountoptions) 以在将卷附加到函数或沙箱时配置挂载时选项（`ReadOnly` 和 `SubPath`）。 `SubPath` 选项安装卷的子目录而不是其根目录。在同一卷堆栈上多次调用`WithMountOptions`：未设置的字段保留其先前的值。
* 已弃用 `Volume.ReadOnly`，改为 [`WithMountOptions(&VolumeMountOptions{ReadOnly: &t})`](/docs/sdk/go/latest/Volume#withmountoptions)。旧方法仍然有效，但将在未来版本中删除。
* 已弃用`Volume.IsReadOnly`；跟踪配置它们的调用站点上配置的安装选项。

### 0.7.5 (2026-05-19)

* 我们提高了 [`Sandbox.SnapshotFilesystem`](/docs/sdk/go/latest/Sandbox#snapshotfilesystem) 操作的可靠性，特别是对于大型快照，我们现在支持在必要时设置长于 55 秒的 `Timeout`。
* 添加了 [`Sandbox.UnmountImage`](/docs/sdk/go/latest/Sandbox#unmountimage) 以从 Sandbox 文件系统中的路径中删除映像挂载并再次显示底层目录。
* [`Sandboxes.Create`](/docs/sdk/go/latest/Sandbox#create) 现在接受 `Tags` 参数，以便在创建时将键值标签附加到沙箱。
* [`Sandboxes.Create`](/docs/sdk/go/latest/Sandbox#create) 现在接受 `InboundCIDRAllowlist` 参数来限制哪些源 IP 可以入站连接到沙箱的隧道和连接令牌。
* 将 `CIDRAllowlist` 重命名为 `OutboundCIDRAllowlist`，以区别于相应的入站白名单。
* Go SDK 现在可以通过后退和自动重试来更优雅地响应服务器限制（例如，速率限制）。

### 0.7.4 (2026-04-03)* [`Sandboxes.Create`](/docs/sdk/go/latest/Sandbox#create) 现在接受 `IncludeOidcIdentityToken` 参数。启用后，`MODAL_IDENTITY_TOKEN`环境变量将被注入沙箱中，从而启用基于 OIDC 的身份验证（例如，用于 AWS 联合）。
* 我们正在为 `Sandbox` 引入“就绪探针”的概念。此功能允许您使用 [`NewTCPProbe`](/docs/sdk/go/latest/Probe#newtcpprobe) 对 TCP 端口配置就绪检查，或使用 [`NewExecProbe`](/docs/sdk/go/latest/Probe#newexecprobe) 执行进程。调用 [`sb.WaitUntilReady()`](/docs/sdk/go/latest/Sandbox#waituntilready) 将阻塞，直到探测成功。

### 0.7.3 (2026-03-12)

* 将 SDK 从`github.com/modal-labs/libmodal`迁移到`github.com/modal-labs/modal-client`。
### 0.7.2 (2026-02-26)

* 更新了 `Sandbox` 方法以等待新创建的沙箱准备就绪，并且在尚不可用时不会立即出错。

### 0.7.1 (2026-02-23)

* 没有影响 Go SDK 的更改。

### 0.7.0 (2026-02-23)

* 添加了 [`Sandbox.MountImage`](/docs/sdk/go/latest/Sandbox#mountimage)，它将 Image 挂载到 Sandbox 文件系统中的路径。
* 添加了 [`Sandbox.SnapshotDirectory`](/docs/sdk/go/latest/Sandbox#snapshotdirectory)，它会对正在运行的沙箱中的目录进行快照并从中创建一个新的 Image。
* 升级[`Sandbox.Exec`](/docs/sdk/go/latest/Sandbox#exec)，带来更高的性能和可靠性。
* 添加了 [`Sandbox.Detach`](/docs/sdk/go/latest/Sandbox#detach) 以断开客户端与沙箱的连接并清理与该连接关联的所有资源。我们**强烈建议**在您与沙箱交互完成后致电`Detach`。 `Detach` 不会关闭来自 `Sandbox.Stdout` 的流。这些流应该使用它们的 `Close` 方法关闭。
* [`Sandbox.Terminate`](/docs/sdk/go/latest/Sandbox#terminate) 默认情况下分离。要与正在运行的沙箱交互，请使用 [`Sandboxes.FromID`](/docs/sdk/go/latest/Sandbox#fromid) 创建一个新的 Sandbox 对象。
* [`Sandbox.Terminate`](/docs/sdk/go/latest/Sandbox#terminate) 现在接受 `Wait` 参数来等待沙箱终止并返回退出代码。

**重大变更：**

* 更改了`Sandbox.Terminate`，现在返回`(int, error)`。 `int`是传入`&SandboxTerminateParams{Wait: true}`时的返回码。
* 添加了`Sandbox.Detach`来断开客户端与沙箱的连接并清理与该连接相关的所有资源。我们**强烈建议**在您与沙箱交互完成后致电`Detach`。

## 0.6

### 0.6.3 (2026-02-18)* 修复了使用 `AllowMissing: true` 删除卷、队列或 Secret 仍可能引发 `NOT_FOUND` 错误的错误。
* 改进了对降级 HTTP/2 连接的处理，解决了间歇性 RST\_STREAM 错误。

### 0.6.2 (2026-02-09)

* 没有影响 Go SDK 的更改。

### 0.6.1 (2026-01-30)

* 添加自定义域到 [`Sandboxes.Create`](/docs/sdk/go/latest/Sandbox#create)。请注意，Sandbox 自定义域的工作方式与 Function 自定义域不同，目前必须由 Modal 手动设置；如果您对此功能感兴趣，请联系我们。

### 0.6.0 (2025-12-10)

* 为`Sandbox.Create`添加了`enable_docker`实验选项。

## 0.5

### 0.5.6 (2025-12-02)
* 添加了 [`Sandbox.CreateConnectToken`](/docs/sdk/go/latest/Sandbox#createconnecttoken)。

### 0.5.5 (2025-11-25)

* 默认情况下为所有测试启用 goroutine 泄漏检测。
* 修复了一些剩余的 goroutine 泄漏。
* 测试清理：确保我们始终终止沙箱、关闭临时对象等。
* 在 [`CloudBucketMount`](/docs/sdk/go/latest/CloudBucketMount) 创建中添加了调试日志记录，使其与 JS SDK 保持一致。
* 调整了 Go SDK 处理 gRPC 消息中空/缺失字段的方式，因此行为与 Python SDK 相同。

### 0.5.4 (2025-11-10)

* 为测试中的 goroutine 泄漏检测启用了 [goleak](https://github.com/uber-go/goleak)。
* 修复了沙箱和图像中所有检测到的 goroutine 泄漏。
* 添加了 [`Volume`](/docs/sdk/go/latest/Volume#delete) 和 [`Secret`](/docs/sdk/go/latest/Secret#delete) 对象的删除方法，并更新了 [`Queue`](/docs/sdk/go/latest/Queue#delete) 对象的删除方法以支持幂等删除`AllowMissing` 参数。

### 0.5.3 (2025-11-08)

* 修复了 `Sandbox.Exec` 会泄漏 goroutine 的错误。

### 0.5.2 (2025-11-04)

* 允许在创建 Modal 客户端时添加自定义 gRPC 拦截器，以允许检测、自定义遥测等。

### 0.5.1 (2025-11-03)
* 所有采用 Context 的 Go SDK 函数都将遵守上下文的超时时间。
* 改进了将 webhook Function 作为普通 Function 调用时的错误消息。
* 允许通过`MODAL_CONFIG_PATH`环境变量自定义配置文件路径（默认为`~/.modal.toml`）。
* 添加了对传递 `MODAL_LOGLEVEL=debug` 环境变量的支持，以记录调试日志，包括。所有 gRPC 调用等

### 0.5.0 (2025-10-28)

Go 的 Modal SDK 的第一个 Beta 版本（从 alpha 毕业）。有关重大更改的详细列表，请参阅[迁移指南](../MIGRATION-GUIDE.md)。

* SDK 现在公开一个中央 [`Client`](/docs/sdk/go/latest/Client) 对象作为与 Modal 资源交互的主要入口点。
* 使用 Modal 对象实例（函数、沙箱、图像等）的界面与以前基本相同，但有一些命名更改。
* 调用已部署的函数和类现在使用新的有效负载序列化协议，这要求已部署的应用程序使用 Modal Python SDK 1.2 或更高版本。
* 在内部删除了全局客户端（以及全局范围内的配置/配置文件数据），将所有内容移至客户端类型。
* Go 和 JS SDK 中一致的参数命名：所有`Options`结构重命名为`Params`。
* 更改了上下文传递的方式，因此上下文现在仅影响当前操作，不用于创建资源的生命周期管理。
* 所有 `Params` 结构现在都作为指针传递，以保持一致性并支持可选参数。
* 字段名称遵循 Go 大小写约定（例如，`Id` → `ID`、`Url` → `URL`、`TokenId` → `TokenID`）。
* 为所有表示内存量的参数添加了明确的单位后缀（以 MiB 为单位，后缀为 `MiB`）。

其他新功能：* 添加了在创建 Sandboxes 和 Cls 实例时设置 CPU 和内存限制的支持。

## 0.0

### 0.0.25 (2025-10-08)

* 关于如何处理输入平面客户端的身份验证令牌的内部更新。

### 0.0.24 (2025-09-19)

* 在多个方法中添加了`Env`参数，以方便将环境变量传递到沙箱等。
* 添加了 [`Sandbox.GetTags()`](/docs/sdk/go/latest/Sandbox#gettags)。

### 0.0.23 (2025-09-15)

* 添加了对沙箱中 PTY 的支持。

### 0.0.22 (2025-09-11)

* 添加了 [`ImageDockerfileCommands()`](/docs/sdk/go/latest/Image#dockerfilecommands)。

### 0.0.21 (2025-09-08)
* 添加了对创建沙箱时设置空闲超时的支持。

### 0.0.20 (2025-09-02)

* 添加了`ImageDelete()`。
* 更改了 `NewImageFromId()` 以在图像不存在时返回 `NotFoundError`。请注意，`NewImageFromId()` 的签名已更改。

### 0.0.19 (2025-08-26)

* 没有影响 Go SDK 的更改。

### 0.0.18 (2025-08-26)

* 添加了 [`Image.Build`](/docs/sdk/go/latest/Image#build)。
* 添加了`NewImageFromId`。
* 调用 `CloseEphemeral()` 后对临时队列的操作现在将显式失败。* 添加了对使用自定义选项实例化 Cls 的支持，使用 [`Cls.WithOptions()`](/docs/sdk/go/latest/Cls#withoptions)/[`.WithConcurrency()`](/docs/sdk/go/latest/Cls#withconcurrency)/[`.WithBatching()`](/docs/sdk/go/latest/Cls#withbatching)。
* 添加了对 [命名沙箱](https://modal.com/docs/guide/sandbox#named-sandboxes) 的支持（[`examples/sandbox-named/main.go`](./examples/sandbox-named/main.go) 中的示例）。
* 添加了对`VolumeEphemeral()`的支持。

### 0.0.17 (2025-08-22)

* 添加了对更多参数的支持 [`Sandbox.Create()`](/docs/sdk/go/latest/Sandbox#create):
  * `BlockNetwork`：是否阻止沙箱的所有网络访问。
  * `CIDRAllowlist`：允许沙箱访问的CIDR列表。
  * `GPU`：沙箱的 GPU 预留（例如“A100”、“T4:2”、“A100-80GB:4”）。
  * `Cloud`：运行沙箱的云提供商。
* `Regions`：运行沙箱的区域。
  * `Verbose`：启用详细日志记录。
  * `Proxy`：将模态代理连接到沙箱。
  * `Workdir`：设置工作目录。
* 添加了对将 [`CloudBucketMount`](/docs/sdk/go/latest/CloudBucketMount) 挂载到沙箱的支持。
* 添加了惰性的顶级 Image 对象。图像是在创建沙箱时构建的。
  * `NewImageFromRegistry`
  * `NewImageFromAwsEcr`
  * `NewImageFromGcpArtifactRegistry`
* 添加了 `SecretFromMap()` 以从键值对创建 Secret（如 Python 中的 `from_dict()`）。
* 将 `Name` 字段添加到 `App`s、`Sandbox`es、`Secret`s、`Volume`s 和 `Queue`s。* 添加了对 [`Function.GetCurrentStats()`](/docs/sdk/go/latest/Function#getcurrentstats) 的支持。
* 添加了对 [`Function.UpdateAutoscaler()`](/docs/sdk/go/latest/Function#updateautoscaler) 的支持。
* 添加了对 [`Function.GetWebURL()`](/docs/sdk/go/latest/Function#getweburl) 的支持。
* 添加了对`Volume.ReadOnly()`的支持。
* 添加了对沙箱上[设置标签](/docs/sdk/go/latest/Sandbox#settags)以及[列出沙箱](/docs/sdk/go/latest/Sandbox#list)（按标签）的支持。

### 0.0.16 (2025-08-07)

* 添加了对[从 ID 获取沙箱](/docs/sdk/go/latest/Sandbox#fromid) 的支持。

### 0.0.15 (2025-07-23)

* 添加了对[对沙箱的文件系统进行快照](/docs/sdk/go/latest/Sandbox#snapshotfilesystem) 的支持。
* 添加了对[轮询沙箱](/docs/sdk/go/latest/Sandbox#poll) 的支持，以检查它们是否仍在运行，或获取退出代码。
* 添加了对在包含 Secrets 的沙箱中执行命令的支持。
* 添加了对创建带有 Secrets 的沙箱的支持。

### 0.0.14 (2025-07-07)

* 添加了对设置 [Tunnels](/docs/sdk/go/latest/Sandbox#tunnels) 的支持，以公开沙箱的实时 TCP 端口。

### 0.0.13 (2025-07-03)

* 修复了使用实验性 `input_plane_region` 选项调用 Cls 的问题。
* 删除了作为公共 API 公开的 `Function.InputPlaneURL`。

### 0.0.12 (2025-07-02)

* 添加了对将 Secret 传递给 `ImageFromRegistry()` 以从私有注册表中提取图像的支持。
* 添加了对使用 `ImageFromGcpArtifactRegistry()` 从 Google Artifact Registry 创建图像的支持。
* 添加了对调用 Python 中使用 `input_plane_region` 选项部署的远程函数的实验性支持。

### 0.0.11 (2025-06-30)

* 添加了 `InitializeClient()` 以在运行时使用凭据初始化客户端。
* 如果没有提供令牌 ID / Secret，客户端库在启动时不再出现恐慌。相反，它会在尝试使用客户端时返回错误。

### 0.0.10 (2025-06-28)

* 为沙盒进程的 `ExecOptions` 添加了 `Workdir` 和 `Timeout` 选项。

### 0.0.9 (2025-06-27)
* 添加了对沙箱文件系统的支持。

### 0.0.8 (2025-06-18)

* 添加了对使用 `App.ImageFromAwsEcr()` 从 AWS ECR 创建映像的支持。
* 添加了对使用 `modal.SecretFromName()` 访问模态机密的支持。

### 0.0.7 (2025-06-09)

* 添加了对 [`Queue`](/docs/sdk/go/latest/Queue) 对象的支持来管理分布式 FIFO 队列。
  * 队列具有与 Python 类似的接口，其中 [`Put()`](/docs/sdk/go/latest/Queue#put) 和 [`Get()`](/docs/sdk/go/latest/Queue#get) 是主要方法。
  * 您可以将结构化对象放入队列，但对 pickle 格式的支持有限。* 添加了 [`InvalidError`](/docs/sdk/go/latest/Errors#invaliderror)、[`QueueEmptyError`](/docs/sdk/go/latest/Errors#queueemptyerror) 和 [`QueueFullError`](/docs/sdk/go/latest/Errors#queuefullerror) 以支持队列。
* Go SDK 中的选项现在采用指针类型，默认值可以是`nil`。

### 0.0.6 (2025-05-30)

* 添加了对使用 [`Function.Spawn()`](/docs/sdk/go/latest/Function#spawn) 生成函数的支持。

### 0.0.5 (2025-05-03)

* 添加了通过 [`Cls`](/docs/sdk/go/latest/Cls) 对象查找和调用远程类的功能。
* 从 `Function.Remote()` 中删除了最初的 `ctx context.Context` 参数。

### 0.0.4 (2025-05-02)
* 支持使用字节负载大小大于 2 MiB 的参数调用远程函数。

### 0.0.3 (2025-04-29)

* 首次公开发布
* 基本 [`Function`](/docs/sdk/go/latest/Function)、[`Sandbox`](/docs/sdk/go/latest/Sandbox)、[`Image`](/docs/sdk/go/latest/Image) 和[`ContainerProcess`](/docs/sdk/go/latest/ContainerProcess) 支持