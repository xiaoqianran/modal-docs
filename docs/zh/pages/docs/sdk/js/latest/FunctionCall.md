<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数调用

代表模态函数调用。 FunctionCalls 是 `Function` 调用
给定的输入。它们可以异步使用（参见`FunctionCall.get()`）或取消
（参见`FunctionCall.cancel()`）。

```typescript
class FunctionCall {
  readonly functionCallId: string;
}
```

## 来自 ID

*通过`modal.functionCalls`访问*

```typescript
async fromId(functionCallId: string): Promise<FunctionCall>
```

根据 ID 创建一个新的 `FunctionCall`。

## 取消

```typescript
async cancel(params: FunctionCallCancelParams = {})
```

取消正在运行的 FunctionCall。

**参数** (`FunctionCallCancelParams`)

`FunctionCall.cancel()` 的可选参数。

* `terminateContainers?` (`boolean`)

## 得到

```typescript
async get(params: FunctionCallGetParams = {}): Promise<any>
```

获取 FunctionCall 的结果，可以选择超时等待。

**参数** (`FunctionCallGetParams`)

`FunctionCall.get()` 的可选参数。

* `timeoutMs?` (`number`)