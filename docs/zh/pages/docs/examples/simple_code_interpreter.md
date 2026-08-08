<!-- modal-docs: machine-translated zh-CN from English source -->

# 构建一个有状态的沙盒代码解释器

此示例演示如何使用 Modal 构建有状态代码解释器
[沙盒](https://modal.com/docs/guide/sandbox)。

我们将创建一个模态沙箱来侦听要执行的代码，然后
在 Python 解释器中执行代码。因为我们在沙盒中运行
环境中，我们可以安全地使用“不安全”的`exec()`来执行代码。

## 在模态沙箱中设置代码解释器

我们的代码解释器使用Python“驱动程序”来监听代码
以 JSON 格式发送到其标准输入 (`stdin`)，执行代码，然后在标准输出（`stdout`）上以 JSON 格式返回结果。

```python
import inspect
import json
import sys
from typing import Any, Iterator

import modal


def driver_program():
    import json
    import sys
    from contextlib import redirect_stderr, redirect_stdout
    from io import StringIO

    # When you `exec` code in Python, you can pass in a dictionary
    # that defines the global variables the code has access to.

    # We'll use that to store state.

    globals: dict[str, Any] = {}
    while True:
        command = json.loads(input())  # read a line of JSON from stdin
        if (code := command.get("code")) is None:
            print(json.dumps({"error": "No code to execute"}))
            continue

        # Capture the executed code's outputs
        stdout_io, stderr_io = StringIO(), StringIO()
        with redirect_stdout(stdout_io), redirect_stderr(stderr_io):
            try:
                exec(code, globals)
            except Exception as e:
                print(f"Execution Error: {e}", file=sys.stderr)

        print(
            json.dumps(
                {"stdout": stdout_io.getvalue(), "stderr": stderr_io.getvalue()}
            ),
            flush=True,
        )


```

我们在[Modal Sandbox](https://modal.com/docs/guide/sandboxes)中运行这个驱动程序。

```python
app = modal.App.lookup("example-simple-code-interpreter", create_if_missing=True)
sb = modal.Sandbox.create(app=app)

```

我们必须将驱动程序转换为字符串才能将其传递到沙箱。
这里我们使用`inspect.getsource`来获取字符串形式的源代码，
但您也可以将驱动程序保存在单独的文件中并读取它。

```python
driver_program_text = inspect.getsource(driver_program)
driver_program_command = f"""{driver_program_text}\n\ndriver_program()"""

```

然后我们用[`Sandbox.exec`](https://modal.com/docs/reference/modal.Sandbox#exec)开始程序，
它在沙箱内创建一个进程（参见[`modal.container_process`](https://modal.com/docs/reference/modal.container_process)
了解详情）。

```python
p = sb.exec("python", "-c", driver_program_command, bufsize=1)

```

## 在模态沙箱中运行代码

现在我们需要一种在正在运行的驱动程序进程中运行代码的方法。
我们的驱动程序已经在其`stdin`和`stdout`上定义了JSON接口，
所以我们只需要编写一个快速包装器来写入远程`stdin`
并从遥控器`stdout`读取。

```python
reader, writer = p.stdin, iter(p.stdout)


def run_code(writer: modal.io_streams.StreamWriter, reader: Iterator[str], code: str):
    writer.write(json.dumps({"code": code}) + "\n")
    writer.drain()
    result = json.loads(next(reader))
    print(result["stdout"], end="")
    if result["stderr"]:
        print("\033[91m" + result["stderr"] + "\033[0m", end="", file=sys.stderr)


```

现在我们可以在沙箱中执行一些代码了！

```python
run_code(reader, writer, "print('hello, world!')")  # hello, world!

```

沙盒和我们的代码解释器是有状态的，
这样我们就可以定义变量并在后续代码中使用它们。

```python
run_code(reader, writer, "x = 10")
run_code(reader, writer, "y = 5")
run_code(reader, writer, "result = x + y")
run_code(reader, writer, "print(f'The result is: {result}')")  # The result is: 15

```

当代码失败时我们还可以看到错误。

```python
run_code(reader, writer, "print('Attempting to divide by zero...')")
run_code(reader, writer, "1 / 0")  # Execution Error: division by zero

```

最后，让我们清理一下并终止沙盒。

```python
sb.terminate()

```