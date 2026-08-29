<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙箱

沙箱是 Modal 中安全、隔离的容器，可在几秒钟内启动。

```typescript
class Sandbox {
  readonly sandboxId: string;
  get stdin(): ModalWriteStream<string>;
  get stdout(): ModalReadStream<string>;
  get stderr(): ModalReadStream<string>;
  get filesystem(): SandboxFilesystem;
  get experimentalSidecars(): SidecarService; // Operations for managing sidecar containers that run alongside the Sandbox's main container. EXPERIMENTAL: the API is subject to change.
}
```

## 创建

*通过`modal.sandboxes`访问*

```typescript
async create(
  app: App,
  image: Image,
  params: SandboxCreateParams = {},
): Promise<Sandbox>
```

使用指定的 `Image` 和选项在 `App` 中创建一个新的 `Sandbox`。

**参数** (`SandboxCreateParams`)

`client.sandboxes.create()` 的可选参数。

* `cpu?` (`number`): 为沙箱保留物理CPU核心，可以是分数。
* `cpuLimit?` (`number`): 沙箱物理CPU核心的硬限制，可以是小数。
* `memoryMiB?` (`number`): MiB 中的内存预留。
* `memoryLimitMiB?` (`number`)：MiB 内存硬限制。* `gpu?` (`string`)：沙箱的 GPU 预留（例如“A100”、“T4:2”、“A100-80GB:4”）。
* `timeoutMs?` (`number`)：沙盒的最大生命周期（以毫秒为单位）。默认为 5 分钟。
* `idleTimeoutMs?` (`number`)：沙盒在终止之前可以空闲的时间（以毫秒为单位）。
* `workdir?` (`string`)：沙盒的工作目录。
* `command?` (`string[]`)：主进程的程序参数序列。默认行为是无限期地休眠，直到超时或终止。
* `env?` (`Record<string, string>`): 在沙盒中设置的环境变量。
* `secrets?` (`Secret[]`): `Secret`作为环境变量注入到沙箱中。
* `volumes?` (`Record<string, Volume>`)：Modal `Volume` 的安装点。
* `cloudBucketMounts?` (`Record<string, CloudBucketMount>`)：`CloudBucketMount` 的安装点。
* `pty?` (`boolean`)：为沙盒入口点命令启用 PTY。启用后，所有输出（进程中的 stdout 和 stderr）都会多路复用到 stdout，并且 stderr 流实际上为空。
* `encryptedPorts?` (`number[]`)：通过隧道进入沙箱的端口列表。加密端口通过 TLS 建立隧道。
* `h2Ports?` (`number[]`)：使用 HTTP/2 隧道进入沙盒的加密端口列表。
* `unencryptedPorts?` (`number[]`)：不加密地隧道进入沙盒的端口列表。
* `blockNetwork?` (`boolean`): 是否阻止沙箱的所有网络访问。
* `outboundCidrAllowlist?` (`string[]`)：允许沙箱访问的CIDR列表。如果未设置，则允许所有 CIDR。不能与 blockNetwork 一起使用。
* `outboundDomainAllowlist?` (`string[]`): 允许沙箱访问的域名列表。支持通配符前缀 (`*.example.com`)。不能与 blockNetwork 一起使用。
* `inboundCidrAllowlist?` (`string[]`)：允许入站连接到沙盒的 CIDR 列表（隧道和连接令牌）。如果未设置，则允许所有 IP。不能与 blockNetwork 一起使用。
* `i6pn?` (`boolean`)：启用私有 IPv6 网络 (i6pn)，以便同一工作区中的沙箱可以直接通过其 `i6pn.modal.local` 地址相互寻址。将组中的每个沙箱固定到同一特定区域（例如`regions: ["us-east-1"]`）。不能与 blockNetwork 一起使用。
* `cloud?` (`string`)：运行沙箱的云提供商。
* `regions?` (`string[]`)：运行沙箱的区域。
* `verbose?` (`boolean`)：启用详细日志记录。
* `proxy?` (`Proxy`)：引用在此沙盒前面使用的模态 `Proxy`。
* `readinessProbe?` (`Probe`)：用于确定沙箱何时准备就绪的探针。* `name?` (`string`)：沙箱的可选名称。在应用程序中是独一无二的。
* `tags?` (`Record<string, string>`)：附加到沙箱的标签。可通过`client.sandboxes.list`过滤。
* `experimentalOptions?` (`Record<string, any>`)：可选实验选项。
* `customDomain?` (`string`)：如果设置，到此沙箱的连接将是此域的子域，而不是默认的。这需要 Modal 事先手动设置，并且仅适用于企业客户。
* `includeOidcIdentityToken?` (`boolean`)：如果为 true，沙箱将收到一个 MODAL\_IDENTITY\_TOKEN env var，用于基于 OIDC 的身份验证（例如，发送到 AWS、GCP）。
* `experimentalEnableSnapshot?` (`boolean`): 启用内存快照。

