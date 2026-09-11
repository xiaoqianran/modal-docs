<!-- modal-docs: machine-translated zh-CN from English source -->

# JS SDK 发行说明

## 最新

### 0.10.1 (2026-09-10)

* 现在可以通过在 `.modal.toml` 中设置 `MODAL_SANDBOX_V2=1` 环境变量或 `sandbox_v2 = true` 配置文件配置来选择[性能更佳的沙箱后端](/blog/scaling-to-1-million-concurrent-sandboxes-in-seconds)。然后，沙箱将使用新的后端，无需更改任何代码。这将成为即将发布的版本中的默认行为；设置标志可以让您提前选择加入。
* 现在，客户端在连接空闲时释放与 Sandbox 主机的连接，并在后续操作时自动重新连接，因此不再需要调用 [`Sandbox.detach()`](/docs/sdk/js/latest/Sandbox#detach) 进行资源清理。
* 我们修复了调用二进制模式沙箱流的 `readText()` 有时可能返回不正确数据的问题。
* 图像构建现在遵循 `modal.toml` 配置文件中指定的 `image_builder_version`。

### 0.10.0 (2026-08-27)
* 添加了 [`Function.logs`](/docs/sdk/js/latest/Function#logs) 和 [`FunctionCall.logs`](/docs/sdk/js/latest/FunctionCall#logs) API，用于获取该对象生成的当前和历史日志。 `Logs`命名空间公开了三种方法：使用[`fetch`](/docs/sdk/js/latest/Function#logsfetch)进行基于时间的查询，使用[`tail`](/docs/sdk/js/latest/Function#logstail)返回最近的条目，或者[`stream`](/docs/sdk/js/latest/Function#logsstream) 用于在条目到达时获取条目。
* [`sandbox.filesystem.copyFromLocal`](/docs/sdk/js/latest/Sandbox#filesystemcopyfromlocal) / [`writeBytes`](/docs/sdk/js/latest/Sandbox#filesystemwritebytes) / [`writeText`](/docs/sdk/js/latest/Sandbox#filesystemwritetext) 现在将数据流式传输到沙箱，而不是按每个请求发出请求块，使大写入速度加快约 2.5 倍。
* [`Function_.updateAutoscaler`](/docs/sdk/js/latest/Function#updateautoscaler) 现在在应用更改后立即返回包含当前自动缩放器设置的对象。

## 0.9

### 0.9.0 (2026-07-09)

* [`client.functions.fromName`](/docs/sdk/js/latest/Function#fromname) 和 [`client.cls.fromName`](/docs/sdk/js/latest/Cls#fromname) 现在接受可选的 `version` 参数来查找版本固定的 Function 或 Cls。
* [`client.secrets.fromObject`](/docs/sdk/js/latest/Secret#fromobject) 现在是惰性的，因此返回的 `Secret` 在第一次使用之前有一个空的 `secretId`。通过将机密直接发送到沙箱并避免机密创建限制，可以改善 [`Sandbox.experimentalCreate`](/docs/sdk/js/latest/Sandbox#experimentalcreate) 和 [`Sandbox.exec`](/docs/sdk/js/latest/Sandbox#exec) 的延迟。
* [`Function_.withOptions`](/docs/sdk/js/latest/Function#withoptions) 和 [`Cls.withOptions`](/docs/sdk/js/latest/Cls#withoptions) 现在接受 `routingRegion` 选项来覆盖 Function 或 Cls 的输入和输出路由经过的区域。
* 添加了 [`Sandbox.filesystem.watch`](/docs/sdk/js/latest/Sandbox#filesystemwatch) 以监视沙箱中文件系统更改的路径。它生成 [`FileWatchEvent`](/docs/sdk/js/latest/FileWatchEvent) 对象并支持 `recursive`、事件类型 `filter` 和 `timeoutMs` 绑定。
* **中断：** [`Sandbox.reloadVolumes`](/docs/sdk/js/latest/Sandbox#reloadvolumes) 现在会阻塞，直到重新加载卷为止，并受到可通过 `SandboxReloadVolumesParams.timeoutMs` 配置的新超时（默认为 55 秒）的限制。如果重新加载未在该窗口内完成，则会引发 [`TimeoutError`](/docs/sdk/js/latest/Errors#timeouterror)。
* **中断：** 将 `VolumeMountOptions` 类型重命名为 `VolumeMountOptionsParams`。相应地更新任何 [`withMountOptions`](/docs/sdk/js/latest/Volume#withmountoptions) 类型注释。

## 0.8

### 0.8.2 (2026-06-29)

* 添加了 [`Sandbox.updateNetworkPolicy`](/docs/sdk/js/latest/Sandbox#updatenetworkpolicy) 以更新正在运行的 Sandbox 的出站网络策略。必须同时提供 `outboundCidrAllowlist` 和 `outboundDomainAllowlist`。

### 0.8.1 (2026-06-25)

* [`Sandbox.createConnectToken`](/docs/sdk/js/latest/Sandbox#createconnecttoken) 现在在其 params 对象上接受可选的 `port` 参数，控制使用令牌时路由到哪个容器端口请求。默认为 8080。

### 0.8.0 (2026-06-10)

随着我们继续努力实现 1.0，此版本主要包含一些重大更改。

* 添加了对命名图像的支持，类似于模态原生图像注册表，通过 [`Image.publish`](/docs/sdk/js/latest/Image#publish) 和 [`Image.fromName`](/docs/sdk/js/latest/Image#fromname) 将图像构建与应用程序部署或沙箱创建解耦。
* 添加了对通过 [`Sandbox.create`](/docs/sdk/js/latest/Sandbox#create) 中的 `outboundDomainAllowlist` 限制沙箱内的进程可以连接的*域*的支持。
* 添加了对 Functions 动态配置的支持：[`Function_.withOptions`](/docs/sdk/js/latest/Function#withoptions)、[`Function_.withConcurrency`](/docs/sdk/js/latest/Function#withconcurrency)、[`Function_.withBatching`](/docs/sdk/js/latest/Function#withbatching) 和[`Function_.instance`](/docs/sdk/js/latest/Function#instance)。
* 提高了为函数调用上传或下载大数据负载时的可靠性。
* 修复了向加载了 [`Image.fromId`](/docs/sdk/js/latest/Image#fromid) 的镜像添加 Dockerfile 命令可能无法使用解析后的镜像作为基础的错误。
* [`Sandbox.exec`](/docs/sdk/js/latest/Sandbox#exec) 现在使用 [`InvalidError`](/docs/sdk/js/latest/Errors#invaliderror) 拒绝相对的 `workdir` 客户端。空字符串 `workdir` 也会被拒绝（通过 `undefined` 使用图像默认值）。
* **突破：** JS SDK 现在从您的 [模态工作区设置](https://modal.com/settings/image-config) 读取 [图像生成器版本](https://modal.com/docs/guide/images#image-builder-updates)，就像 Python SDK 一样。此前，JS SDK 被硬编码为使用版本 `2024.10`。如果您的工作区配置使用不同的版本，您的图像将重建一次（然后像往常一样缓存），因此请注意升级后的首次运行可能需要比平时更长的时间。请注意，版本 `2025.06` 有许多专门针对沙箱工作流程的改进。因此，固定的 `ModalClient.imageBuilderVersion` 属性已被删除，取而代之的是 [`ModalClient.getImageBuilderVersion`](/docs/sdk/js/latest/ModalClient#getimagebuilderversion)。
* **突破：** [`Sandbox.snapshotFilesystem`](/docs/sdk/js/latest/Sandbox#snapshotfilesystem) 不再采用位置 `timeoutMs` 参数。超时现在作为 `timeoutMs?: number` 存在于 params 对象上，使该方法与 [`Sandbox.snapshotDirectory`](/docs/sdk/js/latest/Sandbox#snapshotdirectory) 同等。将 `sb.snapshotFilesystem(30000, params)` 迁移到 `sb.snapshotFilesystem({ timeoutMs: 30000, ...params })`。
* **突破：** [`Sandbox.snapshotFilesystem`](/docs/sdk/js/latest/Sandbox#snapshotfilesystem) 和 [`Sandbox.snapshotDirectory`](/docs/sdk/js/latest/Sandbox#snapshotdirectory) 现在在其 params 对象上接受显式 `ttlMs` 字段（以毫秒为单位），控制结果图像的保留时间。两种方法均默认为 30 天。这是 `snapshotFilesystem` 的默认更改，之前它无限期地保留图像。通过`ttlMs: null`选择退出到期。* **突破：** [`Sandbox.snapshotDirectory`](/docs/sdk/js/latest/Sandbox#snapshotdirectory) 现在在其 params 对象上也有一个 `timeoutMs` 字段，默认值为 55 秒，这使其与文件系统快照相同。如果快照未在该窗口内返回，则会引发 [`TimeoutError`](/docs/sdk/js/latest/Errors#timeouterror)。超时可以设置为任意高，以保留不超时的旧行为。
* **中断：** [`Sandbox.fromId`](/docs/sdk/js/latest/Sandbox#fromid) 不再检查沙箱 ID 是否存在。您可以运行 [`poll`](/docs/sdk/js/latest/Sandbox#poll) 来获取沙箱的状态。
* **重大突破：** 删除了已弃用的低级文件句柄 API：`sandbox.open` 和 `SandboxFile`。请使用 [Sandbox 文件系统 API](/docs/sdk/js/latest/Sandbox#sandboxfilesystem)：`sandbox.filesystem`。
* **中断：** 删除了已弃用的 `volume.readOnly` 和 `volume.isReadOnly`。请改用 [`withMountOptions({ readOnly: true })`](/docs/sdk/js/latest/Volume#withmountoptions)。
* **中断：** 从 [`sandboxes.create`](/docs/sdk/js/latest/Sandbox#create) 中删除了已弃用的 `cidrAllowlist` 参数。请改用`outboundCidrAllowlist`。* **突破：** 删除了整个已弃用的 v0.5.0 向后兼容表面：全局 `initializeClient()` / `close()` 函数和 `ClientOptions` 类型；已弃用的静态工厂 `App.lookup`、`Function_.lookup`、`Cls.lookup`、`Queue.lookup` / `Queue.ephemeral` / `Queue.delete`、`Volume.fromName` / `Volume.ephemeral`、`Secret.fromName` / `Secret.fromObject`、 `Sandbox.fromId` / `Sandbox.fromName` / `Sandbox.list`、`Image.fromId` / `Image.fromRegistry` / `Image.fromAwsEcr` / `Image.fromGcpArtifactRegistry` / `Image.delete`、`Proxy.fromName`，以及`FunctionCall.fromId`；实例垫片 `app.createSandbox`、`app.imageFromRegistry` / `imageFromAwsEcr` / `imageFromGcpArtifactRegistry`、公共 `CloudBucketMount` 构造函数以及已弃用的 `LookupOptions` / ⟦T1
16⟧ / `EphemeralOptions` 类型别名。请参阅 [`MIGRATION-GUIDE.md`](../MIGRATION-GUIDE.md)。

## 0.7

### 0.7.6 (2026-05-21)

* 添加了 [Sandbox 文件系统 API](/docs/sdk/js/latest/Sandbox#sandboxfilesystem)，可通过 `sandbox.filesystem` 获取。文件系统 API 包含方法：
  * [`fs.writeText`](/docs/sdk/js/latest/Sandbox#filesystemwritetext)：将 UTF-8 写入沙箱中的文件。
  * [`fs.writeBytes`](/docs/sdk/js/latest/Sandbox#filesystemwritebytes): 将二进制内容写入沙箱中的文件。
* [`fs.readText`](/docs/sdk/js/latest/Sandbox#filesystemreadtext)：从沙箱中读取文件并将其内容作为 UTF-8 字符串返回。
  * [`fs.readBytes`](/docs/sdk/js/latest/Sandbox#filesystemreadbytes): 从沙箱中读取文件并以字节形式返回其内容。
  * [`fs.makeDirectory`](/docs/sdk/js/latest/Sandbox#filesystemmakedirectory): 在沙箱中创建一个新目录。
  * [`fs.listFiles`](/docs/sdk/js/latest/Sandbox#filesystemlistfiles): 列出 Sandbox 目录中的文件和目录。
  * [`fs.stat`](/docs/sdk/js/latest/Sandbox#filesystemstat): 返回沙箱中单个文件、目录或符号链接的元数据。
  * [`fs.copyFromLocal`](/docs/sdk/js/latest/Sandbox#filesystemcopyfromlocal): 将本地文件复制到沙箱中。
  * [`fs.copyToLocal`](/docs/sdk/js/latest/Sandbox#filesystemcopytolocal): 将文件从 Sandbox 复制到本地路径。
  * [`fs.remove`](/docs/sdk/js/latest/Sandbox#filesystemremove): 删除沙箱中的文件或目录。
* 添加了 [`volume.withMountOptions`](/docs/sdk/js/latest/Volume#withmountoptions) 以在将卷附加到函数或沙箱时配置挂载时选项（`readOnly` 和 `subPath`）。 `subPath` 选项安装卷的子目录而不是其根目录。在同一卷堆栈上多次调用`withMountOptions`：未设置的字段保留其先前的值。
* 已弃用 `Volume.readOnly`，改为 [`withMountOptions({ readOnly: true })`](/docs/sdk/js/latest/Volume#withmountoptions)。旧方法仍然有效，但将在未来版本中删除。
* 已弃用`Volume.isReadOnly`；跟踪配置它们的调用站点上配置的安装选项。

### 0.7.5 (2026-05-19)

* 我们提高了 [`Sandbox.snapshotFilesystem`](/docs/sdk/js/latest/Sandbox#snapshotfilesystem) 操作的可靠性，特别是对于大型快照，我们现在支持在必要时设置长于 55 秒的 `timeoutMs`。
* 添加了 [`sandbox.unmountImage`](/docs/sdk/js/latest/Sandbox#unmountimage) 以从 Sandbox 文件系统中的路径中删除映像挂载并再次显示底层目录。
* [`sandboxes.create`](/docs/sdk/js/latest/Sandbox#create) 现在接受 `tags` 参数，以便在创建时将键值标签附加到沙箱。
* [`sandboxes.create`](/docs/sdk/js/latest/Sandbox#create) 现在接受 `inboundCidrAllowlist` 参数来限制哪些源 IP 可以入站连接到沙箱的隧道和连接令牌。
* 将 `cidrAllowlist` 重命名为 `outboundCidrAllowlist`，以区别于相应的入站白名单。
* JS SDK 现在可以通过后退和自动重试来更优雅地响应服务器限制（例如，速率限制）。

### 0.7.4 (2026-04-03)

* [`sandboxes.create`](/docs/sdk/js/latest/Sandbox#create) 现在接受 `includeOidcIdentityToken` 参数。启用后，`MODAL_IDENTITY_TOKEN`环境变量将被注入沙箱中，从而启用基于 OIDC 的身份验证（例如，用于 AWS 联合）。
* 我们正在为 `Sandbox` 引入“就绪探针”的概念。此功能允许您使用 [`Probe.withTcp`](/docs/sdk/js/latest/Probe#withtcp) 配置 TCP 端口的就绪检查，或使用 [`Probe.withExec`](/docs/sdk/js/latest/Probe#withexec) 执行进程。调用 [`sb.waitUntilReady()`](/docs/sdk/js/latest/Sandbox#waituntilready) 将阻塞，直到探测成功。

### 0.7.3 (2026-03-12)

* 将 SDK 从 `github.com/modal-labs/libmodal` 迁移到 `github.com/modal-labs/modal-client`。

### 0.7.2 (2026-02-26)
* 更新了 `Sandbox` 方法以等待新创建的沙箱准备就绪，并且在尚不可用时不会立即出错。
* 修复了取消`sandbox.stdout`或`sandbox.stderr`会清理后台资源的错误。
* 更新了 `Sandbox` 以在沙箱终止时引发更好的错误。

### 0.7.1 (2026-02-23)

* 修复了 `Sandbox.exec` 中引发 `ChannelCredentials` 类型错误的回归。

### 0.7.0 (2026-02-23)

* 添加了 [`Sandbox.mountImage`](/docs/sdk/js/latest/Sandbox#mountimage)，它将 Image 挂载到 Sandbox 文件系统中的路径。
* 添加了 [`Sandbox.snapshotDirectory`](/docs/sdk/js/latest/Sandbox#snapshotdirectory)，它会对正在运行的沙箱中的目录进行快照并从中创建一个新的 Image。
* 升级[`Sandbox.exec`](/docs/sdk/js/latest/Sandbox#exec)，带来更高的性能和可靠性。
* 添加了 [`sandbox.detach`](/docs/sdk/js/latest/Sandbox#detach) 以断开客户端与沙箱的连接并清理与该连接关联的所有资源。我们**强烈建议**在您与沙箱交互完成后致电`detach`。 `detach` 不会关闭来自 `Sandbox.stdout` 的流。这些流应该使用它们的 `close` 方法关闭。
* [`Sandbox.terminate`](/docs/sdk/js/latest/Sandbox#terminate) 默认情况下分离。要与正在运行的沙箱交互，请使用 [`sandboxes.fromId`](/docs/sdk/js/latest/Sandbox#fromid) 创建一个新的 Sandbox 对象。
* [`Sandbox.terminate`](/docs/sdk/js/latest/Sandbox#terminate) 现在接受 `wait` 参数来等待沙箱终止并返回退出代码。

**重大变更：**

* 添加了 `sandbox.detach` 来断开客户端与沙箱的连接并清理与该连接相关的所有资源。我们**强烈建议**在您与沙箱交互完成后致电`detach`。

## 0.6### 0.6.3 (2026-02-18)

* 修复了使用 `allowMissing=true` 删除卷、队列或 Secret 仍可能引发 `NOT_FOUND` 错误的错误。
* 改进了对降级 HTTP/2 连接的处理，解决了间歇性 RST\_STREAM 错误。

### 0.6.2 (2026-02-09)

* 提高了从 `sandbox.stdout` 和 `sandbox.stderr` 读取流的可靠性。

### 0.6.1 (2026-01-30)

* 添加自定义域到 [`sandboxes.create`](/docs/sdk/js/latest/Sandbox#create)。请注意，Sandbox 自定义域的工作方式与 Function 自定义域不同，目前必须由 Modal 手动设置；如果您对此功能感兴趣，请联系我们。

### 0.6.0 (2025-12-10)
* 为`Sandbox.create`添加了`enable_docker`实验选项。

**重大变更：**

* 更改Sandbox参数默认与Python SDK一致：
  * 将默认沙箱超时设置为 5 分钟（之前为 10 分钟）。
  * 默认情况下将沙箱入口点参数保留为空（之前是`["sleep", "48h"]`）。

## 0.5

### 0.5.6 (2025-12-02)

* 添加了 [`Sandbox.createConnectToken`](/docs/sdk/js/latest/Sandbox#createconnecttoken)。

### 0.5.5 (2025-11-25)

* 测试清理：确保我们始终终止沙箱、关闭临时对象等。* 更新了创建 [`CloudBucketMount`](/docs/sdk/js/latest/CloudBucketMount) 的 API，使用与其他 Modal 对象相同的 `modal.cloudBucketMounts.create()` 模式，使其与 Go SDK 保持一致。
* 调整了 JS SDK 处理 gRPC 消息中空/缺失字段的方式，因此行为与 Python SDK 相同。

### 0.5.4 (2025-11-10)

* 添加了 [`Volume`](/docs/sdk/js/latest/Volume#delete) 和 [`Secret`](/docs/sdk/js/latest/Secret#delete) 对象的删除方法，并更新了 [`Queue`](/docs/sdk/js/latest/Queue#delete) 对象的删除方法以支持幂等删除`allowMissing` 参数。

### 0.5.3 (2025-11-08)

* 没有影响 JS SDK 的更改。

### 0.5.2 (2025-11-04)
* 允许在创建 Modal 客户端时添加自定义 gRPC 拦截器，以允许检测、自定义遥测等。

### 0.5.1 (2025-11-03)

* 改进了将 webhook Function 作为普通 Function 调用时的错误消息。
* 允许通过`MODAL_CONFIG_PATH`环境变量自定义配置文件路径（默认为`~/.modal.toml`）。
* 添加了对传递 `MODAL_LOGLEVEL=debug` 环境变量的支持，以记录调试日志，包括。所有 gRPC 调用等

### 0.5.0 (2025-10-28)

Modal SDK for JS 的第一个测试版（从 alpha 版毕业）。有关重大更改的详细列表，请参阅[迁移指南](../MIGRATION-GUIDE.md)。

* SDK 现在公开一个中央 [`ModalClient`](/docs/sdk/js/latest/ModalClient) 对象作为与 Modal 资源交互的主要入口点。
* 使用 Modal 对象实例（函数、沙箱、图像等）的界面与以前基本相同，但有一些命名更改。
* 调用已部署的函数和类现在使用新的有效负载序列化协议，这要求已部署的应用程序使用 Modal Python SDK 1.2 或更高版本。
* 在内部删除了全局客户端（以及全局范围内的配置/配置文件数据），将所有内容移至客户端类型。
* JS 和 Go SDK 中一致的参数命名：所有`Options`接口重命名为`Params`。
* 为所有表示持续时间（以毫秒为单位，后缀为`Ms`）或内存量（以MiB为单位，后缀为`MiB`）的参数添加了明确的单位后缀。

其他新功能：

* 添加了在创建 Sandboxes 和 Cls 实例时设置 CPU 和内存限制的支持。

## 0.3

### 0.3.25 (2025-10-08)

* 修复了与从 Python 中取消对象（函数调用、队列等）相关的错误，其中 32768 到 65535 之间的整数被错误地解码为有符号整数。
* 关于如何处理输入平面客户端的身份验证令牌的内部更新。

### 0.3.24 (2025-09-19)

* 在多个方法中添加了`env`参数，以方便将环境变量传递到沙箱等中。
* 添加了 [`Sandbox.getTags()`](/docs/sdk/js/latest/Sandbox#gettags)。

### 0.3.23 (2025-09-15)

* 添加了对沙箱中 PTY 的支持。

### 0.3.22 (2025-09-11)

* 添加了 [`Image.dockerfileCommands()`](/docs/sdk/js/latest/Image#dockerfilecommands)。

### 0.3.21 (2025-09-08)

* 添加了对创建沙箱时设置空闲超时的支持。

### 0.3.20 (2025-09-02)

* 添加了 [`Image.delete()`](/docs/sdk/js/latest/Image#delete)。
* 更改了 [`Image.fromId()`](/docs/sdk/js/latest/Image#fromid) 以在图像不存在时抛出 [`NotFoundError`](/docs/sdk/js/latest/Errors#notfounderror)。

### 0.3.19 (2025-08-26)

* [`Sandbox.exec`](/docs/sdk/js/latest/Sandbox#exec) 现在可以正确接受 Secret 列表。

### 0.3.18 (2025-08-26)

* 添加了 [`Image.build`](/docs/sdk/js/latest/Image#build)。
* 添加了 [`Image.fromId`](/docs/sdk/js/latest/Image#fromid)。* 添加了对使用自定义选项实例化 Cls 的支持，使用 [`Cls.withOptions()`](/docs/sdk/js/latest/Cls#withoptions)/[`.withConcurrency()`](/docs/sdk/js/latest/Cls#withconcurrency)/[`.withBatching()`](/docs/sdk/js/latest/Cls#withbatching)。
* 添加了对 [命名沙箱](https://modal.com/docs/guide/sandbox#named-sandboxes) 的支持（[`examples/sandbox-named.ts`](./examples/sandbox-named.ts) 中的示例）。
* 添加了对 [`Volume.ephemeral()`](/docs/sdk/js/latest/Volume#ephemeral) 的支持。

### 0.3.17 (2025-08-22)

* 在[`Sandbox.create()`](/docs/sdk/js/latest/Sandbox#create)中添加了对更多参数的支持：
  * `blockNetwork`：是否阻止沙箱的所有网络访问。
  * `cidrAllowlist`：允许沙箱访问的CIDR列表。
  * `gpu`：沙盒的 GPU 预留（例如“A100”、“T4:2”、“A100-80GB:4”）。
  * `cloud`：运行沙箱的云提供商。
  * `regions`: Region(s) to run the Sandbox on.
* `verbose`：启用详细日志记录。
  * `proxy`：将模态代理连接到沙箱。
  * `workdir`：设置工作目录。
* 添加了对将 [`CloudBucketMount`](/docs/sdk/js/latest/CloudBucketMount) 挂载到沙箱的支持。
* 添加了惰性的顶级 Image 对象。图像是在创建沙箱时构建的。
  * [`Image.fromRegistry`](/docs/sdk/js/latest/Image#fromregistry)
  * [`Image.fromAwsEcr`](/docs/sdk/js/latest/Image#fromawsecr)
  * [`Image.fromGcpArtifactRegistry`](/docs/sdk/js/latest/Image#fromgcpartifactregistry)
* 添加了 [`Secret.fromObject()`](/docs/sdk/js/latest/Secret#fromobject) 以从键值对创建 Secret（如 Python 中的 `from_dict()`）。* 将 `name` 字段添加到 `App`s、`Sandbox`es、`Secret`s、`Volume`s 和 `Queue`s。
* 添加了对 [`Function.getCurrentStats()`](/docs/sdk/js/latest/Function#getcurrentstats) 的支持。
* 添加了对 [`Function.updateAutoscaler()`](/docs/sdk/js/latest/Function#updateautoscaler) 的支持。
* 添加了对 [`Function.getWebURL()`](/docs/sdk/js/latest/Function#getweburl) 的支持。
* 添加了对`Volume.readOnly()`的支持。
* 添加了对沙箱上[设置标签](/docs/sdk/js/latest/Sandbox#settags)以及[列出沙箱](/docs/sdk/js/latest/Sandbox#list)（按标签）的支持。

### 0.3.16 (2025-08-07)

* 添加了对[从 ID 获取沙箱](/docs/sdk/js/latest/Sandbox#fromid) 的支持。
### 0.3.15 (2025-07-23)

* 添加了对[对沙箱的文件系统进行快照](/docs/sdk/js/latest/Sandbox#snapshotfilesystem) 的支持。
* 添加了对[轮询沙箱](/docs/sdk/js/latest/Sandbox#poll) 的支持，以检查它们是否仍在运行，或获取退出代码。
* 添加了对在包含 Secrets 的沙箱中执行命令的支持。
* 添加了对创建带有 Secrets 的沙箱的支持。

### 0.3.14 (2025-07-07)

* 添加了对设置 [Tunnels](/docs/sdk/js/latest/Sandbox#tunnels) 的支持，以公开沙箱的实时 TCP 端口。

### 0.3.13 (2025-07-03)

* 修复了使用实验性 `input_plane_region` 选项调用 Cls 的问题。

### 0.3.12 (2025-07-02)

* 添加了对将 Secret 传递给 `imageFromRegistry()` 以从私有注册表中提取图像的支持。
* 添加了对使用 `imageFromGcpArtifactRegistry()` 从 Google Artifact Registry 创建图像的支持。
* 添加了对调用 Python 中使用 `input_plane_region` 选项部署的远程函数的实验性支持。

### 0.3.11 (2025-06-30)

* 添加了 `initializeClient()` 以在运行时使用凭据初始化客户端。
* 如果没有提供令牌 ID / Secret，客户端库在启动时不再失败。相反，它会在尝试使用客户端时抛出错误。

### 0.3.10 (2025-06-28)
* 为沙盒进程的 `ExecOptions` 添加了 `workdir` 和 `timeout` 选项。

### 0.3.9 (2025-06-27)

* 添加了对沙箱文件系统的支持。

### 0.3.8 (2025-06-24)

* 添加了对 CommonJS 格式 / `require()` 的支持。此前，JS SDK 仅支持 ESM `import`。

### 0.3.7 (2025-06-18)

* 添加了对使用 `App.imageFromAwsEcr()` 从 AWS ECR 创建映像的支持。
* 添加了对使用 `Secret.fromName()` 访问模态机密的支持。
* 修复了一些 pickled 对象的序列化（负整数、字典）。

### 0.3.6 (2025-06-09)

* 添加了对 [`Queue`](/docs/sdk/js/latest/Queue) 对象的支持来管理分布式 FIFO 队列。
  * 队列具有与 Python 类似的接口，其中 [`put()`](/docs/sdk/js/latest/Queue#put) 和 [`get()`](/docs/sdk/js/latest/Queue#get) 是主要方法。
  * 您可以将结构化对象放入队列，但对 pickle 格式的支持有限。
* 添加了 [`InvalidError`](/docs/sdk/js/latest/Errors#invaliderror)、[`QueueEmptyError`](/docs/sdk/js/latest/Errors#queueemptyerror) 和 [`QueueFullError`](/docs/sdk/js/latest/Errors#queuefullerror) 以支持队列。
* 修复了为字节对象生成错误字节码的错误。

### 0.3.5 (2025-05-30)
* 添加了对使用 [`Function_.spawn()`](/docs/sdk/js/latest/Function#spawn) 生成函数的支持。

### 0.3.4 (2025-05-06)

* 添加了通过 [`Cls`](/docs/sdk/js/latest/Cls) 对象查找和调用远程类的功能。

### 0.3.3 (2025-05-02)

* 支持使用字节负载大小大于 2 MiB 的参数调用远程函数。

### 0.3.2 (2025-04-29)

* 首次公开发布
* 基本 [`Function`](/docs/sdk/js/latest/Function)、[`Sandbox`](/docs/sdk/js/latest/Sandbox)、[`Image`](/docs/sdk/js/latest/Image) 和[`ContainerProcess`](/docs/sdk/js/latest/ContainerProcess) 支持