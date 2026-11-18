# App

App references a Modal App.

```go
type App struct {
	AppID       string
	Name        string
	Environment string
	Sandboxes   *AppSandboxesManager // Sandboxes provides operations on this App's Sandboxes.
}
```

## FromName

*Accessed via `client.Apps`*

```go
FromName(ctx context.Context, name string, params *AppFromNameParams) (*App, error)
```

FromName references an App with a given name, creating a new App if necessary.

**Parameters** (`AppFromNameParams`)

AppFromNameParams are options for client.Apps.FromName.

* `Environment` (`string`)
* `CreateIfMissing` (`bool`)

## Info

```go
Info(ctx context.Context, params *AppInfoParams) (*AppInfo, error)
```

Info returns the snapshot from the previous lookup, listing, or refresh.
Set Refresh to fetch current lifecycle information and member Function and Server IDs.
The returned information is a copy that callers can modify independently.

**Parameters** (`AppInfoParams`)

AppInfoParams are options for App.Info.

* `Refresh` (`bool`): Refresh fetches current information instead of the cached snapshot.

## Stats

```go
Stats(ctx context.Context, params *AppStatsParams) (*AppStats, error)
```

Stats returns aggregate Function, Server, and Sandbox statistics for this App.
The default window is the most recent hour. Windows can span at most seven days,
with a start in the past 30 days.

App stats show total call counts, request counts, and the count of active and
errored containers in the time window. They also count Sandboxes that finished
in the interval and those still running as of the end of the window.

The available stats and their definitions are subject to change and are provided
on a best-effort basis. They may be delayed or incomplete.

```go
app, err := client.Apps.FromName(ctx, "my-app", nil)
if err != nil {
	return err
}
stats, err := app.Stats(ctx, nil)
if err != nil {
	return err
}
fmt.Println(stats.Functions.Total.Calls.Failed)
fmt.Println(stats.Functions.ByName["embed"].Counts.Containers.Errors)
```

**Parameters** (`AppStatsParams`)

AppStatsParams contains options for App.Stats.

* `Since` (`*time.Time`): Since is inclusive and defaults to one hour before Until.
* `Until` (`*time.Time`): Until is exclusive and defaults to the current time.

## Stop

```go
Stop(ctx context.Context, params *AppStopParams) error
```

Stop stops the App.

Stopping an App terminates all of its running containers and Sandboxes and
prevents new inputs from being processed.

**Parameters** (`AppStopParams`)

AppStopParams are options for App.Stop.

*No configurable options.*

## App.Sandboxes

Sandboxes provides operations on this App's Sandboxes.

### Stats

```go
Stats(ctx context.Context, params *SandboxStatsParams) (iter.Seq2[SandboxGroupStats, error], error)
```

Stats returns statistics for the App's Sandboxes over a time range, optionally grouped by tag values.

The maximum time range is 7 days.

It yields one SandboxGroupStats per combination of tag values. An InvalidError is returned if the parameters
are invalid, and yielded during iteration if the server rejects the time range or there are more than 10,000
groups. Other RPC errors are also yielded during iteration.

```go
since := time.Now().UTC().Truncate(time.Hour).Add(-24 * time.Hour)
groups, err := app.Sandboxes.Stats(ctx, &modal.SandboxStatsParams{Since: &since, GroupByTags: []string{"team"}})
if err != nil {
	return err
}
for group, err := range groups {
	if err != nil {
		return err
	}
	fmt.Println(group.Tags, group.Cost, group.CostByResource)
}
```

**Parameters** (`SandboxStatsParams`)

SandboxStatsParams contains options for AppSandboxesManager.Stats.

* `Since` (`*time.Time`): Since is the beginning of the time range, inclusive, on a UTC hour boundary. Required.
* `Until` (`*time.Time`): Until is the end of the time range, exclusive, on a UTC hour boundary. If nil, this defaults to the current time.
* `GroupByTags` (`[]string`): GroupByTags lists tag names to group by. Sandboxes with the same values for these names form one group; a name not present on a Sandbox counts as nil. If empty, all matching Sandboxes are returned as a single group with empty Tags.
* `Tags` (`map[string]string`): Tags only includes Sandboxes that match all of these tag names and values.
