<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用统计

AppStats 包含超过 \[Since, Until) 的应用程序范围统计信息，以及当前功能
和按名称索引的服务器。生命周期元数据在查询时描述应用程序，
包括历史窗户。

```go
type AppStats struct {
	Since, Until    time.Time
	Functions       AppStatsFunctionStatsGroup
	Servers         AppStatsServerStatsGroup
	Sandboxes       AppStatsSandboxCounts
	Lifecycle       AppLifecycle
	DeploymentCount *uint64
}
```