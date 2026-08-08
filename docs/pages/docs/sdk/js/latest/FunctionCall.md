# FunctionCall

Represents a Modal FunctionCall. FunctionCalls are `Function` invocations with
a given input. They can be consumed asynchronously (see `FunctionCall.get()`) or cancelled
(see `FunctionCall.cancel()`).

```typescript
class FunctionCall {
  readonly functionCallId: string;
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
