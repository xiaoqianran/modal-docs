<!-- modal-docs: machine-translated zh-CN from English source -->

# 文件系统访问

有多种选项可用于将文件上传到沙盒并访问它们
从沙箱外部。

## 文件系统API

<Callout variant="beta">

与之前的 Sandbox 文件系统 API 相比，此 API 带来了显着的可靠性改进，后者在 v1.4.0 之前的版本中可用，现已弃用。

</Callout>

在沙箱中传入和传出数据的最便捷方式
执行是使用我们的文件系统API：

<CodeTabs>
  {#snippet python()}

```python
import modal

app = modal.App.lookup("sandbox-fs-demo", create_if_missing=True)

sb = modal.Sandbox.create(app=app)

# Write text to a file in the Sandbox.
sb.filesystem.write_text("Hello World!\n", "/tmp/test.txt")

# Read the file back from the Sandbox into a string.
contents = sb.filesystem.read_text("/tmp/test.txt")
print(contents)

sb.terminate()
sb.detach()
```

{/片段}
{#snippet javascript()}

```javascript notest
import { ModalClient } from "modal";

const modal = new ModalClient();
const app = await modal.apps.fromName("sandbox-fs-demo", {
  createIfMissing: true,
});
const image = modal.images.fromRegistry("python:3.13-slim");

const sb = await modal.sandboxes.create(app, image);

// Write text to a file in the Sandbox.
await sb.filesystem.writeText("Hello World!\n", "/tmp/test.txt");

// Read the file back from the Sandbox into a string.
const contents = await sb.filesystem.readText("/tmp/test.txt");
console.log(contents);

await sb.terminate();
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

	app, _ := mc.Apps.FromName(ctx, "sandbox-fs-demo", &modal.AppFromNameParams{
		CreateIfMissing: true,
	})
	image := mc.Images.FromRegistry("python:3.13-slim", nil)

	sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)
	defer sb.Terminate(ctx, nil)

	fs := sb.Filesystem

	// Write text to a file in the Sandbox.
	fs.WriteText(ctx, "Hello World!\n", "/tmp/test.txt", nil)

	// Read the file back from the Sandbox into a string.
	contents, _ := fs.ReadText(ctx, "/tmp/test.txt", nil)
	fmt.Println(contents)
}
```

{/片段} </CodeTabs>它具有方便的 API，用于双向流式传输文件副本：

<CodeTabs>
  {#snippet python()}

```python
from pathlib import Path
import modal

# Write a local file.
with open("local-file.txt", "w") as f:
    f.write("Hello World!\n")

app = modal.App.lookup("sandbox-fs-demo", create_if_missing=True)

sb = modal.Sandbox.create(app=app)

# Copy the local file into the Sandbox.
sb.filesystem.copy_from_local("local-file.txt", "/tmp/file-in-sandbox.txt")

# Copy it back to the local filesystem.
sb.filesystem.copy_to_local("/tmp/file-in-sandbox.txt", "local-file-copy.txt")

print(Path("local-file-copy.txt").read_text())

sb.terminate()
sb.detach()
```

{/片段}
{#snippet javascript()}

```javascript notest
import { readFile, writeFile } from "node:fs/promises";

const sb = await modal.sandboxes.create(app, image);

// Write a local file.
await writeFile("local-file.txt", "Hello World!\n", "utf-8");

// Copy the local file into the Sandbox.
await sb.filesystem.copyFromLocal("local-file.txt", "/tmp/file-in-sandbox.txt");

// Copy it back to the local filesystem.
await sb.filesystem.copyToLocal(
  "/tmp/file-in-sandbox.txt",
  "local-file-copy.txt",
);

console.log(await readFile("local-file-copy.txt", "utf-8"));

await sb.terminate();
```

{/片段}
{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)
defer sb.Terminate(ctx, nil)

fs := sb.Filesystem

// Write a local file.
os.WriteFile("local-file.txt", []byte("Hello World!\n"), 0o644)

// Copy the local file into the Sandbox.
fs.CopyFromLocal(ctx, "local-file.txt", "/tmp/file-in-sandbox.txt", nil)

// Copy it back to the local filesystem.
fs.CopyToLocal(ctx, "/tmp/file-in-sandbox.txt", "local-file-copy.txt", nil)

data, _ := os.ReadFile("local-file-copy.txt")
fmt.Println(string(data))
```

{/片段} </CodeTabs>

它还提供用于检查和管理文件的 API：

<CodeTabs>
  {#snippet python()}

```python
import modal

app = modal.App.lookup("sandbox-fs-demo", create_if_missing=True)

sb = modal.Sandbox.create(app=app)

# Set up a structured project.
sb.filesystem.make_directory("/tmp/project/results")

# Let the Sandbox do some work and write outputs to files.
sb.filesystem.write_text("42\n", "/tmp/project/results/answer.txt")
sb.filesystem.write_text("debug info\n", "/tmp/project/results/debug.log")

# Inspect what was produced.
for entry in sb.filesystem.list_files("/tmp/project/results"):
    print(entry.name, entry.type.value, entry.size)

# Check that the result file has content before downloading it.
info = sb.filesystem.stat("/tmp/project/results/answer.txt")
if info.size > 0:
    answer = sb.filesystem.read_text("/tmp/project/results/answer.txt")
    print(answer)

# Clean up the whole project.
sb.filesystem.remove("/tmp/project", recursive=True)

sb.terminate()
sb.detach()
```

{/片段}
{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image);

// Set up a structured project.
await sb.filesystem.makeDirectory("/tmp/project/results");

// Let the Sandbox do some work and write outputs to files.
await sb.filesystem.writeText("42\n", "/tmp/project/results/answer.txt");
await sb.filesystem.writeText("debug info\n", "/tmp/project/results/debug.log");

// Inspect what was produced.
const entries = await sb.filesystem.listFiles("/tmp/project/results");
for (const entry of entries) {
  console.log(entry.name, entry.type, entry.size);
}

// Check that the result file has content before downloading it.
const info = await sb.filesystem.stat("/tmp/project/results/answer.txt");
if (info.size > 0) {
  const answer = await sb.filesystem.readText(
    "/tmp/project/results/answer.txt",
  );
  console.log(answer);
}

// Clean up the whole project.
await sb.filesystem.remove("/tmp/project", { recursive: true });

await sb.terminate();
```

{/片段}
{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)
defer sb.Terminate(ctx, nil)

fs := sb.Filesystem

// Set up a structured project.
fs.MakeDirectory(ctx, "/tmp/project/results", nil)

// Let the Sandbox do some work and write outputs to files.
fs.WriteText(ctx, "42\n", "/tmp/project/results/answer.txt", nil)
fs.WriteText(ctx, "debug info\n", "/tmp/project/results/debug.log", nil)

// Inspect what was produced.
entries, _ := fs.ListFiles(ctx, "/tmp/project/results", nil)
for _, entry := range entries {
	fmt.Println(entry.Name, entry.Type, entry.Size)
}

// Check that the result file has content before downloading it.
info, _ := fs.Stat(ctx, "/tmp/project/results/answer.txt", nil)
if info.Size > 0 {
	answer, _ := fs.ReadText(ctx, "/tmp/project/results/answer.txt", nil)
	fmt.Println(answer)
}

// Clean up the whole project.
fs.Remove(ctx, "/tmp/project", &modal.SandboxFilesystemRemoveParams{Recursive: true})
```

{/片段} </CodeTabs>

这些 API 可用于读取最大 5GB 的文件和写入任何大小的文件。

但是，如果您有一个大型数据集，想要从多个沙箱中重复使用，
考虑[使用卷](#using-volumes)。

## 使用体积
可以使用模态 [Volume](/docs/sdk/py/latest/Volume) 或
带有沙盒的 [CloudBucketMount](/docs/guide/cloud-bucket-mounts)。

Volumes 和 CloudBucketMounts 允许您上传一次数据并访问该数据
从许多沙箱中有效地获取数据。

要从沙箱访问卷，您可以使用 `Sandbox.create` 的 `volumes` 参数：

```python notest
# Find or create a Volume with the name "my-volume".
vol = modal.Volume.from_name("my-volume", create_if_missing=True)
sb = modal.Sandbox.create(
    volumes={"/cache": vol},
    app=my_app,
)
# Read a file in the Volume.
p = sb.exec("bash", "-c", "cat /cache/some-file.txt")
print(p.stdout.read())
p.wait()

# Write a file to the Volume.
p = sb.exec("bash", "-c", "echo foo > /cache/a.txt")
p.wait()
sb.terminate(wait=True)
sb.detach()

# Access the Volume file from outside the Sandbox.
for data in vol.read_file("a.txt"):
    print(data)
```

卷和 CloudBucketMount 之间的文件同步行为有所不同。对于
卷，更改由[后台提交](/docs/guide/volumes#background-commits) 保存
在沙箱执行时每隔几秒运行一次，并在以下时间进行最终提交
沙盒终止。使用 Volumes v2，您还可以在任何时候显式提交（请参阅
[使用 `sync` 提交卷更改](#committing-volume-changes-with-sync-v2-only)
如下）。对于 CloudBucketMounts，文件会自动同步。

您需要通过调用沙箱对象上的 [.reload\_volumes()](/docs/sdk/py/latest/Sandbox#reload_volumes) 方法显式重新加载卷以查看自首次安装以来所做的更改。

###挂载子目录

您可以使用以下命令挂载卷的子目录而不是整个卷
[`with_mount_options`](/docs/guide/volumes#mount-options)。这尤其是
当许多沙箱共享一个卷但每个沙箱应该只
访问自己的数据：

<CodeTabs>
  {#snippet python()}

```python notest
sb_app = modal.App.lookup("my-app", create_if_missing=True)

vol = modal.Volume.from_name("shared-volume", create_if_missing=True)

# Each Sandbox only sees its own subdirectory of the Volume.
sb = modal.Sandbox.create(
    volumes={"/data": vol.with_mount_options(sub_path="/users/user_123")},
    app=sb_app,
)
# /data inside the Sandbox maps to /users/user_123 in the Volume.
# The Sandbox cannot see or modify files belonging to other users.
p = sb.exec("bash", "-c", "echo hello > /data/output.txt")
p.wait()
sb.terminate(wait=True)
sb.detach()
```

{/片段}

{#snippet javascript()}

```javascript notest
const app = await modal.apps.fromName("my-app", {
  createIfMissing: true,
});
const vol = await modal.volumes.fromName("shared-volume", {
  createIfMissing: true,
});
const image = modal.images.fromRegistry("python:3.13-slim");

// Each Sandbox only sees its own subdirectory of the Volume.
const sb = await modal.sandboxes.create(app, image, {
  volumes: { "/data": vol.withMountOptions({ subPath: "/users/user_123" }) },
});
// /data inside the Sandbox maps to /users/user_123 in the Volume.
// The Sandbox cannot see or modify files belonging to other users.
const p = await sb.exec(["bash", "-c", "echo hello > /data/output.txt"]);
await p.wait();
await sb.terminate({ wait: true });
```

{/片段}

{#snippet go()}

```go notest
app, _ := mc.Apps.FromName(ctx, "volume-subdir-test", &modal.AppFromNameParams{CreateIfMissing: true})

vol, _ := mc.Volumes.FromName(ctx, "shared-volume", &modal.VolumeFromNameParams{
	CreateIfMissing: true,
})
image := mc.Images.FromRegistry("python:3.13-slim", nil)

// Each Sandbox only sees its own subdirectory of the Volume.
subPath := "/users/user_123"
sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Volumes: map[string]*modal.Volume{
		"/data": vol.WithMountOptions(&modal.VolumeMountOptions{SubPath: &subPath}),
	},
})
defer sb.Terminate(ctx, nil)

// /data inside the Sandbox maps to /users/user_123 in the Volume.
// The Sandbox cannot see or modify files belonging to other users.
p, _ := sb.Exec(ctx, []string{"bash", "-c", "echo hello > /data/output.txt"}, nil)
p.Wait(ctx)
```

{/片段} </CodeTabs>

有关卷安装选项的更多详细信息，请参阅
[卷指南](/docs/guide/volumes#mount-options)。

### 使用 `sync` 提交卷更改（仅限 v2）

对于 [Volumes v2](/docs/guide/volumes#volumes-v2-overview)，您可以明确
通过运行 `sync` 在沙盒执行期间随时提交更改
挂载点上的命令。这会将所有数据和元数据更改保存到
无需等待沙盒终止即可存储卷：

```python notest
sb = modal.Sandbox.create(
    volumes={"/data": modal.Volume.from_name("my-v2-volume")},
    app=my_app,
)

# Write files to the volume
sb.exec("bash", "-c", "echo 'hello' > /data/output.txt").wait()

# Commit changes immediately
p = sb.exec("sync", "/data")
p.wait()
if p.returncode != 0:
    raise Exception(f"sync failed with exit code {p.returncode}")

# Changes are now persisted and visible to other containers
sb.terminate()
sb.detach()
```

这对于您想要长期运行的沙箱特别有用
保留中间结果，或者当您需要更改对其他人可见时
沙盒终止之前的容器。

## 添加文件到图像

在某些情况下，您可能需要[将文件添加到图像本身](/docs/guide/images#add-local-files-with-add_local_dir-and-add_local_file)。
如果该文件将被许多沙箱使用，或者如果您
想要从沙盒的入口点命令访问该文件。
这可以使用以下方法完成
[`add_local_file`](/docs/sdk/py/latest/Image#add_local_file) 和
[`add_local_dir`](/docs/sdk/py/latest/Image#add_local_dir) 上的方法
[`Image`](/docs/sdk/py/latest/Image) 类：

```python notest
# Eagerly build the image - otherwise the Image will lazily build when the
# Sandbox is created.
image = (
    modal.Image.debian_slim()
    .add_local_dir(
        local_path="/home/user/my_dir",
        remote_path="/app",
    )
    .build(my_app)
)

sb = modal.Sandbox.create(app=my_app, image=image)
p = sb.exec("ls", "/app")
print(p.stdout.read())
p.wait()
sb.detach()
```