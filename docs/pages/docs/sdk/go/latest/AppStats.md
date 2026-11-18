# AppStats

AppStats contains App-wide statistics over \[Since, Until), with current Functions
and Servers indexed by name. Lifecycle metadata describes the App when queried,
including for historical windows.

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
