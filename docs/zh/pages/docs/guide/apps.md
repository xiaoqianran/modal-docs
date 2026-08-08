<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用程序、功能和入口点

[`App`](/docs/sdk/py/latest/App) 表示在 Modal 上运行的应用程序。它将一个或多个函数分组以进行原子部署，并充当共享命名空间。所有函数和Clses都与一个相关联
应用程序。

[`Function`](/docs/sdk/py/latest/Function) 一旦部署，就会充当一个独立的单元，并且独立于其他函数[向上和向下扩展](/docs/guide/scale)。如果该函数没有实时输入，则默认情况下，不会运行任何容器，并且您的帐户不会为计算资源付费，即使它所属的应用程序已部署。

应用程序可以是临时的，也可以是部署的。您可以在[`apps`](/apps)页面查看当前正在运行的所有应用程序的列表。

定义两个独立函数的模态应用程序的代码可能如下所示：

```python

import modal

app = modal.App(name="my-modal-app")


@app.function()
def f():
    print("Hello world!")


@app.function()
def g():
    print("Goodbye world!")

```

## 临时应用程序

当您使用时会创建一个临时应用程序
[`modal run`](/docs/cli/latest/run) CLI 命令，或
[`app.run`](/docs/sdk/py/latest/App#run) 方法。这会创建一个临时的
仅在脚本运行期间存在的应用程序。

当调用程序退出时，或者当
服务器检测到客户端不再连接。
您可以使用
[`--detach`](/docs/cli/latest/run) 为了保持临时应用程序均匀运行
客户端退出后。

通过使用 `app.run`，您可以从 Python 脚本中运行模态应用程序：

```python
def main():
    ...
    with app.run():
        some_modal_function.remote()
```

默认情况下，以这种方式运行应用程序不会传播模态日志和进度条消息。要启用输出，请使用 [`modal.enable_output`](/docs/sdk/py/latest/enable_output) 上下文管理器：

```python
def main():
    ...
    with modal.enable_output():
        with app.run():
            some_modal_function.remote()
```

## 已部署的应用程序

使用 [`modal deploy`](/docs/cli/latest/deploy) 创建已部署的应用程序
CLI 命令。该应用程序将无限期地保留，直到您通过以下方式停止它：
[web UI](/apps) 或 [`modal app stop`](/docs/cli/latest/app#modal-app-stop) 命令。已部署应用程序中具有附加功能的功能
[schedule](/docs/guide/cron) 将按计划运行。否则，你可以
使用手动调用它们
[Web 函数或 Python](/docs/guide/trigger-deployed-functions)。

部署的应用程序通过 [`App`](/docs/sdk/py/latest/App) 命名
构造函数。重新部署现有的`App`（基于名称）将更新它
就位。

## 临时应用程序的入口点

当您`modal run`应用程序时首先运行的代码称为“入口点”。

您可以使用以下方法注册本地入口点
[`@app.local_entrypoint()`](/docs/sdk/py/latest/App#local_entrypoint)
装饰师。您还可以使用常规模态函数作为入口点，其中
只有全局范围内的代码才会在本地执行。

### 参数解析

如果您的入口点函数采用原始类型的参数，`modal run`
自动将它们解析为 CLI 选项。例如，以下函数
可以用`modal run script.py --foo 1 --bar "hello"`调用：

```python
# script.py

@app.local_entrypoint()
def main(foo: int, bar: str):
    some_modal_function.remote(foo, bar)
```

如果您希望使用自己的参数解析库，例如 `argparse`，您可以接受入口点或函数的可变长度参数列表。在这种情况下，Modal 会跳过 CLI 解析并将 CLI 参数作为字符串元组转发。例如，可以使用`modal run my_file.py --foo=42 --bar="baz"`调用以下函数：

```python
import argparse

@app.function()
def train(*arglist):
    parser = argparse.ArgumentParser()
    parser.add_argument("--foo", type=int)
    parser.add_argument("--bar", type=str)
    args = parser.parse_args(args = arglist)
```

### 手动指定入口点

如果只有一个`local_entrypoint`注册，
[`modal run script.py`](/docs/cli/latest/run) 将自动使用它。如果
您没有指定入口点，只有一个装饰模态函数，
将被用作远程入口点。否则，您可以直接
`modal run` 使用特定的入口点。

例如，如果您有一个用以下修饰的函数
文件中的 [`@app.function()`](/docs/sdk/py/latest/App#function)：

```python
# script.py

@app.function()
def f():
    print("Hello world!")


@app.function()
def g():
    print("Goodbye world!")


@app.local_entrypoint()
def main():
    f.remote()
```
运行 [`modal run script.py`](/docs/cli/latest/run) 将执行 `main`
本地函数，这将远程调用`f`函数。不过你可以
而是运行 `modal run script.py::app.f` 或 `modal run script.py::app.g`
直接执行`f`或`g`。

## 应用程序曾经是存根

客户端中的`modal.App`类以前称为`modal.Stub`。的
旧名称作为别名保留了一段时间，但从 Modal 1.0.0 开始，
使用 `modal.Stub` 会导致错误。