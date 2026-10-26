<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙箱退出快照

<Callout variant="beta">

退出快照不能保证沙盒的文件系统在罕见的硬件故障的情况下得以保留。如果您需要更强的持久性保证，请考虑使用 [Volumes](/docs/guide/volumes)。

</Callout>

退出快照拍摄[文件系统快照](/docs/guide/sandbox-snapshots#filesystem-snapshots)
在正常和不正常的沙箱退出时自动执行，包括
`terminate()`、入口点完成、空闲超时、生命周期到期和 OOM。

当您在沙箱消失后想要文件系统状态时，这非常有用
必须首先自己对文件系统进行快照。典型用途：

* 在空闲超时后恢复代理或编码会话
* 从意外退出的沙盒中恢复工作
* 避免您自己的拆解和飞行中的手动快照之间的竞争

## 用法

通过在创建时设置 `enable_exit_snapshot` 来选择加入
实验选项，然后获取结果[图像](/docs/guide/images)
沙箱退出后：

<CodeTabs>
  {#snippet python()}

```python notest
import modal

app = modal.App.lookup("exit-snapshot-example", create_if_missing=True)

sb = modal.Sandbox.create(
    "bash",
    "-c",
    "echo hello > /tmp/marker.txt",
    app=app,
    experimental_options={"enable_exit_snapshot": True},
)
sb.wait()

image = sb._experimental_get_exit_snapshot()
restored = modal.Sandbox.create(app=app, image=image)
print(restored.filesystem.read_text("/tmp/marker.txt"))  # "hello\n"
restored.terminate()
```

{/片段}
{#snippet javascript()}

```javascript notest
import { ModalClient } from "modal";

const modal = new ModalClient();
const app = await modal.apps.fromName("exit-snapshot-example", {
  createIfMissing: true,
});
const image = modal.images.fromRegistry("python:3.13-slim");

const sb = await modal.sandboxes.create(app, image, {
  command: ["bash", "-c", "echo hello > /tmp/marker.txt"],
  experimentalOptions: { enable_exit_snapshot: true },
});
await sb.wait();

const snapshot = await sb.experimentalGetExitSnapshot();
const restored = await modal.sandboxes.create(app, snapshot);
console.log(await restored.filesystem.readText("/tmp/marker.txt")); // "hello"
await restored.terminate();
```

{/片段}
{#snippet go()}

```go notest
package main

import (
	"context"
	"fmt"

	modal "github.com/modal-labs/modal-client/go"
)

func main() {
	ctx := context.Background()
	mc, _ := modal.NewClient()

	app, _ := mc.Apps.FromName(ctx, "exit-snapshot-example", &modal.AppFromNameParams{
		CreateIfMissing: true,
	})
	image := mc.Images.FromRegistry("python:3.13-slim", nil)

	sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
		Command:             []string{"bash", "-c", "echo hello > /tmp/marker.txt"},
		ExperimentalOptions: map[string]any{"enable_exit_snapshot": true},
	})
	sb.Wait(ctx, nil)

	snapshot, _ := sb.ExperimentalGetExitSnapshot(ctx, nil)
	restored, _ := mc.Sandboxes.Create(ctx, app, snapshot, nil)
	text, _ := restored.Filesystem.ReadText(ctx, "/tmp/marker.txt", nil)
	fmt.Println(text) // "hello"
	restored.Terminate(ctx, nil)
}
```

{/片段} </CodeTabs>

您还可以稍后通过 ID 重新连接到沙盒并获取退出快照
从那个手柄。当创建和恢复发生在
不同的流程：

<CodeTabs>
  {#snippet python()}

```python notest
import modal

app = modal.App.lookup("exit-snapshot-example", create_if_missing=True)

# Process A: create a Sandbox, do work, then let it idle out or terminate.
sb = modal.Sandbox.create(
    app=app,
    experimental_options={"enable_exit_snapshot": True},
)
sb.filesystem.write_text("session state", "/workspace/state.txt")
sandbox_id = sb.object_id
sb.terminate(wait=True)

# Process B: resume from the exit snapshot.
sb = modal.Sandbox.from_id(sandbox_id)
image = sb._experimental_get_exit_snapshot()
sb2 = modal.Sandbox.create(app=app, image=image)
print(sb2.filesystem.read_text("/workspace/state.txt"))  # "session state"
sb2.terminate()
```

{/片段}
{#snippet javascript()}

```javascript notest
// Process A: create a Sandbox, do work, then let it idle out or terminate.
const sb = await modal.sandboxes.create(app, image, {
  experimentalOptions: { enable_exit_snapshot: true },
});
await sb.filesystem.writeText("session state", "/workspace/state.txt");
const sandboxId = sb.sandboxId;
await sb.terminate({ wait: true });

// Process B: resume from the exit snapshot.
const sb1 = await modal.sandboxes.fromId(sandboxId);
const snapshot = await sb1.experimentalGetExitSnapshot();
const sb2 = await modal.sandboxes.create(app, snapshot);
console.log(await sb2.filesystem.readText("/workspace/state.txt")); // "session state"
await sb2.terminate();
```

{/片段}
{#snippet go()}

```go notest
// Process A: create a Sandbox, do work, then let it idle out or terminate.
sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	ExperimentalOptions: map[string]any{"enable_exit_snapshot": true},
})
sb.Filesystem.WriteText(ctx, "session state", "/workspace/state.txt", nil)
sandboxID := sb.SandboxID
sb.Terminate(ctx, &modal.SandboxTerminateParams{Wait: true})

// Process B: resume from the exit snapshot.
sb, _ = mc.Sandboxes.FromID(ctx, sandboxID, nil)
snapshot, _ := sb.ExperimentalGetExitSnapshot(ctx, nil)
sb2, _ := mc.Sandboxes.Create(ctx, app, snapshot, nil)
text, _ := sb2.Filesystem.ReadText(ctx, "/workspace/state.txt", nil)
fmt.Println(text) // "session state"
sb2.Terminate(ctx, nil)
```

{/片段} </CodeTabs>

## 等待快照

获取退出快照长轮询，直到快照到达终端
状态。 timeout 参数控制等待的时间：

|超时 |行为 |
| ---------------- | ---------------------------------------------------------------- ||取消设置（默认）|等待快照成功或失败 |
| `0` |立即检查；如果待处理，则会失败并显示 `TimeoutError` |
| `> 0` |等待指定的持续时间 |

成功时，该方法返回一个 `Image`，您可以使用它来创建新的
沙盒。

## 错误

获取退出快照可能会失败并出现以下错误：

|错误 |当 |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `SnapshotCreationError` |快照创建失败 |
| `TimeoutError` |超时后仍待处理 |
| `InvalidError` |沙盒上未启用退出快照，或超时为负数 |
| `NotFoundError` |沙盒不再存在|

在 Python 中，这些都是 `modal.exception` 类。请注意，`TimeoutError` 是
Modal 自己的类而不是 Python 的内置类，所以一个裸露的 `except TimeoutError`
不会抓住它。

## 保留

退出快照 图像在创建后保留 30 天，与默认为[文件系统快照](/docs/guide/sandbox-snapshots#snapshot-retention)。
之后，尝试使用该图像失败，并显示 `NotFoundError`。

## 限制

* **仅限文件系统。** 退出快照捕获沙箱文件系统，而不是
  内存或目录挂载。
* **仅限主容器。** [Sidecar 容器](/docs/guide/sandbox-sidecars)
  不包括在内。
* **不包括抢占。** GPU 沙箱 [可能在抢占式上运行
  容量](/docs/guide/sandbox-resources#gpu-sandboxes)，以及抢占的
  主机通常不会给沙盒足够的时间来退出
  快照。这仅影响 GPU 沙箱 - CPU 沙箱不受影响
可抢占。如果您依赖 GPU 沙箱的退出快照，也
  [文件系统快照](/docs/guide/sandbox-snapshots#filesystem-snapshots)
  定期。
* **快照失败会丢失沙盒的文件系统状态。** 如果您需要
  定期持久化具有更强的持久性保证的状态，更喜欢
  [卷](/docs/guide/volumes)。