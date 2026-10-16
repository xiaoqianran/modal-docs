# FunctionStats

FunctionStats contains historical Function statistics for a time range.

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
