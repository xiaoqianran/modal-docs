<!-- modal-docs: machine-translated zh-CN from English source -->

# 客户提供的加密密钥

<Callout variant="alpha" />

客户提供的加密密钥 (CSEK) 让您可以提供自己的密钥材料
创建受支持的模态资源时。 Modal 使用键作为
资源加密流程，但不保留密钥。

当您需要客户持有的 Modal 存储数据的密钥材料时，请使用 CSEK。
您负责生成、存储、备份和提供密钥
当受保护的资源被使用时再次。

<Callout variant="warning">

如果您丢失了受保护资源的 CSEK，Modal 无法为您恢复它。
将密钥存储在 Modal 外部的持久密钥管理系统中。

</Callout>

## CSEK 的工作原理

对于每个受支持的资源，适用相同的基本流程：

1. 使用加密安全随机源生成密钥材料。
2. 创建资源时传递密钥。
3. 将资源 ID 和密钥存储在您自己的系统中。
4. 读取、挂载或恢复资源时再次传递相同的密钥。

密钥材料不得为空，且长度必须在 16 到 512 字节之间。

<CodeTabs>
  {#snippet python()}

```python notest
import secrets
encryption_key = secrets.token_bytes(32)
```

{/片段}
{#snippet javascript()}

```javascript notest
import { randomBytes } from "node:crypto";
const encryptionKey = randomBytes(32);
```

{/片段}
{#snippet go()}

```go notest
encryptionKey := make([]byte, 32)
if _, err := rand.Read(encryptionKey); err != nil {
	// Handle key generation errors.
}
```

{/片段} </CodeTabs>
不要将 CSEK 材料提交到源代码控制、将其烘焙到图像中、将其打印在
日志，或将其存储在其保护的数据旁边。更喜欢专用钥匙
具有访问控制和备份策略的管理系统或秘密管理器
符合您的安全要求。

## 支持的资源

此页面记录了当前支持的资源的 CSEK。作为CSEK的支持
可用于更多模态资源，将添加其他部分。

|资源 | SDK支持|
| ------------------------------------------- | -------------------------- |
| [目录快照](#directory-snapshots) | Python、JavaScript、Go SDK |

## 目录快照

[目录快照](/docs/guide/sandbox-snapshots#directory-snapshots) 让
您从正在运行的沙箱中捕获一个目录作为
[图片](/docs/sdk/py/latest/Image)。通过 CSEK，您可以在以下情况下传递密钥材料：
创建快照并在安装时再次传递相同的密钥。

### 创建受CSEK保护的目录快照

<CodeTabs>
  {#snippet python()}

```python notest
import secrets

import modal

app = modal.App.lookup("csek-directory-snapshots", create_if_missing=True)
encryption_key = secrets.token_bytes(32)

sb = modal.Sandbox.create(app=app)
sb.exec(
    "bash",
    "-c",
    "mkdir -p /project && echo 'private data' > /project/state.txt",
).wait()

snapshot = sb.snapshot_directory(
    "/project",
    _experimental_encryption_key=encryption_key,
)
sb.terminate()

# Store both values in your own durable systems.
snapshot_id = snapshot.object_id
```

{/片段}
{#snippet javascript()}

```javascript notest
import { randomBytes } from "node:crypto";
import { ModalClient } from "modal";

const modal = new ModalClient();
const app = await modal.apps.fromName("csek-directory-snapshots", {
  createIfMissing: true,
});
const image = modal.images.fromRegistry("debian:12-slim");
const encryptionKey = randomBytes(32);

const sb = await modal.sandboxes.create(app, image);
await (
  await sb.exec([
    "bash",
    "-c",
    "mkdir -p /project && echo 'private data' > /project/state.txt",
  ])
).wait();

const snapshot = await sb.snapshotDirectory("/project", {
  experimentalEncryptionKey: encryptionKey,
});
await sb.terminate();

// Store both values in your own durable systems.
const snapshotId = snapshot.imageId;
```

{/片段}
{#snippet go()}

```go notest
package main

import (
	"context"
	"crypto/rand"

	modal "github.com/modal-labs/modal-client/go"
)

func main() {
	ctx := context.Background()
	mc, _ := modal.NewClient()

	app, _ := mc.Apps.FromName(ctx, "csek-directory-snapshots", &modal.AppFromNameParams{
		CreateIfMissing: true,
	})
	image := mc.Images.FromRegistry("debian:12-slim", nil)
	encryptionKey := make([]byte, 32)
	if _, err := rand.Read(encryptionKey); err != nil {
		panic(err) // Handle this error.
	}

	sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)
	process, _ := sb.Exec(ctx, []string{
		"bash",
		"-c",
		"mkdir -p /project && echo 'private data' > /project/state.txt",
	}, nil)
	process.Wait(ctx, nil)

	snapshot, _ := sb.SnapshotDirectory(ctx, "/project", &modal.SandboxSnapshotDirectoryParams{
		ExperimentalEncryptionKey: encryptionKey,
	})
	sb.Terminate(ctx, nil)

	// Store both values in your own durable systems.
	snapshotID := snapshot.ImageID
	_ = snapshotID
}
```

{/片段} </CodeTabs>
加密密钥参数当前作为实验性 SDK API 公开。
请参阅[功能成熟度](/docs/guide/feature-maturity#experimental-sdk) 了解如何
Modal 处理实验性 SDK 表面。

### 挂载受CSEK保护的目录快照

要稍后使用快照，请通过 ID 重新水合图像并将相同的密钥传递给
挂载操作。

<CodeTabs>
  {#snippet python()}

```python notest
import modal

app = modal.App.lookup("csek-directory-snapshots")
snapshot = modal.Image.from_id(snapshot_id)

sb = modal.Sandbox.create(app=app)
sb.mount_image(
    "/project",
    snapshot,
    _experimental_encryption_key=encryption_key,
)

contents = sb.exec("cat", "/project/state.txt").stdout.read().strip()
assert contents == "private data"
sb.terminate()
```

{/片段}
{#snippet javascript()}

```javascript notest
import { ModalClient } from "modal";

const modal = new ModalClient();
const app = await modal.apps.fromName("csek-directory-snapshots");
const snapshot = await modal.images.fromId(snapshotId);
const image = modal.images.fromRegistry("debian:12-slim");

const sb = await modal.sandboxes.create(app, image);
await sb.mountImage("/project", snapshot, {
  experimentalEncryptionKey: encryptionKey,
});

const contents = await (
  await sb.exec(["cat", "/project/state.txt"])
).stdout.readText();
console.assert(contents.trim() === "private data");
await sb.terminate();
```

{/片段}
{#snippet go()}

```go notest
package main

import (
	"context"
	"io"
	"strings"

	modal "github.com/modal-labs/modal-client/go"
)

func main() {
	ctx := context.Background()
	mc, _ := modal.NewClient()

	app, _ := mc.Apps.FromName(ctx, "csek-directory-snapshots", nil)
	snapshot, _ := mc.Images.FromID(ctx, snapshotID, nil)
	image := mc.Images.FromRegistry("debian:12-slim", nil)

	sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)
	sb.MountImage(ctx, "/project", snapshot, &modal.SandboxMountImageParams{
		ExperimentalEncryptionKey: encryptionKey,
	})

	process, _ := sb.Exec(ctx, []string{"cat", "/project/state.txt"}, nil)
	contents, _ := io.ReadAll(process.Stdout)
	if strings.TrimSpace(string(contents)) != "private data" {
		panic("unexpected contents")
	}
	sb.Terminate(ctx, nil)
}
```

{/片段} </CodeTabs>

如果密钥丢失或不正确，Modal 无法挂载加密快照。

### 重新快照加密目录

挂载受 CSEK 保护的目录快照后，您可以创建另一个
该安装路径的目录快照：

* 传递加密密钥参数以使用CSEK保护新快照。
* 省略加密密钥参数以使用 Modal 管理创建新快照
  加密。

每个受 CSEK 保护的快照都与该快照创建时使用的密钥相关联。
创建的。如果您使用不同的密钥创建新的受 CSEK 保护的快照，请使用
挂载新快照时的新密钥。

### 保留

CSEK 不会更改目录快照保留。目录快照是
创建后保留 30 天。请参阅[快照保留](/docs/guide/sandbox-snapshots#snapshot-retention)
了解详情。