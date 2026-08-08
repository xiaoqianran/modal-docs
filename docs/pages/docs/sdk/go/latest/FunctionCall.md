# FunctionCall

FunctionCall references a Modal Function Call. Function Calls are
Function invocations with a given input. They can be consumed
asynchronously (see Get()) or cancelled (see Cancel()).

```go
type FunctionCall struct {
	FunctionCallID string
}
```

## FromID

*Accessed via `client.FunctionCalls`*

```go
FromID(ctx context.Context, functionCallID string, params *FunctionCallFromIDParams) (*FunctionCall, error)
```

FromID looks up a FunctionCall by ID.

**Parameters** (`FunctionCallFromIDParams`)

FunctionCallFromIDParams are options for FunctionCallService.FromID.

*No configurable options.*

## Cancel

```go
Cancel(ctx context.Context, params *FunctionCallCancelParams) error
```

Cancel cancels a FunctionCall.

**Parameters** (`FunctionCallCancelParams`)

FunctionCallCancelParams are options for cancelling Function Calls.

* `TerminateContainers` (`bool`)

## Get

```go
Get(ctx context.Context, params *FunctionCallGetParams) (any, error)
```

Get waits for the output of a FunctionCall.
If timeout > 0, the operation will be cancelled after the specified duration.

**Parameters** (`FunctionCallGetParams`)

FunctionCallGetParams are options for getting outputs from Function Calls.

* `Timeout` (`*time.Duration`): Timeout specifies the maximum duration to wait for the output. If nil, no timeout is applied. If set to 0, it will check if the function call is already completed.
