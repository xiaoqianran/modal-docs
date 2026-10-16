# Function

Function references a deployed Modal Function.

```go
type Function struct {
	FunctionID string
	Logs       *FunctionLogsManager    // Logs provides access to logs emitted by this Function.
	Metrics    *FunctionMetricsManager // Metrics provides metric samples and schema definitions.
}
```

## FromID

*Accessed via `client.Functions`*

```go
FromID(ctx context.Context, functionID string) (*Function, error)
```

FromID references a Function by its ID.

```
client, err := modal.NewClient()
if err != nil {
	return err
}
defer client.Close()
fn, err := client.Functions.FromID(ctx, "fu-***")
if err != nil {
	return err
}
fmt.Println(fn.getWebURL())
```

## FromName

*Accessed via `client.Functions`*

```go
FromName(ctx context.Context, appName string, name string, params *FunctionFromNameParams) (*Function, error)
```

FromName references a Function from a deployed App by its name.

**Parameters** (`FunctionFromNameParams`)

FunctionFromNameParams are options for client.Functions.FromName.

* `Environment` (`string`)
* `Version` (`int`): Version looks up a version-pinned Function deployed at this App version.

## GetCurrentStats

```go
GetCurrentStats(ctx context.Context, params *FunctionGetCurrentStatsParams) (*FunctionCurrentStats, error)
```

GetCurrentStats returns a FunctionCurrentStats object with statistics about the Function.

**Parameters** (`FunctionGetCurrentStatsParams`)

FunctionGetCurrentStatsParams are options for Function.GetCurrentStats.

*No configurable options.*

## GetWebURL

```go
GetWebURL() string
```

GetWebURL returns the URL of a Function running as a Web Function.
Returns empty string if this Function is not a Web Function.

## Instance

```go
Instance(ctx context.Context) (*Function, error)
```

## Remote

```go
Remote(ctx context.Context, args []any, kwargs map[string]any) (any, error)
```

Remote executes a single input on a remote Function.

## Spawn

```go
Spawn(ctx context.Context, args []any, kwargs map[string]any) (*FunctionCall, error)
```

Spawn starts running a single input on a remote Function.

## Stats

```go
Stats(ctx context.Context, params *FunctionStatsParams) (*FunctionStats, error)
```

Stats returns historical statistics. The default range is the last hour; the maximum range is 7 days.

Read statistics for the last hour:

```
fn, err := client.Functions.FromName(ctx, "libmodal-test-support", "echo_string", nil)
if err != nil {
	return err
}
stats, err := fn.Stats(ctx, nil)
if err != nil {
	return err
}
fmt.Println(stats.InputSuccessCount, stats.InputFailureCount)
```

Include all variants over the last 24 hours:

```
until := time.Now()
since := until.Add(-24 * time.Hour)
variantStats, err := fn.Stats(ctx, &modal.FunctionStatsParams{
	Since:       &since,
	Until:       &until,
	AllVariants: true,
})
if err != nil {
	return err
}
for metric, distribution := range variantStats.InputPercentileStats {
	fmt.Println(metric, distribution.Unit, distribution.Percentiles)
}
```

Set Container to a container ID to restrict statistics to that container.

**Parameters** (`FunctionStatsParams`)

FunctionStatsParams contains options for Function.Stats.

* `Since` (`*time.Time`): Since is inclusive and defaults to one hour before Until.
* `Until` (`*time.Time`): Until is exclusive and defaults to the current time.
* `Container` (`string`): Container restricts statistics to this container ID.
* `AllVariants` (`bool`): AllVariants aggregates the base Function and its variants.

## UpdateAutoscaler

```go
UpdateAutoscaler(ctx context.Context, params *FunctionUpdateAutoscalerParams) (*FunctionAutoscalerSettings, error)
```

UpdateAutoscaler overrides the current autoscaler behavior for this Function.

**Parameters** (`FunctionUpdateAutoscalerParams`)

FunctionUpdateAutoscalerParams contains options for overriding a Function's autoscaler behavior.

* `MinContainers` (`*uint32`)
* `MaxContainers` (`*uint32`)
* `BufferContainers` (`*uint32`)
* `ScaledownWindow` (`*time.Duration`)

## WithBatching

```go
WithBatching(params *FunctionWithBatchingParams) *Function
```

**Parameters** (`FunctionWithBatchingParams`)

FunctionWithBatchingParams represents batching configuration for a Modal Function.

* `MaxBatchSize` (`int`)
* `Wait` (`time.Duration`)

## WithConcurrency

```go
WithConcurrency(params *FunctionWithConcurrencyParams) *Function
```

**Parameters** (`FunctionWithConcurrencyParams`)

FunctionWithConcurrencyParams represents concurrency configuration for a Modal Function.

* `MaxInputs` (`int`)
* `TargetInputs` (`*int`)

## WithOptions

```go
WithOptions(options *FunctionWithOptionsParams) *Function
```

**Parameters** (`FunctionWithOptionsParams`)

FunctionWithOptionsParams represents runtime options for a Modal Function.

