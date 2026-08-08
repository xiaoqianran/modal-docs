# Function

Function references a deployed Modal Function.

```go
type Function struct {
	FunctionID string
}
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
GetCurrentStats(ctx context.Context, params *FunctionGetCurrentStatsParams) (*FunctionStats, error)
```

GetCurrentStats returns a FunctionStats object with statistics about the Function.

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

## UpdateAutoscaler

```go
UpdateAutoscaler(ctx context.Context, params *FunctionUpdateAutoscalerParams) error
```

UpdateAutoscaler overrides the current autoscaler behavior for this Function.

**Parameters** (`FunctionUpdateAutoscalerParams`)

FunctionUpdateAutoscalerParams contains options for overriding a Function's autoscaler behavior.

* `MinContainers` (`*uint32`)
* `MaxContainers` (`*uint32`)
* `BufferContainers` (`*uint32`)
* `ScaledownWindow` (`*uint32`)

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