## 实验性创建

*通过`modal.sandboxes`访问*

```typescript
async experimentalCreate(
  app: App,
  image: Image,
  params: SandboxCreateParams = {},
): Promise<Sandbox>
```
使用实验性 V2 后端创建一个新的 `Sandbox`。

支持的功能包括执行、加密隧道、等待/轮询/终止、
CPU和内存配置、区域放置、卷、云存储桶
安装（通过`Secret`或`oidcAuthRoleArn`使用静态凭证），
OIDC 身份令牌、`proxies`、文件系统快照和
自定义域（`customDomain`允许通过
该父域的子域而不是默认的模态域；
需要 Modal 事先设置）。

通过 `experimentalEnableSnapshot: true` 创建一个沙箱，可以使用`Sandbox.experimentalSnapshot`拍摄的快照。网络等功能
不支持文件系统和 GPU。

使用此方法创建的 V2 沙箱目前不会返回
`client.sandboxes.list()`。一个命名的沙箱可以是
抬头看着
`client.sandboxes.experimentalFromName()`；
否则存储`sandbox.sandboxId`并使用
`client.sandboxes.fromId()` 重新连接。

**参数** (`SandboxCreateParams`)

`client.sandboxes.create()` 的可选参数。

* `cpu?` (`number`): 为沙箱保留物理CPU核心，可以是分数。
* `cpuLimit?` (`number`): 沙箱物理CPU核心的硬限制，可以是小数。
* `memoryMiB?` (`number`): MiB 中的内存预留。
* `memoryLimitMiB?` (`number`): MiB 内存硬限制。
* `gpu?` (`string`)：沙箱的 GPU 预留（例如“A100”、“T4:2”、“A100-80GB:4”）。
* `timeoutMs?` (`number`)：沙盒的最大生命周期（以毫秒为单位）。默认为 5 分钟。
* `idleTimeoutMs?` (`number`)：沙箱在终止之前可以空闲的时间（以毫秒为单位）。
* `workdir?` (`string`)：沙盒的工作目录。
* `command?` (`string[]`)：主进程的程序参数序列。默认行为是无限期地休眠，直到超时或终止。
* `env?` (`Record<string, string>`): 在沙盒中设置的环境变量。* `secrets?` (`Secret[]`): `Secret`作为环境变量注入到沙箱中。
* `volumes?` (`Record<string, Volume>`)：Modal `Volume` 的安装点。
* `cloudBucketMounts?` (`Record<string, CloudBucketMount>`)：`CloudBucketMount` 的安装点。
* `pty?` (`boolean`)：为沙盒入口点命令启用 PTY。启用后，所有输出（进程中的 stdout 和 stderr）都会多路复用到 stdout，并且 stderr 流实际上为空。
* `encryptedPorts?` (`number[]`)：通过隧道进入沙箱的端口列表。加密端口通过 TLS 建立隧道。
* `h2Ports?` (`number[]`)：使用 HTTP/2 隧道进入沙箱的加密端口列表。
* `unencryptedPorts?` (`number[]`)：在不加密的情况下隧道进入沙箱的端口列表。
* `blockNetwork?` (`boolean`): 是否阻止沙箱的所有网络访问。
* `outboundCidrAllowlist?` (`string[]`)：允许沙箱访问的CIDR列表。如果未设置，则允许所有 CIDR。不能与 blockNetwork 一起使用。
* `outboundDomainAllowlist?` (`string[]`): 允许沙盒访问的域名列表。支持通配符前缀 (`*.example.com`)。不能与 blockNetwork 一起使用。
* `inboundCidrAllowlist?` (`string[]`)：允许入站连接到沙盒的 CIDR 列表（隧道和连接令牌）。如果未设置，则允许所有 IP。不能与 blockNetwork 一起使用。* `i6pn?` (`boolean`)：启用私有 IPv6 网络 (i6pn)，以便同一工作区中的沙箱可以直接通过其 `i6pn.modal.local` 地址相互寻址。将组中的每个沙盒固定到同一特定区域（例如`regions: ["us-east-1"]`）。不能与 blockNetwork 一起使用。
* `cloud?` (`string`)：运行沙箱的云提供商。
* `regions?` (`string[]`)：运行沙盒的区域。
* `verbose?` (`boolean`)：启用详细日志记录。
* `proxy?` (`Proxy`)：引用在此沙箱前面使用的模态 `Proxy`。
* `readinessProbe?` (`Probe`)：用于确定沙箱何时准备就绪的探针。
* `name?` (`string`)：沙盒的可选名称。在应用程序中是独一无二的。
* `tags?` (`Record<string, string>`)：附加到沙箱的标签。可通过`client.sandboxes.list`过滤。
* `experimentalOptions?` (`Record<string, any>`)：可选实验选项。
* `customDomain?` (`string`)：如果设置，到此沙箱的连接将是此域的子域，而不是默认的。这需要 Modal 事先手动设置，并且仅适用于企业客户。
* `includeOidcIdentityToken?` (`boolean`)：如果为 true，沙箱将收到一个 MODAL\_IDENTITY\_TOKEN env var，用于基于 OIDC 的身份验证（例如到 AWS、GCP）。
* `experimentalEnableSnapshot?` (`boolean`): 启用内存快照。

