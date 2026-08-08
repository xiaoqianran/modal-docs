<!-- modal-docs: machine-translated zh-CN from English source -->

# 重试

Retries 表示模态函数/Cl 的重试策略配置。

```go
type Retries struct {
	MaxRetries         int
	BackoffCoefficient float32
	InitialDelay       time.Duration
	MaxDelay           time.Duration
}
```

## 新重试

```go
func NewRetries(maxRetries int, params *RetriesParams) (*Retries, error)
```

NewRetries 创建新的重试配置。

**参数** (`RetriesParams`)

RetriesParams 是用于创建重试策略的选项。

* `BackoffCoefficient` (`*float32`)：指数退避乘数。默认为 2.0。
* `InitialDelay` (`*time.Duration`)：默认为 1 秒。
* `MaxDelay` (`*time.Duration`)：默认为 60 秒。