<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数

函数引用已部署的模态函数。

```go
type Function struct {
	FunctionID string
	Logs       *FunctionLogsManager    // Logs provides access to logs emitted by this Function.
	Metrics    *FunctionMetricsManager // Metrics provides metric samples and schema definitions.
}
```

## 来自 ID

*通过`client.Functions`访问*

```go
FromID(ctx context.Context, functionID string) (*Function, error)
```

FromID 通过 ID 引用函数。

```
client, err := modal.NewClient()
if err != nil {
	return err
}
defer client.Close()
fn, err := client.Functions.FromID(ctx, "fu-***")
if err != nil {
	return err
}
fmt.Println(fn.getWebURL())
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
GetCurrentStats(ctx context.Context, params *FunctionGetCurrentStatsParams) (*FunctionCurrentStats, error)
```

GetCurrentStats 返回一个 FunctionCurrentStats 对象，其中包含有关该函数的统计信息。**参数** (`FunctionGetCurrentStatsParams`)

FunctionGetCurrentStatsParams 是 Function.GetCurrentStats 的选项。

*没有可配置选项。*

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

## 统计数据

```go
Stats(ctx context.Context, params *FunctionStatsParams) (*FunctionStats, error)
```

统计返回历史统计数据。默认范围是最近一小时；最大范围为 7 天。

读取最近一小时的统计数据：

```
fn, err := client.Functions.FromName(ctx, "libmodal-test-support", "echo_string", nil)
if err != nil {
	return err
}
stats, err := fn.Stats(ctx, nil)
if err != nil {
	return err
}
fmt.Println(stats.InputSuccessCount, stats.InputFailureCount)
```
包括过去 24 小时内的所有变体：

```
until := time.Now()
since := until.Add(-24 * time.Hour)
variantStats, err := fn.Stats(ctx, &modal.FunctionStatsParams{
	Since:       &since,
	Until:       &until,
	AllVariants: true,
})
if err != nil {
	return err
}
for metric, distribution := range variantStats.InputPercentileStats {
	fmt.Println(metric, distribution.Unit, distribution.Percentiles)
}
```

将 Container 设置为容器 ID 以将统计信息限制到该容器。

**参数** (`FunctionStatsParams`)

FunctionStatsParams 包含 Function.Stats 的选项。

* `Since` (`*time.Time`)：Since 包含在内，默认为 Until 之前一小时。
* `Until` (`*time.Time`)：Until 是独占的，默认为当前时间。
* `Container` (`string`)：容器将统计限制到该容器ID。
* `AllVariants` (`bool`): AllVariants 聚合基本函数及其变体。

## 更新自动缩放器

```go
UpdateAutoscaler(ctx context.Context, params *FunctionUpdateAutoscalerParams) (*FunctionAutoscalerSettings, error)
```UpdateAutoscaler 会覆盖此函数的当前自动缩放器行为。

**参数** (`FunctionUpdateAutoscalerParams`)

FunctionUpdateAutoscalerParams 包含用于覆盖函数的自动缩放器行为的选项。

* `MinContainers` (`*uint32`)
* `MaxContainers` (`*uint32`)
* `BufferContainers` (`*uint32`)
* `ScaledownWindow` (`*time.Duration`)

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

## 函数.日志

日志提供对此函数发出的日志的访问。

### 获取

```go
Fetch(
	ctx context.Context,
	since time.Time,
	params *FunctionLogFetchParams,
) (iter.Seq2[LogEntry, error], error)
```

Fetch 获取与日期范围和过滤器相对应的功能日志。

因为是时间范围的开始。 params.Until 默认为当前时间。该序列按时间顺序生成 `LogEntry` 值。

**参数** (`FunctionLogFetchParams`)

FunctionLogFetchParams 是用于获取函数日志的选项。

