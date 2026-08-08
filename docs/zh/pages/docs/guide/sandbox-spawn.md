<!-- modal-docs: machine-translated zh-CN from English source -->

# 在沙箱中运行命令

创建沙箱后，您可以使用以下命令在其中运行命令
[`Sandbox.exec`](/docs/sdk/py/latest/Sandbox#exec) 方法。

```python notest
sb = modal.Sandbox.create(app=my_app)

process = sb.exec("echo", "hello", timeout=3)
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
sb.detach()
```

`Sandbox.exec` 返回一个 [`ContainerProcess`](/docs/sdk/py/latest/container_process#containerprocess)
对象，它允许访问进程的`stdout`、`stderr`和`stdin`。
`timeout`参数确保`exec`命令最多运行
`timeout`秒。

## 输入

Sandbox 和 ContainerProcess `stdin` 句柄是 [`StreamWriter`](/docs/sdk/py/latest/io_streams#streamwriter)对象。该对象支持同步和异步 API 的刷新写入：

```python notest
import asyncio

sb = modal.Sandbox.create(app=my_app)

p = sb.exec("bash", "-c", "while read line; do echo $line; done")
p.stdin.write(b"foo bar\n")
p.stdin.write_eof()
p.stdin.drain()
p.wait()
sb.terminate()
sb.detach()

async def run_async():
    sb = await modal.Sandbox.create.aio(app=my_app)
    p = await sb.exec.aio("bash", "-c", "while read line; do echo $line; done")
    p.stdin.write(b"foo bar\n")
    p.stdin.write_eof()
    await p.stdin.drain.aio()
    await p.wait.aio()
    await sb.terminate.aio()
    await sb.detach.aio()

asyncio.run(run_async())
```

## 输出

Sandbox 和 ContainerProcess `stdout` 和 `stderr` 句柄是 [`StreamReader`](/docs/sdk/py/latest/io_streams#streamreader)
对象。这些对象支持以同步和异步方式从流中读取。
这些句柄还遵守为 `Sandbox.exec` 指定的超时。

要在底层进程完成后从流中读取数据，您可以使用 `read`
方法，该方法会阻塞，直到进程完成并返回整个输出流。

```python notest
sb = modal.Sandbox.create(app=my_app)
p = sb.exec("echo", "hello")
print(p.stdout.read())
sb.terminate()
sb.detach()
```

要流式输出，请利用 `stdout` 和 `stderr` 的事实
可迭代：

```python notest
import asyncio

sb = modal.Sandbox.create(app=my_app)

p = sb.exec("bash", "-c", "for i in $(seq 1 10); do echo foo $i; sleep 0.1; done")

for line in p.stdout:
    # Lines preserve the trailing newline character, so use end="" to avoid double newlines.
    print(line, end="")
p.wait()
sb.terminate()
sb.detach()

async def run_async():
    sb = await modal.Sandbox.create.aio(app=my_app)
    p = await sb.exec.aio("bash", "-c", "for i in $(seq 1 10); do echo foo $i; sleep 0.1; done")
    async for line in p.stdout:
        # Avoid double newlines by using end="".
        print(line, end="")
    await p.wait.aio()
    await sb.terminate.aio()
    await sb.detach.aio()

asyncio.run(run_async())
```

### 流类型
默认情况下，所有流都缓冲在内存中，等待被消耗
客户。您可以使用 `stdout` 和 `stderr` 参数控制此行为。
这些参数在概念上类似于 `stdout` 和 `stderr`
[`subprocess`](https://docs.python.org/3/library/subprocess.html#subprocess.DEVNULL)模块的参数。

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
sb.detach()
```