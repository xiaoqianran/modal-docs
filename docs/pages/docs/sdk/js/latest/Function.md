# Function

Represents a deployed Modal Function, which can be invoked remotely.

```typescript
class Function_ {
  readonly functionId: string;
  readonly methodName?: string;
  get logs(): FunctionLogsManager; // Access logs for this Function. Use `fetch()` to read logs from a UTC time range, `tail()` to read the most recent logs, and `stream()` to follow new logs as they arrive. See also: [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs) for CLI access to logs for an App.
}
```

## fromName

*Accessed via `modal.functions`*

```typescript
async fromName(
  appName: string,
  name: string,
  params: FunctionFromNameParams = {},
): Promise<Function_>
```

Reference a `Function` by its name in an App.

**Parameters** (`FunctionFromNameParams`)

Optional parameters for `client.functions.fromName()`.

* `environment?` (`string`)
* `version?` (`number`): Look up a version-pinned Function deployed at this App version.

## getCurrentStats

```typescript
async getCurrentStats(): Promise<FunctionStats>
```

## getWebUrl

```typescript
async getWebUrl(): Promise<string | undefined>
```

URL for addressing the Web Function via HTTP.

**Returns:** The web URL, or undefined if this is not a Web Function

## instance

```typescript
async instance(): Promise<Function_>
```

Create an instance of the Function with configuration specified by
`withOptions`, `withConcurrency`,
and/or `withBatching`.

## remote

```typescript
async remote(
  args: any[] = [],
  kwargs: Record<string, any> = {},
): Promise<any>
```

## spawn

```typescript
async spawn(
  args: any[] = [],
  kwargs: Record<string, any> = {},
): Promise<FunctionCall>
```

## updateAutoscaler

```typescript
async updateAutoscaler(
  params: FunctionUpdateAutoscalerParams,
): Promise<FunctionAutoscalerSettings>
```

**Parameters** (`FunctionUpdateAutoscalerParams`)

Optional parameters for `Function_.updateAutoscaler()`.

* `minContainers?` (`number`)
* `maxContainers?` (`number`)
* `bufferContainers?` (`number`)
* `scaledownWindowMs?` (`number`)

## withBatching

```typescript
withBatching(params: FunctionWithBatchingParams): Function_
```

Override the static Function batching configuration at runtime.

**Parameters** (`FunctionWithBatchingParams`)

Configuration options for `Function_.withBatching()`.

* `maxBatchSize` (`number`)
* `waitMs` (`number`)

## withConcurrency

```typescript
withConcurrency(params: FunctionWithConcurrencyParams): Function_
```

Override the static Function concurrency configuration at runtime.

**Parameters** (`FunctionWithConcurrencyParams`)

Configuration options for `Function_.withConcurrency()`.

* `maxInputs` (`number`)
* `targetInputs?` (`number`)

## withOptions

```typescript
withOptions(options: FunctionWithOptionsParams): Function_
```

Override the static Function configuration at runtime.

**Parameters** (`FunctionWithOptionsParams`)

Configuration options for `Function_.withOptions()`.

* `cpu?` (`number`)
* `cpuLimit?` (`number`)
* `memoryMiB?` (`number`)
* `memoryLimitMiB?` (`number`)
* `gpu?` (`string`)
* `env?` (`Record<string, string>`)
* `secrets?` (`Secret[]`)
* `volumes?` (`Record<string, Volume>`)
* `retries?` (`number | Retries`)
* `maxContainers?` (`number`)
* `bufferContainers?` (`number`)
* `scaledownWindowMs?` (`number`)
* `timeoutMs?` (`number`)
* `routingRegion?` (`string`)

## Function.logs

Access logs for this Function.

Use `fetch()` to read logs from a UTC time
range, `tail()` to read the most recent
logs, and `stream()` to follow new logs as
they arrive.

See also: [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs)
for CLI access to logs for an App.

### fetch

```typescript
fetch(params: FunctionLogFetchParams): AsyncIterable<LogEntry>
```

Fetch Function logs corresponding to a UTC time range and optional
filters.

Entries are returned in chronological order.

**Parameters** (`FunctionLogFetchParams`)

* `since` (`Date`): Start of the UTC time range.
* `until?` (`Date`): End of the UTC time range. Defaults to the current time.
* `source?` (`LogSource`): Filter by source: `stdout`, `stderr`, or `system`.
* `searchText?` (`string`): Filter by text contained in the log message.

**Returns:** An async iterable of `LogEntry` objects.

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");

for await (const entry of function_.logs.fetch({
  since: new Date(Date.now() - 4 * 60 * 60 * 1_000),
  source: "stdout",
})) {
  process.stdout.write(entry.message);
}
```

### stream

```typescript
stream(params: FunctionLogStreamParams = {}): AsyncIterable<LogEntry>
```

Stream new Function logs until the timeout is reached.

**Parameters** (`FunctionLogStreamParams`)

* `timeoutMs?` (`number`): Number of milliseconds to wait between log entries before ending the stream. By default, the stream blocks until it is interrupted.

**Returns:** An async iterable of `LogEntry` objects as they arrive.

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");

for await (const entry of function_.logs.stream({ timeoutMs: 60_000 })) {
  process.stdout.write(entry.message);
}
```

### tail

```typescript
tail(params: FunctionLogTailParams = {}): AsyncIterable<LogEntry>
```

Fetch the most recent Function logs.

Entries are returned in chronological order.

**Parameters** (`FunctionLogTailParams`)

* `entries?` (`number`): Number of log entries to return. Defaults to 100.
* `source?` (`LogSource`): Filter by source: `stdout`, `stderr`, or `system`.

**Returns:** An async iterable of `LogEntry` objects.

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");

for await (const entry of function_.logs.tail({ entries: 20 })) {
  process.stdout.write(entry.message);
}
```
