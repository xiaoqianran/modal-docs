# Cls

Cls represents a Modal class definition that can be instantiated with parameters.
It contains metadata about the class and its methods.

```go
type Cls struct {
}
```

## FromName

*Accessed via `client.Cls`*

```go
FromName(ctx context.Context, appName string, name string, params *ClsFromNameParams) (*Cls, error)
```

FromName references a Cls from a deployed App by its name.

**Parameters** (`ClsFromNameParams`)

ClsFromNameParams are options for client.Cls.FromName.

* `Environment` (`string`)
* `Version` (`int`): Version looks up a version-pinned Cls deployed at this App version.

## Instance

```go
Instance(ctx context.Context, parameters map[string]any) (*ClsInstance, error)
```

Instance creates a new instance of the class with the provided parameters.

## WithBatching

```go
WithBatching(params *ClsWithBatchingParams) *Cls
```

WithBatching creates an instance of the Cls with dynamic batching enabled or overridden with new values.

**Parameters** (`ClsWithBatchingParams`)

ClsWithBatchingParams represents batching configuration for a Modal Cls.

* `MaxBatchSize` (`int`)
* `Wait` (`time.Duration`)

## WithConcurrency

```go
WithConcurrency(params *ClsWithConcurrencyParams) *Cls
```

WithConcurrency creates an instance of the Cls with input concurrency enabled or overridden with new values.

**Parameters** (`ClsWithConcurrencyParams`)

ClsWithConcurrencyParams represents concurrency configuration for a Modal Cls.

* `MaxInputs` (`int`)
* `TargetInputs` (`*int`)

## WithOptions

```go
WithOptions(params *ClsWithOptionsParams) *Cls
```

WithOptions overrides the static Function configuration at runtime.

**Parameters** (`ClsWithOptionsParams`)

ClsWithOptionsParams represents runtime options for a Modal Cls.

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
