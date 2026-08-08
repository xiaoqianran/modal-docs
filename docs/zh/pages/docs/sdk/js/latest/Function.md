<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数

表示已部署的模态函数，可以远程调用。

```typescript
class Function_ {
  readonly functionId: string;
  readonly methodName?: string;
}
```

## 来自姓名

*通过`modal.functions`访问*

```typescript
async fromName(
  appName: string,
  name: string,
  params: FunctionFromNameParams = {},
): Promise<Function_>
```

在应用程序中通过名称引用 `Function`。

**参数** (`FunctionFromNameParams`)

`client.functions.fromName()` 的可选参数。

* `environment?` (`string`)
* `version?` (`number`): 查找部署在该App版本上的版本固定函数。

## 获取当前统计信息

```typescript
async getCurrentStats(): Promise<FunctionStats>
```

## 获取WebUrl

```typescript
async getWebUrl(): Promise<string | undefined>
```

用于通过 HTTP 寻址 Web 功能的 URL。

**返回：** Web URL，如果这不是 Web 函数，则返回未定义

## 实例

```typescript
async instance(): Promise<Function_>
```

使用指定的配置创建函数的实例`withOptions`、`withConcurrency`、
和/或`withBatching`。

## 远程

```typescript
async remote(
  args: any[] = [],
  kwargs: Record<string, any> = {},
): Promise<any>
```

## 生成

```typescript
async spawn(
  args: any[] = [],
  kwargs: Record<string, any> = {},
): Promise<FunctionCall>
```

## 更新自动缩放器

```typescript
async updateAutoscaler(
  params: FunctionUpdateAutoscalerParams,
): Promise<void>
```

**参数** (`FunctionUpdateAutoscalerParams`)

`Function_.updateAutoscaler()` 的可选参数。

* `minContainers?` (`number`)
* `maxContainers?` (`number`)
* `bufferContainers?` (`number`)
* `scaledownWindowMs?` (`number`)

## 批处理

```typescript
withBatching(params: FunctionWithBatchingParams): Function_
```

在运行时覆盖静态函数批处理配置。

**参数** (`FunctionWithBatchingParams`)

`Function_.withBatching()` 的配置选项。

* `maxBatchSize` (`number`)
* `waitMs` (`number`)

## 并发

```typescript
withConcurrency(params: FunctionWithConcurrencyParams): Function_
```

在运行时覆盖静态函数并发配置。

**参数** (`FunctionWithConcurrencyParams`)

`Function_.withConcurrency()` 的配置选项。

* `maxInputs` (`number`)
* `targetInputs?` (`number`)

## 带选项

```typescript
withOptions(options: FunctionWithOptionsParams): Function_
```
在运行时覆盖静态 Function 配置。

**参数** (`FunctionWithOptionsParams`)

`Function_.withOptions()` 的配置选项。

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