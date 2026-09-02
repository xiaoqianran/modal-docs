<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙箱边车

<Callout variant="alpha">

目前存在一些[已知限制](#limitations)。

</Callout>

## 简介

沙箱边车让您可以在主容器旁边运行其他容器
沙箱容器，位于同一主机上。沙箱和它的 sidecar 是相连的
通过内部桥接网络，允许之间的低延迟通信
基于 TCP/UDP 的容器，使其非常适合：

* 通过运行将代理工具与其执行环境分离
  一个容器中的代理及其工具在另一个容器中调用
* 凭证注入，通过在单独的受信任容器中运行代理来实现
  来自主应用程序，并让该代理注入凭据或
  在将网络调用传递给外部服务之前的其他秘密。
  请参阅[秘密注入示例](/docs/examples/sidecar_secrets_injection)
  进行工作演示
* 将复杂的多服务应用程序拆分到单独的容器上，
  例如数据库、缓存或工作进程，类似于 Docker Compose。

我们仍在探索 Sandbox Sidecar 的所有使用方式 - 如果您
想出另一个用例，请告诉我们！
Sidecars 通过 Sandbox 上的 sidecars 界面进行管理
（Python 中的`_experimental_sidecars`，JS/Go 中的`experimentalSidecars`），
它提供了创建、列出、获取和终止 Sidecar 容器的方法。

每个 Sidecar 容器：

* 独立于主沙盒容器运行自己的映像。
* 在与主 Sandbox 容器和其他 Sidecar 容器隔离的单独沙盒进程中运行。
* 可以通过内部桥接网络与主 Sandbox 容器和其他 Sidecar 容器进行通信。
* 可以在沙箱的生命周期内动态创建、终止和替换。* 支持像主沙箱容器一样执行命令。

## 用法

### 创建 Sidecar 容器

主 Sandbox 容器可解析为 `main`，每个 Sidecar 容器
可以通过您在创建时给出的 `name` 来解析。

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

名称使用 `/etc/hosts` 进行解析，当创建或终止 sidecar 时，它会更新。

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

### 通过 Sidecar 路由 HTTPS 流量

Sidecars 可用于检查来自主沙箱的传出 HTTPS 流量
不同上下文中的容器，例如执行更高级的请求
过滤、检查日志请求或注入主要的秘密
沙盒容器不应具有访问权限。

通常，应用程序需要支持显式代理配置，例如尊重 `HTTPS_PROXY` 环境变量，通过 Sidecar 路由流量。
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

仅中继到端口 443 的 TCP 流量。此流量不受其他流量影响
沙盒上的出口控制，例如 `outbound_cidr_allowlist` 或
[代理](/docs/guide/proxy-ips)。非中继流量仍受
沙箱的出口控制。该选项不能与设置结合使用
沙盒上的`block_network`或`outbound_domain_allowlist`。

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

## 资源配置

主Sandbox容器和Sidecar容器共享Sandbox的资源分配（CPU和内存），
并且资源仅在沙箱上配置。当你规划你的
资源分配，确保Sandbox配置了足够的CPU
以及所有容器的内存组合。
爆破还是有可能的，参见【沙盒资源指南和
定价](/docs/guide/sandbox-resources) 了解更多详细信息。

例如，如果您想运行具有两个 Sidecar 的沙盒，并且您期望主要
容器使用 1 个 CPU 核心和 512 MiB 内存，Sidecar A 使用 0.5 个 CPU 和 256 MiB，
和 Sidecar B 使用 0.5 CPU 和 256 MiB，您应该将沙箱的资源设置为
至少 2 个 CPU 和 1024 MiB 来容纳所有三个容器。

您可以创建的 Sidecar 的最大数量也取决于主沙箱的
资源预留。每个容器（包括主容器）至少需要
32 mCPU 和 32 MiB 内存，因此限制为：

```
max containers = min(cpu_in_milli / 32, memory_in_mib / 32)
```

每个沙箱还存在 **250** 并发 sidecar 容器的硬性限制，
与资源预留无关。

## 限制

主沙箱支持与常规沙箱相同的功能，但某些功能尚不支持
对于边车：
* **仅预构建图像**：Sidecar 图像必须使用 `image.build()` 预构建，参考
  通过 `Image.from_id()` 通过 ID 或通过 `Image.from_name()` 通过名称，或从文件系统/目录快照创建。懒惰的形象
  Sidecar 不支持构建。另请参阅[将映像构建与沙箱创建分开](/docs/guide/sandboxes#separating-image-builds-from-sandbox-creation)。
* **不支持云桶安装**：Sidecar 容器当前不支持附加 [云桶安装](/docs/guide/cloud-bucket-mounts)。
* **不支持内存快照**：Sidecar 的文件系统可以进行快照
  独立，但 Sidecar 内存状态不会被捕获
  [沙盒快照](/docs/guide/sandbox-snapshots)。
* **VM 不兼容**：Sidecar 与 VM Sandbox 不兼容。
* **不保留对 /etc/hosts 的更改**：`/etc/hosts` 在 sidecar 创建/终止时重写，并且不保留用户更改。
* **最多 250 个并发 sidecar**：一个沙箱最多可以同时运行 250 个 sidecar 容器。
* **不支持 [Proxy](/docs/guide/proxy-ips)**：来自 Sidecar 的流量不会通过代理退出。