## 来自 ID

*通过`modal.sandboxes`访问*

```typescript
async fromId(sandboxId: string): Promise<Sandbox>
```

从 ID 返回正在运行的 `Sandbox` 对象。**返回：** 带ID的沙箱

## 来自姓名

*通过`modal.sandboxes`访问*

```typescript
async fromName(
  appName: string,
  name: string,
  params?: SandboxFromNameParams,
): Promise<Sandbox>
```

从已部署的 `App` 中按名称获取正在运行的 `Sandbox`。

如果未找到具有给定名称的正在运行的沙箱，则引发 `NotFoundError`。
沙箱的名称是传递给 `sandboxes.create()` 的 `name` 参数。

* `appName`：部署的App名称
* `name`：沙盒名称

**参数** (`SandboxFromNameParams`)

`client.sandboxes.fromName()` 的可选参数。

* `environment?` (`string`)

**返回：** 解析为沙箱的 Promise

## 实验性FromName

*通过`modal.sandboxes`访问*

```typescript
async experimentalFromName(
  appName: string,
  name: string,
  params?: SandboxExperimentalFromNameParams,
): Promise<Sandbox>
```

从已部署的 `App` 按名称获取正在运行的 V2 `Sandbox`。

这会查找 V2 沙箱，即通过以下方式创建的沙箱
`client.sandboxes.experimentalCreate()`。

实验性：API 可能会发生变化。

* `appName`：部署的App名称
* `name`: 沙盒名称

**参数** (`SandboxExperimentalFromNameParams`)

`client.sandboxes.experimentalFromName()` 的可选参数。

* `environment?` (`string`)

**返回：** 解析为沙箱的 Promise

## 实验性的来自快照

*通过`modal.sandboxes`访问*

```typescript
async experimentalFromSnapshot(
  snapshot: SandboxSnapshot,
  params?: SandboxExperimentalFromSnapshotParams,
): Promise<Sandbox>
```

从内存快照恢复`Sandbox`。

恢复的目标是从中获取快照的同一后端。一个V1
快照恢复为 V1 沙箱，V2 快照恢复为 V2 沙箱。

实验性：API 可能会发生变化。

**参数** (`SandboxExperimentalFromSnapshotParams`)`client.sandboxes.experimentalFromSnapshot()` 的可选参数。

* `name?` (`string | null`)：恢复的沙箱的名称。省略重用原始沙箱的名称，传递 `null` 使其保持未命名，或传递字符串以覆盖它。

## 列表

*通过`modal.sandboxes`访问*

```typescript
async *list(
  params: SandboxListParams = {},
): AsyncGenerator<Sandbox, void, unknown>
```

