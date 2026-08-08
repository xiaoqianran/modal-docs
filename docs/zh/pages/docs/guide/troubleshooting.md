<!-- modal-docs: machine-translated zh-CN from English source -->

# 故障排除

本指南页面记录了常见 Modal 问题的解决方案。

有关对在 Modal 上运行的您自己的代码进行故障排除的提示，
请参阅[本指南页](/docs/guide/development-debugging)。

## “命令未找到”错误

如果您安装了 Modal 但看到类似的错误
`modal: command not found` 当尝试运行 CLI 时，这意味着
Python 包可执行文件（“二进制文件”）的安装位置不存在
在您的系统路径上。这是一个常见问题；你需要重新配置你的
系统的环境变量来修复它。

一种解决方法是使用 `python -m modal` 而不是 `modal`。然而，这
只是一个补丁。这个问题没有单一的解决方案，因为 Python
根据您的环境在不同位置安装依赖项。参见
这个[StackOverflow 热门问题](https://stackoverflow.com/q/35898734)
有关如何解决系统路径问题的指导。

## 函数副作用

同一容器*可以*重复用于同一函数的多次调用
在应用程序内。这意味着如果你的函数有副作用，比如修改
磁盘上的文件，它们可能会或可能不会出现在后续调用中
功能。您不应该依赖副作用的存在，但您可能会
必须小心，以免它们造成问题。

例如，如果您使用 sqlite3 创建磁盘支持的数据库：

```python
import modal
import sqlite3

app = modal.App()

@app.function()
def db_op():
    db = sqlite3("db_file.sqlite3")
    db.execute("CREATE TABLE example (col_1 TEXT)")
    ...
```

该函数*可能*（但不一定）在第二次调用时失败
出现 `OperationalError: table foo already exists` 错误。

为了解决这个问题，请注意清除副作用（例如
在上面的函数调用结束时删除 db 文件）或使您的函数
考虑它们（例如添加
`if os.path.exists("db_file.sqlite")` 条件或随机化文件名
上面）。或者，您可以设置`single_use_containers=True`，以便每个
函数调用将启动一个新容器；但是，请注意，这将导致
成本更高，延迟更差，因为每次调用都需要冷启动。

## 心跳超时

`modal.Function` 容器中的 Modal 客户端运行主机用于健康检查容器主进程的心跳循环。
如果容器长时间（分钟）停止心跳，容器将因日志中显示的`heartbeat timeout`而终止。

容器心跳超时很少见，通常是由两个应用程序级来源之一引起的：
* [全局解释器锁](https://wiki.python.org/moin/GlobalInterpreterLock) 被长时间持有，阻止心跳线程取得进展。 [py-spy](https://github.com/benfred/py-spy?tab=readme-ov-file#how-does-gil-detection-work)可以检测GIL持有情况。为了方便起见，我们将 `py-spy` [自动包含在 `modal shell`](/docs/guide/developing-debugging#debug-shells) 中。 GIL 持有的快速修复方法是运行[在子进程中](https://docs.python.org/3/library/multiprocessing.html#the-process-class) 持有 GIL 的代码。
* 容器进程发起关闭，有意停止心跳，但并没有完成关闭。

在这两种情况下，[打开调试日志记录](/docs/guide/developing-debugging#debug-logs)将有助于诊断问题。

## `413 Content Too Large` 错误

如果您收到 `413 Content Too Large` 错误，这可能是因为您
达到我们的 gRPC 负载大小限制。

当前大小限制为 100MB。

## 过时的内核版本 (4.4.0)

我们的安全运行时[报告了一个具有误导性的旧版本](https://github.com/google/gvisor/issues/11117)内核版本，4.4.0。
某些软件库会检测到这一点并报告警告。这些警告可以忽略，因为运行时
实际上实现了 5.15+ 版本的 Linux 内核功能。

如果过时的内核版本报告在您的应用程序中造成错误，请联系我们[在我们的 Slack 中](https://modal.com/slack)。

## L4 GPU 类型上的 CUDA 驱动程序初始化失败
Modal 队列中的某些 L4 实例类型在 NVIDIA 驱动程序中存在不稳定问题，导致
以下 CUDA 上下文初始化错误：

```
RuntimeError: CUDA driver initialization failed, you might not have a CUDA gpu.
```

下面给出了确保容器可靠启动的解决方法：

```python
@modal.enter()
def warmup_cuda(self):
    import ctypes
    import time
    import modal
    cu = ctypes.CDLL("libcuda.so.1")
    max_retries = 10
    retry_delay_secs = 0.5
    for attempt in range(max_retries):
        rc = cu.cuInit(0)
        if rc == 0:
            break
        else:
            if attempt < max_retries - 1:
                print(f"cuInit failed on attempt {attempt + 1}/{max_retries} with code {rc}, retrying...")
                time.sleep(retry_delay_secs)
    else:
        print(f"CUDA initialization failed after {max_retries} attempts; stopping container")
        modal.experimental.stop_fetching_inputs()
```

我们正在调查此问题的根本原因解决方案。
数千个 GPU 规模的多云 GPU 可靠性是一项艰巨的技术挑战！
[此处](/blog/gpu-health) 详细了解我们的解决方案。

## 分叉进程中的连接问题

当进程被分叉时，子进程可能会继承陈旧的网络状态
家长。如果您从分叉进程中使用 Modal（例如 Celery prefork
工人，`multiprocessing`），在分叉后创建一个新的客户端并传递它
明确地：

```python
import multiprocessing
import modal

def child():
    client = modal.Client.from_credentials(token_id, token_secret)
    fc = modal.FunctionCall.from_id(call_id, client=client)
    result = fc.get(timeout=0)

p = multiprocessing.Process(target=child)
p.start()
```