<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用程序统计请求计数

AppStatsRequestCounts 对拆分为 HTTP 1xx/2xx/3xx 的服务器请求进行计数
以及所有其他结果，包括零状态。

```go
type AppStatsRequestCounts struct {
	Total, OK, Failed uint64
}
```