列出当前环境或应用程序 ID（如果指定）的所有 `Sandbox`es。
如果指定了标签，则仅返回至少具有这些标签的沙箱。

**参数** (`SandboxListParams`)

`client.sandboxes.list()` 的可选参数。

* `appId?` (`string`)：过滤特定`App`的沙箱。
* `tags?` (`Record<string, string>`): 只返回包含所有指定标签的沙箱。
* `environment?` (`string`)：覆盖请求的环境；默认为当前配置文件。

## 实验列表

*通过`modal.sandboxes`访问*

```typescript
async *experimentalList(
  params: SandboxExperimentalListParams = {},
): AsyncGenerator<Sandbox, void, unknown>
```

列表 V2 `Sandbox`es。

这列出了所有沙箱（v1 和 v2）。
将 `appId` 传递给应用程序；省略它以列出当前的
环境（已弃用 - 更喜欢通过 `appId` 确定范围）。如果指定了标签，
仅返回至少具有这些标签的沙箱。

产生当前正在运行的 `Sandbox` 对象。

实验性：API 可能会发生变化。

**参数** (`SandboxExperimentalListParams`)

`client.sandboxes.experimentalList()` 的参数。* `appId?` (`string`)：列出沙箱的应用程序。省略在整个环境中列出（已弃用）。
* `tags?` (`Record<string, string>`): 只返回包含所有指定标签的沙箱。
* `environment?` (`string`)：覆盖请求的环境；默认为当前配置文件。

## 创建连接令牌

```typescript
async createConnectToken(
  params?: SandboxCreateConnectTokenParams,
): Promise<SandboxCreateConnectCredentials>
```

创建用于与沙箱建立 HTTP 连接的令牌。

**参数** (`SandboxCreateConnectTokenParams`)

`Sandbox.createConnectToken()` 的可选参数。

* `userMetadata?` (`string`)：可选的用户提供的元数据字符串，在将请求转发到沙箱时将由代理添加到标头中。
* `port?` (`number`)：使用此令牌时请求路由到的容器端口。默认为 8080。

## 分离

```typescript
detach(): void
```

断开与沙箱的连接，清理本地资源。
沙箱继续在 Modal 的基础设施上运行。
调用 detach() 后，对此 Sandbox 对象的大多数操作都会抛出异常。

## 执行

```typescript
async exec(
  command: string[],
  params?: SandboxExecParams & { mode?: "text" },
): Promise<ContainerProcess<string>>
async exec(
  command: string[],
  params: SandboxExecParams & { mode: "binary" },
): Promise<ContainerProcess<Uint8Array>>
```

**参数** (`SandboxExecParams`)

`Sandbox.exec()` 的可选参数。

* `mode?` (`StreamMode`)：指定输入和输出流的文本或二进制编码。
* `stdout?` (`StdioBehavior`): 是否通过管道传输或忽略标准输出。
* `stderr?` (`StdioBehavior`): 是否通过管道传输或忽略标准错误。* `workdir?` (`string`)：运行命令的工作目录。
* `timeoutMs?` (`number`)：进程超时（以毫秒为单位）。默认为 0（无超时）。
* `env?` (`Record<string, string>`): 为命令设置的环境变量。
* `secrets?` (`Secret[]`): `Secret` 作为命令的环境变量注入。
* `pty?` (`boolean`): 为命令启用 PTY。启用后，所有输出（进程中的 stdout 和 stderr）都会多路复用到 stdout，并且 stderr 流实际上为空。

## 实验性GetExitSnapshot

```typescript
async experimentalGetExitSnapshot(
  params?: SandboxExperimentalGetExitSnapshotParams,
): Promise<Image>
```

获取退出文件系统快照映像。

实验性：API 可能会发生变化。
**参数** (`SandboxExperimentalGetExitSnapshotParams`)

Sandbox.experimentalGetExitSnapshot() 的可选参数。

* `timeoutMs?` (`number`)：等待的总时间（以毫秒为单位），分布在每次最多 `EXIT_SNAPSHOT_LONG_POLL_TIMEOUT` 秒的重复长轮询中。 `undefined`（默认）等待快照达到最终状态。 `0` 立即执行检查，无需等待。

**返回：** 退出快照图像。

**加薪：**

