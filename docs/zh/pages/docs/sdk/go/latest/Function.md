<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数

函数引用已部署的模态函数。

```go
type Function struct {
	FunctionID string
}
```

## 来自姓名

*通过`client.Functions`访问*

```go
FromName(ctx context.Context, appName string, name string, params *FunctionFromNameParams) (*Function, error)
```

FromName 通过名称引用已部署应用程序中的函数。

**参数** (`FunctionFromNameParams`)

FunctionFromNameParams 是 client.Functions.FromName 的选项。

* `Environment` (`string`)
* `Version` (`int`)：版本查找部署在此应用程序版本上的版本固定函数。

## 获取当前统计信息

```go
GetCurrentStats(ctx context.Context, params *FunctionGetCurrentStatsParams) (*FunctionStats, error)
```

GetCurrentStats 返回一个 FunctionStats 对象，其中包含有关该函数的统计信息。

**参数** (`FunctionGetCurrentStatsParams`)

FunctionGetCurrentStatsParams 是 Function.GetCurrentStats 的选项。*没有可配置选项。*

## 获取WebURL

```go
GetWebURL() string
```

GetWebURL 返回作为 Web 函数运行的函数的 URL。
如果此函数不是 Web 函数，则返回空字符串。

## 实例

```go
Instance(ctx context.Context) (*Function, error)
```

## 远程

```go
Remote(ctx context.Context, args []any, kwargs map[string]any) (any, error)
```

远程在远程函数上执行单个输入。

## 生成

```go
Spawn(ctx context.Context, args []any, kwargs map[string]any) (*FunctionCall, error)
```

Spawn 开始在远程函数上运行单个输入。

## 更新自动缩放器

```go
UpdateAutoscaler(ctx context.Context, params *FunctionUpdateAutoscalerParams) error
```

UpdateAutoscaler 会覆盖此函数的当前自动缩放器行为。

**参数** (`FunctionUpdateAutoscalerParams`)

FunctionUpdateAutoscalerParams 包含用于覆盖函数的自动缩放器行为的选项。

* `MinContainers` (`*uint32`)
* `MaxContainers` (`*uint32`)
* `BufferContainers` (`*uint32`)
* `ScaledownWindow` (`*uint32`)

## 带批处理

```go
WithBatching(params *FunctionWithBatchingParams) *Function
```

**参数** (`FunctionWithBatchingParams`)

FunctionWithBatchingParams 表示模态函数的批处理配置。

* `MaxBatchSize` (`int`)
* `Wait` (`time.Duration`)

## 并发性

```go
WithConcurrency(params *FunctionWithConcurrencyParams) *Function
```

**参数** (`FunctionWithConcurrencyParams`)

FunctionWithConcurrencyParams 表示模态函数的并发配置。

* `MaxInputs` (`int`)
* `TargetInputs` (`*int`)

## 带选项

```go
WithOptions(options *FunctionWithOptionsParams) *Function
```

**参数** (`FunctionWithOptionsParams`)

FunctionWithOptionsParams 表示模态函数的运行时选项。

* `CPU` (`*float64`)
* `CPULimit` (`*float64`)
* `MemoryMiB` (`*int`)
* `MemoryLimitMiB` (`*int`)
* `GPU` (`*string`)
* `Env` (`map[string]string`)
* `Secrets` (`[]*Secret`)
* `Volumes` (`map[string]*Volume`)
* `Retries` (`*Retries`)
* `MaxContainers` (`*int`)
* `BufferContainers` (`*int`)
* `ScaledownWindow` (`*time.Duration`)
* `Timeout` (`*time.Duration`)
* `RoutingRegion` (`*string`)