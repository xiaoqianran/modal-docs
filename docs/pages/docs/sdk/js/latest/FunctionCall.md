# FunctionCall

Represents a Modal FunctionCall. FunctionCalls are `Function` invocations with
a given input. They can be consumed asynchronously (see `FunctionCall.get()`) or cancelled
(see `FunctionCall.cancel()`).

```typescript
class FunctionCall {
  readonly functionCallId: string;
  get logs(): FunctionCallLogsManager; // Access logs for this FunctionCall. Use `fetch()` to read logs from a UTC time range, `tail()` to read the most recent logs, and `stream()` to follow new logs as they arrive. See also: [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs) for CLI access to logs for an App.
}
```

## fromId

*Accessed via `modal.functionCalls`*

```typescript
async fromId(functionCallId: string): Promise<FunctionCall>
```

Create a new `FunctionCall` from ID.

## cancel

```typescript
async cancel(params: FunctionCallCancelParams = {})
```

Cancel a running FunctionCall.

**Parameters** (`FunctionCallCancelParams`)

Optional parameters for `FunctionCall.cancel()`.

* `terminateContainers?` (`boolean`)

## get

```typescript
async get(params: FunctionCallGetParams = {}): Promise<any>
```

Get the result of a FunctionCall, optionally waiting with a timeout.

**Parameters** (`FunctionCallGetParams`)

Optional parameters for `FunctionCall.get()`.

* `timeoutMs?` (`number`)

## FunctionCall.logs

Access logs for this FunctionCall.

Use `fetch()` to read logs from a UTC
time range, `tail()` to read the most
recent logs, and `stream()` to follow
new logs as they arrive.

See also: [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs)
for CLI access to logs for an App.

### fetch

```typescript
fetch(params: FunctionCallLogFetchParams = {}): AsyncIterable<LogEntry>
```

Fetch logs associated with this FunctionCall corresponding to a UTC time
range and optional filters.

When `since` is omitted, logs are fetched from the start of the
FunctionCall. Entries are returned in chronological order.

**Parameters** (`FunctionCallLogFetchParams`)

* `since?` (`Date`): Start of the UTC time range. Defaults to the start of the FunctionCall.
* `until?` (`Date`): End of the UTC time range. Defaults to the current time.
* `source?` (`LogSource`): Filter by source: `stdout`, `stderr`, or `system`.
* `searchText?` (`string`): Filter by text contained in the log message.

**Returns:** An async iterable of `LogEntry` objects.

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");
const call = await function_.spawn([]);

for await (const entry of call.logs.fetch()) {
  console.log(entry.timestamp, entry.message);
}
```

### stream

```typescript
stream(params: FunctionCallLogStreamParams = {}): AsyncIterable<LogEntry>
```

Stream new FunctionCall logs until the timeout is reached or the
FunctionCall is observed to have completed.

The completion check is best-effort. If completion cannot be determined,
the stream continues until the timeout is reached.

**Parameters** (`FunctionCallLogStreamParams`)

* `timeoutMs?` (`number`): Number of milliseconds to wait between log entries before ending the stream. By default, the stream blocks until it is interrupted.

**Returns:** An async iterable of `LogEntry` objects as they arrive.

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");
const call = await function_.spawn([]);

for await (const entry of call.logs.stream()) {
  process.stdout.write(entry.message);
}
```

### tail

```typescript
tail(params: FunctionCallLogTailParams = {}): AsyncIterable<LogEntry>
```

Fetch the most recent FunctionCall logs.

Entries are returned in chronological order.

**Parameters** (`FunctionCallLogTailParams`)

* `entries?` (`number`): Number of log entries to return. Defaults to 100.
* `source?` (`LogSource`): Filter by source: `stdout`, `stderr`, or `system`.

**Returns:** An async iterable of `LogEntry` objects.

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");
const call = await function_.spawn([]);

for await (const entry of call.logs.tail({ entries: 10 })) {
  console.log(entry.timestamp, entry.message);
}
```
