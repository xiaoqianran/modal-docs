<!-- modal-docs: machine-translated zh-CN from English source -->

# AppStatsServerCounts

AppStatsServerCounts 包含服务器请求和容器计数。

```go
type AppStatsServerCounts struct {
	Requests   AppStatsRequestCounts
	Containers AppStatsContainerCounts
}
```