# Retries

Retries represents retry policy configuration for a Modal Function/Cls.

```go
type Retries struct {
	MaxRetries         int
	BackoffCoefficient float32
	InitialDelay       time.Duration
	MaxDelay           time.Duration
}
```

## NewRetries

```go
func NewRetries(maxRetries int, params *RetriesParams) (*Retries, error)
```

NewRetries creates a new Retries configuration.

**Parameters** (`RetriesParams`)

RetriesParams are options for creating a Retries policy.

* `BackoffCoefficient` (`*float32`): Multiplier for exponential backoff. Defaults to 2.0.
* `InitialDelay` (`*time.Duration`): Defaults to 1s.
* `MaxDelay` (`*time.Duration`): Defaults to 60s.
