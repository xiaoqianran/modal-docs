<!-- modal-docs: machine-translated zh-CN from English source -->

# 异步API使用

Modal 中的所有功能在标准（阻塞）和
异步变体。可以通过附加`.aio`来访问异步接口
到 Modal API 中的任何函数。

例如，在阻塞中代替 `my_modal_function.remote("hello")`
上下文，你可以使用 `await my_modal_function.remote.aio("hello")` 来获取
异步协程响应，与 Python 的 `asyncio` 库一起使用。

```python
import asyncio
import modal

app = modal.App()


@app.function()
async def myfunc():
    ...


@app.local_entrypoint()
async def main():
    # execute 100 remote calls to myfunc in parallel
    await asyncio.gather(*[myfunc.remote.aio() for i in range(100)])
```

这是一项高级功能。如果您对异步感到满意
编程，您可以使用它来创建任意并行执行模式，
额外的好处是任何模态函数都可以远程执行。

## 异步函数

无论您在使用 *Modal 时是否使用异步运行时（如 `asyncio`）
本身*，您可以自由定义您的 `app.function` 装饰的函数体
作为异步或阻塞。两种定义都适用于远程
来自任何上下文的模态函数调用。

异步函数可以调用阻塞函数，反之亦然。

```python
@app.function()
def blocking_function():
    return 42


@app.function()
async def async_function():
    x = await blocking_function.remote.aio()
    return x * 10


@app.local_entrypoint()
def blocking_main():
    print(async_function.remote())  # => 420
```

如果函数配置为支持每个容器多个并发输入，
阻塞上下文和异步上下文之间的行为略有不同：

* 在阻塞上下文中，并发输入将在单独的 Python 线程上运行。
这些都受 GIL 的约束，但如果出现以下情况，它们仍然可能导致竞争条件：
  与非线程安全对象一起使用。
* 在异步上下文中，并发输入被简单地安排为协程
  执行者线程。一切都保持单线程。