<!-- modal-docs: machine-translated zh-CN from English source -->

# 开发和调试

Modal 可以轻松地在云中运行应用程序、尝试在云中更改代码，以及
调试远程执行代码，就像它就在您的笔记本电脑上一样。要速度
促进您的内部开发循环，本指南提供了工具和技术的概要
用于在 Modal 中开发和调试软件。

## 互动性

您可以交互式地启动模态应用程序，然后让它直接进入
操作的中间，在有趣的调用站点或运行时站点
爆炸。

### 互动功能可以启动交互式 Python 调试器或启动 `IPython`
REPL 就在 Modal 应用程序的中间。

为此，您首先需要使用以下命令以“交互”模式运行您的应用程序
`--interactive` / `-i` 标志。在交互模式下，可以建立连接
通过从函数内调用 `interact()` 到调用终端。

举个简单的例子，您可以使用内置的 Python `input` 接受用户输入
功能：

```python
@app.function()
def my_fn(hidden):
    modal.interact()

    x = input("Enter a number: ")
    if hidden == x:
        print(f"Your number is {x}, which is the hidden value!")
    else:
        print(f"Your number is {x}, which is not the hidden value")
```

现在，当您使用 `--interactive` 标志运行应用程序时，您可以发送
输入到您的应用程序，即使它正在远程容器中运行！

```shell
modal run -i guess_number.py::my_fn --hidden 5
Enter a number: 5
Your number is 5, which is the hidden value!
```

