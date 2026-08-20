<!-- modal-docs: machine-translated zh-CN from English source -->

# 模态函数

模态函数使用高度可扩展的无服务器云计算执行 Python 代码。

准备在 Modal 上运行的函数非常简单，只需定义一个 [App](/docs/guide/apps) 并使用 [`@app.function()`](/docs/sdk/py/latest/App#function) 装饰器注册该函数即可：

```python
app = modal.App("basic-function")

@app.function()
def f(x: int, exp: int) -> int:
    return x**exp
```

包装后的函数成为一个 [`modal.Function`](/docs/sdk/py/latest/Function)，可以从本地脚本调用，也可以根据其他应用程序的需要进行部署和调用，就好像它是其代码库的一部分一样。

当您调用该函数时，Modal 会处理所有操作细节：启动容器、路由输入以及传播任何异常。如果您不发送更多输入，该函数将自动缩放为零，这样就不会产生持续成本。有关函数调用、其生成的任何日志以及丰富的容器指标的信息都会自动捕获并呈现在多个可观察性表面上。

## 配置函数运行时
函数运行时通过 [`@app.function()`](/docs/sdk/py/latest/App#function) 装饰器的参数进行配置。有关容器环境和函数可用资源的所有内容都可以在 Python 代码库中定义，而无需引用外部配置文件。

函数接收 [CPU 和内存](/docs/guide/resources) 的基线分配。对于简单任务来说，显式资源配置不是必需的，因为函数可以在需要时机会性地突破此基线。可以为较繁重的作业配置额外的资源以保证可用性：

```python
@app.function(cpu=16, memory=32768)  # 16 physical cores, 32 GiB of RAM
def f():
    ...
```

还可以使用一个或多个 [GPU](/docs/guide/gpu) 来配置函数：

```python
@app.function(gpu="H200:8")
def f():
    ...
```

函数在任意容器环境中执行，如函数的 [Image](/docs/guide/images) 所定义。应用程序中的每个功能都可以有自己的图像。图像可以包含资源，包括来自 PyPI 或私有存储库的 Python 库、FFmpeg 或 OpenCV 等二进制依赖项以及从本地系统复制的数据：

```python
image  = (
    modal.Image.debian_slim()
    .uv_sync()
    .apt_install("ffmpeg")
    .add_local_dir("data", "/data")
)

@app.function(image=image)
def f():
    ...
```

如果该函数配备了 GPU，则会自动包含 [CUDA 驱动程序](/docs/guide/cuda)。
默认情况下，Modal 在容器中包含 Function 的源。根据[项目结构](/docs/guide/project-struct)，这将是定义函数实现的脚本文件或整个包。因此，函数不需要是独立的，并且可以引用其模块中的其他资源。

可以使用 Modal [Volume](/docs/guide/volumes) 或 [CloudBucketMount](/docs/guide/cloud-bucket-mounts) 将较大的数据集（例如模型权重）安装到容器中：

```python
vol = modal.Volume.from_name("model-weights")

@app.function(volumes={"/models": vol})
def f():
    ...
```

环境变量可以在容器运行时中定义，方法是将它们作为安全的 [Secrets](/docs/guide/secrets) 传递或直接设置它们：

```python
api_key = modal.Secret.from_name("api-key")

@app.function(secrets=[api_key], env={"LOG_LEVEL": "info"})
def f():
    ...
```

## 函数调用

模态函数由其中一种[调用方法](/docs/guide/function-invocation-methods)调用，例如[`f.remote()`](/docs/sdk/py/latest/Function#remote)或[`f.spawn()`](/docs/sdk/py/latest/Function#spawn)。当被同一 App 中的另一个 Function 或本地入口点引用时，可以直接调用 Function：

```python
@app.function()
def f() -> str:
    return "Hello from a Modal container"

@app.function()
def g() -> str:
    return f.remote()

@app.local_entrypoint()
def main():
    print(g.remote())
```

可以使用应用程序和函数名称从另一个应用程序或在 [lookup](/docs/guide/trigger-deployed-functions) 后从 Modal 外部调用函数：

```python notest
f = modal.Function.from_name("prod-app", "f")
result = f.remote()
```
远程查找和调用还可以通过我们的 [JavaScript](/docs/sdk/js/latest) 和 [Go](/docs/sdk/go/latest) SDK 执行，允许您在用其他语言编写的应用程序中执行利用 Python 人工智能生态系统的代码：

<CodeTabs>
  {#snippet javascript()}

```javascript notest
const f = await modal.functions.fromName("prod-app", "f");
result = await f.remote();
```

{/片段}

{#snippet go()}

```go notest
f, _ := mc.Functions.FromName(ctx, "prod-app", "f", nil)
result, err := f.Remote(ctx, nil, nil)
```

{/片段} </CodeTabs>

应用 [Web Function](/docs/guide/webhooks) 装饰器之一为该函数分配一个 URL，并允许您通过 HTTP 从任何地方调用它：

```python
image = modal.Image.debian_slim().uv_pip_install("fastapi[standard]")

@app.function(image=image)
@modal.fastapi_endpoint()
def f() -> dict[str, str]:
    return {"message": "Hello from a Modal container"}
```

请注意，Web Functions 默认情况下向 Internet 开放，但它们可以选择要求通过 [代理令牌](/docs/guide/webhook-proxy-auth) 进行身份验证。

Web Functions 旨在方便地将简单的 Python 函数公开为 Web 服务；对于高并发或延迟敏感的应用程序，请使用 Modal 的 [Server](/docs/guide/servers) 原语。

函数也可以按计划自动调用，类似于 cron 作业：

```python
@app.function(schedule=modal.Cron("0 6 * * *", timezone="America/New_York"))
def f():
    ...
```

## 执行语义

模态函数抽象了可靠的云计算编排的几个原则，以呈现一个看起来像本地 Python 函数调用的输入/输出接口。
函数调用将通过您的 Modal 令牌/秘密凭证自动进行身份验证，并根据您的 [RBAC](/docs/guide/rbac) 配置进行授权。 Function实现不需要进行访问控制。

Modal 负责调度容器并将输入路由到它们。默认情况下，函数容器可以在我们的全球队列中的任何位置启动，从而最大限度地提高可用性并最大限度地减少调度延迟。限制容器调度，例如为了合规性，[配置计算和路由区域](/docs/guide/region-selection)：

```python
@app.function(region="eu", routing_region="eu-west")
def f():
    ...
```

请注意，计算区域选择会产生[定价乘数](/docs/guide/region-selection#pricing)；路由区域选择则不然。区域选择还限制了计算池，尤其是与特定 GPU 或大型资源请求结合使用时，这可能会影响调度延迟。
由于容器调度会对输入负载做出反应，因此容器在调用时可能不可用。输入将在 Modal 的 I/O 系统中排队，直到可以分发到可用容器。如果输入入队太快或队列已满，它们将被拒绝并显示 [`ResourceExhaustedError`](/docs/sdk/py/latest/exception#resourceexhaustederror)。对于批量工作负载，更喜欢持久的 [`f.spawn()`](/docs/sdk/py/latest/Function#spawn) 方法，它支持更高的调用率和更深的输入队列。

Modal 对每次调用应用输入超时；不需要在调用上下文中设置超时。默认情况下超时很短（5 分钟），但对于模型训练等长时间运行的流程，超时可以延长至 24 小时：

```python
@app.function(timeout=86400)  # 24 hours
def f():
    ...
```

有时，容器在执行输入时会失败，例如由于[抢占](/docs/guide/preemption) 或内存不足 (OOM) 错误。 Modal 会自动重试容器失败时正在运行的任何输入。因此，函数实现应该是幂等的。 CPU 功能可以选择非抢占性，尽管这会产生定价乘数：

```python
@app.function(nonpreemptible=True)
def f():
    ...
```
源自 Function 实现的异常不会自动重试，但可以启用输入 [retries](/docs/guide/retries)：

```python
@app.function(retries=3)
def f():
    ...
```

## 自动缩放和并行性

模态函数默认自动缩放。正如该函数会自动启动一个容器来响应初始输入一样，如果在繁忙时收到进一步的输入，它将启动其他容器。在持续负载下，自动缩放器将管理容器池（启动容器或缩小容器）以适应波动的需求水平。

函数公开了多个选项来控制[自动缩放行为](/docs/guide/scale)。使用 `min_containers` 或 `buffer_containers` 通过保持额外的空闲容器运行来减少冷启动损失，并设置 `max_containers` 来限制高需求下的扩展：

```python
@app.function(min_containers=1, buffer_containers=1, max_containers=20)
def f():
    ...
```
容器处理完输入后，就可以重用。容器重用减少了平均延迟，因为后续输入将立即处理，而不是等待新容器启动。随着负载的减少，Modal 将逐渐缩小空闲容器的规模，如果输入完全停止，Functions 最终将缩小到零。 `scaledown_window` 控制这种行为的攻击性：

```python
@app.function(scaledown_window=600)  # Idle for longer to better handle sporadic load patterns
def f():
    ...
```

虽然大多数 Function 配置需要重新部署才能更改，但可以使用 [`f.update_autoscaler()`](/docs/sdk/py/latest/Function#update_autoscaler) 动态更新自动缩放器参数：

```python notest
f = modal.Function.from_name("prod-app", "f")
f.update_autoscaler(max_containers=50)  # Override the Function's decorator configuration
```

请注意，任何动态更新都将由后续部署重置。

由于函数可以快速自动缩放，因此它们非常适合需要扇出并行性的突发工作负载或批处理作业。面向批处理的 [`f.map()`](/docs/sdk/py/latest/Function#map) 和 [`f.spawn_map()`](/docs/sdk/py/latest/Function#spawn_map) 方法通过有效地将可迭代的输入推入 Modal 来促进并行执行：

```python notest
for result in f.map(inputs):  # Iterate in parallel and handle each result
    ...

f.spawn_map(inputs)  # Higher parallelism with durable semantics for fire-and-forget batch jobs
```
并行执行也可以使用并发模式来实现。 [`f.spawn()`](/docs/sdk/py/latest/Function#spawn) 方法返回一个 [`modal.FunctionCall`](/docs/sdk/py/latest/FunctionCall)，其作用类似于 Future：

```python notest
fc = f.spawn(x)
result = fc.get()
```

产生多个调用允许它们并行运行：

```python notest
fcs = [f.spawn(x_i) for x_i in xs]
results = modal.FunctionCall.gather(*fcs)
```

异步代码库还可以使用 Modal 的 [`aio` 接口](/docs/guide/async) 通过任何调用方法应用并发模式：

```python notest
coros = [f.remote.aio(x_i) for x_i in xs]
results = await asyncio.gather(*coros)
```

## 容器生命周期管理

虽然 Modal 容器启动时间不到一秒，但您的应用程序逻辑可能需要昂贵的额外设置，例如从磁盘加载模型权重。通过将 Function 的代码构建为类并使用 [`@app.cls()`](/docs/sdk/py/latest/App#cls) 装饰器，您可以将启动逻辑与输入处理分开：

```python
@app.cls()
class InferenceEngine:
    @modal.enter()
    def setup(self):
        self.model = load_model()

    @modal.method()
    def predict(self, text: str) -> float:
        return self.model.predict(text)
```

在此示例中，使用 [`@modal.enter()`](/docs/sdk/py/latest/enter) 装饰器包装的方法将仅运行一次，作为容器启动的一部分。在一个或多个启动方法完成之前，容器不会被视为“就绪”，并且 Modal 将在向容器发送任何输入之前等待此事件。
Cls 是通过“构造”类并调用用 [`@modal.method()`](/docs/sdk/py/latest/method) 修饰的方法来调用的。与普通函数一样，这可以是本地引用或查找：

```python notest
result = InferenceEngine().predict.remote(text)  # Refer to a Cls on the same App

InferenceEngine = modal.Cls.from_name("prod-app", "InferenceEngine")
result = InferenceEngine().predict.remote(text)  # Refer to a Cls via a lookup
```

将代码构建为类还可以让您在用 [`@modal.exit()`](/docs/sdk/py/latest/exit) 装饰器包装的方法中定义容器拆卸逻辑。这对于清理操作非常有用，例如优雅地关闭与数据库的连接。退出处理程序还可用于使您的应用程序对[容器抢占](/docs/guide/preemption) 更具弹性。

写入`self`命名空间的任何状态都将在单个容器处理的调用中持续存在，但当容器终止时它将被丢弃。状态可以使用 Modal 的分布式 [Dict](/docs/guide/dicts) 或 [Queue](/docs/guide/queues) 原语在容器之间共享。

如果函数生成不应在输入之间泄漏的本地状态，您可以设置 `single_use_containers=True`。这会导致每个容器在处理输入后终止。请注意，一次性容器会增加一些延迟和成本，因为它们无法从通过多个输入分摊容器启动中受益。

## 函数参数化
要编写模板化容器生命周期逻辑，请将 [`modal.parameter()`](/docs/sdk/py/latest/parameter) 声明添加到类中：

```python
@app.cls()
class InferenceEngine:
    model_name: str = modal.parameter()

    @modal.enter()
    def startup(self):
        self.model = load_model(self.model_name)

    @modal.method()
    def predict(self, input: str) -> float:
        ...
```

这将创建一个[参数化函数](/docs/guide/parametrized-functions)。在调用上下文中构造 Cl 时提供参数值，这会创建 Function 的特定实例：

```python notest
result = InferenceEngine(model_name="tts-large").predict.remote(text)
```

由于参数适用于整个容器生命周期，因此每组不同的参数值都对应于一个单独的、独立的自动缩放*容器池*。即使在启动时未读取参数值，也可以利用它来对函数的容器进行分区。例如，您可能希望在不同的容器中处理来自不同客户的数据：

```python notest
result = PartitionedInferenceEngine(customer_id="c-024").predict.remote(text)
```

请注意，每个函数可以拥有的不同实例的数量是有限的，因此这种方法仅适用于基数相对较低的分区方案。当参数值不会频繁重复并从容器重用中受益时，首选使用 `single_use_containers=` 进行容器隔离。

## 动态配置
更新 [`@app.function()`](/docs/sdk/py/latest/App#function) 装饰器中的配置值需要 [重新部署](/docs/guide/managing-deployments)，但也可以使用以下命令从调用站点[动态配置](/docs/guide/dynamic-function-config) 函数[`f.with_options()`](/docs/sdk/py/latest/Function#with_options)。这在特定输入或参数值需要不同资源（例如不同 GPU）的情况下非常有用：

```python notest
result = InferenceEngine(model_name="tts-large").predict.remote(text)

InferenceEngineH200 = InferenceEngine.with_options(gpu="H200")
result = InferenceEngineH200(model_name="tts-xlarge").predict.remote(text)
```

与参数化函数一样（但与自动缩放器配置的更新不同），每组不同的动态选项对应一个独立的容器池。如果动态配置 CPU 或内存，请使用一组粗略的值来从容器重用中受益。

## Concurrency and batching

默认情况下，每个函数容器一次处理一个输入。函数支持两种不同的模式来处理多个输入。

[输入并发](/docs/guide/concurrent-inputs)，使用 [`@modal.concurrent()`](/docs/sdk/py/latest/concurrent) 装饰器启用，允许函数接受多个输入并使用线程或异步任务同时执行它们：

```python
@app.function()
@modal.concurrent(max_inputs=10)
def f(x):
    ...  # Sync implementation; each input runs in its own thread

@app.function()
@modal.concurrent(max_inputs=10)
async def g(x):
    ...  # Async implementation; each input runs on the main thread in an asyncio task
```
如果函数受 I/O 限制，则可以从输入并发中受益，例如因为它们发出网络请求或数据库查询。一些 GPU 框架还可以通过连续批处理从输入并发中受益。如果函数受 CPU 限制，则输入并发不太可能有用。

另一种策略是[动态批处理](/docs/guide/dynamic-batching)，使用[`@modal.batched()`](/docs/sdk/py/latest/batched)装饰器启用。批处理函数必须定义为接受输入列表（或多个列表）并返回输出列表：

```python
@app.function()
@modal.batched(max_batch_size=4, wait_ms=1000)
def f(x: list[int], y: list[int]) -> list[int]:
    return [x_i + y_i for x_i, y_i in zip(x, y)]
```

调用批处理函数时，输入将单独发送，由 Modal 缓冲，直到批大小填满或等待时间过去，然后在单个函数调用中进行处理。从任何单个调用者的角度来看，这看起来与普通的 Function 调用没有什么不同：

```python notest
xy_sum = f.remote(2, 6)
```

当您可以通过张量或数组框架（如 torch 或 numpy）利用矢量化时，动态批处理特别有用。