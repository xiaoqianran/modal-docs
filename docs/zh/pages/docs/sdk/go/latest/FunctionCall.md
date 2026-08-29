<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数调用

FunctionCall 引用模态函数调用。函数调用是
使用给定输入的函数调用。它们可以被食用
异步（请参阅 Get()）或取消（请参阅 Cancel()）。

```go
type FunctionCall struct {
	FunctionCallID string
	Logs           *FunctionCallLogsManager // Logs provides access to logs emitted by this FunctionCall.
}
```

## 来自 ID

*通过`client.FunctionCalls`访问*

```go
FromID(ctx context.Context, functionCallID string, params *FunctionCallFromIDParams) (*FunctionCall, error)
```

FromID 通过 ID 查找 FunctionCall。

**参数** (`FunctionCallFromIDParams`)

FunctionCallFromIDParams 是 FunctionCallService.FromID 的选项。

*没有可配置选项。*

## 取消

```go
Cancel(ctx context.Context, params *FunctionCallCancelParams) error
```

取消取消函数调用。

**参数** (`FunctionCallCancelParams`)

FunctionCallCancelParams 是取消函数调用的选项。

* `TerminateContainers` (`bool`)

## 获取

```go
Get(ctx context.Context, params *FunctionCallGetParams) (any, error)
```Get 等待 FunctionCall 的输出。
如果超时> 0，则操作将在指定的持续时间后取消。

**参数** (`FunctionCallGetParams`)

FunctionCallGetParams 是用于从函数调用获取输出的选项。

* `Timeout` (`*time.Duration`): Timeout指定等待输出的最大持续时间。如果为零，则不应用超时。如果设置为 0，它将检查函数调用是否已完成。

## 函数调用.Logs

Logs 提供对此 FunctionCall 发出的日志的访问。

### 获取

```go
Fetch(
	ctx context.Context,
	params *FunctionCallLogFetchParams,
) (iter.Seq2[LogEntry, error], error)
```

Fetch 获取与对应的 FunctionCall 关联的所有日志
日期范围和过滤器。
params.Since 默认为 FunctionCall 的开始，params.Until
默认为当前时间。该序列产生 `LogEntry` 值
按时间顺序排列。

**参数** (`FunctionCallLogFetchParams`)

FunctionCallLogFetchParams 是用于获取 FunctionCall 日志的选项。

* `Since` (`*time.Time`)：因为是时间范围的开始。它默认为 FunctionCall 的开始。
* `Until` (`*time.Time`)：直到时间范围结束。它默认为当前时间。
* `Source` (`LogSource`)：源按 stdout、stderr 或系统过滤日志。零值包括所有来源。* `SearchText` (`string`): SearchText 通过搜索文本过滤 FunctionCall 日志。

### 流

```go
Stream(
	ctx context.Context,
	params *LogStreamParams,
) (iter.Seq2[LogEntry, error], error)
```

Stream 流式传输新的 FunctionCall 日志，直到达到超时。

超时指定日志条目之间等待的时间
终止流。当观察到 FunctionCall 时流停止
已完成或达到超时时。完成检查是最好的
努力；如果无法确定完成，则流将继续，直到
已达到超时。默认情况下，流会阻塞直至被中断。
该序列在到达时会产生 `LogEntry` 值。

**参数** (`LogStreamParams`)

LogStreamParams 是流日志的选项。
* `Timeout` (`*time.Duration`)：超时是终止流之前日志条目之间等待的持续时间。当 nil 时，流会阻塞直到被中断。

### 尾巴

```go
Tail(ctx context.Context, params *LogTailParams) (iter.Seq2[LogEntry, error], error)
```

Tail 获取最新的 FunctionCall 日志。

该序列按时间顺序生成 `LogEntry` 值。

**参数** (`LogTailParams`)

LogTailParams 是用于获取最新日志的选项。

* `Entries` (`int`): Entries 是要返回的日志条目数。默认为 100。
* `Source` (`LogSource`)：源按 stdout、stderr 或系统过滤日志。零值包括所有来源。