对于更有趣的示例，您可以 [`pip_install("ipython")`](/docs/sdk/py/latest/Image#pip_install)
并在代码中的任意位置动态启动 `IPython` REPL：

```python
@app.function()
def f():
    model = expensive_function()
    # play around with model
    modal.interact()
    import IPython
    IPython.embed()
```

内置的Python调试器可以使用语言的`breakpoint()`启动
功能。为了方便起见，断点自动调用`interact`。

```python
@app.function()
def f():
    x = "10point3"
    breakpoint()
    answer = float(x)
```

### 调试正在运行的容器

#### 调试 shell

Modal 还允许您在正在运行的容器上运行交互式命令
终端——很像`ssh`-ing到传统机器或云虚拟机。

要在正在运行的容器内运行命令，您首先需要获取容器
身份证。您可以使用以下命令查看所有正在运行的容器及其容器 ID[`modal container list`](/docs/cli/latest/container)。

获取Container ID后，即可通过`modal shell [container-id]`连接Container。这将启动一个“调试外壳”，其中包含一些预安装的工具：

* `vim`
* `nano`
* `ps`
* `strace`
* `curl`
* `py-spy`
* 以及更多！

您可以使用调试 shell 来检查或终止正在运行的进程、修改容器文件系统、运行命令等。您还可以使用容器的包管理器（例如`apt`）安装其他包。

<Asciinema recordingId="KM0bfr08yZpbpCPx6KQJRWwh3" autoPlay={true} />

请注意，一旦容器完成运行，调试 shell 将立即终止。

#### `modal container exec`
您还可以使用 `modal container exec [container-id] [command...]` 在正在运行的容器中执行特定命令。例如，要查看`/root`中有哪些文件，您可以运行`modal container exec [container-id] ls /root`。

```
❯ modal container list
                         Active Containers in environment: nathan-dev
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━┓
┃ Container ID                  ┃ App ID                    ┃ App Name ┃ Start Time           ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━┩
│ ta-01JK47GVDMWMGPH8MQ0EW30Y25 │ ap-FSuhQ4LpvNAt5b6mKi1CDw │ my-app   │ 2025-02-02 16:02 EST │
└───────────────────────────────┴───────────────────────────┴──────────┴──────────────────────┘

❯ modal container exec ta-01JK47GVDMWMGPH8MQ0EW30Y25 ls /root
__pycache__  test00.py
```

请注意，一旦您的容器执行，您执行的命令将立即终止
已运行完毕。

默认情况下，命令将在
[伪终端（PTY）]（https://en.wikipedia.org/wiki/Pseudoterminal），但是这个
可以使用 `--no-pty` 标志禁用。

#### 实时容器分析

当容器或输入看似卡住或没有进展时，
您可以使用 Modal Web 仪表板来找出正在执行的代码
实时容器。为此，请在您的容器的 **Containers** 选项卡中查找 **Live Profiling**
功能仪表板。

![实时容器分析](https://modal-public-assets.s3.us-east-1.amazonaws.com/live-profiling-bigger.gif)

### 调试容器镜像

您还可以使用相同的方法在新容器中启动交互式 shell
环境作为您的功能。这对于调试问题非常方便
图像，交互式地完善构建命令，并探索内容
[`Volume`](/docs/sdk/py/latest/Volume) 和
[`NetworkFileSystem`](/docs/sdk/py/latest/NetworkFileSystem)。

访问此功能的主要接口是
[`modal shell`](/docs/cli/latest/shell) CLI 命令，它接受一个 Function
在您的应用程序中输入名称（或者提示您选择一个，如果没有提供），然后运行
与函数相同的图像上的交互式命令，具有相同的
[`Secret`](/docs/sdk/py/latest/Secret) 和
[`NetworkFileSystem`](/docs/sdk/py/latest/NetworkFileSystem) 作为所选函数附加。

默认命令是 `/bin/bash`，但您可以用任何其他命令覆盖它
使用 `--cmd` 标志选择的命令。

<Asciinema recordingId="824SeTFiQmleEUF5JjOElofhG" autoPlay={true} />

请注意，`modal shell [filename].py`不会将 shell 附加到正在运行的容器上函数，而是创建底层 Image 的新实例。要将 shell 附加到正在运行的容器，请改用 `modal shell [container-id]`。

## 实时更新

### 使用`modal serve`热重载

Modal 有命令 `modal serve <filename.py>`，它创建一个循环
当任何支持文件发生更改时，实时更新应用程序。

实时更新与 Web Functions 配合使用，同步您所做的更改，
它也可以很好地与 cron 计划和作业队列配合使用。

```python
import modal

app = modal.App(image=modal.Image.debian_slim().pip_install("fastapi"))


@app.function()
@modal.fastapi_endpoint()
def f():
    return "I update on file edit!"


@app.function(schedule=modal.Period(seconds=5))
def run_me():
    print("I also update on file edit!")
```

如果您编辑此文件，`modal serve`命令将检测到更改并
更新代码，无需重新启动命令。

### 使用 `--strategy=recreate` 开发已部署的应用程序

一般来说，我们建议使用`modal serve`开发应用程序。
但如果您的开发流程涉及运行`modal deploy`，
我们建议您使用标志`--strategy=recreate`。
这将终止之前部署中所有正在运行的容器
以便所有后续输入都将进入新容器。

## 可观察性

每个正在运行的模态应用程序，包括所有临时应用程序，流日志和资源
指标返回给您查看。

启动时，应用程序将记录一个仪表板链接，该链接将带您进入其应用程序页面。

```shell
$ python3 main.py
✓ Initialized. View app page at https://modal.com/apps/ap-XYZ1234.
...
```

从该页面您可以访问以下内容：

* 日志，来自您的应用程序和来自 Modal 的系统级日志
* 计算资源指标（CPU、RAM、GPU）
* 函数调用历史记录，包括历史成功/失败计数

### 调试日志

您可以通过将`MODAL_LOGLEVEL`环境变量设置为`DEBUG`来启用Modal的客户端调试日志。
运行以下命令将显示本地运行的 Modal 客户端的调试日志记录。

```bash
MODAL_LOGLEVEL=DEBUG modal run hello.py
```

要在远程容器中运行的 Modal 客户端中启用调试日志，您可以使用设置 `MODAL_LOGLEVEL`
模态 [`Secret`](/docs/sdk/py/latest/Secret)。

```python
@app.function(secrets=[modal.Secret.from_dict({"MODAL_LOGLEVEL": "DEBUG"})])
def f():
    print("Hello, world!")
```

### 客户端回溯

要查看客户端异常的回溯（又名[堆栈跟踪](https://en.wikipedia.org/wiki/Stack_trace)），您可以将 `MODAL_TRACEBACK` 环境变量设置为 `1`。

```bash
MODAL_TRACEBACK=1 modal run my_app.py
```
我们鼓励您报告需要启用此功能的情况，因为它表明 Modal 中存在问题。