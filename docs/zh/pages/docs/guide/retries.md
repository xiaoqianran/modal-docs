<!-- modal-docs: machine-translated zh-CN from English source -->

# 失败和重试

失败是生活的一部分。有时你只需要重试。本指南页面记录了如何在 Modal 上执行此操作。

有关 `modal.Retries` 对象的参考文档，请参阅[本页](/docs/sdk/py/latest/Retries)。

## 使用 `retries` 自动从薄片中恢复

如果您设置了，您可以将 Modal 配置为自动重试功能失败
声明函数时的`retries`选项：

```python
@app.function(retries=3)
def my_flaky_function():
    pass
```

显示的基本配置在重试尝试之间提供固定的 1 秒延迟。
用于对重试延迟进行细粒度控制，包括指数退避
配置，使用[`modal.Retries`](/docs/sdk/py/latest/Retries)。

## 处理`Function.map`中的失败

默认情况下，失败会传播回调用者。
要将异常视为成功结果并将其聚合到结果列表中，
传入 [`return_exceptions=True`](/docs/guide/scale#exceptions)。

与 [`Function.map()`](/docs/guide/scale#parallel-execution-of-inputs) 一起使用时，
每个输入都会独立重试。

## 容器崩溃

如果 `modal.Function` 容器崩溃（在启动时，例如在全局范围内处理导入时，或在执行期间，例如内存不足错误），
Modal 将重新安排容器及其当前分配的任何工作。
对于[临时应用程序](/docs/guide/apps#ephemeral-apps)，将重试容器崩溃，直到超过故障率，
之后，所有挂起的输入都将失败，并且异常将传播给调用者。

对于[部署的应用程序](/docs/guide/apps#deployed-apps)，容器崩溃将无限期地重试，以免中断服务。
相反，模态将应用崩溃循环退避，并且为该函数创建新容器的速度将会减慢。
崩溃循环容器显示在[应用程序仪表板](/apps) 中。