* `TimeoutError`：如果在快照到达最终状态之前经过`timeoutMs`。这包括快照仍处于待处理状态时的`timeoutMs = 0`。

## 实验集名称

```typescript
async experimentalSetName(name: string): Promise<void>
```为没有创建的正在运行的 V2 `Sandbox` 分配一个名称。

仅 V2 沙箱支持此功能，即通过以下方式创建的沙箱
`client.sandboxes.experimentalCreate()`。
名称只能设置一次，并且只能在从未有过名称的沙箱上设置；
之后可以使用以下命令查找沙盒
`client.sandboxes.experimentalFromName()`。

实验性：API 可能会发生变化。

* `name`：分配给沙箱的名称。在应用程序内必须是唯一的。

**加薪：**

* `AlreadyExistsError`：如果应用程序中另一个正在运行的沙箱已经拥有该名称。
* `InvalidError`：如果服务器拒绝该名称无效。
* `ConflictError`：如果沙箱已经有名称或不再运行。

## 实验快照

```typescript
async experimentalSnapshot(): Promise<SandboxSnapshot>
```
快照沙箱的文件系统和内存。

返回一个可以恢复到新沙箱中的`SandboxSnapshot`
与`client.sandboxes.experimentalFromSnapshot()`。

沙盒必须是使用 `experimentalEnableSnapshot: true` 创建的。

实验性：API 可能会发生变化。

## 获取标签

```typescript
async getTags(): Promise<Record<string, string>>
```

从服务器获取当前附加到此沙箱的标签（键值对）。

##挂载图像

```typescript
async mountImage(
  path: string,
  image?: Image,
  params?: SandboxMountImageParams,
): Promise<void>
```

将 `Image` 挂载到沙箱文件系统中的路径上。

* `path`：目录应挂载的路径
* `image`：可选安装`Image`。如果未定义，则安装一个空目录。

**参数** (`SandboxMountImageParams`)

`Sandbox.mountImage()` 的可选参数。* `experimentalEncryptionKey?` (`Uint8Array`)：用于解密图像的实验性客户提供的加密密钥。使用加密快照的相同密钥。

## 民意调查

```typescript
async poll(): Promise<number | null>
```

检查沙盒是否已完成运行。

如果沙箱仍在运行，则返回`null`，否则返回退出代码。

## 重新加载卷

```typescript
async reloadVolumes(params?: SandboxReloadVolumesParams): Promise<void>
```

重新加载沙箱中安装的所有卷。

阻塞直到重新加载完成，或者超时抛出 `TimeoutError`
（重新加载可能仍会在后台完成）。

**参数** (`SandboxReloadVolumesParams`)

`Sandbox.reloadVolumes()` 的可选参数。

* `timeoutMs?` (`number`)：总体预算（以毫秒为单位）。默认为 55000。

## 设置标签

```typescript
async setTags(tags: Record<string, string>): Promise<void>
```
在沙盒上设置标签（键值对）。标签可用于过滤`client.sandboxes.list`中的结果。

设置标签会替换沙箱的整个标签集；传递空对象会清除所有标签。

## 快照目录

```typescript
async snapshotDirectory(
  path: string,
  params?: SandboxSnapshotDirectoryParams,
): Promise<Image>
```

从正在运行的沙箱中的目录拍摄快照并创建新的 `Image`。

生成的图像保留`ttlMs`（默认：30 天），
作为从创建开始衡量的硬性界限——使用不会扩展
一生。通过`ttlMs: null`无限期保留。

该呼叫的总体预算为 `timeoutMs`（默认值：55000）。如果它
在快照完成之前经过，调用被取消并且
抛出错误。

* `path`: 快照目录路径

**参数** (`SandboxSnapshotDirectoryParams`)

`Sandbox.snapshotDirectory()` 的可选参数。

* `timeoutMs?` (`number`)：快照调用的总体预算，以毫秒为单位。默认为 55000。如果在快照完成之前就过去了，则调用将被取消并引发错误。
* `ttlMs?` (`number | null`)：生成图像的生命周期（以毫秒为单位），作为从创建时测量的硬截止。默认为 30 天。通过`null`无限期保留图像。
* `experimentalEncryptionKey?` (`Uint8Array`)：实验性客户提供的加密密钥，用于加密生成的快照。安装映像时需要相同的密钥。 Modal 不保留密钥。

