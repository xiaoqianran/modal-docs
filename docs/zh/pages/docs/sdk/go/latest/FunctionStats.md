<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数统计

FunctionStats 包含某个时间范围内的历史函数统计数据。

```go
type FunctionStats struct {
	Since                       time.Time
	Until                       time.Time
	InputSuccessCount           uint64
	InputFailureCount           uint64
	InputTimeoutCount           uint64
	InputRunningAtEndCount      uint64
	ContainerStartedCount       uint64
	ContainerErrorCount         uint64
	ContainerCreatingAtEndCount uint64
	VariantCount                uint32
	InputPercentileStats        map[string]StatsPercentileDistribution
	ContainerPercentileStats    map[string]StatsPercentileDistribution
	AllVariants                 bool
}
```