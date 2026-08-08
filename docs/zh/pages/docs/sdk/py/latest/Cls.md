<!-- modal-docs: machine-translated zh-CN from English source -->

# CLs

```python
class Cls(modal.object.Object)
```

Cls 添加了方法池和 [生命周期钩子](https://modal.com/docs/guide/lifecycle-functions) 行为
到 [modal.Function](https://modal.com/docs/sdk/py/latest/Function)。

通常，您不会直接构造 Cls。
相反，请在 App 对象上使用 [`@app.cls()`](https://modal.com/docs/sdk/py/latest/App#cls) 装饰器。

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作
需要时会懒洋洋地补充水分。主要用例是当您需要时
访问对象元数据，例如其 ID。

*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 来自\_name```python
from_name(cls, app_name, name, *, version=None, environment_name=None,
    client=None)
```

通过名称引用已部署应用程序中的 Cl。

这是一种延迟对局部进行补水的惰性方法
具有来自 Modal 服务器的元数据的对象，直到第一个
实际使用的时间。

**参数**

<Parameter name="app_name" type="str" description="Name of the deployed App that defines this class." />
<Parameter name="name" type="str" description="Object tag of the Cls within that App." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Workspace environment for the lookup; defaults to the active environment." />
<Parameter name="client" type="&quot;_Client | None&quot;" defaultValue="None" description="Optional Modal client; defaults to the process client." />

**退货**

首次使用时可补水的`Cls`参考。

**使用**

```python
Model = modal.Cls.from_name("other-app", "Model")
```

`version`参数构造一个版本固定的Cls：

```python
Modelv3 = modal.Cls.from_name("other-app", "Model", version=3)
```

## 带有\_选项

```python
with_options(self, *, cpu=None, memory=None, gpu=None, env=None, secrets=None,
    volumes={}, retries=None, max_containers=None, buffer_containers=None,
    scaledown_window=None, timeout=None, region=None, cloud=None,
    routing_region=None)
```

使用特定于调用的值覆盖静态 Cls 配置。

此方法将返回 Cls 的新变体，该变体将独立于
基本配置。
请注意，无法使用此方法“取消设置”选项（即，如果在
`@app.cls()`装饰器，在这里传递`gpu=None`不会创建仅CPU实例）。

后面调用的容器参数（`volumes` 和 `secrets`）会替换之前的值；它们没有合并。

**参数**

<Parameter name="cpu" type="float | tuple[float, float] | None" defaultValue="None" description="CPU cores for instances created from this Cls (see `⟦T20⟧⟦T21⟧⟦T22⟧` resource options)." />
<Parameter name="memory" type="int | tuple[int, int] | None" defaultValue="None" description="Memory in MiB, or min/max pair, for those instances." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type string, for example `⟦T23⟧`." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables merged into a temporary secret for this configuration." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Additional secrets attached to the service function." />
<Parameter name="volumes" type="dict[str | PurePosixPath, _Volume | _CloudBucketMount]" defaultValue="&#123;&#125;" description="Volume and cloud-bucket mounts (paths to `⟦T24⟧⟦T25⟧⟦T26⟧`)." />
<Parameter name="retries" type="int | Retries | None" defaultValue="None" description="Retry policy or count for invocations." />
<Parameter name="max_containers" type="int | None" defaultValue="None" description="Cap on concurrently running containers for this Cls configuration." />
<Parameter name="buffer_containers" type="int | None" defaultValue="None" description="Extra idle containers kept warm while the Function is active." />
<Parameter name="scaledown_window" type="int | None" defaultValue="None" description="Seconds a container may stay idle before scaling down." />
<Parameter name="timeout" type="int | None" defaultValue="None" description="Function timeout in seconds." />
<Parameter name="region" type="str | Sequence[str] | None" defaultValue="None" description="One region or a list of regions to schedule on." />
<Parameter name="cloud" type="str | None" defaultValue="None" description="Cloud provider (for example `⟦T27⟧⟦T28⟧⟦T29⟧⟦T30⟧⟦T31⟧⟦T32⟧⟦T33⟧`)." />
<Parameter name="routing_region" type="str | None" defaultValue="None" description="Region that inputs and outputs are routed through for this Cls." />

**退货**

带有合并选项的新`Cls`。

**使用**

从已部署的应用程序中查找 Cls 后或者如果您有从另一个函数或其应用程序上的本地入口点直接引用 Cls：

```python notest
Model = modal.Cls.from_name("my_app", "Model")
ModelUsingGPU = Model.with_options(gpu="A100")
ModelUsingGPU().generate.remote(input_prompt)  # Run with an A100 GPU
```

可以多次调用该方法来“堆栈”更新：

```python notest
Model.with_options(gpu="A100").with_options(scaledown_window=300)  # Use an A100 with slow scaledown
```

## 与\_并发

```python
with_concurrency(self, *, max_inputs, target_inputs=None)
```

使用特定于调用的输入并发设置覆盖静态 Cls 配置。

**参数**

<Parameter name="max_inputs" type="int" description="Maximum number of inputs processed concurrently per container." />
<Parameter name="target_inputs" type="int | None" defaultValue="None" description="Optional target concurrency; see `⟦T35⟧` / Function concurrency docs." />

**退货**

具有合并并发设置的新 `Cls`。

**使用**

```python notest
Model = modal.Cls.from_name("my_app", "Model")
ModelUsingGPU = Model.with_options(gpu="A100").with_concurrency(max_inputs=100)
ModelUsingGPU().generate.remote(42)  # will run on an A100 GPU with input concurrency enabled
```

## 与\_batching

```python
with_batching(self, *, max_batch_size, wait_ms)
```

使用特定于调用的动态批处理设置覆盖静态 Cls 配置。

**参数**

<Parameter name="max_batch_size" type="int" description="Maximum batch size for dynamic batching." />
<Parameter name="wait_ms" type="int" description="Maximum time to wait to fill a batch, in milliseconds." />

**退货**

具有合并批处理设置的新`Cls`。

**使用**

```python notest
Model = modal.Cls.from_name("my_app", "Model")
ModelUsingGPU = Model.with_options(gpu="A100").with_batching(max_batch_size=100, wait_ms=1000)
ModelUsingGPU().generate.remote(42)  # A100 with dynamic batching
```