<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数

表示已部署的模态函数，可以远程调用。

```typescript
class Function_ {
  readonly functionId: string;
  readonly methodName?: string;
  get logs(): FunctionLogsManager; // Access logs for this Function. Use `fetch()` to read logs from a UTC time range, `tail()` to read the most recent logs, and `stream()` to follow new logs as they arrive. See also: [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs) for CLI access to logs for an App.
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
): Promise<FunctionAutoscalerSettings>
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

## 函数.logs

此功能的访问日志。

使用 `fetch()` 从 UTC 时间读取日志
范围，`tail()`读取最新的
日志，以及 `stream()` 来跟踪新日志
他们到达了。

另请参阅：[`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs)用于 CLI 访问应用程序的日志。

### 获取

```typescript
fetch(params: FunctionLogFetchParams): AsyncIterable<LogEntry>
```

获取对应于 UTC 时间范围和可选的函数日志
过滤器。

条目按时间顺序返回。

**参数** (`FunctionLogFetchParams`)

* `since` (`Date`)：UTC 时间范围的开始。
* `until?` (`Date`)：UTC 时间范围结束。默认为当前时间。
* `source?` (`LogSource`)：按来源过滤：`stdout`、`stderr` 或 `system`。
* `searchText?` (`string`)：按日志消息中包含的文本过滤。

**返回：** `LogEntry` 对象的异步迭代。

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

### 流

```typescript
stream(params: FunctionLogStreamParams = {}): AsyncIterable<LogEntry>
```

流式传输新的函数日志，直到达到超时。

**参数** (`FunctionLogStreamParams`)
* `timeoutMs?` (`number`)：结束流之前日志条目之间等待的毫秒数。默认情况下，流会阻塞直至被中断。

**返回：** `LogEntry` 对象到达时的异步可迭代。

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");

for await (const entry of function_.logs.stream({ timeoutMs: 60_000 })) {
  process.stdout.write(entry.message);
}
```

### 尾巴

```typescript
tail(params: FunctionLogTailParams = {}): AsyncIterable<LogEntry>
```

获取最新的函数日志。

条目按时间顺序返回。

**参数** (`FunctionLogTailParams`)

* `entries?` (`number`)：要返回的日志条目数。默认为 100。
* `source?` (`LogSource`)：按来源过滤：`stdout`、`stderr` 或 `system`。

**返回：** `LogEntry` 对象的异步迭代。

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");

for await (const entry of function_.logs.tail({ entries: 20 })) {
  process.stdout.write(entry.message);
}
```