<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙箱

此页面是沙箱的高级指南，
用于在 Modal 上执行不受信任的用户或代理代码的安全容器。

有关 `modal.Sandbox` 接口的参考文档，
请参阅[此页](/docs/sdk/py/latest/Sandbox)。

## 什么是沙箱以及为什么我应该使用它们？

除了Function接口之外，Modal还有一个直接的
用于*在运行时*定义容器并安全地运行任意代码的接口
在他们里面。

例如，如果您想要：

* 执行由语言模型生成的代码。
* 创建隔离环境来运行不受信任的代码。
* 检查 git 存储库并对其运行命令，例如测试套件，或者
  `npm lint`。
* 运行具有任意依赖项和设置脚本的容器。

每个单独的作业称为**沙箱**，可以使用
[`Sandbox.create`](/docs/sdk/py/latest/Sandbox#create) 构造函数：

<CodeTabs>
  {#snippet python()}

```python
sb_app = modal.App.lookup("my-app", create_if_missing=True)
sb = modal.Sandbox.create(app=sb_app)

p = sb.exec("python", "-c", "print('hello')", timeout=3)
print(p.stdout.read())

p = sb.exec("bash", "-c", "for i in {1..10}; do date +%T; sleep 0.5; done", timeout=5)
for line in p.stdout:
    # Avoid double newlines by using end="".
    print(line, end="")

sb.terminate()
sb.detach()
```

{/片段}

{#snippet python\_async()}

```python
sb_app = await modal.App.lookup.aio("my-app", create_if_missing=True)
sb = await modal.Sandbox.create.aio(app=sb_app)

p = await sb.exec.aio("python", "-c", "print('hello')", timeout=3)
print(await p.stdout.read.aio())

p = await sb.exec.aio("bash", "-c", "for i in {1..10}; do date +%T; sleep 0.5; done", timeout=5)
async for line in p.stdout:
    # Avoid double newlines by using end="".
    print(line, end="")

await sb.terminate.aio()
await sb.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
import { ModalClient } from "modal";

const modal = new ModalClient();
const app = await modal.apps.fromName("my-app", {
  createIfMissing: true,
});
const image = modal.images.fromRegistry("python:3.13-slim");

const sb = await modal.sandboxes.create(app, image);

const p = await sb.exec(["python", "-c", "print('hello')"], {
  timeoutMs: 3 * 1000,
});
console.log(await p.stdout.readText());

const p2 = await sb.exec(
  ["bash", "-c", "for i in {1..10}; do date +%T; sleep 0.5; done"],
  { timeoutMs: 5 * 1000 },
);
for await (const line of p2.stdout) {
  process.stdout.write(line);
}

await sb.terminate();
```

{/片段}

{#snippet go()}

```go notest
package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"time"

	modal "github.com/modal-labs/modal-client/go"
)

func main() {
	ctx := context.Background()
	mc, _ := modal.NewClient()

	app, _ := mc.Apps.FromName(ctx, "my-app", &modal.AppFromNameParams{
		CreateIfMissing: true,
	})
	image := mc.Images.FromRegistry("python:3.13-slim", nil)

	sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)
	defer sb.Terminate(ctx, nil)

	p, _ := sb.Exec(ctx, []string{"python", "-c", "print('hello')"}, &modal.SandboxExecParams{
		Timeout: 3 * time.Second,
	})
	stdout, _ := io.ReadAll(p.Stdout)
	fmt.Println(string(stdout))

	p2, _ := sb.Exec(ctx, []string{"bash", "-c", "for i in {1..10}; do date +%T; sleep 0.5; done"}, &modal.SandboxExecParams{
		Timeout: 5 * time.Second,
	})
	io.Copy(os.Stdout, p2.Stdout)
}
```

{/片段} </CodeTabs>
**注意：** 您可以直接使用`python my_script.py`将上面的示例作为脚本运行。这里不需要`modal run`，因为没有[入口点](/docs/guide/apps#entrypoints-for-ephemeral-apps)。

沙盒从外部生成时需要传递 [`App`](/docs/guide/apps)
模态容器的。您可以传入一个常规的 `App` 对象，或者通过名称查找一个
[`App.lookup`](/docs/sdk/py/latest/App#lookup)。 `App.lookup` 上的 `create_if_missing` 标志
如果不存在，将创建一个具有给定名称的 `App` 。

## 生命周期

### 活动

每个沙箱都会经历一系列生命周期事件，因为它从
创作到完成。了解这些事件对于监控很有用，
调试以及构建对沙箱状态变化做出反应的自动化。

生命周期事件按顺序为：

1. **已创建** — 已向 Modal 请求并注册沙盒。在此
   指出 Sandbox 对象存在并具有 ID，但尚未使用任何计算资源
   尚未分配。这是调用`Sandbox.create`后的初始状态。

2. **已安排** — 沙盒已安排给特定工作人员。的
   工作人员现在正在配置沙盒所需的资源（CPU、内存、GPU、
卷等）并准备容器环境。沙盒将
   容器完全初始化后，转换到 **Started**。

3. **开始** — 沙盒的容器已在工作人员上启动，并且
   入口点进程（如果有）正在运行。此时就可以开始执行了
   沙盒内的命令带有`sandbox.exec(...)`。网络隧道和容量
   坐骑处于活动状态。

4. **准备就绪** — 如果[就绪探针](/docs/guide/sandboxes#readiness-probes)
   为沙盒启用，一旦探测成功，就会触发此事件，表明
   沙箱内的服务已完全初始化并准备好接受流量。
   这对于运行 Web 服务器或其他服务的沙箱特别有用
   在处理请求之前需要预热时间。如果就绪探针是
   未配置，将跳过此事件。

5. **完成** — 沙箱已停止运行。这可能会发生在几个人身上
   原因：入口点进程自行退出，沙箱被显式地退出
   终止（通过仪表板或`sandbox.terminate()`），超时或空闲超时
   已达到，或发生内存不足的情况。完成后，不再继续
可以在沙箱内执行命令。您可以详细了解为什么沙盒
   在仪表板中停止运行或通过检查从返回的退出代码
   `sandbox.poll()`。

### 超时

沙箱的默认最长生命周期为 5 分钟。您可以通过传递来更改此设置
`timeout` 长达 24 小时的 `Sandbox.create(...)` 功能。

<CodeTabs>
  {#snippet python()}

```python fixture:sb_app
sb = modal.Sandbox.create(app=sb_app, timeout=10*60)  # 10 minutes
sb.detach()
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
sb = await modal.Sandbox.create.aio(app=sb_app, timeout=10*60)  # 10 minutes
await sb.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  timeoutMs: 10 * 60 * 1000, // 10 minutes
});
sb.detach();
```

{/片段}

{#snippet go()}

```go notest
sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Timeout: 10 * time.Minute,
})
defer sb.Detach()
```

{/片段} </CodeTabs>如果您需要沙盒运行超过 24 小时，我们建议使用
[文件系统快照](/docs/guide/sandbox-snapshots) 保留其状态，
然后使用后续的沙箱从该快照恢复。

### 空闲超时

沙箱也可以在一段时间不活动后自动终止 - 您可以通过设置 `idle_timeout` 参数来做到这一点。如果满足以下任一条件，则沙箱被视为处于活动状态：

1.它有一个正在运行的活动[命令](/docs/guide/sandbox-spawn)（通过[`sb.exec(...)`](/docs/sdk/py/latest/Sandbox#exec)）
2.它的标准输入正在被写入（通过[`sb.stdin.write()`](/docs/sdk/py/latest/Sandbox#stdin)）
3. 它在其中一个[隧道](/docs/guide/tunnels) 上有一个开放的 TCP 连接

### 就绪探针

沙盒启动后，您通常需要在沙盒启动之前运行自定义初始化逻辑
准备使用 - 使用 `git pull` 提取代码，安装依赖项，启动服务器，
编写配置文件或其他未烘焙到映像中的设置。就绪探针
为您提供一种跟踪初始化何时完成的方法，因此您不必构建
轮询或向自己发出信号。 Modal 还使用探测结果为您提供
可观察到此启动阶段通常需要多长时间。

就绪探测是检查 Modal 是否在沙箱内自动运行
可配置的间隔。然后你可以调用`wait_until_ready()`来阻塞，直到探针
成功了。

有两种类型的就绪探针：

* **TCP 探测** — 检查沙箱内的 TCP 端口是否正在接受连接。
  当您的启动逻辑包括启动服务器时，这是最常见的选择。
* **Execprobe** — 在沙箱内运行任意命令，并在以下情况下成功：
  命令退出，状态代码为 0。将此用于任何其他就绪条件：检查
文件存在，验证安装脚本是否已完成，确认依赖关系
  安装等

两种探头类型都接受一个`interval_ms`参数（默认值：100ms）来控制如何
通常会重试该检查，直到成功为止。

#### TCP 就绪探测

当您的 Sandbox 启动服务器并且您想要等到
它正在监听一个端口：

<CodeTabs>
  {#snippet python()}

```python fixture:sb_app
sb = modal.Sandbox.create(
    "python3", "-m", "http.server", "8080",
    readiness_probe=modal.Probe.with_tcp(8080),
    app=sb_app,
)

# Blocks until port 8080 is accepting connections
sb.wait_until_ready()

# The server is now ready — interact with it via tunnels, exec, etc.
sb.terminate()
sb.detach()
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
sb = await modal.Sandbox.create.aio(
    "python3", "-m", "http.server", "8080",
    readiness_probe=modal.Probe.with_tcp(8080),
    app=sb_app,
)

# Blocks until port 8080 is accepting connections
await sb.wait_until_ready.aio()

# The server is now ready — interact with it via tunnels, exec, etc.
await sb.terminate.aio()
await sb.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
import { ModalClient, Probe } from "modal";

const modal = new ModalClient();
const app = await modal.apps.fromName("my-app", { createIfMissing: true });
const image = modal.images.fromRegistry("python:3.13-slim");

const sb = await modal.sandboxes.create(app, image, {
  command: ["python3", "-m", "http.server", "8080"],
  readinessProbe: Probe.withTcp(8080),
});

// Blocks until port 8080 is accepting connections
await sb.waitUntilReady();

// The server is now ready — interact with it via tunnels, exec, etc.
await sb.terminate();
```

{/片段}

{#snippet go()}

```go notest
package main

import (
	"context"
	"time"

	modal "github.com/modal-labs/modal-client/go"
)

func main() {
	ctx := context.Background()
	mc, _ := modal.NewClient()

	app, _ := mc.Apps.FromName(ctx, "my-app", &modal.AppFromNameParams{
		CreateIfMissing: true,
	})
	image := mc.Images.FromRegistry("python:3.13-slim", nil)
	probe, _ := modal.NewTCPProbe(8080, nil)

	sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
		Command:        []string{"python3", "-m", "http.server", "8080"},
		ReadinessProbe: probe,
	})
	defer sb.Detach()

	// Blocks until port 8080 is accepting connections
	sb.WaitUntilReady(ctx, 5*time.Minute)

	// The server is now ready — interact with it via tunnels, exec, etc.
	sb.Terminate(ctx, nil)
}
```

{/片段} </CodeTabs>

#### 执行就绪探测当准备情况取决于 TCP 端口以外的其他因素时，请使用 exec 探针 — 例如
例如，等待文件创建或安装脚本完成：

<CodeTabs>
  {#snippet python()}

```python fixture:sb_app
sb = modal.Sandbox.create(
    "bash", "-c", "sleep 5 && touch /tmp/ready && sleep 3600",
    readiness_probe=modal.Probe.with_exec(
        "sh", "-c", "test -f /tmp/ready",
        interval_ms=250,
    ),
    app=sb_app,
)

# Blocks until "test -f /tmp/ready" exits with code 0
sb.wait_until_ready()

# The sandbox is now ready
p = sb.exec("cat", "/tmp/ready")
sb.terminate()
sb.detach()
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
sb = await modal.Sandbox.create.aio(
    "bash", "-c", "sleep 5 && touch /tmp/ready && sleep 3600",
    readiness_probe=modal.Probe.with_exec(
        "sh", "-c", "test -f /tmp/ready",
        interval_ms=250,
    ),
    app=sb_app,
)

# Blocks until "test -f /tmp/ready" exits with code 0
await sb.wait_until_ready.aio()

# The sandbox is now ready
p = await sb.exec.aio("cat", "/tmp/ready")
await sb.terminate.aio()
await sb.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
import { ModalClient, Probe } from "modal";

const modal = new ModalClient();
const app = await modal.apps.fromName("my-app", { createIfMissing: true });
const image = modal.images.fromRegistry("python:3.13-slim");

const sb = await modal.sandboxes.create(app, image, {
  command: ["bash", "-c", "sleep 5 && touch /tmp/ready && sleep 3600"],
  readinessProbe: Probe.withExec(["sh", "-c", "test -f /tmp/ready"], {
    intervalMs: 250,
  }),
});

// Blocks until "test -f /tmp/ready" exits with code 0
await sb.waitUntilReady();

// The sandbox is now ready
await sb.terminate();
```

{/片段}

{#snippet go()}

```go notest
package main

import (
	"context"
	"time"

	modal "github.com/modal-labs/modal-client/go"
)

func main() {
	ctx := context.Background()
	mc, _ := modal.NewClient()

	app, _ := mc.Apps.FromName(ctx, "my-app", &modal.AppFromNameParams{
		CreateIfMissing: true,
	})
	image := mc.Images.FromRegistry("python:3.13-slim", nil)
	probe, _ := modal.NewExecProbe(
		[]string{"sh", "-c", "test -f /tmp/ready"},
		&modal.ExecProbeParams{Interval: 250 * time.Millisecond},
	)

	sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
		Command:        []string{"bash", "-c", "sleep 5 && touch /tmp/ready && sleep 3600"},
		ReadinessProbe: probe,
	})
	defer sb.Detach()

	// Blocks until "test -f /tmp/ready" exits with code 0
	sb.WaitUntilReady(ctx, 5*time.Minute)

	// The sandbox is now ready
	sb.Terminate(ctx, nil)
}
```

{/片段} </CodeTabs>

**注意：** 就绪探针最多运行 5 分钟。如果探头没有
在该窗口内成功，`wait_until_ready()`将提高
`modal.exception.TimeoutError`。这是 Modal 自己的错误类而不是
内置`TimeoutError`，所以裸露的`except TimeoutError`无法捕获它。探头
超时不会自动终止沙盒 - 您可能想要捕获
如果从未准备就绪，则会出现错误并显式终止沙箱：

<CodeTabs>
  {#snippet python()}

```python notest
try:
    sb.wait_until_ready()
except modal.exception.TimeoutError:
    print("Sandbox failed to become ready")
    sb.terminate()
    sb.detach()
```

{/片段}

{#snippet python\_async()}

```python notest
try:
    await sb.wait_until_ready.aio()
except modal.exception.TimeoutError:
    print("Sandbox failed to become ready")
    await sb.terminate.aio()
    await sb.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
try {
  await sb.waitUntilReady();
} catch (err) {
  console.log("Sandbox failed to become ready");
  await sb.terminate();
}
```

{/片段}

{#snippet go()}

```go notest
if err := sb.WaitUntilReady(ctx, 5*time.Minute); err != nil {
	fmt.Println("Sandbox failed to become ready")
	sb.Terminate(ctx, nil)
}
```

{/片段} </CodeTabs>

如果您在未配置就绪状态的沙箱上调用 `wait_until_ready()`
探针，将引发错误。同样，在沙箱结束后调用它
终止会引发错误。然而，在沙箱之后调用`wait_until_ready()`已经准备好立即返回。

## 返回代码

提供[Unix风格的退出代码](https://tldp.org/LDP/abs/html/exitcodes.html)来帮助诊断成功、手动终止或内存不足等情况。

它们可用于以下两者：

* 沙箱中的进程（通过 [`ContainerProcess.returncode`](/docs/sdk/py/latest/container_process#returncode) / [`ContainerProcess.poll()`](/docs/sdk/py/latest/container_process#poll))
* 沙箱本身（通过 [`Sandbox.returncode`](/docs/sdk/py/latest/Sandbox#returncode) / [`Sandbox.poll()`](/docs/sdk/py/latest/Sandbox#poll))

<CodeTabs>
  {#snippet python()}

```python fixture:sb_app
sb = modal.Sandbox.create(app=sb_app)

# Read returncode of individual process
p = sb.exec("sh", "-c", "exit 42")
p.wait()
print(p.returncode) # 42

# Read returncode of finished sandbox
# Terminate sends a SIGKILL, code 137
sb.terminate(wait=True)
print(sb.returncode) # 137
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
sb = await modal.Sandbox.create.aio(app=sb_app)

# Read returncode of individual process
p = await sb.exec.aio("sh", "-c", "exit 42")
await p.wait.aio()
print(p.returncode) # 42

# Read returncode of finished sandbox
# Terminate sends a SIGKILL, code 137
await sb.terminate.aio(wait=True)
print(sb.returncode) # 137
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image);

// Read returncode of individual process
const p = await sb.exec(["sh", "-c", "exit 42"]);
const returnCode = await p.wait();
console.log(returnCode); // 42

// Read returncode of finished sandbox
// Terminate sends a SIGKILL, code 137
const returnCodeSb = await sb.terminate({ wait: true });
console.log(returnCodeSb); // 137
```

{/片段}
{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)

// Read returncode of individual process
p, _ := sb.Exec(ctx, []string{"sh", "-c", "exit 42"}, nil)
returnCode, _ := p.Wait(ctx)
fmt.Println(returnCode) // 42

// Read returncode of finished sandbox
// Terminate sends a SIGKILL, code 137
returnCodeSb, _ := sb.Terminate(ctx, &modal.SandboxTerminateParams{Wait: true})
fmt.Println(returnCodeSb) // 137
```

{/片段} </CodeTabs>

## 配置

沙箱支持常规 `modal.Function` 中的几乎所有配置选项。
请参阅 [`Sandbox.create`](/docs/sdk/py/latest/Sandbox#create) 了解更多文档
关于沙盒配置。

例如，图像和卷可以像函数一样使用：

<CodeTabs>
  {#snippet python()}

```python fixture:sb_app
sb = modal.Sandbox.create(
    image=modal.Image.debian_slim().pip_install("pandas"),
    volumes={"/data": modal.Volume.from_name("data-volume", create_if_missing=True)},
    app=sb_app,
)
sb.detach()
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
sb = await modal.Sandbox.create.aio(
    image=modal.Image.debian_slim().pip_install("pandas"),
    volumes={"/data": modal.Volume.from_name("data-volume", create_if_missing=True)},
    app=sb_app,
)
await sb.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
const image = modal.images.fromRegistry("python:3.13-slim");
const volume = modal.volumes.fromName("my-volume");
const sb = await modal.sandboxes.create(app, image, {
  volumes: { "/data": volume },
  workdir: "/repo",
});
sb.detach();
```

{/片段}

{#snippet go()}

```go notest
image := mc.Images.FromRegistry("python:3.13-slim", nil)
volume := mc.Volumes.FromName("my-volume", nil)
sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
  Volumes: map[string]*modal.Volume{"/data": volume},
  Workdir: "/repo",
})
defer sb.Detach()
```

{/片段} </CodeTabs>

## 环境

### 环境变量您可以使用内联机密设置环境变量：

<CodeTabs>
  {#snippet python()}

```python fixture:sb_app
secret = modal.Secret.from_dict({"MY_SECRET": "hello"})

sb = modal.Sandbox.create(
    secrets=[secret],
    app=sb_app,
)
p = sb.exec("bash", "-c", "echo $MY_SECRET")
print(p.stdout.read())
sb.detach()
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
secret = modal.Secret.from_dict({"MY_SECRET": "hello"})

sb = await modal.Sandbox.create.aio(
    secrets=[secret],
    app=sb_app,
)
p = await sb.exec.aio("bash", "-c", "echo $MY_SECRET")
print(await p.stdout.read.aio())
await sb.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
const secret = modal.secrets.fromObject({ MY_SECRET: "hello" });
const image = modal.images.fromRegistry("python:3.13-slim");

const sb = await modal.sandboxes.create(app, image, {
  secrets: [secret],
});
const p = await sb.exec(["bash", "-c", "echo $MY_SECRET"]);
console.log(await p.stdout.readText());
sb.detach();
```

{/片段}

{#snippet go()}

```go notest
secret, err := mc.Secrets.FromMap(ctx, map[string]string{"MY_SECRET": "hello"}, nil)
image := mc.Images.FromRegistry("python:3.13-slim", nil)

sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
  Secrets: []*modal.Secret{secret},
})
defer sb.Detach()
p, err := sb.Exec(ctx, []string{"bash", "-c", "echo $MY_SECRET"}, nil)
stdout, err := io.ReadAll(p.Stdout)
fmt.Println(string(stdout))
```

{/片段} </CodeTabs>

### 自定义图像

就像函数一样，沙箱支持[自定义图像](/docs/guide/images)。这些可以使用[方法链接](/docs/guide/images)或通过引用[外部容器注册表中的现有映像](/docs/guide/existing-images)来定义。

#### 将镜像构建与沙箱创建分开

为了避免在重建无效图像时阻止创建新沙箱，
建议使用 Modal 的命名图像和沙箱，而不是使用
内联图像定义。

使用 [`Image.build`](/docs/sdk/py/latest/Image#build) 触发
映像构建作为部署流程的一部分或定期构建（例如，在
[计划作业](/docs/guide/cron) 或 CI 管道），然后将结果发布为
[命名图像](/docs/guide/named-images)

然后沙箱可以使用 [`Image.from_name`](/docs/sdk/py/latest/Image#from_name)
以保证在重建时不会阻塞的方式引用图像。

<CodeTabs>
  {#snippet python()}

```python notest
# build_sandbox_image.py
app = modal.App.lookup("sandbox-app", create_if_missing=True)

# Method-chained image
image = modal.Image.debian_slim().pip_install("pandas")

# Or, for an external registry image with a fixed tag:
# image = modal.Image.from_registry("ubuntu:24.04")

with modal.enable_output():
    image.build(app=app).publish("sandbox-runtime")

# sandbox_app.py
app = modal.App.lookup("sandbox-app", create_if_missing=True)

image = modal.Image.from_name("sandbox-runtime")
modal.Sandbox.create(app=app, image=image)
```

{/片段}

{#snippet python\_async()}

```python notest
# build_sandbox_image.py
app = await modal.App.lookup.aio("sandbox-app", create_if_missing=True)

# Method-chained image
image = modal.Image.debian_slim().pip_install("pandas")

# Or, for an external registry image with a fixed tag:
# image = modal.Image.from_registry("ubuntu:24.04")

with modal.enable_output():
    await image.build.aio(app)
await image.publish.aio("sandbox-runtime")

# app.py
app = await modal.App.lookup.aio("sandbox-app", create_if_missing=True)

image = modal.Image.from_name("sandbox-runtime")
await modal.Sandbox.create.aio(app=app, image=image)
```{/片段}

{#snippet javascript()}

```javascript notest
// build_sandbox_image.ts
const app = await modal.apps.fromName("sandbox-app", {
  createIfMissing: true,
});

const image = modal.images
  .fromRegistry("python:3.13-slim")
  .dockerfileCommands(["RUN pip install pandas"]);

await image.build(app);
await image.publish("sandbox-runtime");

// app.ts
const app = await modal.apps.fromName("sandbox-app", {
  createIfMissing: true,
});

const image = await modal.images.fromName("sandbox-runtime");
await modal.sandboxes.create(app, image);
```

{/片段}

{#snippet go()}

```go notest
// build_sandbox_image.go
app, err := mc.Apps.FromName(ctx, "sandbox-app", &modal.AppFromNameParams{
	CreateIfMissing: true,
})

image := mc.Images.FromRegistry("python:3.13-slim", nil).
	DockerfileCommands([]string{"RUN pip install pandas"}, nil)

builtImage, err := image.Build(ctx, app, nil)
err = builtImage.Publish(ctx, "sandbox-runtime", nil)

// app.go
app, err = mc.Apps.FromName(ctx, "sandbox-app", &modal.AppFromNameParams{
	CreateIfMissing: true,
})

image, err = mc.Images.FromName(ctx, "sandbox-runtime", nil)
sb, err := mc.Sandboxes.Create(ctx, app, image, nil)
defer sb.Detach()
```

{/片段} </CodeTabs>

<Callout variant="info">

* **Modal 在拉取后将外部图像标签视为不可变。** 对于 [外部注册表](/docs/guide/existing-images) 图像，`Image.build` 始终返回缓存版本 - Modal 不会检测对可变标签（如 `:latest`）的上游更改。
* 要获取新版本的外部注册表映像，请更新部署脚本中的标签（例如，`ubuntu:24.04` → `ubuntu:24.04-20240523`）。

</Callout>

#### 镜像构建日志

您可能需要手动启用输出流才能查看映像构建日志：

<CodeTabs>
{#snippet python()}

```python fixture:sb_app
image = modal.Image.debian_slim().pip_install("pandas", "numpy")

with modal.enable_output():
    sb = modal.Sandbox.create(image=image, app=sb_app)
sb.detach()
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
image = modal.Image.debian_slim().pip_install("pandas", "numpy")

with modal.enable_output():
    sb = await modal.Sandbox.create.aio(image=image, app=sb_app)
await sb.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
const image = modal.images
  .fromRegistry("python:3.13-slim")
  .dockerfileCommands(["RUN pip install pandas numpy"]);

const sb = await modal.sandboxes.create(app, image);
sb.detach();
```

{/片段}

{#snippet go()}

```go notest
image := mc.Images.FromRegistry("python:3.13-slim", nil).
  DockerfileCommands([]string{"RUN pip install pandas numpy"}, nil)

// Note: Image build logs are automatically streamed in Go
sb, err := mc.Sandboxes.Create(ctx, app, image, nil)
defer sb.Detach()
```

{/片段} </CodeTabs>

## 使用入口点运行沙箱

在大多数情况下，沙箱被视为可以运行任意命令的通用容器
命令。但是，在某些情况下，您可能想要运行单个命令或脚本
作为沙盒的入口点。您可以通过将命令参数传递给
沙箱构造函数：

<CodeTabs>
  {#snippet python()}

```python fixture:sb_app
sb = modal.Sandbox.create("python", "-m", "http.server", "8080", app=sb_app, timeout=10)
for line in sb.stdout:
    print(line, end="")
sb.detach()
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
sb = await modal.Sandbox.create.aio("python", "-m", "http.server", "8080", app=sb_app, timeout=10)
async for line in sb.stdout:
    print(line, end="")
await sb.detach.aio()
```

{/片段}{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  command: ["python", "-m", "http.server", "8080"],
  timeoutMs: 10 * 1000,
});
sb.detach();
```

{/片段}

{#snippet go()}

```go notest
sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
  Command: []string{"python", "-m", "http.server", "8080"},
  Timeout: 10 * time.Second,
})
sb.Detach()
```

{/片段} </CodeTabs>

此功能对于运行您想要的长期服务最有用
继续在后台运行。请参阅我们的 [Jupyter 笔记本示例](/docs/examples/jupyter_sandbox)
更具体的例子。

## 从其他代码引用沙箱

如果您有正在运行的沙箱，则可以使用 `from_id` 方法检索它。

<CodeTabs>
  {#snippet python()}

```python fixture:sb_app
sb = modal.Sandbox.create(app=sb_app)
sb_id = sb.object_id
sb.detach()

# ... later in the program ...

sb2 = modal.Sandbox.from_id(sb_id)
p = sb2.exec("echo", "hello")
print(p.stdout.read())
sb2.terminate()
sb2.detach()
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
sb = await modal.Sandbox.create.aio(app=sb_app)
sb_id = sb.object_id
await sb.detach.aio()

# ... later in the program ...

sb2 = await modal.Sandbox.from_id.aio(sb_id)
p = await sb2.exec.aio("echo", "hello")
print(await p.stdout.read.aio())
await sb2.terminate.aio()
await sb2.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image);
const sbId = sb.sandboxId;
await sb.detach();

// ... later in the program ...

const sb2 = await modal.sandboxes.fromId(sbId);
const p = await sb2.exec(["echo", "hello"]);
console.log(await p.stdout.readText());
await sb2.terminate();
```

{/片段}

{#snippet go()}

```go notest
sb, err := mc.Sandboxes.Create(ctx, app, image, nil)
defer sb.Detach()
sbId := sb.SandboxID

// ... later in the program ...

sb2, err := mc.Sandboxes.FromID(ctx, sbId)
defer sb2.Terminate(ctx, nil)
p, err := sb2.Exec(ctx, []string{"echo", "hello"}, nil)
stdout, err := io.ReadAll(p.Stdout)
fmt.Println(string(stdout))
```

{/片段} </CodeTabs>
一个常见的用例是保持沙箱池可用于执行任务
当它们进来时。您可以保留“开放”沙箱的`object_id`列表，并且
重用它们，在使用它们的任何函数中关闭`object_id`。

## 命名沙箱

您可以在创建沙箱时为其指定名称。每个名称在应用程序中必须是唯一的 -
一次只有一个“正在运行”的沙箱可以使用给定名称。请注意，关联的应用程序必须是
已部署的应用程序。一旦沙箱完全停止运行，其名称就可以重复使用。一些应用程序发现沙箱名称对于确保不超过一个沙箱是有用的。
每个资源或项目运行。如果具有给定名称的沙箱已在运行，`create()`
会引发错误。

<CodeTabs>
  {#snippet python()}

```python notest
sb1 = modal.Sandbox.create(app=sb_app, name="my-name")
# This will raise a modal.exception.AlreadyExistsError.
sb2 = modal.Sandbox.create(app=sb_app, name="my-name")
```

{/片段}

{#snippet python\_async()}

```python notest
sb1 = await modal.Sandbox.create.aio(app=sb_app, name="my-name")
# This will raise a modal.exception.AlreadyExistsError.
sb2 = await modal.Sandbox.create.aio(app=sb_app, name="my-name")
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb1 = await modal.sandboxes.create(app, image, { name: "my-name" });
// this will raise an AlreadyExistsError
const sb2 = await modal.sandboxes.create(app, image, { name: "my-name" });
```

{/片段}

{#snippet go()}

```go notest
sb1, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
  Name: "my-name",
})
// this will return an error
sb2, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
  Name: "my-name",
})
```

{/片段} </CodeTabs>

可以使用 `from_name()` *但只能从已部署的应用程序中获取指定的沙箱
如果沙盒当前正在运行*。如果没有找到正在运行的沙箱，`from_name()`将引发
一个错误。

<CodeTabs>
  {#snippet python()}

```python notest
sb_app = modal.App.lookup("my-app", create_if_missing=True)
sb1 = modal.Sandbox.create(app=sb_app, name="my-name")
# Returns the currently running Sandbox with the name "my-name" from the
# deployed App named "my-app".
sb2 = modal.Sandbox.from_name("my-app", "my-name")
assert sb1.object_id == sb2.object_id # sb1 and sb2 refer to the same Sandbox
sb1.detach()
sb2.detach()
```

{/片段}

{#snippet python\_async()}

```python notest
sb_app = await modal.App.lookup.aio("my-app", create_if_missing=True)
sb1 = await modal.Sandbox.create.aio(app=sb_app, name="my-name")
# Returns the currently running Sandbox with the name "my-name" from the
# deployed App named "my-app".
sb2 = await modal.Sandbox.from_name.aio("my-app", "my-name")
assert sb1.object_id == sb2.object_id # sb1 and sb2 refer to the same Sandbox
await sb1.detach.aio()
await sb2.detach.aio()
```
{/片段}

{#snippet javascript()}

```javascript notest
const app = await modal.apps.fromName("my-app", { createIfMissing: true });
const sb1 = await modal.sandboxes.create(app, image, { name: "my-name" });
// returns the currently running Sandbox with the name "my-name" from the
// deployed App named "my-app".
const sb2 = await modal.sandboxes.fromName("my-app", "my-name");
console.assert(sb1.sandboxId === sb2.sandboxId); // sb1 and sb2 refer to the same Sandbox
sb1.detach();
sb2.detach();
```

{/片段}

{#snippet go()}

```go notest
app, err := mc.Apps.FromName(ctx, "my-app", &modal.AppFromNameParams{
  CreateIfMissing: true,
})
sb1, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
  Name: "my-name",
})
// returns the currently running Sandbox with the name "my-name" from the
// deployed App named "my-app".
sb2, err := mc.Sandboxes.FromName(ctx, "my-app", "my-name", nil)
// sb1 and sb2 refer to the same Sandbox
fmt.Println(sb1.SandboxID == sb2.SandboxID)
defer sb1.Detach()
defer sb2.Detach()
```

{/片段} </CodeTabs>

沙箱名称只能包含字母数字字符、短划线、句点和下划线，并且必须
少于 64 个字符。

## 标记

沙箱还可以用任意键值对进行标记。可以使用这些标签
过滤`Sandbox.list`中的结果。

<CodeTabs>
  {#snippet python()}

```python fixture:sb_app
sandbox_v1_1 = modal.Sandbox.create("sleep", "10", app=sb_app)
sandbox_v1_2 = modal.Sandbox.create("sleep", "20", app=sb_app)

sandbox_v1_1.set_tags({"major_version": "1", "minor_version": "1"})
sandbox_v1_2.set_tags({"major_version": "1", "minor_version": "2"})

for sandbox in modal.Sandbox.list(app_id=sb_app.app_id):  # All sandboxes.
    print(sandbox.object_id)

for sandbox in modal.Sandbox.list(
    app_id=sb_app.app_id,
    tags={"major_version": "1"},
):  # Also all sandboxes.
    print(sandbox.object_id)

for sandbox in modal.Sandbox.list(
    app_id=sb_app.app_id,
    tags={"major_version": "1", "minor_version": "2"},
):  # Just the latest sandbox.
    print(sandbox.object_id)

sandbox_v1_1.detach()
sandbox_v1_2.detach()
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
sandbox_v1_1 = await modal.Sandbox.create.aio("sleep", "10", app=sb_app)
sandbox_v1_2 = await modal.Sandbox.create.aio("sleep", "20", app=sb_app)

await sandbox_v1_1.set_tags.aio({"major_version": "1", "minor_version": "1"})
await sandbox_v1_2.set_tags.aio({"major_version": "1", "minor_version": "2"})

async for sandbox in modal.Sandbox.list.aio(app_id=sb_app.app_id):  # All sandboxes.
    print(sandbox.object_id)

async for sandbox in modal.Sandbox.list.aio(
    app_id=sb_app.app_id,
    tags={"major_version": "1"},
):  # Also all sandboxes.
    print(sandbox.object_id)

async for sandbox in modal.Sandbox.list.aio(
    app_id=sb_app.app_id,
    tags={"major_version": "1", "minor_version": "2"},
):  # Just the latest sandbox.
    print(sandbox.object_id)

await sandbox_v1_1.detach.aio()
await sandbox_v1_2.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
const sandboxV1_1 = await modal.sandboxes.create(app, image, {
  command: ["sleep", "10"],
});
const sandboxV1_2 = await modal.sandboxes.create(app, image, {
  command: ["sleep", "20"],
});

await sandboxV1_1.setTags({ major_version: "1", minor_version: "1" });
await sandboxV1_2.setTags({ major_version: "1", minor_version: "2" });

// All sandboxes.
for await (const sandbox of modal.sandboxes.list({ appId: app.appId })) {
  console.log(sandbox.sandboxId);
}

// Also all sandboxes.
for await (const sandbox of modal.sandboxes.list({
  appId: app.appId,
  tags: { major_version: "1" },
})) {
  console.log(sandbox.sandboxId);
}

// Just the latest sandbox.
for await (const sandbox of modal.sandboxes.list({
  appId: app.appId,
  tags: { major_version: "1", minor_version: "2" },
})) {
  console.log(sandbox.sandboxId);
}
sandboxV1_1.detach();
sandboxV1_2.detach();
```

{/片段}

{#snippet go()}

```go notest
sandboxV1_1, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
  Command: []string{"sleep", "10"},
})
sandboxV1_2, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
  Command: []string{"sleep", "20"},
})
defer sandboxV1_1.Detach()
defer sandboxV1_2.Detach()

sandboxV1_1.SetTags(ctx, map[string]string{"major_version": "1", "minor_version": "1"})
sandboxV1_2.SetTags(ctx, map[string]string{"major_version": "1", "minor_version": "2"})

// All sandboxes.
it, _ := mc.Sandboxes.List(ctx, &modal.SandboxListParams{
  AppID: app.AppID,
})
for sandbox := range it {
  fmt.Println(sandbox.SandboxID)
}

// Also all sandboxes.
it, _ = mc.Sandboxes.List(ctx, &modal.SandboxListParams{
  AppID: app.AppID,
  Tags:  map[string]string{"major_version": "1"},
})
for sandbox := range it {
  fmt.Println(sandbox.SandboxID)
}

// Just the latest sandbox.
it, _ = mc.Sandboxes.List(ctx, &modal.SandboxListParams{
  AppID: app.AppID,
  Tags:  map[string]string{"major_version": "1", "minor_version": "2"},
})
for sandbox := range it {
  fmt.Println(sandbox.SandboxID)
}
```

{/片段} </CodeTabs>

## 清理客户端连接与其他模态对象不同，本地沙箱将直接连接到
它的计算基板。虽然这个连接应该自动关闭
在垃圾收集期间，我们建议显式清理资源
一旦您通过调用沙箱的 `detach()` 方法完成与沙箱的交互：

<CodeTabs>
  {#snippet python()}

```python fixture:sb_app
sb = modal.Sandbox.create(app=sb_app)
sb.detach()
```

{/片段}

{#snippet python\_async()}

```python fixture:sb_app
sb = await modal.Sandbox.create.aio(app=sb_app)
await sb.detach.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image);
sb.detach();
```

{/片段}

{#snippet go()}

```go notest
sb, err := mc.Sandboxes.Create(ctx, app, image, nil)
defer sb.Detach()
```

{/片段} </CodeTabs>

调用`detach`后，任何使用Sandbox对象的操作都不能保证
工作。如果您想继续与正在运行的沙箱交互，请使用 `Sandbox.from_id`
获取引用原始 Sandbox 的新 Sandbox 对象。在Python SDK中，
`terminate` 会保留您的沙盒，因此我们建议您在完成后致电 `detach`
已终止的沙箱已完成。在Go/JS SDK中，`Terminate`也会分离
你的沙盒。