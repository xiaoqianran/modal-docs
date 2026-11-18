<!-- modal-docs: machine-translated zh-CN from English source -->

# AppStatsFunctionStatsGroup

AppStatsFunctionStatsGroup 包含当前函数的总计，其中
按名称键入的各个功能统计数据。

```go
type AppStatsFunctionStatsGroup struct {
	Total  AppStatsFunctionCounts
	ByName map[string]AppStatsFunctionStats
}
```