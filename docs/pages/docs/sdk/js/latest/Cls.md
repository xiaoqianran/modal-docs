# Cls

Represents a deployed Modal Cls.

## fromName

*Accessed via `modal.cls`*

```typescript
async fromName(
  appName: string,
  name: string,
  params: ClsFromNameParams = {},
): Promise<Cls>
```

Reference a `Cls` from a deployed `App` by its name.

**Parameters** (`ClsFromNameParams`)

Optional parameters for `client.cls.fromName()`.

* `environment?` (`string`)
* `version?` (`number`): Look up a version-pinned Cls deployed at this App version.

## instance

```typescript
async instance(parameters: Record<string, any> = {}): Promise<ClsInstance>
```

Create a new instance of the Cls with parameters and/or runtime options.

## withBatching

```typescript
withBatching(params: ClsWithBatchingParams): Cls
```

Create an instance of the Cls with dynamic batching enabled or overridden with new values.

**Parameters** (`ClsWithBatchingParams`)

* `maxBatchSize` (`number`)
* `waitMs` (`number`)

## withConcurrency

```typescript
withConcurrency(params: ClsWithConcurrencyParams): Cls
```

Create an instance of the Cls with input concurrency enabled or overridden with new values.

**Parameters** (`ClsWithConcurrencyParams`)

* `maxInputs` (`number`)
* `targetInputs?` (`number`)

## withOptions

```typescript
withOptions(options: ClsWithOptionsParams): Cls
```

Override the static Function configuration at runtime.

**Parameters** (`ClsWithOptionsParams`)

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