**返回：** 解析为 `Image` 的 Promise

## 快照文件系统

```typescript
async snapshotFilesystem(
  params?: SandboxSnapshotFilesystemParams,
): Promise<Image>
```

快照沙箱的文件系统。

返回一个 `Image` 对象，可用于生成具有相同文件系统的新沙箱。

该呼叫的总体预算为 `timeoutMs`（默认值：55000）。如果它
在快照完成之前经过，调用被取消并且
抛出错误。

**参数** (`SandboxSnapshotFilesystemParams`)`Sandbox.snapshotFilesystem()` 的可选参数。

* `timeoutMs?` (`number`)：快照调用的总体预算，以毫秒为单位。默认为 55000。如果在快照完成之前就过去了，则调用将被取消并引发错误。
* `ttlMs?` (`number | null`)：生成图像的生命周期（以毫秒为单位），作为从创建时测量的硬截止。默认为 30 天。通过`null`无限期保留图像。

**返回：** 解析为 `Image` 的 Promise

## 终止

```typescript
async terminate(): Promise<void>
async terminate(params: { wait: true }): Promise<number>
```

**参数** (`SandboxTerminateParams`)

`Sandbox.terminate()` 的可选参数。

* `wait?` (`boolean`): 如果为 true，则等待沙盒完成并返回退出代码。

## 隧道

```typescript
async tunnels(timeoutMs = 50000): Promise<Record<number, Tunnel>>
```
获取沙箱的`Tunnel`元数据。

如果超时后隧道不可用，则引发 `SandboxTimeoutError`。

**返回：** `Tunnel` 对象的字典，由容器端口作为键控。

## 卸载图像

```typescript
async unmountImage(path: string): Promise<void>
```

卸载先前安装在沙箱文件系统中的路径上的`Image`。

* `path`：要卸载的挂载路径

## 更新网络策略

```typescript
async updateNetworkPolicy(
  params: SandboxUpdateNetworkPolicyParams,
): Promise<void>
```

更新正在运行的沙箱的出站网络策略。

新策略不再允许的已建立连接将被终止。

**参数** (`SandboxUpdateNetworkPolicyParams`)

`Sandbox.updateNetworkPolicy()` 的参数。每个维度都是独立的：`undefined` 保持该维度不变，
而定义的值会替换它（空数组会阻止该值的所有出口）
维度；通配符条目（例如 `"0.0.0.0/0"` 或 `"*"` 允许一切）。

目前，必须提供两个维度（底层传输不
尚不支持部分更新）。这一要求将在一段时间内放宽
未来的版本。

* `outboundCidrAllowlist?` (`string[]`)
* `outboundDomainAllowlist?` (`string[]`)

## 等待

```typescript
async wait(): Promise<number>
```

## 等待直到就绪

```typescript
async waitUntilReady(timeoutMs = 300_000): Promise<void>
```

等待沙盒就绪探针报告沙盒已就绪。

此方法仅适用于配置了就绪探针的沙箱。
* `timeoutMs`：最大总等待时间，以毫秒为单位。

**返回：** 一旦沙盒准备就绪，就会解决的承诺。

**加薪：**

* `TimeoutError`：如果在`timeoutMs`之前未报告准备情况。

## Sandbox.experimentalSidecars

用于管理与运行的边车容器一起运行的操作
沙箱的主要容器。

实验性：API 可能会发生变化。

### 创建

```typescript
async create(
  name: string,
  image: Image,
  params?: SidecarCreateParams,
): Promise<SidecarContainer>
```

在沙盒中启动一个新的 sidecar 容器。 `Image` 必须
之前已经通过调用 `Image.build()` 来构建
传递给`create`。

**参数** (`SidecarCreateParams`)

`SidecarService.create()` 的选项。

* `command?` (`string[]`)：启动时在 sidecar 容器中运行的命令。
* `env?` (`Record<string, string>`): 在 sidecar 容器中设置的环境变量。
* `secrets?` (`Secret[]`): `Secret`作为环境变量注入到sidecar容器中。
* `workdir?` (`string`)：sidecar 容器的工作目录。
* `outboundCidrAllowlist?` (`string[]`)：允许sidecar访问的CIDR列表。独立于主容器；如果未设置，则允许所有 CIDR。空列表会阻止所有外部出口，同时保留与主容器的连接。
* `outboundDomainAllowlist?` (`string[]`)：允许sidecar访问的域名列表。支持通配符前缀 (`*.example.com`)。独立于主容器。
* `pty?` (`boolean`): 为 sidecar 启用 PTY。

