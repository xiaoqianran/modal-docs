# AppStatsRequestCounts

AppStatsRequestCounts counts Server requests split into HTTP 1xx/2xx/3xx
and all other outcomes, including status zero.

```go
type AppStatsRequestCounts struct {
	Total, OK, Failed uint64
}
```
