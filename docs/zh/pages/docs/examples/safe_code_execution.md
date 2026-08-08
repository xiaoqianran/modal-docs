<!-- modal-docs: machine-translated zh-CN from English source -->

# 在沙盒环境中运行任意代码

这个例子演示了如何运行任意代码
在模态 [沙盒](https://modal.com/docs/guide/sandbox) 中使用多种语言。

## 设置多语言环境

沙箱允许我们在安全的环境中运行任何类型的代码。
我们将使用具有几种不同语言运行时的图像来演示这一点。

```python
import modal

image = modal.Image.debian_slim(python_version="3.11").apt_install(
    "nodejs", "ruby", "php"
)
app = modal.App.lookup("example-safe-code-execution", create_if_missing=True)

```

我们现在将使用此图像创建一个沙箱。我们还将启用输出，以便我们可以看到图像构建
日志。请注意，我们不会向沙箱传递任何命令，因此它将保持活动状态，等待我们
向其发送命令。

```python
with modal.enable_output():
    sandbox = modal.Sandbox.create(app=app, image=image)

print(f"Sandbox ID: {sandbox.object_id}")

```## 在沙箱中运行 bash、Python、Node.js、Ruby 和 PHP

我们现在可以使用 [`Sandbox.exec`](https://modal.com/docs/reference/modal.Sandbox#exec) 来运行一些不同的
沙盒中的命令。

```python
bash_ps = sandbox.exec("echo", "hello from bash")
python_ps = sandbox.exec("python", "-c", "print('hello from python')")
nodejs_ps = sandbox.exec("node", "-e", 'console.log("hello from nodejs")')
ruby_ps = sandbox.exec("ruby", "-e", "puts 'hello from ruby'")
php_ps = sandbox.exec("php", "-r", "echo 'hello from php';")

print(bash_ps.stdout.read(), end="")
print(python_ps.stdout.read(), end="")
print(nodejs_ps.stdout.read(), end="")
print(ruby_ps.stdout.read(), end="")
print(php_ps.stdout.read(), end="")
print()

```

输出应该类似于

```
hello from bash
hello from python
hello from nodejs
hello from ruby
hello from php
```

我们可以同时使用多种语言来构建复杂的应用程序。
让我们通过使用 bash 在 Python 和 Node.js 之间传输数据来演示这一点。这里
我们使用 Python 生成一些随机数，并使用 Node.js 将它们求和。

```python
combined_process = sandbox.exec(
    "bash",
    "-c",
    """python -c 'import random; print(\" \".join(str(random.randint(1, 100)) for _ in range(10)))' |
    node -e 'const readline = require(\"readline\");
    const rl = readline.createInterface({input: process.stdin});
    rl.on(\"line\", (line) => {
      const sum = line.split(\" \").map(Number).reduce((a, b) => a + b, 0);
      console.log(`The sum of the random numbers is: ${sum}`);
      rl.close();
    });'""",
)

result = combined_process.stdout.read().strip()
print(result)

```

对于长时间运行的进程，您可以使用 stdout 作为迭代器来流式传输输出。

```python
slow_printer = sandbox.exec(
    "ruby",
    "-e",
    """
    10.times do |i|
      puts "Line #{i + 1}: #{Time.now}"
      STDOUT.flush
      sleep(0.5)
    end
    """,
)

for line in slow_printer.stdout:
    print(line, end="")

```

这应该打印类似的内容

```
Line 1: 2024-10-21 15:30:53 +0000
Line 2: 2024-10-21 15:30:54 +0000
...
Line 10: 2024-10-21 15:30:58 +0000
```

由于沙箱与我们系统的其他部分安全地分开，
我们可以在其中运行非常危险的代码！

```python
sandbox.exec("rm", "-rfv", "/", "--no-preserve-root")

```

该命令已删除整个文件系统，因此我们无法运行更多命令。
让我们终止沙盒以进行清理。

```python
sandbox.terminate()

```