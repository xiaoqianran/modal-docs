<!-- modal-docs: machine-translated zh-CN from English source -->

# 在沙箱中运行命令

创建沙盒后，您可以使用其 `exec` 在其中运行命令
方法。

<CodeTabs>
  {#snippet python()}

```python notest
sb = modal.Sandbox.create(app=my_app)

process = sb.exec("echo", "hello", timeout=3)  # timeout in seconds
print(process.stdout.read())

process = sb.exec("python", "-c", "print(1 + 1)", timeout=3)
print(process.stdout.read())

process = sb.exec(
    "bash",
    "-c",
    "for i in $(seq 1 10); do echo foo $i; sleep 0.1; done",
    timeout=5,
)
for line in process.stdout:
    print(line, end="")

sb.terminate()
```

{/片段}

{#snippet javascript()}

```javascript notest
import { ModalClient } from "modal";

const modal = new ModalClient();
const app = await modal.apps.fromName("sandbox-exec", {
  createIfMissing: true,
});
const image = modal.images.fromRegistry("python:3.13-slim");
const sb = await modal.sandboxes.create(app, image);

let p = await sb.exec(["echo", "hello"], {
  timeoutMs: 3000,
  stdout: "pipe",
});
console.log(await p.stdout.readText());

p = await sb.exec(["python", "-c", "print(1 + 1)"], {
  timeoutMs: 3000,
  stdout: "pipe",
});
console.log(await p.stdout.readText());

p = await sb.exec(
  ["bash", "-c", "for i in $(seq 1 10); do echo foo $i; sleep 0.1; done"],
  { timeoutMs: 5000, stdout: "pipe" },
);
for await (const chunk of p.stdout) {
  process.stdout.write(chunk);
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

	app, _ := mc.Apps.FromName(ctx, "sandbox-exec", &modal.AppFromNameParams{
		CreateIfMissing: true,
	})
	image := mc.Images.FromRegistry("python:3.13-slim", nil)
	sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)

	process, _ := sb.Exec(ctx, []string{"echo", "hello"}, &modal.SandboxExecParams{
		Timeout: 3 * time.Second,
		Stdout:  modal.Pipe,
	})
	stdout, _ := io.ReadAll(process.Stdout)
	fmt.Print(string(stdout))

	process, _ = sb.Exec(ctx, []string{"python", "-c", "print(1 + 1)"}, &modal.SandboxExecParams{
		Timeout: 3 * time.Second,
		Stdout:  modal.Pipe,
	})
	stdout, _ = io.ReadAll(process.Stdout)
	fmt.Print(string(stdout))

	process, _ = sb.Exec(ctx, []string{
		"bash", "-c", "for i in $(seq 1 10); do echo foo $i; sleep 0.1; done",
	}, &modal.SandboxExecParams{
		Timeout: 5 * time.Second,
		Stdout:  modal.Pipe,
	})
	io.Copy(os.Stdout, process.Stdout)
	sb.Terminate(ctx, nil)
}
```

{/片段} </CodeTabs>

`exec` 返回一个进程对象，其中包含命令的标准输入、输出和
错误流。超时限制了命令可以运行的时间。

## 输入

要将数据发送到命令，请写入其标准输入，然后关闭流
发出 EOF 信号：

<CodeTabs>
  {#snippet python()}

```python notest
import asyncio

sb = modal.Sandbox.create(app=my_app)

p = sb.exec("bash", "-c", "while read line; do echo $line; done")
p.stdin.write(b"foo bar\n")
p.stdin.write_eof()
p.stdin.drain()
p.wait()
sb.terminate()

async def run_async():
    sb = await modal.Sandbox.create.aio(app=my_app)
    p = await sb.exec.aio("bash", "-c", "while read line; do echo $line; done")
    p.stdin.write(b"foo bar\n")
    p.stdin.write_eof()
    await p.stdin.drain.aio()
    await p.wait.aio()
    await sb.terminate.aio()

asyncio.run(run_async())
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image);

const p = await sb.exec(["bash", "-c", "while read line; do echo $line; done"]);
await p.stdin.writeText("foo bar\n");
await p.stdin.close();
await p.wait();
await sb.terminate();
```

{/片段}{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)

p, _ := sb.Exec(ctx, []string{
	"bash", "-c", "while read line; do echo $line; done",
}, nil)
p.Stdin.Write([]byte("foo bar\n"))
p.Stdin.Close()
p.Wait(ctx, nil)
sb.Terminate(ctx, nil)
```

{/片段} </CodeTabs>

## 输出

从命令的标准输出和错误流中读取命令的输出。读取自
这些流也遵守执行超时。

<CodeTabs>
  {#snippet python()}

```python notest
sb = modal.Sandbox.create(app=my_app)
p = sb.exec("echo", "hello")
print(p.stdout.read())
sb.terminate()
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image);

const p = await sb.exec(["echo", "hello"], { stdout: "pipe" });
console.log(await p.stdout.readText());
await sb.terminate();
```

{/片段}

{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)

p, _ := sb.Exec(ctx, []string{"echo", "hello"}, &modal.SandboxExecParams{
	Stdout: modal.Pipe,
})
stdout, _ := io.ReadAll(p.Stdout)
fmt.Print(string(stdout))
sb.Terminate(ctx, nil)
```

{/片段} </CodeTabs>

要流式输出，请在命令生成时读取它：

<CodeTabs>
  {#snippet python()}

```python notest
import asyncio

sb = modal.Sandbox.create(app=my_app)

p = sb.exec("bash", "-c", "for i in $(seq 1 10); do echo foo $i; sleep 0.1; done")

for line in p.stdout:
    # Lines preserve the trailing newline character, so use end="" to avoid double newlines.
    print(line, end="")
p.wait()
sb.terminate()

async def run_async():
    sb = await modal.Sandbox.create.aio(app=my_app)
    p = await sb.exec.aio("bash", "-c", "for i in $(seq 1 10); do echo foo $i; sleep 0.1; done")
    async for line in p.stdout:
        # Avoid double newlines by using end="".
        print(line, end="")
    await p.wait.aio()
    await sb.terminate.aio()

asyncio.run(run_async())
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image);

const p = await sb.exec([
  "bash",
  "-c",
  "for i in $(seq 1 10); do echo foo $i; sleep 0.1; done",
]);
for await (const chunk of p.stdout) {
  process.stdout.write(chunk);
}
await p.wait();
await sb.terminate();
```

{/片段}

{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)

p, _ := sb.Exec(ctx, []string{
	"bash", "-c", "for i in $(seq 1 10); do echo foo $i; sleep 0.1; done",
}, nil)
io.Copy(os.Stdout, p.Stdout)
p.Wait(ctx, nil)
sb.Terminate(ctx, nil)
```

{/片段} </CodeTabs>

### 流类型

默认情况下，每个流都是通过管道传输的：Modal 保留其输出，以便您的客户端可以读取
它。使用 `stdout` 和 `stderr` 选项来丢弃流的输出。

<CodeTabs>
  {#snippet python()}

```python notest
from modal.stream_type import StreamType

sb = modal.Sandbox.create(app=my_app)

# Default behavior: buffered in memory.
p = sb.exec(
    "bash",
    "-c",
    "echo foo; echo bar >&2",
    stdout=StreamType.PIPE,
    stderr=StreamType.PIPE,
)
print(p.stdout.read())
print(p.stderr.read())

# Print the stream to STDOUT as it comes in.
p = sb.exec(
    "bash",
    "-c",
    "echo foo; echo bar >&2",
    stdout=StreamType.STDOUT,
    stderr=StreamType.STDOUT,
)
p.wait()

# Discard all output.
p = sb.exec(
    "bash",
    "-c",
    "echo foo; echo bar >&2",
    stdout=StreamType.DEVNULL,
    stderr=StreamType.DEVNULL,
)
p.wait()

sb.terminate()
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image);

// Pipe output so it can be read from the process streams.
let p = await sb.exec(["bash", "-c", "echo foo; echo bar >&2"], {
  stdout: "pipe",
  stderr: "pipe",
});
console.log(await p.stdout.readText());
console.log(await p.stderr.readText());

// Forward both streams to the local stdout as they arrive.
p = await sb.exec(["bash", "-c", "echo foo; echo bar >&2"], {
  stdout: "pipe",
  stderr: "pipe",
});
for await (const chunk of p.stdout) process.stdout.write(chunk);
for await (const chunk of p.stderr) process.stdout.write(chunk);
await p.wait();

// Discard all output.
p = await sb.exec(["bash", "-c", "echo foo; echo bar >&2"], {
  stdout: "ignore",
  stderr: "ignore",
});
await p.wait();
await sb.terminate();
```

{/片段}

{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, nil)

// Pipe output so it can be read from the process streams.
p, _ := sb.Exec(ctx, []string{"bash", "-c", "echo foo; echo bar >&2"}, &modal.SandboxExecParams{
	Stdout: modal.Pipe,
	Stderr: modal.Pipe,
})
stdout, _ := io.ReadAll(p.Stdout)
stderr, _ := io.ReadAll(p.Stderr)
fmt.Printf("%s%s", stdout, stderr)

// Forward both streams to the local stdout as they arrive.
p, _ = sb.Exec(ctx, []string{"bash", "-c", "echo foo; echo bar >&2"}, &modal.SandboxExecParams{
	Stdout: modal.Pipe,
	Stderr: modal.Pipe,
})
io.Copy(os.Stdout, p.Stdout)
io.Copy(os.Stdout, p.Stderr)
p.Wait(ctx, nil)

// Discard all output.
p, _ = sb.Exec(ctx, []string{"bash", "-c", "echo foo; echo bar >&2"}, &modal.SandboxExecParams{
	Stdout: modal.Ignore,
	Stderr: modal.Ignore,
})
p.Wait(ctx, nil)
sb.Terminate(ctx, nil)
```

{/片段} </CodeTabs>

仅当您读取时，exec 的 stdout 和 stderr 才会流式传输到您的客户端
他们。将流读到底会返回其所有输出；如果过程是
仍在运行，读取会阻塞，直到进程完成。执行后
完成后，您最多可以阅读其输出 10 分钟。模态然后丢弃
输出，因此稍后读取将失败。