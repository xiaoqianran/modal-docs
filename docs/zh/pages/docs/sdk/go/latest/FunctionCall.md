<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数调用

FunctionCall 引用模态函数调用。函数调用是
使用给定输入的函数调用。它们可以被食用
异步（请参阅 Get()）或取消（请参阅 Cancel()）。

```go
type FunctionCall struct {
	FunctionCallID string
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
```

Get 等待 FunctionCall 的输出。
如果超时> 0，则操作将在指定的持续时间后取消。

**参数** (`FunctionCallGetParams`)

FunctionCallGetParams 是用于从函数调用获取输出的选项。

* `Timeout` (`*time.Duration`): Timeout指定等待输出的最大持续时间。如果为零，则不应用超时。如果设置为 0，它将检查函数调用是否已完成。