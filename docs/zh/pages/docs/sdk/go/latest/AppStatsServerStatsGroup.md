<!-- modal-docs: machine-translated zh-CN from English source -->

# AppStatsServerStatsGroup

AppStatsServerStatsGroup 包含当前服务器的总计，其中
按名称键入的各个服务器统计信息。

```go
type AppStatsServerStatsGroup struct {
	Total  AppStatsServerCounts
	ByName map[string]AppStatsServerStats
}
```