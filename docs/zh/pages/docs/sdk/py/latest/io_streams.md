<!-- modal-docs: machine-translated zh-CN from English source -->

# io\_streams

## 流阅读器

```python
class StreamReader(typing.Generic)
```

从流中检索日志（`stdout` 或 `stderr`）。

作为异步迭代，该对象支持 `for` 和 `async for`
声明。只需循环对象即可分块读取。

### 文件\_描述符

```python
file_descriptor(self)
```

对于 stdout，可能的值为 `1`；对于 stderr，可能的值为 `2`。

### 阅读

```python
read(self)
```

获取流的全部内容，直到 EOF。

## 流写入器

```python
class StreamWriter(object)
```

提供一个接口来缓冲日志并将其写入沙箱或容器进程流（`stdin`）。

### 写

```python
write(self, data)
```

将数据写入流但不立即发送。这是非阻塞的，并将数据排队到内部缓冲区。必须是
与 `drain()` 方法一起使用，该方法刷新缓冲区。

**使用**

```python fixture:sandbox
proc = sandbox.exec(
    "bash",
    "-c",
    "while read line; do echo $line; done",
)
proc.stdin.write(b"foo\n")
proc.stdin.write(b"bar\n")
proc.stdin.write_eof()
proc.stdin.drain()
```

### 写\_eof

```python
write_eof(self)
```

缓冲数据耗尽后关闭流的写入端。

如果进程在输入时被阻止，则在输入后它将解除阻止
`write_eof()`。此方法需要与`drain()`配合使用
方法，它将 EOF 刷新到进程。

### 排水

```python
drain(self)
```

刷新写入缓冲区并将数据发送到正在运行的进程。

这是一种流量控制方法，在发送数据之前会阻塞。它返回
何时适合继续将数据写入流。
**使用**

```python notest
writer.write(data)
writer.drain()
```

异步用法：

```python notest
writer.write(data)  # not a blocking operation
await writer.drain.aio()
```