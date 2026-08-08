<!-- modal-docs: machine-translated zh-CN from English source -->

# 超时

所有模态 [Function](/docs/sdk/py/latest/Function) 执行都有默认值
执行超时为 300 秒（5 分钟），但用户可以指定超时
持续时间在 1 秒到 24 小时之间。

```python
import time


@app.function()
def f():
    time.sleep(599)  # Timeout!


@app.function(timeout=600)
def g():
    time.sleep(599)
    print("*Just* made it!")
```

超时持续时间是函数“执行”时间的度量。它不
包括计划时间或除代码执行时间之外的任何其他时间段
在模态中执行。此持续时间也是每次执行尝试，意味着
使用 [`modal.Retries`](/docs/sdk/py/latest/Retries) 配置的函数将
每次重试时启动新的执行超时。例如，无限循环
具有 100 秒超时和 3 次允许重试的函数将运行至少 400
模态内的秒数。

### 容器启动超时

函数的 `startup_timeout` 配置容器的*启动*时间。你的容器
可能需要很长时间才能启动，因为它正在加载大量数据，初始化
大型模型或导入许多包。在这些情况下，您可以延长
您的函数的`startup_timeout`。

```python
@app.cls(startup_timeout=30, timeout=10)
class MyFunction:
    @modal.enter()
    def startup(self):
        time.sleep(20)

    @modal.method()
    def f(self):
        time.sleep(1)
```

v1.1.4 中添加了`startup_timeout`。在 v1.1.4 之前，`timeout` 配置
*执行*时间和*启动*时间。如果`startup_timeout`未设置，`timeout`将
两次仍然配置。

## 处理超时
在用尽任何指定的重试后，函数中的超时将产生
`modal.exception.FunctionTimeoutError` 您可能会在代码中发现它。

```python
import modal.exception


@app.function(timeout=100)
def f():
    time.sleep(200)  # Timeout!


@app.local_entrypoint()
def main():
    try:
        f.remote()
    except modal.exception.FunctionTimeoutError:
        ... # Handle the timeout.
```

## 超时准确率

只要超时允许，函数将*至少*运行，但它们可能会
多跑几秒。如果您需要准确且精确的超时
函数执行的持续时间，建议您实施
用户代码中的超时逻辑。