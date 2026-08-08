<!-- modal-docs: machine-translated zh-CN from English source -->

# 动态功能配置

模态函数配置的许多方面都可以从特定的调用站点动态配置。这在函数的[计算资源](/docs/guide/resources)、[秘密](/docs/guide/secrets)、[超时](/docs/guide/timeouts)或其他属性需要根据特定输入而变化的情况下非常有用。

## 基本配置

[`@app.function()`](/docs/sdk/py/latest/App#function) 装饰器中公开的功能可以在运行时使用 [`modal.Function.with_options()`](/docs/sdk/py/latest/Function#with_options) 方法动态配置。

假设您有以下定义：

```python
@app.function()
def f(x: int) -> int:
    return x ** 2
```

如果（出于某种原因）您想在多个不同的 GPU 上比较此函数的输出，您可以使用不同的配置多次调用它：

```python continuation
@app.local_entrypoint()
def main():
    for gpu in ["T4", "L4", "A10"]:
        result = f.with_options(gpu=gpu).remote(2)
        print(f"Result with {gpu} GPU: {result}")
```

此示例在应用程序运行后创建基本函数的三个附加变体。这些变体是按需创建的“新功能”。基本功能本身不受影响。如果您直接调用`f.remote()`，它将在没有 GPU 的情况下继续执行。

也可以在查找后从调用站点动态配置已部署的函数：

```python notest
deployed_f = modal.Function.from_name("demo-app", "f")
for gpu in ["T4", "L4", "A10"]:
    result = deployed_f.with_options(gpu=gpu).remote(2)
    print(f"Result with {gpu} GPU: {result}")
```

## 输入并发和批处理
还可以动态配置[输入并发](/docs/guide/concurrent-inputs) 或[批处理](/docs/guide/dynamic-batching)。由于这些功能是通过单独的装饰器（[`@modal.concurrent()`](/docs/sdk/py/latest/concurrent)/[`@modal.batched()`](/docs/sdk/py/latest/batched)）启用的，因此它们的动态配置通过单独的方法运行（[`modal.Function.with_concurrency()`]（/docs/sdk/py/latest/Function#with_concurrency）/[`modal.Function.with_batching()`]（/docs/sdk/py/latest/Function#with_batching））：

```python notest
concurrent_f = modal.Function.from_name("demo-app", "f").with_concurrency(max_inputs=32)
```

如果按顺序调用多个动态配置方法，它们的参数将组合并形成单个配置：

```python notest
# This Function uses a GPU with input concurrency
concurrent_f.with_options(gpu="H100").remote(...)
```

## 自动缩放注意事项

每个不同的配置都有自己专用的自动缩放容器池。默认情况下，容器池将根据基本功能的配置自动缩放，并单独计费。例如，如果您的函数具有 `@app.function(max_containers=5)` 并且您使用 `f.with_options(gpu="H100")` 动态添加 GPU，则无论当前运行多少个 CPU 容器，您都将获得最多 5 个*额外* H100 容器。
尽量避免生成过多的细粒度配置，以便您可以从容器共享中受益，从而提高利用率并减少冷启动延迟。例如，如果请求特定于输入的 `memory=` 或 `cpu=` 资源，最好舍入到粗桶中。

在单独进程中查找和动态配置的函数如果应用相同的配置，仍将共享容器。

如果您的基本 Function 配置设置了 `min_containers`，则 Function 变体将忽略它，以避免创建僵尸热池。出于同样的原因，无法在`modal.Function.with_options()`中设置`min_containers`。

可以使用 `modal.Function.with_options()` 动态配置自动缩放行为的其他方面。例如，如果您不希望重复使用该变体，则可以减少 `scaledown_window` 以便容器更快关闭。但是，如果您的目标是随着时间的推移使用不同的自动缩放策略，则使用 [`modal.Function.update_autoscaler`](/docs/sdk/py/latest/Function#update_autoscaler) 修改基本 Function 的行为可能会更简单。

## 动态Cls配置
还可以动态配置`modal.Cls`。如果 Cls 是参数化的（/docs/guide/parametrized-functions）（它还创建一个具有自己的容器池和自动缩放会计的新 Function 变体），则动态选项将与参数值组成：

```python notest
ModelCls = modal.Cls.from_name("demo-app", "ModelCls")
model = ModelCls.with_options(gpu="H100")(size="8B")
```