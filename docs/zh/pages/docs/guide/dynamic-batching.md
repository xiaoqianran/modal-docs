<!-- modal-docs: machine-translated zh-CN from English source -->

# 动态批处理

Modal 的 `@batched` 功能可以让你累积请求
并以动态大小的批次处理它们，而不是逐一处理。

批处理可以提高吞吐量，但会带来潜在的延迟成本。
批量请求可以共享资源并重用工作，从而减少每个请求的时间和成本。
批处理对于 GPU 加速的机器学习工作负载特别有用，
由于 GPU 旨在最大化吞吐量，并且经常在共享资源上遇到瓶颈，
就像存储在内存中的权重一样。

静态批处理可能会导致无限制的延迟，因为该函数会等待固定数量的请求到达。
Modal 的动态批处理在执行之前等待固定时间*或*固定数量的请求（以较小者为准），
最大化批处理的吞吐量优势，同时最小化延迟损失。

## 使用 `@batched` 启用动态批处理

要启用动态批处理，请应用
[`@modal.batched` 装饰器](/docs/sdk/py/latest/batched) 到目标
Python 函数。然后，将其包装在`@app.function()`中并在Modal上运行，
输入会被累积并分批处理。

看起来是这样的：

```python
import modal

app = modal.App()

@app.function()
@modal.batched(max_batch_size=2, wait_ms=1000)
async def batch_add(xs: list[int], ys: list[int]) -> list[int]:
    return [x + y for x, y in zip(xs, ys)]
```
当您调用用 `@batched` 修饰的函数时，您可以在各个输入上异步调用它。
输出返回到调用它们的地方。

例如，下面的代码调用了上面修饰的 `batch_add` 函数 3 次，但是 `batch_add`
只执行两次：

```python continuation
@app.local_entrypoint()
async def main():
    inputs = [(1, 300), (2, 200), (3, 100)]
    async for result in batch_add.starmap.aio(inputs):
        print(f"Sum: {result}")
        # Sum: 301
        # Sum: 202
        # Sum: 103
```

第一次执行时，`xs`批处理为`[1, 2]`
并将`ys`批处理为`[300, 200]`。大约延迟一秒后，执行`xs`
批量到`[3]`，`ys`批量到`[100]`。
结果是一个生成 `301`、`202` 和 `103` 的迭代器。

## 将 `@batched` 与接受和返回列表的函数一起使用对于与 `@modal.batched` 兼容的 Python 函数，它必须遵守
以下规则：

* \*\* 函数的输入必须是列表。 \*\*
  在上面的例子中，我们传递了`xs`和`ys`，它们都是`int`的列表。
* \*\* 该函数必须返回一个列表\*\*。在上面的例子中，函数返回
  总和列表。
* \*\* 所有输入列表和输出列表的长度必须相同。 \*\*
  在上面的例子中，如果`L == len(xs) == len(ys)`，则`L == len(batch_add(xs, ys))`。

## Modal `Cls` 方法与动态批处理兼容

Modal [`Cls`](/docs/guide/lifecycle-functions)es 上的方法也支持动态批处理。

```python
import modal

app = modal.App()

@app.cls()
class BatchedClass():
    @modal.batched(max_batch_size=2, wait_ms=1000)
    async def batch_add(self, xs: list[int], ys: list[int]) -> list[int]:
        return [x + y for x, y in zip(xs, ys)]
```
另一项规则适用于具有批处理方法的类：

* 如果一个类有一个批处理方法，它**不能有其他批处理方法或[方法](/docs/sdk/py/latest/method)**。

## 配置动态批次的等待时间和批次大小

`@batched` 装饰器接受两个必需的配置参数：

* `max_batch_size` 限制组合成单个批次的输入数量。
* `wait_ms` 限制函数等待更多输入的时间
  收到第一个输入。

第一次调用批处理函数会启动一个新的批处理，随后
调用将请求添加到此正在进行的批次中。如果达到`max_batch_size`，
该批处理立即执行。如果不满足`max_batch_size`但满足`wait_ms`
自第一个请求添加到批次以来已经过去了，未填充的批次是
被执行。

### 选择批量配置

要优化应用程序的批处理配置，请考虑以下启发式：

* 将 `max_batch_size` 设置为你的函数可以处理的最大值，这样你
  可以分摊和并行尽可能多的工作。

* 将 `wait_ms` 设置为目标延迟和执行时间之间的差值。大多数应用
有目标延迟，这允许任何请求的延迟保持不变
  在这个限度内。

## 通过动态批处理提供 Web Functions

这是一个提供动态批处理请求的函数的简单示例
带有 [`@modal.fastapi_endpoint`](/docs/guide/webhooks)。运行
[`modal serve`](/docs/cli/latest/serve)，向端点提交请求，
该函数将即时批处理您的请求。

```python
import modal

app = modal.App(image=modal.Image.debian_slim().pip_install("fastapi"))

@app.function()
@modal.batched(max_batch_size=2, wait_ms=1000)
async def batch_add(xs: list[int], ys: list[int]) -> list[int]:
    return [x + y for x, y in zip(xs, ys)]


@app.function()
@modal.fastapi_endpoint(method="POST", docs=True)
async def add(body: dict[str, int]) -> dict[str, int]:
    result = await batch_add.remote.aio(body["x"], body["y"])
    return {"result": result}
```

现在，您可以向Web Function提交请求并批量处理它们。例如，三个请求
在以下示例中，这可能是来自实际部署中并发客户端的请求，
将被分批分为两次执行：

```python notest
import asyncio
import aiohttp

async def send_post_request(session, url, data):
    async with session.post(url, json=data) as response:
        return await response.json()

async def main():
    # Enter the Web Function URL here
    url = "https://workspace--app-name-endpoint-name.modal.run"

    async with aiohttp.ClientSession() as session:
        # Submit three requests asynchronously
        tasks = [
            send_post_request(session, url, {"x": 1, "y": 300}),
            send_post_request(session, url, {"x": 2, "y": 200}),
            send_post_request(session, url, {"x": 3, "y": 100}),
        ]
        results = await asyncio.gather(*tasks)
        for result in results:
            print(f"Sum: {result['result']}")

asyncio.run(main())
```