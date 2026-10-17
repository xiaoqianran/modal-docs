<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数

表示已部署的模态函数，可以远程调用。

```typescript
class Function_ {
  readonly functionId: string;
  readonly methodName?: string;
  get logs(): FunctionLogsManager; // Access logs for this Function. Use `fetch()` to read logs from a UTC time range, `tail()` to read the most recent logs, and `stream()` to follow new logs as they arrive. See also: [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs) for CLI access to logs for an App.
  get metrics(): FunctionMetricsManager; // Access metric samples with export() and series definitions with schema().
}
```

## 来自 ID

*通过`modal.functions`访问*

```typescript
async fromId(functionId: string): Promise<Function_>
```

通过 ID 引用 `Function`。

```typescript
const client = new ModalClient();
const fn = await client.functions.fromId("fu-***");
console.log(await fn.getWebUrl());
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
async getCurrentStats(): Promise<FunctionCurrentStats>
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
```使用指定的配置创建函数的实例
`withOptions`、`withConcurrency`、
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

## 统计数据

```typescript
async stats(params: FunctionStatsParams = {}): Promise<FunctionStats>
```

返回历史统计数据。默认为最后一小时；最大范围为 7 天。

**参数** (`FunctionStatsParams`)

* `since?` (`Date`)：包含开始；默认为一小时前直到。
* `until?` (`Date`)：独占结束；默认为当前时间。
* `container?` (`string`)：限制统计该容器ID。
* `allVariants?` (`boolean`)：聚合基本函数及其变体。默认为 false。

阅读过去一小时的统计数据。

```ts
const fn = await modal.functions.fromName("libmodal-test-support", "echo_string");
const stats = await fn.stats();
console.log(stats.inputSuccessCount, stats.inputFailureCount);
```

包括过去 24 小时内的所有变体。
```ts
const until = new Date();
const since = new Date(until.getTime() - 24 * 60 * 60 * 1000);
const variantStats = await fn.stats({ since, until, allVariants: true });
for (const [metric, distribution] of Object.entries(variantStats.inputPercentileStats)) {
  console.log(metric, distribution.unit, distribution.percentiles);
}
```

将 `container` 设置为容器 ID 以将统计信息限制到该容器。

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
* `targetInputs?` (`number`)## 带选项

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
日志，以及 `stream()` 来跟踪新日志：
他们到达了。

另请参阅：[`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs)
用于 CLI 访问应用程序的日志。
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
* `searchText?` (`string`)：按日志消息中包含的文本进行过滤。

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

流式传输新的函数日志，直到达到超时。**参数** (`FunctionLogStreamParams`)

* `timeoutMs?` (`number`)：结束流之前日志条目之间等待的毫秒数。默认情况下，流会阻塞直至被中断。

**返回：** `LogEntry` 对象到达时的异步迭代。

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

## 函数.metrics
使用 export() 访问指标示例，并使用 schema() 访问系列定义。

### 导出

```typescript
async export(
  params: FunctionMetricsExportParams = {},
): Promise<ObjectMetrics>
```

获取指标样本，默认为过去一小时内的所有组。

最大范围为 31 天，每个系列最多 500 点。省略
bucketSizeSecs 让 Modal 选择大约支持的宽度定位
100桶。边界向下舍入到 UTC 存储桶边界：此后之前的数据
可以包括在内，并且排除在until处的部分桶。
缺失的观测值为 null。使用 schema() 来发现定义。

**参数** (`FunctionMetricsExportParams`)用于导出函数度量样本的选项。

* `since?` (`Date`)：默认为之前一小时，直到。
* `until?` (`Date`)：默认为当前时间。
* `bucketSizeSecs?` (`number`)：以整秒为单位的桶宽度。
* `allVariants?` (`boolean`)：包括根函数及其所有变体。默认为 false。

```typescript
const metrics = await fn.metrics.export({
  bucketSizeSecs: 5 * 60,
  groups: ["calls"],
});
for (const point of metrics.series["successful_calls_count"].points) {
  console.log(point.time, point.value);
}
```

### 架构

```typescript
async schema(
  params: MetricsSchemaParams = {},
): Promise<Record<string, MetricsSchema>>
```

返回按组名称键入的指标定义，而不获取样本。
省略组以返回所有组。每个组的定义包括其所有
个人系列。

**参数** (`MetricsSchemaParams`)

用于发现指标定义的选项。

* `groups?` (`string[]`): 省略或传递一个空数组来选择所有组。