* `CPU` (`*float64`)
* `CPULimit` (`*float64`)
* `MemoryMiB` (`*int`)
* `MemoryLimitMiB` (`*int`)
* `GPU` (`*string`)
* `Env` (`map[string]string`)
* `Secrets` (`[]*Secret`)
* `Volumes` (`map[string]*Volume`)
* `Retries` (`*Retries`)
* `MaxContainers` (`*int`)
* `BufferContainers` (`*int`)
* `ScaledownWindow` (`*time.Duration`)
* `Timeout` (`*time.Duration`)
* `RoutingRegion` (`*string`)

## Function.Logs

Logs provides access to logs emitted by this Function.

### Fetch

```go
Fetch(
	ctx context.Context,
	since time.Time,
	params *FunctionLogFetchParams,
) (iter.Seq2[LogEntry, error], error)
```

Fetch fetches Function logs corresponding to the date range and filters.

since is the start of the time range. params.Until defaults to the current
time. The sequence yields `LogEntry` values in chronological order.

**Parameters** (`FunctionLogFetchParams`)

FunctionLogFetchParams are options for fetching Function logs.

* `Until` (`*time.Time`): Until is the end of the time range. It defaults to the current time.
* `Source` (`LogSource`): Source filters logs by stdout, stderr, or system. The zero value includes all sources.
* `SearchText` (`string`): SearchText filters Function logs by search text.

### Stream

```go
Stream(
	ctx context.Context,
	params *LogStreamParams,
) (iter.Seq2[LogEntry, error], error)
```

Stream streams new Function logs until the timeout is reached.

The timeout specifies how long to wait between log entries before
terminating the stream. By default, the stream blocks until it is
interrupted. The sequence yields `LogEntry` values as they arrive.

**Parameters** (`LogStreamParams`)

LogStreamParams are options for streaming logs.

* `Timeout` (`*time.Duration`): Timeout is the duration to wait between log entries before terminating the stream. When nil, the stream blocks until it is interrupted.

### Tail

```go
Tail(ctx context.Context, params *LogTailParams) (iter.Seq2[LogEntry, error], error)
```

Tail fetches the most recent Function logs.

The sequence yields `LogEntry` values in chronological order.

**Parameters** (`LogTailParams`)

LogTailParams are options for fetching the most recent logs.

* `Entries` (`int`): Entries is the number of log entries to return. It defaults to 100.
* `Source` (`LogSource`): Source filters logs by stdout, stderr, or system. The zero value includes all sources.

## Function.Metrics

Metrics provides metric samples and schema definitions.

### Export

```go
Export(ctx context.Context, params *FunctionMetricsExportParams) (*ObjectMetrics, error)
```

Export fetches metric samples for a Function.

Defaults to all groups over the last hour. Since defaults to one hour before
Until. The maximum range is 31 days, with at most 500 points per series. If
BucketSize is omitted, Modal selects a supported width targeting approximately
100 buckets. Bounds round down to UTC bucket boundaries, so data before Since
may be included and the partial bucket at Until is excluded.

Set AllVariants to true to include the root Function and its variants.
Missing observations have a nil Value. Use `FunctionMetricsManager.Schema` to
discover group names and series definitions without fetching samples.

```
bucketSize := 5 * time.Minute
metrics, err := function.Metrics.Export(ctx, &modal.FunctionMetricsExportParams{
	BucketSize: &bucketSize,
	Groups:     []string{"calls"},
})
if err != nil {
	return err
}
for _, point := range metrics.Series["successful_calls_count"].Points {
	if point.Value == nil {
		fmt.Println(point.Time, "missing")
	} else {
		fmt.Println(point.Time, *point.Value)
	}
}
```

**Parameters** (`FunctionMetricsExportParams`)

FunctionMetricsExportParams configures a metric export.

* `Since` (`*time.Time`): Since defaults to one hour before Until.
* `Until` (`*time.Time`): Until defaults to the current time.
* `BucketSize` (`*time.Duration`): BucketSize is optional; nil lets Modal select a supported width.
* `Groups` (`[]string`): Groups selects metric groups; empty selects all groups.
* `AllVariants` (`bool`): AllVariants includes the root Function and all its variants.

### Schema

```go
Schema(ctx context.Context, params *MetricsSchemaParams) (map[string]MetricsSchema, error)
```

Schema returns metric definitions keyed by group name without fetching samples.
Pass nil params or omit Groups to return all supported groups. Each group's
Definitions contains its individual series names, units, and descriptions.
Use these group names in `FunctionMetricsExportParams.Groups` when exporting.

Inspect the available call metrics:

```
schema, err := fn.Metrics.Schema(ctx, &modal.MetricsSchemaParams{
	Groups: []string{"calls"},
})
if err != nil {
	return err
}
for _, definition := range schema["calls"].Definitions {
	fmt.Println(definition.Name, definition.Unit, definition.Description)
}
```

**Parameters** (`MetricsSchemaParams`)

MetricsSchemaParams selects groups whose definitions should be returned.

* `Groups` (`[]string`): Groups defaults to all groups.
