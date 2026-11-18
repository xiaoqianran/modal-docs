# AppStatsFunctionStatsGroup

AppStatsFunctionStatsGroup contains totals across current Functions, with
individual Function stats keyed by name.

```go
type AppStatsFunctionStatsGroup struct {
	Total  AppStatsFunctionCounts
	ByName map[string]AppStatsFunctionStats
}
```