### 得到

```typescript
async get(
  name: string,
  params?: SidecarGetParams,
): Promise<SidecarContainer>
```

按名称返回 sidecar 容器。

**参数** (`SidecarGetParams`)

`SidecarService.get()` 的选项。

* `includeTerminated?` (`boolean`): 如果为true，则返回具有该名称的最新容器，即使它已经终止。

### 列表

```typescript
async list(params?: SidecarListParams): Promise<SidecarContainer[]>
```

返回所有 sidecar 容器（不包括主容器）。

**参数** (`SidecarListParams`)

`SidecarService.list()` 的选项。

* `includeTerminated?` (`boolean`)：如果为 true，则包含已终止的容器。## 沙箱.文件系统

沙箱文件系统 API 的命名空间。

### 从本地复制

```typescript
async copyFromLocal(localPath: string, remotePath: string): Promise<void>
```

将本地文件复制到沙箱中。

`remotePath` 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。

**加薪：**

* `SandboxFilesystemNotADirectoryError`：`remotePath`的父组件不是目录。
* `SandboxFilesystemIsADirectoryError`: `remotePath` 指向一个目录。
* `SandboxFilesystemPermissionError`：沙箱中的写入权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。
* `Error`: `localPath`不存在、是目录或无法读取(`ENOENT`、`EISDIR`、`EACCES`)。

### 复制到本地

```typescript
async copyToLocal(remotePath: string, localPath: string): Promise<void>
```
将文件从沙盒复制到本地路径。

`remotePath` 必须是沙盒中文件的绝对路径。
如果需要，会创建 `localPath` 的父目录。本地文件
如果已经存在则被覆盖。

**加薪：**

* `SandboxFilesystemNotFoundError`: 远程路径不存在。
* `SandboxFilesystemIsADirectoryError`：远程路径指向一个目录。
* `SandboxFilesystemFileTooLargeError`：文件超出读取大小限制。
* `SandboxFilesystemPermissionError`：沙箱中的读取权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。
* `Error`: `localPath` 指向目录，否则不允许写入。

### 列表文件

```typescript
async listFiles(remotePath: string): Promise<FileInfo[]>
```列出 Sandbox 目录中的文件和目录。

`remotePath` 必须是沙盒中目录的绝对路径。
返回按名称排序的 `FileInfo` 对象数组。

**加薪：**

* `SandboxFilesystemNotFoundError`：路径不存在。
* `SandboxFilesystemNotADirectoryError`：路径不是目录。
* `SandboxFilesystemPermissionError`：读取权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### make目录

```typescript
async makeDirectory(
  remotePath: string,
  options?: { createParents?: boolean },
): Promise<void>
```

在沙箱中创建一个新目录。

`remotePath` 必须是沙箱中的绝对路径。

当 `createParents` 为 `true`（默认值）时，任何缺失的父级
创建目录并且调用是幂等的（如果
目录已存在）。当`createParents`为`false`时，立即数
父级必须已存在，并且路径不得已存在。

**加薪：**

* `SandboxFilesystemNotFoundError`：父级不存在，`createParents`是`false`。
* `SandboxFilesystemPathAlreadyExistsError`：路径已存在，`createParents`为`false`。
* `SandboxFilesystemNotADirectoryError`：路径组件不是目录。
* `SandboxFilesystemPermissionError`：不允许创建。
* `InvalidError`：挂载不支持该操作。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### 读取字节

```typescript
async readBytes(remotePath: string): Promise<Uint8Array>
```

从沙盒中读取文件并以字节形式返回其内容。

`remotePath` 必须是沙盒中文件的绝对路径。**加薪：**

* `SandboxFilesystemNotFoundError`：路径不存在。
* `SandboxFilesystemIsADirectoryError`：路径指向一个目录。
* `SandboxFilesystemFileTooLargeError`：文件超出读取大小限制。
* `SandboxFilesystemPermissionError`：读取权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### 读取文本

