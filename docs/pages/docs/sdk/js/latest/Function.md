# Function

Represents a deployed Modal Function, which can be invoked remotely.

```typescript
class Function_ {
  readonly functionId: string;
  readonly methodName?: string;
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
): Promise<void>
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
