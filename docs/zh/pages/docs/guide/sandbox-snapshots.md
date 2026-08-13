<!-- modal-docs: machine-translated zh-CN from English source -->

# 快照

沙箱支持快照，允许您保存沙箱的状态
并稍后恢复。这对于：

* 减少启动延迟
* 创建自定义环境供您的沙箱运行
* 备份沙箱的状态以进行调试
* 以相同的初始状态运行大规模实验
* 分支沙箱的状态以独立测试不同的代码更改

Modal 目前支持三种不同类型的 Sandbox 快照：

1. [文件系统快照](#filesystem-snapshots)
2. [目录快照](#directory-snapshots)
3. [内存快照](#memory-snapshots)

## 快照保留

不同的快照类型有不同的保留策略：

|快照类型|默认保留期限 |
| ------------------- | ------------------------ |
|文件系统快照 |创建后 30 天 |
|目录快照 |创建后 30 天 |
|内存快照|创建后 7 天 |

<Callout variant="warning">
**v1.5 (Python) / v0.8.0 (Go/JS) 中的重大更改：** 文件系统快照现在默认为 30 天 TTL。以前，文件系统快照无限期保留，目录快照已默认为 30 天。 `snapshot_filesystem()` 和 `snapshot_directory()` 现在都接受显式 TTL 参数，您可以使用该参数覆盖默认值，包括选择完全退出过期。

</Callout>

文件系统快照和目录快照是[Images](/docs/sdk/py/latest/Image)，并在其 TTL 过期（默认为 30 天）后自动进行垃圾收集。您可以在创建快照时配置自定义 TTL，或选择完全退出过期状态以无限期保留快照。内存快照在创建后 7 天后过期，目前无法延期。

以下是为每种快照类型配置自定义 TTL 的方法：

<CodeTabs>
  {#snippet python()}

```python notest
# Filesystem snapshot with custom TTL of 7 days
image = sb.snapshot_filesystem(ttl=7 * 24 * 3600)

# Filesystem snapshot with no expiry (retain indefinitely, like the pre-v1.5 default)
image = sb.snapshot_filesystem(ttl=None)

# Directory snapshot with custom TTL of 7 days
snapshot = sb.snapshot_directory("/project", ttl=7 * 24 * 3600)

# Directory snapshot with no expiry
snapshot = sb.snapshot_directory("/project", ttl=None)
```

{/片段}
{#snippet javascript()}

```javascript notest
// Filesystem snapshot with custom TTL of 7 days
let image = await sb.snapshotFilesystem({ ttlMs: 7 * 24 * 3600 * 1000 });

// Filesystem snapshot with no expiry (retain indefinitely, like the pre-v0.8.0 default)
image = await sb.snapshotFilesystem({ ttlMs: null });

// Directory snapshot with custom TTL of 7 days
let snapshot = await sb.snapshotDirectory("/project", {
  ttlMs: 7 * 24 * 3600 * 1000,
});

// Directory snapshot with no expiry
snapshot = await sb.snapshotDirectory("/project", { ttlMs: null });
```

{/片段}
{#snippet go()}

```go notest
// Filesystem snapshot with custom TTL of 7 days
image, _ := sb.SnapshotFilesystem(ctx, &modal.SandboxSnapshotFilesystemParams{
    TTL: 7 * 24 * time.Hour,
})

// Filesystem snapshot with no expiry (retain indefinitely, like the pre-v0.8.0 default)
image, _ = sb.SnapshotFilesystem(ctx, &modal.SandboxSnapshotFilesystemParams{
    TTL: modal.NoExpiryTTL,
})

// Directory snapshot with custom TTL of 7 days
snapshot, _ := sb.SnapshotDirectory(ctx, "/project", &modal.SandboxSnapshotDirectoryParams{
    TTL: 7 * 24 * time.Hour,
})

// Directory snapshot with no expiry
snapshot, _ = sb.SnapshotDirectory(ctx, "/project", &modal.SandboxSnapshotDirectoryParams{
    TTL: modal.NoExpiryTTL,
})
```

{/片段} </CodeTabs>
如果您尝试使用过期的快照，Modal 将在将映像安装到正在运行的沙箱中时立即引发 `NotFoundError`，或者在从过期映像启动新沙箱时首次交互（例如 `exec` 或 `wait`）。请注意，`Image.from_id()`本身是惰性的，即使提供的图像ID已被删除，也不会在构造时引发错误。

要管理长期快照的存储，您可以在不再需要时以编程方式删除它们。有关详细信息，请参阅[删除快照](#deleting-snapshots)。

## 文件系统快照

文件系统快照是沙箱文件系统在给定时间点的副本。
这些快照是[图像](/docs/sdk/py/latest/Image)，可用于创建
新沙箱。

要创建文件系统快照，您可以使用
[`Sandbox.snapshot_filesystem()`](/docs/sdk/py/latest/Sandbox#snapshot_filesystem) 方法：

```python notest
import modal

app = modal.App.lookup("sandbox-fs-snapshot-test", create_if_missing=True)

sb = modal.Sandbox.create(app=app)
p = sb.exec("bash", "-c", "echo 'test' > /test")
p.wait()
assert p.returncode == 0, "failed to write to file"
image = sb.snapshot_filesystem()
sb.terminate()

sb2 = modal.Sandbox.create(image=image, app=app)
p2 = sb2.exec("bash", "-c", "cat /test")
assert p2.stdout.read().strip() == "test"
```

文件系统快照针对性能进行了优化：它们被计算为差异
来自您的基础映像，因此仅存储修改后的文件。恢复文件系统快照
利用与我们为沙盒快速冷启动相同的基础设施。
请参阅[快照保留](#snapshot-retention)了解 TTL 配置选项，并参阅[删除快照](#deleting-snapshots)了解如何管理快照存储。

## 目录快照

目录快照允许您对正在运行的沙箱中的特定目录进行快照。生成的快照是一个图像，然后可以将其安装到另一个已经运行的沙箱中（通常在稍后的时间），这可用于：

* **独立于应用程序代码更新系统依赖项**：可以通过从更新的基础映像启动新的沙箱，然后安装到之前快照的应用程序代码中来更新基础依赖项。
* **将热池与快照结合使用**：对于受益于沙盒的[热池](/docs/examples/sandbox_pool) 来减少启动延迟的用例，第一次初始化现在可以在热池中进行，而不会失去在以后某个时间点恢复特定于应用程序的代码的能力。
* **加快先前会话的恢复速度**：当容器加载文件时，已安装映像中的文件会被优先考虑，因此与从完整文件系统映像启动相比，安装目录可以加快沙盒恢复速度。

＃＃＃ 用法
使用`snapshot_directory`对目录进行快照，
`mount_image` 在目录路径上挂载以前的目录快照，
和 `unmount_image` 稍后删除已安装的图像。
要使用客户持有的密钥材料保护目录快照，请参阅
[客户提供的加密密钥](/docs/guide/customer-supplied-encryption-keys#directory-snapshots)。

<CodeTabs>
  {#snippet python()}

```python notest
sb = modal.Sandbox.create(app=app)
# Write some dummy data
sb.exec("bash", "-c", "mkdir /project && echo 'data' > /project/file.txt").wait()

# Snapshot the directory
snapshot = sb.snapshot_directory("/project")

# Ok to throw away the old Sandbox at this point
sb.terminate()

# Mount the snapshot in a new Sandbox
sb2 = modal.Sandbox.create(app=app)
try:
    sb2.mount_image("/project", snapshot)
except modal.exception.NotFoundError:
    # Handle a potential ttl expiry of the old snapshot here
    ...

# The Sandbox now has access to the previous project state
assert sb2.exec("cat", "/project/file.txt").stdout.read().strip() == "data"

```

{/片段}
{#snippet javascript()}

```javascript notest
import { NotFoundError } from "modal";

const sb = await modal.sandboxes.create(app, image);
// Write some dummy data
const p = await sb.exec([
  "bash",
  "-c",
  "mkdir /project && echo 'data' > /project/file.txt",
]);
await p.wait();

// Snapshot the directory
const snapshot = await sb.snapshotDirectory("/project");

// Ok to throw away the old Sandbox at this point
await sb.terminate();
sb.detach();

// Mount the snapshot in a new Sandbox
const sb2 = await modal.sandboxes.create(app, image);
try {
  await sb2.mountImage("/project", snapshot);
} catch (e) {
  if (e instanceof NotFoundError) {
    // Handle a potential ttl expiry of the old snapshot here
  }
}

// The Sandbox now has access to the previous project state
const p2 = await sb2.exec(["cat", "/project/file.txt"]);
console.assert((await p2.stdout.readText()).trim() === "data");
sb2.detach();
```

{/片段}
{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)
defer sb.Detach()

// Write some dummy data
p, _ := sb.Exec(ctx, []string{"bash", "-c", "mkdir /project && echo 'data' > /project/file.txt"}, nil)
p.Wait(ctx, nil)

// Snapshot the directory
snapshot, _ := sb.SnapshotDirectory(ctx, "/project", nil)

// Ok to throw away the old Sandbox at this point
sb.Terminate(ctx, nil)

// Mount the snapshot in a new Sandbox
sb2, _ := mc.Sandboxes.Create(ctx, app, image, nil)
defer sb2.Detach()

if err := sb2.MountImage(ctx, "/project", snapshot, nil); err != nil {
  var notFound modal.NotFoundError
  if errors.As(err, &notFound) {
    // Handle a potential ttl expiry of the old snapshot here
  }
}

// The Sandbox now has access to the previous project state
p2, _ := sb2.Exec(ctx, []string{"cat", "/project/file.txt"}, nil)
stdout, _ := io.ReadAll(p2.Stdout)
fmt.Println(strings.TrimSpace(string(stdout))) // "data"
```

{/片段} </CodeTabs>

### 卸载已安装的映像

要卸载以前安装的映像，在您传递到 `mount_image` 的确切路径上调用 `unmount_image`。
卸载后，该路径下的底层沙盒文件系统再次可见。

<CodeTabs>
  {#snippet python()}

```python notest
sb2.unmount_image("/project")
```

{/片段}
{#snippet javascript()}

```javascript notest
await sb2.unmountImage("/project");
```

{/片段}
{#snippet go()}

```go notest
_ = sb2.UnmountImage(ctx, "/project", nil)
```

{/片段} </CodeTabs>

## 内存快照

<Callout variant="alpha">

目前存在许多已知的[限制](#limitations)。

</Callout>

沙箱内存快照是沙箱整个状态的副本，包括内存中和文件系统上的状态。稍后可以恢复这些快照以创建新的沙箱，它是原始沙箱的精确克隆。
要对 Sandbox 进行快照，请创建它并将 `_experimental_enable_snapshot` 设置为 `True`，然后使用 `_experimental_snapshot` 方法，该方法返回一个 `SandboxSnapshot` 对象：

```python notest
image = modal.Image.debian_slim().apt_install("curl", "procps")
app = modal.App.lookup("sandbox-snapshot", create_if_missing=True)

with modal.enable_output():
    sb = modal.Sandbox.create(
        "python3", "-m", "http.server", "8000",
        app=app, image=image, _experimental_enable_snapshot=True
    )

print(f"Performing snapshot of {sb.object_id} ...")
snapshot = sb._experimental_snapshot()
```

使用 `Sandbox._experimental_from_snapshot` 从返回的 SandboxSnapshot 创建一个新的 Sandbox：

```python notest
print(f"Restoring from snapshot {sb.object_id} ...")
sb2 = modal.Sandbox._experimental_from_snapshot(snapshot)

print("Let's see that the http.server is still running...")
p = sb2.exec("ps", "aux")
print(p.stdout.read())

# Talk to snapshotted Sandbox http.server
p = sb2.exec("curl", "http://localhost:8000/")
reply = p.stdout.read()
print(reply)  # <!DOCTYPE HTML><html lang...
```

新沙箱将是原始沙箱的副本。所有正在运行的进程仍将运行，处于与快照时相同的状态，并且对文件系统所做的任何更改都将可见。

您可以使用 `snapshot.object_id` 检索任何沙盒快照的 ID。要通过 ID 从快照恢复，请首先使用 `SandboxSnapshot.from_id` 对快照进行再水合，然后从中恢复：

```python notest
snapshot_id = snapshot.object_id
# ... save the Sandbox ID (sb-123abc) for later
# sometime in the future...
snapshot = modal.SandboxSnapshot.from_id(snapshot_id)
sandbox = modal.Sandbox._experimental_from_snapshot(snapshot)
```

请注意，这些方法是*实验性的*，我们将来可能会更改它们。

### 重新快照

当从“本身”从内存快照创建的沙箱创建新的内存快照时，新快照将继承原始快照的到期日期。
这意味着快照状态的“链”只能变得与该系列中第一个快照的到期日期一样旧。

例如，以下示例中的快照\_2在创建后仅在3天内有效：

```python notest
sandbox_1 = modal.Sandbox.create(_experimental_enable_snapshot=True)

# snapshot_1 has a lifetime of 7 days from creation
snapshot_1 = sandbox_1._experimental_snapshot()

# 4 days later we do a restore + snapshot from snapshot_1
print(f"Restoring from snapshot {snapshot_1.object_id} ...")
sandbox_2 = modal.Sandbox._experimental_from_snapshot(snapshot_1)
snapshot_2 = sandbox_2._experimental_snapshot()
# snapshot_2 now has a lifetime of 7 - 4 = 3 days from creation
```

### 限制
* 沙箱内存快照在创建后 7 天后过期（请参阅[快照保留](#snapshot-retention)）。对于更持久的快照，请尝试[文件系统快照](#filesystem-snapshots)。
* 拍摄快照时，打开的 TCP 连接将自动关闭，并且在恢复快照时需要重新打开。
* 对沙盒进行快照目前将导致其终止。我们打算尽快取消此限制。
* 使用 `_experimental_enable_snapshot=True` 创建的沙箱或从快照恢复的沙箱无法在 GPU 上运行。
* 当 `Sandbox.exec` 命令仍在运行时，无法对沙盒进行快照。此外，通过调用`Sandbox.exec`启动的任何后台进程在快照后都不会正确恢复。
* 沙箱内存快照只能在与原始沙箱运行时完全相同的实例类型上恢复。鉴于 Modal 具有多样化的容量，这有时会导致调度延迟，特别是当内存快照与窄区域固定相结合时。

## 保持沙箱状态

要在沙箱会话中保留状态，您需要：
1. **触发快照。** 快照是从沙箱外部触发的，通常是在终止之前。一种常见的模式是在沙箱内运行 exec 进程并等待其退出。一旦完成，控制器就会拍摄快照并终止沙箱。
2. **存储快照 ID。** 必须保留 `object_id` 字符串，以便稍后可以从中恢复。这通常由会话或用户 ID 进行键控，并且可以存储在数据库、外部键值存储或 [Modal Dict](/docs/guide/dicts) 中。以下示例展示了这种模式。此代码通常会在模态函数或您自己的后端中运行，编排沙箱：

```python notest
import modal

app = modal.App.lookup("sandbox-snapshot-lifecycle", create_if_missing=True)
snapshot_store = modal.Dict.from_name("sandbox-snapshots", create_if_missing=True)
session_id = "sess_a1b2c3d4"

# Restore from snapshot, or use base image
if session_id in snapshot_store:
    image = modal.Image.from_id(snapshot_store[session_id])
else:
    image = modal.Image.debian_slim()

sb = modal.Sandbox.create(image=image, app=app)

# Run agent which exits when ready to be snapshotted
p = sb.exec("python", "agent.py")
p.wait()

# Snapshot and store the object_id
snapshot_store[session_id] = sb.snapshot_filesystem().object_id
sb.terminate()
```

## 删除快照

由于文件系统和目录快照都是[图像](/docs/sdk/py/latest/Image)，因此您可以使用图像删除 API 删除它们。这对于管理存储或遵守数据保留策略很有用。

<Callout variant="warning">

删除是不可逆的。已删除的快照无法恢复，并且配置为使用已删除快照的任何沙盒都将无法启动。

</Callout>

<CodeTabs>
  {#snippet python()}

```python notest
import modal.experimental

# Get the image ID from a filesystem or directory snapshot
image = sb.snapshot_filesystem()
# or: image = sb.snapshot_directory("/project")
image_id = image.object_id  # e.g., "im-abc123"

# Later, delete the snapshot when no longer needed
modal.experimental.image_delete(image_id)
```

{/片段}
{#snippet javascript()}

```javascript notest
// Get the image ID from a filesystem or directory snapshot
const image = await sb.snapshotFilesystem();
// or: const image = await sb.snapshotDirectory("/project");
const imageId = image.imageId; // e.g., "im-abc123"

// Later, delete the snapshot when no longer needed
await modal.images.delete(imageId);
```

{/片段}
{#snippet go()}

```go notest
// Get the image ID from a filesystem or directory snapshot
image, _ := sb.SnapshotFilesystem(ctx, nil)
// or: image, _ := sb.SnapshotDirectory(ctx, "/project", nil)
imageId := image.ImageID // e.g., "im-abc123"

// Later, delete the snapshot when no longer needed
mc.Images.Delete(ctx, imageId, nil)
```

{/片段} </CodeTabs>
要删除快照，您需要自己跟踪图像 ID（例如，在数据库或 [Modal Dict](/docs/guide/dicts) 中），因为目前没有 API 可以列出您创建的所有快照。