```typescript
async readText(remotePath: string): Promise<string>
```

从沙盒中读取文件并将其内容作为 UTF-8 字符串返回。

`remotePath` 必须是沙盒中文件的绝对路径。

**加薪：**

* `SandboxFilesystemNotFoundError`: 路径不存在。
* `SandboxFilesystemIsADirectoryError`：路径指向一个目录。
* `SandboxFilesystemFileTooLargeError`：文件超出读取大小限制。
* `SandboxFilesystemPermissionError`：读取权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。
### 删除

```typescript
async remove(
  remotePath: string,
  options?: { recursive?: boolean },
): Promise<void>
```

删除沙箱中的文件或目录。

`remotePath` 必须是沙盒中的绝对路径。当`remotePath`
是一个目录，`recursive`是`false`（默认），它被删除
仅当为空时。当`recursive`为`true`时，目录及其所有内容
内容被删除。并非所有安装都支持递归删除 -
`CloudBucketMount` 不支持。

**加薪：**

* `SandboxFilesystemNotFoundError`：路径不存在。
* `SandboxFilesystemDirectoryNotEmptyError`: `recursive` 是 `false` 并且目录不为空。
* `SandboxFilesystemPermissionError`：不允许移除。
* `InvalidError`：安装座不支持该操作。* `SandboxFilesystemError`：命令因任何其他原因失败。

### 统计

```typescript
async stat(remotePath: string): Promise<FileInfo>
```

返回沙箱中单个文件、目录或符号链接的元数据。

`remotePath` 必须是沙盒中的绝对路径。如果 `remotePath` 是
符号链接，返回的 `FileInfo` 描述符号链接本身，而不是
它指向的目标。

**加薪：**

* `SandboxFilesystemNotFoundError`：路径不存在。
* `SandboxFilesystemNotADirectoryError`：路径的非叶组件不是目录。
* `SandboxFilesystemPermissionError`：路径组件不可搜索。
* `SandboxFilesystemError`：命令因任何其他原因失败。

###观看

```typescript
async *watch(
  remotePath: string,
  params: {
    filter?: FileWatchEventType[];
    recursive?: boolean;
    timeoutMs?: number;
  } = {},
): AsyncIterable<FileWatchEvent>
```

观察沙盒中的路径以了解文件系统更改。

`remotePath` 必须是沙盒中的绝对路径。如果它指向一个
文件，报告该文件的事件。如果它指向一个目录，
报告直接位于其中的条目的事件。套装`recursive: true`
还接收所有嵌套子目录的事件。如果 `remotePath` 是
一个符号链接，它遵循已解析的事件引用路径
目标。

当变化发生时产生 `FileWatchEvent` 对象，直到
超时结束、迭代器关闭或沙箱终止。

可以选择将发出的事件类型限制为包含在
`filter`。未定义的 `filter` 允许所有类型；传递一个空数组
抑制所有事件。`timeoutMs` 被截断为整秒。省略它即可无限期观看。
当超时结束时，迭代器将停止而不引发异常。

**加薪：**

* `SandboxFilesystemNotFoundError`: `remotePath` 不存在。
* `SandboxFilesystemPermissionError`：手表访问被拒绝。
* `InvalidError`：文件系统不支持观看。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### 写入字节

```typescript
async writeBytes(
  data: Uint8Array | ArrayBuffer | Buffer,
  remotePath: string,
): Promise<void>
```

将二进制内容写入沙箱中的文件。

`remotePath` 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。

**加薪：**

* `TypeError`：`data` 不是 `Uint8Array`、`ArrayBuffer` 或 `Buffer`。
* `SandboxFilesystemNotADirectoryError`：`remotePath`的父组件不是目录。
* `SandboxFilesystemIsADirectoryError`: `remotePath` 指向一个目录。
* `SandboxFilesystemPermissionError`：写权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### 写文本

```typescript
async writeText(data: string, remotePath: string): Promise<void>
```

将 UTF-8 文本写入沙箱中的文件。

`remotePath` 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。

**加薪：**

* `TypeError`: `data` 不是字符串。
* `SandboxFilesystemNotADirectoryError`：`remotePath`的父组件不是目录。
* `SandboxFilesystemIsADirectoryError`: `remotePath` 指向一个目录。
* `SandboxFilesystemPermissionError`：写权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。