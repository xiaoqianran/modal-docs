<!-- modal-docs: machine-translated zh-CN from English source -->

# 文件\_io

## 文件IO

```python
class FileIO(typing.Generic)
```

\[Alpha] FileIO 句柄，用于 Sandbox 文件系统 API。

已于 2026 年 3 月 9 日弃用。请改用 `Sandbox.filesystem` API。

该 API 旨在模仿 Python 的 io.FileIO。

目前此 API 处于 Alpha 阶段，可能会发生变化。文件 I/O 操作
大小可能限制为 100 MiB，请求的吞吐量为
目前实施中受到限制。有关大文件传输的建议
请参阅沙盒[文件系统访问指南](https://modal.com/docs/guide/sandbox-files)。

**使用**

```python notest
import modal

app = modal.App.lookup("my-app", create_if_missing=True)

sb = modal.Sandbox.create(app=app)
f = sb.open("/tmp/foo.txt", "w")
f.write("hello")
f.close()
```

```python
__init__(self, client, task_id)
```

### 创建

```python
create(cls, path, mode, client, task_id)
```

创建一个新的 FileIO 句柄。

### 阅读

```python
read(self, n=None)
```从当前位置读取 n 个字节，如果 n 为 None，则读取整个剩余文件。

### 阅读线

```python
readline(self)
```

从当前位置读取一行。

### 阅读行

```python
readlines(self)
```

从当前位置读取所有行。

### 写

```python
write(self, data)
```

将数据写入当前位置。

在整个缓冲区被刷新之前，写入可能不会出现，这
可以使用 `flush()` 手动完成，也可以在文件保存时自动完成
关闭。

### 冲水

```python
flush(self)
```

将缓冲区刷新到磁盘。

### 寻找

```python
seek(self, offset, whence=0)
```

移动到文件中的新位置。

`whence`默认为0（绝对文件定位）；其他值为1
（相对于当前位置）和 2 （相对于文件末尾）。

### ls

```python
ls(cls, path, client, task_id)
```

列出所提供目录的内容。

### mkdir

```python
mkdir(cls, path, client, task_id, parents=False)
```

创建一个新目录。

### rm

```python
rm(cls, path, client, task_id, recursive=False)
```

删除沙箱中的文件或目录。

###观看

```python
watch(cls, path, client, task_id, filter=None, recursive=False, timeout=None)
```

### 关闭

```python
close(self)
```

刷新缓冲区并关闭文件。

## ls

```python
ls(path, client, task_id)
```

列出所提供目录的内容。

## 目录

```python
mkdir(path, client, task_id, parents=False)
```

创建一个新目录。

## rm

```python
rm(path, client, task_id, recursive=False)
```

删除沙箱中的文件或目录。

## 观看

```python
watch(path, client, task_id, filter=None, recursive=False, timeout=None)
```

监视文件或目录的更改。