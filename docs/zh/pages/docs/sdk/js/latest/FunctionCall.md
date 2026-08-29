<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数调用

代表模态函数调用。 FunctionCalls 是 `Function` 调用
给定的输入。它们可以异步使用（参见`FunctionCall.get()`）或取消
（参见`FunctionCall.cancel()`）。

```typescript
class FunctionCall {
  readonly functionCallId: string;
  get logs(): FunctionCallLogsManager; // Access logs for this FunctionCall. Use `fetch()` to read logs from a UTC time range, `tail()` to read the most recent logs, and `stream()` to follow new logs as they arrive. See also: [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs) for CLI access to logs for an App.
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

## 函数调用.logs此 FunctionCall 的访问日志。

使用 `fetch()` 从 UTC 读取日志
时间范围，`tail()`阅读最多
最近的日志，以及关注的`stream()`
新日志到达时。

另请参阅：[`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs)
用于 CLI 访问应用程序的日志。

### 获取

```typescript
fetch(params: FunctionCallLogFetchParams = {}): AsyncIterable<LogEntry>
```

获取与对应于 UTC 时间的 FunctionCall 关联的日志
范围和可选过滤器。

当`since`省略时，日志从头开始获取
函数调用。条目按时间顺序返回。

**参数** (`FunctionCallLogFetchParams`)

* `since?` (`Date`)：UTC 时间范围的开始。默认为 FunctionCall 的开始。
* `until?` (`Date`)：UTC 时间范围结束。默认为当前时间。
* `source?` (`LogSource`)：按来源过滤：`stdout`、`stderr` 或 `system`。
* `searchText?` (`string`)：按日志消息中包含的文本进行过滤。

**返回：** `LogEntry` 对象的异步迭代。

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");
const call = await function_.spawn([]);

for await (const entry of call.logs.fetch()) {
  console.log(entry.timestamp, entry.message);
}
```

### 流

```typescript
stream(params: FunctionCallLogStreamParams = {}): AsyncIterable<LogEntry>
```

流式传输新的 FunctionCall 日志，直到达到超时或
观察到 FunctionCall 已完成。

完成检查是尽力而为的。如果无法确定是否完成，
流将继续，直到达到超时。

**参数** (`FunctionCallLogStreamParams`)* `timeoutMs?` (`number`)：结束流之前日志条目之间等待的毫秒数。默认情况下，流会阻塞直至被中断。

**返回：** `LogEntry` 对象到达时的异步可迭代。

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");
const call = await function_.spawn([]);

for await (const entry of call.logs.stream()) {
  process.stdout.write(entry.message);
}
```

### 尾巴

```typescript
tail(params: FunctionCallLogTailParams = {}): AsyncIterable<LogEntry>
```

获取最新的 FunctionCall 日志。

条目按时间顺序返回。

**参数** (`FunctionCallLogTailParams`)

* `entries?` (`number`)：要返回的日志条目数。默认为 100。
* `source?` (`LogSource`)：按来源过滤：`stdout`、`stderr` 或 `system`。

**返回：** `LogEntry` 对象的异步迭代。

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
const function_ = await modal.functions.fromName("my-app", "train");
const call = await function_.spawn([]);

for await (const entry of call.logs.tail({ entries: 10 })) {
  console.log(entry.timestamp, entry.message);
}
```