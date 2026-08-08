<!-- modal-docs: machine-translated zh-CN from English source -->

# 容器\_进程

## 容器进程

```python
class ContainerProcess(typing.Generic)
```

表示容器中正在运行的进程。

容器进程通过直接通信进行通信
容器正在运行的 Modal Worker。

```python
__init__(self, process_id, task_id, client, command_router_client,
    stdout=StreamType.PIPE, stderr=StreamType.PIPE, exec_deadline=None,
    text=True, by_line=False)
```

### 标准输出

```python
stdout(self)
```

StreamReader 用于容器进程的标准输出流。

### 标准错误

```python
stderr(self)
```

容器进程的 stderr 流的 StreamReader。

### 标准输入

```python
stdin(self)
```

容器进程的标准输入流的 StreamWriter。

### 返回码

```python
returncode(self)
```

### 民意调查

```python
poll(self)
```

检查容器进程是否运行完毕。

如果进程仍在运行，则返回`None`，否则返回退出代码。

### 等待

```python
wait(self)
```

等待容器进程运行完毕。返回退出代码。