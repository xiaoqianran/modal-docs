<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙箱边车

<Callout variant="beta">

目前存在一些[已知限制](#limitations)。

</Callout>

## 简介

沙箱边车是与主沙箱一起运行的独立容器
同一主机上的容器。它们提供低延迟信任边界，让您
跨容器分割具有不同信任级别的代码。例如，您可以
将凭证、代理或监控保存在主容器的 Sidecar 中
无法直接访问。

由于沙盒及其 Sidecar 运行在同一主机上，因此沙盒之间的通信
它们停留在本地而不是跨越远程服务边界。这使得
边车非常适合：

* 通过运行将代理工具与其执行环境分离
  代理在一个容器中，其工具在另一个容器中调用。请参阅[代理示例](/docs/examples/sidecar_agent)
  对于一般形状。
* 凭证注入，通过在单独的受信任容器中运行代理来实现
  来自主应用程序，并让该代理注入凭据
  或其他秘密，然后再将网络调用传递给外部服务。的
  [凭证代理示例](/docs/examples/sidecar_secrets_injection) 使用
仅在 sidecar 中注入的模态 [Secret](/docs/guide/secrets)。
* 通过[路由沙箱的 HTTPS] 监控和过滤出站流量
  通过代理 Sidecar 的流量](#routing-https-traffic-through-a-sidecar)
  用你自己的规则。 [流量路由示例](/docs/examples/sidecar_traffic_routing)
  显示基于 mitmproxy 的请求过滤器。
* 将复杂的多服务应用程序拆分到单独的容器上，
  例如数据库、缓存或工作进程，类似于 Docker Compose。的
  [Redis 示例](/docs/examples/sidecar_redis) 显示了该模式。

我们仍在探索 Sandbox Sidecar 的所有使用方式 - 如果您
想出另一个用例，请告诉我们！了解更多背景信息
我们构建了 Sidecars，请参阅[Sidecars 发布博文](https://modal.com/blog/introducing-sandbox-sidecars-trust-boundary)。

Sidecars 通过 Sandbox 上的 sidecars 界面进行管理
（Python 中的`_experimental_sidecars`，JS/Go 中的`experimentalSidecars`），
它提供了创建、列出、获取和终止 Sidecar 容器的方法。

每个 Sidecar 容器：

* 独立于主沙盒容器运行自己的映像。
* 与主 Sandbox 容器和其他 Sidecar 容器隔离
与单独沙箱相同的隔离边界：gVisor 或 VM，具体取决于
  沙盒的[运行时](/docs/guide/sandboxes#runtimes)。
* 可以通过内部桥接网络与主沙箱容器进行通信
  和其他边车容器。在我们的基准测试中，沙箱之间的通信
  它的 Sidecar 比独立沙箱之间的速度至少快 3 倍
  同一地区。
* 通过Modal SDK创建，而不是从Sandbox内部创建，因此代码运行
  在主沙盒容器中无法创建或修改它。
* 可以在沙箱的生命周期内动态创建、终止和替换。
  终止沙盒会停止其所有 Sidecar。
* 拥有自己的出站网络策略，独立于主沙盒容器。
* 共享Sandbox的CPU和内存，这使得Sidecars更具成本效益
  而不是在多个沙箱中运行相同的进程。参见
  [资源配置](#resource-configuration)。
* 支持像主沙箱容器一样执行命令。

## 用法

### 创建 Sidecar 容器

主 Sandbox 容器可解析为 `main`，每个 Sidecar 容器
可以通过您在创建时给出的 `name` 来解析。使用 `/etc/hosts` 解析名称，得到
当 sidecar 创建或终止时更新。

<CodeTabs>
{#snippet python()}

```python notest
import modal

app = modal.App.lookup("sidecar-example", create_if_missing=True)
image = modal.Image.debian_slim().build(app)

sb = modal.Sandbox.create("sleep", "600", app=app, image=image, timeout=300)

sidecar = sb._experimental_sidecars.create(
    "python",
    "-m",
    "http.server",
    "8080",
    name="web",
    image=image,
)

# Give the server a moment to start, then call it from the main sandbox.
p = sb.exec(
    "python",
    "-c",
    "import time, urllib.request; time.sleep(1); print(urllib.request.urlopen('http://web:8080').status)",
)
p.wait()
print(p.stdout.read())  # "200"

sb.terminate()
```

{/片段}

{#snippet javascript()}

```javascript notest
import { ModalClient } from "modal";

const modal = new ModalClient();
const app = await modal.apps.fromName("sidecar-example", {
  createIfMissing: true,
});
const image = await modal.images.fromRegistry("python:3.13-slim").build(app);

const sb = await modal.sandboxes.create(app, image, {
  command: ["sleep", "600"],
  timeoutMs: 300 * 1000,
});

const sidecar = await sb.experimentalSidecars.create("web", image, {
  command: ["python", "-m", "http.server", "8080"],
});

// Give the server a moment to start, then call it from the main sandbox.
const p = await sb.exec([
  "python",
  "-c",
  "import time, urllib.request; time.sleep(1); print(urllib.request.urlopen('http://web:8080').status)",
]);
await p.wait();
console.log(await p.stdout.readText()); // "200"

await sb.terminate();
```

{/片段}

{#snippet go()}

```go
package main

import (
	"context"
	"fmt"
	"io"
	"time"

	modal "github.com/modal-labs/modal-client/go"
)

func main() {
	ctx := context.Background()
	mc, _ := modal.NewClient()

	app, _ := mc.Apps.FromName(ctx, "sidecar-example", &modal.AppFromNameParams{
		CreateIfMissing: true,
	})
	image, _ := mc.Images.FromRegistry("python:3.13-slim", nil).Build(ctx, app, nil)

	sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
		Command: []string{"sleep", "600"},
		Timeout: 5 * time.Minute,
	})
	defer sb.Terminate(ctx, nil)

	sidecar, _ := sb.ExperimentalSidecars.Create(ctx, "web", image, &modal.SidecarCreateParams{
		Command: []string{"python", "-m", "http.server", "8080"},
	})
	_ = sidecar

	// Give the server a moment to start, then call it from the main sandbox.
	p, _ := sb.Exec(ctx, []string{
		"python", "-c",
		"import time, urllib.request; time.sleep(1); print(urllib.request.urlopen('http://web:8080').status)",
	}, nil)
	stdout, _ := io.ReadAll(p.Stdout)
	fmt.Println(string(stdout)) // "200"
}
```

{/片段} </CodeTabs>

### 列出和检索 sidecar

您可以列出所有正在运行的 Sidecar 容器或按名称检索特定容器：

<CodeTabs>
{#snippet python()}

```python notest
containers = sb._experimental_sidecars.list()
for container in containers:
    print(f"{container.name}: {container.object_id}")

sidecar = sb._experimental_sidecars.get(name="web")
```

{/片段}

{#snippet javascript()}

```javascript notest
const containers = await sb.experimentalSidecars.list();
for (const container of containers) {
  console.log(`${container.containerName}: ${container.containerId}`);
}

const sidecar = await sb.experimentalSidecars.get("web");
```

{/片段}

{#snippet go()}

```go notest
containers, _ := sb.ExperimentalSidecars.List(ctx, nil)
for _, container := range containers {
	fmt.Printf("%s: %s\n", container.ContainerName, container.ContainerID)
}

sidecar, _ := sb.ExperimentalSidecars.Get(ctx, "web", nil)
_ = sidecar
```

{/片段} </CodeTabs>

### 通过 Sidecar 路由 HTTPS 流量Sidecars 可用于检查来自主沙箱的传出 HTTPS 流量
不同上下文中的容器，例如执行更高级的请求
过滤、检查日志请求或注入主要的秘密
沙盒容器不应具有访问权限。

通常，应用程序需要支持显式代理配置，例如
尊重 `HTTPS_PROXY` 环境变量，通过 Sidecar 路由流量。
要包含来自**代理不知道**应用程序的 HTTPS 流量（端口 443 上的 TCP），您可以
设置路由 **所有** 出站的实验性 `proxy_traffic_via_sidecar` 选项
来自主 Sandbox 容器的 HTTPS 流量通过 Sidecar。

<CodeTabs>
{#snippet python()}

```python notest
sb = modal.Sandbox.create(
    "sleep",
    "600",
    app=app,
    image=image,
    experimental_options={"proxy_traffic_via_sidecar": "my-proxy-sidecar"},
)

# Until this Sidecar is running, HTTPS from the main container is refused.
sb._experimental_sidecars.create("python", "/proxy.py", name="my-proxy-sidecar", image=proxy_image)
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  command: ["sleep", "600"],
  experimentalOptions: { proxy_traffic_via_sidecar: "my-proxy-sidecar" },
});

// Until this Sidecar is running, HTTPS from the main container is refused.
await sb.experimentalSidecars.create("my-proxy-sidecar", proxyImage, {
  command: ["python", "/proxy.py"],
});
```

{/片段}

{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Command:             []string{"sleep", "600"},
	ExperimentalOptions: map[string]any{"proxy_traffic_via_sidecar": "my-proxy-sidecar"},
})
// Until this Sidecar is running, HTTPS from the main container is refused.
sb.ExperimentalSidecars.Create(ctx, "my-proxy-sidecar", proxyImage, &modal.SidecarCreateParams{
	Command: []string{"python", "/proxy.py"},
})
```

{/片段} </CodeTabs>

Sidecar 接收原始 TLS 流并且必须读取目标主机名
来自`ClientHello`的SNI。原来的目的IP没有转发，所以
诸如`SO_ORIGINAL_DST`之类的机制不起作用。读取或重写 HTTP
请求，使用证书颁发机构终止代理中的 TLS
沙盒信任。参见【Sidecar流量路由
示例](/docs/examples/sidecar_traffic_routing) 完整的基于 mitmproxy
请求过滤器。

仅中继到端口 443 的 TCP 流量。沙盒自己的出口控制是
为此预留：沙盒上的`outbound_cidr_allowlist`仍然控制着每一个
其他端口，但无论其列出什么，中继流量都会通过。非中继
流量仍然受到沙箱的出口控制。

相反，中继流量由 Sidecar 的出口控制控制。
转发到. Sidecar的出站网络策略独立于main
容器的并且默认是打开的，所以除非你通过 `outbound_cidr_allowlist`
或`outbound_domain_allowlist`到Sidecar本身，中继流量到达
Sidecar 选择连接到的任何目的地。

该选项不能与设置`block_network`结合使用，
沙盒上的`outbound_domain_allowlist`或`proxy`。

### 模态代理

您可以指定来自 Sidecar 的流量应通过
[Proxy](/docs/guide/proxy-ips) 通过在创建 Sidecar 时传递 `proxy` ，就像
对于沙箱。

### 连接令牌

<Callout variant="info">

Sidecars可以直接连接到主容器上的每个端口，包括
[连接令牌](/docs/guide/sandbox-networking#connecting-to-sandboxes-with-http-and-websockets) 的端口
将请求路由到。 Sidecar 发送到该端口的请求不需要令牌，
并且可以设置任何`X-Verified-User-Data`标头。如果你的服务器在主
容器信任该标头，避免同时使用 Connect Tokens 和 Sidecar
在同一个沙箱中。

</Callout>

### OIDC 代币

与沙箱一样，Sidecar 不会收到 [OIDC](/docs/guide/oidc-integration)
默认情况下的令牌。要选择加入，请在创建时传递 `include_oidc_identity_token=True`
边车。然后，该令牌可通过以下方式在 Sidecar 内使用：
`MODAL_IDENTITY_TOKEN`环境变量。 Sidecar的身份令牌已发行
对于其容器，因此其 `container_id` 声明与相应的 Sandbox 不同。

### 文件系统快照
您可以将正在运行的 Sidecar 的文件系统快照为可重用的映像。的
生成的图像可以在任何接受现有图像的地方使用；例子
下面使用它来启动另一个 Sidecar。快照的范围仅限于该 Sidecar；
它不包括主沙盒文件系统或其他 Sidecar。

<CodeTabs>
{#snippet python()}

```python notest
sidecar.filesystem.write_text("ready", "/tmp/state")
snapshot = sidecar.snapshot_filesystem()

restored = sb._experimental_sidecars.create(
    "sleep", "600", name="restored", image=snapshot
)
assert restored.filesystem.read_text("/tmp/state") == "ready"
```

{/片段}

{#snippet javascript()}

```javascript notest
await sidecar.filesystem.writeText("ready", "/tmp/state");
const snapshot = await sidecar.snapshotFilesystem();

const restored = await sb.experimentalSidecars.create("restored", snapshot, {
  command: ["sleep", "600"],
});
console.assert((await restored.filesystem.readText("/tmp/state")) === "ready");
```

{/片段}

{#snippet go()}

```go notest
_ = sidecar.Filesystem.WriteText(ctx, "ready", "/tmp/state", nil)
snapshot, _ := sidecar.SnapshotFilesystem(ctx, nil)

restored, _ := sb.ExperimentalSidecars.Create(ctx, "restored", snapshot, &modal.SidecarCreateParams{
	Command: []string{"sleep", "600"},
})
state, _ := restored.Filesystem.ReadText(ctx, "/tmp/state", nil)
fmt.Println(state) // "ready"
```

{/片段} </CodeTabs>

### 目录挂载和快照

您可以在正在运行的 Sidecar 中将图像挂载到绝对路径并卸载它之后。您还可以将 Sidecar 目录快照到新镜像中。由此产生的
图像可以在任何接受现有图像的地方使用，包括作为安装
或作为新容器的文件系统。

下面的示例使用已安装的 `/workspace` 作为会话状态，对其进行快照，
终止原始 Sidecar，并将快照挂载到替换的 Sidecar 中
边车：

<CodeTabs>
{#snippet python()}

```python notest
sidecar.mount_image("/workspace", modal.Image.from_scratch())
sidecar.filesystem.write_text("ready", "/workspace/state")

workspace = sidecar.snapshot_directory("/workspace")
sidecar.terminate(wait=True)

replacement = sb._experimental_sidecars.create(
    "sleep", "600", name="replacement", image=image
)
replacement.mount_image("/workspace", workspace)
assert replacement.filesystem.read_text("/workspace/state") == "ready"
replacement.unmount_image("/workspace")
```

{/片段}

{#snippet javascript()}

```javascript notest
await sidecar.mountImage("/workspace");
await sidecar.filesystem.writeText("ready", "/workspace/state");

const workspace = await sidecar.snapshotDirectory("/workspace");
await sidecar.terminate({ wait: true });

const replacement = await sb.experimentalSidecars.create("replacement", image, {
  command: ["sleep", "600"],
});
await replacement.mountImage("/workspace", workspace);
console.assert(
  (await replacement.filesystem.readText("/workspace/state")) === "ready",
);
await replacement.unmountImage("/workspace");
```

{/片段}

{#snippet go()}

```go notest
_ = sidecar.MountImage(ctx, "/workspace", nil, nil)
_ = sidecar.Filesystem.WriteText(ctx, "ready", "/workspace/state", nil)

workspace, _ := sidecar.SnapshotDirectory(ctx, "/workspace", nil)
_, _ = sidecar.Terminate(ctx, &modal.SidecarTerminateParams{Wait: true})

replacement, _ := sb.ExperimentalSidecars.Create(ctx, "replacement", image, &modal.SidecarCreateParams{
	Command: []string{"sleep", "600"},
})
_ = replacement.MountImage(ctx, "/workspace", workspace, nil)
state, _ := replacement.Filesystem.ReadText(ctx, "/workspace/state", nil)
fmt.Println(state) // "ready"
_ = replacement.UnmountImage(ctx, "/workspace", nil)
```

{/片段} </CodeTabs>

### 卷

Sidecar 可以挂载 [Volumes](/docs/guide/volumes)，配置方式与
在沙盒上。每个容器都有自己的安装座。您可以安装相同的卷
在主沙盒和其他 Sidecar 中共享数据。

### 云桶安装座

Sidecar可以挂载[云桶挂载](/docs/guide/cloud-bucket-mounts)，
配置方式与沙盒上相同。每个容器都有自己的挂载：
安装在 Sidecar 中的存储桶在主 Sandbox 容器中不可见，或者
在其他 Sidecar 中，因此将其安装在每个需要它的容器中。云桶
GPU 沙盒的 Sidecar 不支持挂载。

<CodeTabs>
{#snippet python()}

```python notest
bucket = modal.CloudBucketMount(
    "my-bucket",
    secret=modal.Secret.from_name("my-aws-secret"),
    read_only=True,
)

reader = sb._experimental_sidecars.create(
    "sleep", "600", name="reader", image=image, volumes={"/mnt/bucket": bucket}
)
p = reader.exec("ls", "/mnt/bucket")
p.wait()
print(p.stdout.read())
```

{/片段}

{#snippet javascript()}

```javascript notest
const secret = await modal.secrets.fromName("my-aws-secret");

const reader = await sb.experimentalSidecars.create("reader", image, {
  command: ["sleep", "600"],
  cloudBucketMounts: {
    "/mnt/bucket": modal.cloudBucketMounts.create("my-bucket", {
      secret,
      readOnly: true,
    }),
  },
});
const p = await reader.exec(["ls", "/mnt/bucket"]);
await p.wait();
console.log(await p.stdout.readText());
```

{/片段}

{#snippet go()}

```go notest
secret, _ := mc.Secrets.FromName(ctx, "my-aws-secret", nil)
bucket, _ := mc.CloudBucketMounts.New("my-bucket", &modal.CloudBucketMountParams{
	Secret:   secret,
	ReadOnly: true,
})

reader, _ := sb.ExperimentalSidecars.Create(ctx, "reader", image, &modal.SidecarCreateParams{
	Command:           []string{"sleep", "600"},
	CloudBucketMounts: map[string]*modal.CloudBucketMount{"/mnt/bucket": bucket},
})
p, _ := reader.Exec(ctx, []string{"ls", "/mnt/bucket"}, nil)
stdout, _ := io.ReadAll(p.Stdout)
fmt.Println(string(stdout))
```

{/片段} </CodeTabs>

使用 [OIDC 身份验证](/docs/guide/cloud-bucket-mounts#using-oidc-identity-tokens)，
身份令牌是为 Sidecar 容器颁发的，因此其`container_id`
声明与主容器的声明不同。匹配的 IAM 信任策略
完整的主题也必须允许 Sidecar 的容器 ID。

## 资源配置

主Sandbox容器和Sidecar容器共享Sandbox的资源分配（CPU和内存），
并且资源仅在沙箱上配置。当你规划你的
资源分配，确保Sandbox配置了足够的CPU
以及所有容器的内存组合。

例如，如果您想运行具有两个 Sidecar 的沙盒，并且您期望主要
容器使用 1 个 CPU 核心和 512 MiB 内存，Sidecar A 使用 0.5 个 CPU 和 256 MiB，
和 Sidecar B 使用 0.5 CPU 和 256 MiB，您应该将沙箱的资源设置为
至少 2 个 CPU 和 1024 MiB 来容纳所有三个容器。

每个沙箱有 **250** 并发 sidecar 容器的硬性限制，
与资源预留无关。

在gVisor运行时，爆发仍然是可能的；请参阅[沙箱资源指南和
定价](/docs/guide/sandbox-resources) 了解更多详细信息。

在 VM 运行时上，启动 Sandbox 时需要为任何 Sidecar 预留内存。
预留空间是从主 VM 的内存中划分出来的：它以 `memory - reserve` 启动，并且如果
沙箱使用[内存爆发](/docs/guide/sandbox-resources)，永远不会超过`limit - reserve`，
留下边车的储备。该请求必须为主虚拟机留下至少 1024 MiB。与每一个
Sidecar 启动时，您可以指定用于该 Sidecar 的储备量，或者保留
选项为空以使用全部剩余储备：

<CodeTabs>
{#snippet python()}

```python notest
sb = modal.Sandbox.create(
    "sleep",
    "600",
    app=app,
    image=image,
    timeout=300,
    runtime="vm",
    memory=8192,
    experimental_options={"vm_sidecar_memory_reserve_mib": 1024},
)

sidecar = sb._experimental_sidecars.create(
    "python",
    "-m",
    "http.server",
    "8080",
    name="web",
    image=image,
    experimental_memory_reserve_consume_mib=512,
)

# Omit experimental_memory_reserve_consume_mib to give this sidecar
# the remaining reserve (512 MiB here).
worker = sb._experimental_sidecars.create(
    "sleep", "600", name="worker", image=image
)
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  command: ["sleep", "600"],
  timeoutMs: 300 * 1000,
  runtime: "vm",
  memoryMiB: 8192,
  experimentalOptions: { vm_sidecar_memory_reserve_mib: "1024" },
});

const sidecar = await sb.experimentalSidecars.create("web", image, {
  command: ["python", "-m", "http.server", "8080"],
  experimentalMemoryReserveConsumeMiB: 512,
});

// Omit experimentalMemoryReserveConsumeMiB to give this sidecar
// the remaining reserve (512 MiB here).
const worker = await sb.experimentalSidecars.create("worker", image, {
  command: ["sleep", "600"],
});
```

{/片段}

{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Command:             []string{"sleep", "600"},
	Timeout:             5 * time.Minute,
	Runtime:             modal.SandboxRuntimeVM,
	MemoryMiB:           8192,
	ExperimentalOptions: map[string]any{"vm_sidecar_memory_reserve_mib": "1024"},
})

sidecar, _ := sb.ExperimentalSidecars.Create(ctx, "web", image, &modal.SidecarCreateParams{
	Command:                             []string{"python", "-m", "http.server", "8080"},
	ExperimentalMemoryReserveConsumeMiB: 512,
})
_ = sidecar

// Omit ExperimentalMemoryReserveConsumeMiB to give this sidecar
// the remaining reserve (512 MiB here).
worker, _ := sb.ExperimentalSidecars.Create(ctx, "worker", image, &modal.SidecarCreateParams{
	Command: []string{"sleep", "600"},
})
_ = worker
```

{/片段} </CodeTabs>

终止的 VM Sidecar 将返回其预留空间，以供新 Sidecar 重用。

## 限制

主沙箱支持与常规沙箱相同的功能，但某些功能尚不支持
对于边车：

* **仅预构建的图像**：Sidecar 图像必须已经存在：使用 `image.build()` 预构建，a
  [命名图像](/docs/guide/named-images) 通过 `Image.from_name()`，
  通过 `Image.from_id()` 的 ID，或从 [文件系统](/docs/guide/sandbox-snapshots#filesystem-snapshots)/[目录](/docs/guide/sandbox-snapshots#directory-snapshots) 快照创建。懒惰的形象
  Sidecar 不支持构建。另请参阅
  [将图像构建与沙箱创建分开](/docs/guide/sandboxes#separating-image-builds-from-sandbox-creation)。
* **无 stdin/stdout**：Sidecar 的入口点不公开 stdin、stdout 或 stderr 流。
* **GPU 沙箱的限制**：您可以将 Sidecar 连接到具有 GPU 的沙箱，但 Sidecar 仅限 CPU，无法连接 [Cloud Bucket Mounts](/docs/guide/cloud-bucket-mounts)。
* **不支持内存快照**：Sidecar的[文件系统](/docs/guide/sandbox-snapshots#filesystem-snapshots)和[各个目录](/docs/guide/sandbox-snapshots#directory-snapshots)可以独立进行快照，但Sidecar内存状态不能用
  [内存快照](/docs/guide/sandbox-snapshots#memory-snapshots)。
* **Sidecars 绕过 Connect Tokens**：Sidecar 可以直接到达主容器的 Connect Token 端口并设置任何
  `X-Verified-User-Data` 标头。请参阅[连接令牌](#connect-tokens)。
* **不保留对 /etc/hosts 的更改**：`/etc/hosts` 在 sidecar 创建/终止时重写，并且不保留用户更改。