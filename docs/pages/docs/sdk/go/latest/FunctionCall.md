# FunctionCall

FunctionCall references a Modal Function Call. Function Calls are
Function invocations with a given input. They can be consumed
asynchronously (see Get()) or cancelled (see Cancel()).

```go
type FunctionCall struct {
	FunctionCallID string
	Logs           *FunctionCallLogsManager // Logs provides access to logs emitted by this FunctionCall.
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

## FunctionCall.Logs

Logs provides access to logs emitted by this FunctionCall.

### Fetch

```go
Fetch(
	ctx context.Context,
	params *FunctionCallLogFetchParams,
) (iter.Seq2[LogEntry, error], error)
```

Fetch fetches all logs associated with the FunctionCall corresponding to the
date range and filters.

params.Since defaults to the start of the FunctionCall, and params.Until
defaults to the current time. The sequence yields `LogEntry` values in
chronological order.

**Parameters** (`FunctionCallLogFetchParams`)

FunctionCallLogFetchParams are options for fetching FunctionCall logs.

* `Since` (`*time.Time`): Since is the start of the time range. It defaults to the start of the FunctionCall.
* `Until` (`*time.Time`): Until is the end of the time range. It defaults to the current time.
* `Source` (`LogSource`): Source filters logs by stdout, stderr, or system. The zero value includes all sources.
* `SearchText` (`string`): SearchText filters FunctionCall logs by search text.

### Stream

```go
Stream(
	ctx context.Context,
	params *LogStreamParams,
) (iter.Seq2[LogEntry, error], error)
```

Stream streams new FunctionCall logs until the timeout is reached.

The timeout specifies how long to wait between log entries before
terminating the stream. Stream stops when the FunctionCall is observed to
have completed or when the timeout is reached. The completion check is best
effort; if completion cannot be determined, the stream continues until the
timeout is reached. By default, the stream blocks until it is interrupted.
The sequence yields `LogEntry` values as they arrive.

**Parameters** (`LogStreamParams`)

LogStreamParams are options for streaming logs.

* `Timeout` (`*time.Duration`): Timeout is the duration to wait between log entries before terminating the stream. When nil, the stream blocks until it is interrupted.

### Tail

```go
Tail(ctx context.Context, params *LogTailParams) (iter.Seq2[LogEntry, error], error)
```

Tail fetches the most recent FunctionCall logs.

The sequence yields `LogEntry` values in chronological order.

**Parameters** (`LogTailParams`)

LogTailParams are options for fetching the most recent logs.

* `Entries` (`int`): Entries is the number of log entries to return. It defaults to 100.
* `Source` (`LogSource`): Source filters logs by stdout, stderr, or system. The zero value includes all sources.
