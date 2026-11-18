# AppStatsServerStatsGroup

AppStatsServerStatsGroup contains totals across current Servers, with
individual Server stats keyed by name.

```go
type AppStatsServerStatsGroup struct {
	Total  AppStatsServerCounts
	ByName map[string]AppStatsServerStats
}
```
