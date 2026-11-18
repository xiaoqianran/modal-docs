<!-- modal-docs: machine-translated zh-CN from English source -->

# AppStats服务器统计

AppStatsServerStats 包含服务器的对象 ID 和计数。

```go
type AppStatsServerStats struct {
	ObjectID string
	Counts   AppStatsServerCounts
}
```