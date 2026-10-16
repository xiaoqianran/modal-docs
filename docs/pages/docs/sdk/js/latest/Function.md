# Function

Represents a deployed Modal Function, which can be invoked remotely.

```typescript
class Function_ {
  readonly functionId: string;
  readonly methodName?: string;
  get logs(): FunctionLogsManager; // Access logs for this Function. Use `fetch()` to read logs from a UTC time range, `tail()` to read the most recent logs, and `stream()` to follow new logs as they arrive. See also: [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs) for CLI access to logs for an App.
  get metrics(): FunctionMetricsManager; // Access metric samples with export() and series definitions with schema().
}
```

## fromId

*Accessed via `modal.functions`*

```typescript
async fromId(functionId: string): Promise<Function_>
```

Reference a `Function` by its ID.

```typescript
const client = new ModalClient();
const fn = await client.functions.fromId("fu-***");
console.log(await fn.getWebUrl());
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
async getCurrentStats(): Promise<FunctionCurrentStats>
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

## stats

```typescript
async stats(params: FunctionStatsParams = {}): Promise<FunctionStats>
```

Return historical statistics. Defaults to the last hour; the maximum range is 7 days.

**Parameters** (`FunctionStatsParams`)

* `since?` (`Date`): Inclusive start; defaults to one hour before until.
* `until?` (`Date`): Exclusive end; defaults to the current time.
* `container?` (`string`): Restrict statistics to this container ID.
* `allVariants?` (`boolean`): Aggregate the base Function and its variants. Defaults to false.

Read statistics for the last hour.

```ts
const fn = await modal.functions.fromName("libmodal-test-support", "echo_string");
const stats = await fn.stats();
console.log(stats.inputSuccessCount, stats.inputFailureCount);
```

Include all variants over the last 24 hours.

```ts
const until = new Date();
const since = new Date(until.getTime() - 24 * 60 * 60 * 1000);
const variantStats = await fn.stats({ since, until, allVariants: true });
for (const [metric, distribution] of Object.entries(variantStats.inputPercentileStats)) {
  console.log(metric, distribution.unit, distribution.percentiles);
}
```

Set `container` to a container ID to restrict statistics to that container.

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

## Function.metrics

Access metric samples with export() and series definitions with schema().

### export

```typescript
async export(
  params: FunctionMetricsExportParams = {},
): Promise<ObjectMetrics>
```

Fetch metric samples, defaulting to all groups over the last hour.

The maximum range is 31 days, with at most 500 points per series. Omit
bucketSizeSecs to let Modal select a supported width targeting approximately
100 buckets. Bounds round down to UTC bucket boundaries: data before since
may be included, and the partial bucket at until is excluded.
Missing observations have value null. Use schema() to discover definitions.

**Parameters** (`FunctionMetricsExportParams`)

Options for exporting Function metric samples.

* `since?` (`Date`): Defaults to one hour before until.
* `until?` (`Date`): Defaults to the current time.
* `bucketSizeSecs?` (`number`): Bucket width in whole seconds.
* `allVariants?` (`boolean`): Include the root Function and all its variants. Defaults to false.

```typescript
const metrics = await fn.metrics.export({
  bucketSizeSecs: 5 * 60,
  groups: ["calls"],
});
for (const point of metrics.series["successful_calls_count"].points) {
  console.log(point.time, point.value);
}
```

### schema

```typescript
async schema(
  params: MetricsSchemaParams = {},
): Promise<Record<string, MetricsSchema>>
```

Return metric definitions keyed by group name, without fetching samples.
Omit groups to return all groups. Each group's definitions include all its
individual series.

**Parameters** (`MetricsSchemaParams`)

Options for discovering metric definitions.

* `groups?` (`string[]`): Omit or pass an empty array to select all groups.
