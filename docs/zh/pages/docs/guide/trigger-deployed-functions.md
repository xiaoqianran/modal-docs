<!-- modal-docs: machine-translated zh-CN from English source -->

# 调用已部署的函数

可以调用[已部署的应用程序](/docs/guide/managing-deployments)中的模态函数
通过执行*函数查找*从应用程序源外部：

<CodeTabs>
  {#snippet python()}

```python notest
f = modal.Function.from_name("my-app", "f")
result = f.remote()
```

{/片段}

{#snippet python\_async()}

```python notest
f = modal.Function.from_name("my-app", "f")
result = await f.remote.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
const f = await modal.functions.fromName("my-app", "f");
result = await f.remote();
```

{/片段}

{#snippet go()}

```go notest
f, _ := mc.Functions.FromName(ctx, "my-app", "f", nil)
result, err := f.Remote(ctx, nil, nil)
```

{/片段} </CodeTabs>

函数查找的范围是应用程序的名称、函数的名称
该应用程序，以及可选的该应用程序所在的[环境](/docs/guide/environments)
部署于。请注意，仅*部署的*应用程序支持查找。抬头看
如果函数的应用程序是[临时](/docs/guide/apps#ephemeral-apps)，则函数将失败，
例如通过 `modal serve` CLI 运行。

## 用例

当您想将模态应用程序视为远程应用程序时，函数查找非常有用
服务。

例如，您可能希望将 Modal 代码库组织成多个
具有不同部署生命周期的松散耦合应用程序。查找允许
这些应用程序中的功能可以互相调用，就好像它们是同一应用程序的成员一样
应用程序。

您可能还拥有 Modal 之外的代码库，需要执行某些操作
将从 Modal 的可扩展计算中受益的操作。模态函数
查找将其转化为简单的函数调用，自动处理
参数、结果和异常的序列化和反序列化。
使用 Modal 的 [JS 和 Go SDK](/docs/guide/sdk-javascript-go)，调用
代码库甚至不需要用 Python 编写。

## 调用模式

查找函数句柄后可以使用任何远程调用方法。

例如，您可以生成后台执行并轮询其状态：

<CodeTabs>
  {#snippet python()}

```python notest
f = modal.Function.from_name("my-app", "f")
function_call = f.spawn(42)

# Poll for the result without blocking by passing timeout=0.
try:
    result = function_call.get(timeout=0)
except TimeoutError:
    result = None  # still running
```

{/片段}

{#snippet python\_async()}

```python notest
f = modal.Function.from_name("my-app", "f")
function_call = await f.spawn.aio(42)

# Poll for the result without blocking by passing timeout=0.
try:
    result = await function_call.get.aio(timeout=0)
except TimeoutError:
    result = None  # still running
```

{/片段}

{#snippet javascript()}

```javascript notest
const f = await modal.functions.fromName("my-app", "f");
const functionCall = await f.spawn([42]);

// Poll for the result without blocking by passing timeoutMs: 0.
let result;
try {
  result = await functionCall.get({ timeoutMs: 0 });
} catch (err) {
  if (!(err instanceof FunctionTimeoutError)) throw err;
  result = null; // still running
}
```

{/片段}{#snippet go()}

```go notest
f, _ := mc.Functions.FromName(ctx, "my-app", "f", nil)
functionCall, _ := f.Spawn(ctx, []any{42}, nil)

// Poll for the result without blocking by passing a zero *time.Duration timeout
zero := time.Duration(0)
result, err := functionCall.Get(ctx, &modal.FunctionCallGetParams{Timeout: &zero})
// A non-nil err indicates the call is still running.
```

{/片段} </CodeTabs>

或者你可以在多个容器之间分配令人尴尬的并行工作：

<CodeTabs>
  {#snippet python()}

```python notest
f = modal.Function.from_name("my-app", "f")
results = list(f.map(range(5)))
```

{/片段}

{#snippet python\_async()}

```python notest
f = modal.Function.from_name("my-app", "f")
results = [result async for result in f.map.aio(range(5))]
```

{/片段} </CodeTabs>

注意：目前仅 Python 支持 `Function.map()`。

当您的 Function 被定义为 Modal Cls 时，您可以传递
[参数](/docs/guide/parametrized-functions) 和调用
具体方法查找后：

<CodeTabs>
  {#snippet python()}

```python notest
Model = modal.Cls.from_name("my-app", "Model")
obj = Model(size="35B")
result = obj.generate.remote("hello")
```

{/片段}

{#snippet python\_async()}

```python notest
Model = modal.Cls.from_name("my-app", "Model")
obj = Model(size="35B")
result = await obj.generate.remote.aio("hello")
```

{/片段}

{#snippet javascript()}

```javascript notest
const cls = await modal.cls.fromName("my-app", "Model");
const obj = await cls.instance({ size: "35B" });
const generate = obj.method("generate");
const result = await generate.remote(["hello"]);
```

{/片段}

{#snippet go()}

```go notest
cls, _ := mc.Cls.FromName(ctx, "my-app", "Model", nil)
obj, _ := cls.Instance(ctx, map[string]any{"size": "35B"})
generate, _ := obj.Method("generate")
result, _ := generate.Remote(ctx, []any{"hello"}, nil)
```

{/片段} </CodeTabs>
也可以
[动态配置](/docs/guide/dynamic-function-config) 函数
或通过远程查找 Cls。例如，您可以选择 GPU 类型
与您正在调用的特定模型一致：

<CodeTabs>
  {#snippet python()}

```python notest
Model = modal.Cls.from_name("my-app", "Model")
obj = Model.with_options(gpu="H100")(size="35B")
result = obj.generate.remote("hello")
```

{/片段}

{#snippet python\_async()}

```python notest
Model = modal.Cls.from_name("my-app", "Model")
obj = Model.with_options(gpu="H100")(size="35B")
result = await obj.generate.remote.aio("hello")
```

{/片段}

{#snippet javascript()}

```javascript notest
const cls = await modal.cls.fromName("my-app", "Model");
const obj = await cls.withOptions({ gpu: "H100" }).instance({ size: "35B" });
const generate = obj.method("generate");
const result = await generate.remote(["hello"]);
```

{/片段}

{#snippet go()}

```go notest
cls, _ := mc.Cls.FromName(ctx, "my-app", "Model", nil)
gpu := "H100"
obj, _ := cls.
	WithOptions(&modal.ClsWithOptionsParams{GPU: &gpu}).
	Instance(ctx, map[string]any{"size": "35B"})
generate, _ := obj.Method("generate")
result, _ := generate.Remote(ctx, []any{"hello"}, nil)
```

{/片段} </CodeTabs>

## 版本固定查找

<Callout variant="gated-feature">

<a href="/pricing">团队和企业计划</a>提供版本固定查找。
访问<a href="/settings/plans">工作空间设置</a>进行升级。

</Callout>所有函数调用都将路由到“最新”可用版本
默认应用程序。期间
[滚动部署](/docs/guide/managing-deployments#deployment-strategies),
这可能对应于过时的版本，但重复调用
函数句柄最终将到达最近的部署，而无需任何
需要刷新手柄。

还可以查找应用程序的特定版本，它返回
“版本固定”功能句柄：

<CodeTabs>
  {#snippet python()}

```python notest
f = modal.Function.from_name("my-app", "f", version=3)
result = f.remote()
```

{/片段}

{#snippet python\_async()}

```python notest
f = modal.Function.from_name("my-app", "f", version=3)
result = await f.remote.aio()
```

{/片段}

{#snippet javascript()}

```javascript notest
const f = await modal.functions.fromName("my-app", "f", { version: 3 });
result = await f.remote();
```

{/片段}

{#snippet go()}

```go notest
f, _ := mc.Functions.FromName(ctx, "my-app", "f", &modal.FunctionFromNameParams{Version: 3})
result, err := f.Remote(ctx, nil, nil)
```
{/片段} </CodeTabs>

如果版本固定的Function直接调用同一个App中的其他Function，
这些调用也将保证在同一版本上运行（这不是
通常是跨部署的情况，即使是同一应用程序内的调用）。

版本固定的调用有一些权衡。主要是版本固定
调用将由具有特殊规则的不同容器池处理
围绕自动缩放：

* 处理版本固定调用的容器不包含在
  函数的主要`max_containers`预算。相反，该限制将应用于
  *个人版本*的级别。如果每个容器都必须考虑到这一点
  消耗有限的资源（例如，与数据库的连接）。
* 版本固定函数将忽略 `min_containers` 配置
  函数装饰器，默认情况下它们不会维护暖池。如果这个
  如果需要，可以使用`Function.update_autoscaler()`方法
  动态配置暖池。用户有责任扩展
  不再需要时将池温热下来。

仅保留窗口内的应用程序版本支持版本固定
（即您也可以回滚到的版本）。更长的保留窗口是
在企业计划中可用。

## 身份验证

函数查找通过 Modal [API 令牌](/settings/tokens) 进行身份验证。
这些标记隐式指定查找的目标工作区。

令牌会自动从您的`~/.modal.toml`中的活动配置文件中读取
文件。它们也可以通过 `MODAL_TOKEN_ID` 和
`MODAL_TOKEN_SECRET` 环境变量。这些优先于
`~/.modal.toml` 设置后。

## 限制

虽然您可以在函数句柄上使用任何远程调用方法
查找，不支持`.local()`调用，因为实现
将无法在本地使用。

与同一个 Python 应用程序中的函数之间的远程调用不同，
查找后，类型检查器将无法读取函数接口。
您的代码必须显式缩小结果范围以将其视为
具体类型。

## 使用 HTTPS 调用

模态 [Web Functions](/docs/guide/webhooks) 可以通过 HTTPS 调用
[公共 URL](/docs/guide/webhook-urls)。

与通过我们的 SDK 之一进行函数查找不同，Web 函数不是
默认情况下进行身份验证，并且经过身份验证的 Web Functions 使用
[代理令牌](/docs/guide/webhook-proxy-auth) 而不是 Modal API 令牌。

Web 函数可以从 Web 浏览器、Unix 工具（如
`curl`，或任何具有 HTTPS 客户端的语言。