* `Until` (`*time.Time`)：直到时间范围结束。它默认为当前时间。
* `Source` (`LogSource`)：源按 stdout、stderr 或系统过滤日志。零值包括所有来源。
* `SearchText` (`string`): SearchText 按搜索文本过滤功能日志。

### 流

```go
Stream(
	ctx context.Context,
	params *LogStreamParams,
) (iter.Seq2[LogEntry, error], error)
```

Stream 传输新的 Function 日志，直到达到超时。

超时指定日志条目之间等待的时间
终止流。默认情况下，流会阻塞，直到它被
打断了。该序列在到达时会产生 `LogEntry` 值。

**参数** (`LogStreamParams`)

LogStreamParams 是流日志的选项。

* `Timeout` (`*time.Duration`)：超时是终止流之前日志条目之间等待的持续时间。当 nil 时，流会阻塞直到被中断。

### 尾巴

```go
Tail(ctx context.Context, params *LogTailParams) (iter.Seq2[LogEntry, error], error)
```

Tail 获取最新的函数日志。

该序列按时间顺序生成 `LogEntry` 值。

**参数** (`LogTailParams`)

LogTailParams 是用于获取最新日志的选项。

* `Entries` (`int`): Entries 是要返回的日志条目数。默认为 100。
* `Source` (`LogSource`)：源按 stdout、stderr 或系统过滤日志。零值包括所有来源。

## 函数.指标

Metrics 提供指标示例和架构定义。

### 导出

```go
Export(ctx context.Context, params *FunctionMetricsExportParams) (*ObjectMetrics, error)
```

导出获取函数的指标样本。

默认为过去一小时内的所有组。由于默认为一小时前
直到。最大范围为 31 天，每个系列最多 500 点。如果
BucketSize 被省略，Modal 选择大约支持的宽度目标
100桶。范围向下舍入到 UTC 存储桶边界，因此数据之前
可以包括并且排除直到的部分桶。

将 AllVariants 设置为 true 以包含根 Function 及其变体。
缺失的观测值为零。使用 `FunctionMetricsManager.Schema` 来
无需获取样本即可发现组名称和系列定义。

```
bucketSize := 5 * time.Minute
metrics, err := function.Metrics.Export(ctx, &modal.FunctionMetricsExportParams{
	BucketSize: &bucketSize,
	Groups:     []string{"calls"},
})
if err != nil {
	return err
}
for _, point := range metrics.Series["successful_calls_count"].Points {
	if point.Value == nil {
		fmt.Println(point.Time, "missing")
	} else {
		fmt.Println(point.Time, *point.Value)
	}
}
```

**参数** (`FunctionMetricsExportParams`)

FunctionMetricsExportParams 配置指标导出。

* `Since` (`*time.Time`)：Since 默认为 Until 之前一小时。
* `Until` (`*time.Time`)：直到默认为当前时间。
* `BucketSize` (`*time.Duration`): BucketSize 可选； nil 让 Modal 选择支持的宽度。* `Groups` (`[]string`): Groups 选择指标组；空选择所有组。
* `AllVariants` (`bool`): AllVariants 包括根 Function 及其所有变体。

### 架构

```go
Schema(ctx context.Context, params *MetricsSchemaParams) (map[string]MetricsSchema, error)
```

架构返回按组名称键入的指标定义，而不获取样本。
传递 nil 参数或省略 Groups 以返回所有支持的组。各组的
定义包含其各个系列的名称、单位和描述。
导出时在 `FunctionMetricsExportParams.Groups` 中使用这些组名称。

检查可用的呼叫指标：

```
schema, err := fn.Metrics.Schema(ctx, &modal.MetricsSchemaParams{
	Groups: []string{"calls"},
})
if err != nil {
	return err
}
for _, definition := range schema["calls"].Definitions {
	fmt.Println(definition.Name, definition.Unit, definition.Description)
}
```

**参数** (`MetricsSchemaParams`)

MetricsSchemaParams 选择应返回其定义的组。

* `Groups` (`[]string`)：组默认为所有组。