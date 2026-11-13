<!-- modal-docs: machine-translated zh-CN from English source -->

# 程序化的可观测性

部署应用程序后，您可能想检查它是否正在接收流量，
调用是否成功，或者 GPU 容器是否仍在运行
交通停止。

CLI 和 SDK 公开用于查询配置、统计信息、指标、调用和请求历史记录的命令，以及
日志。使用这些工具从您的终端进行调查
或者构建您自己的脚本以实现可观察性。

本指南涵盖五种类型的命令，每种命令回答不同的问题：

|命令 |问题 || -------------------- | -------------------------------------------------- |
| `info` |部署了什么以及如何配置？        |
| `stats` |我的部署健康吗？                          |
| `metrics` |随着时间的推移，部署的表现如何？          |
| `calls` / `requests` |部署处理了哪些调用或请求？ |
| `logs` |容器内发生了什么？               |

下面的示例使用名为 `example-app` 的已部署 [App](/docs/sdk/py/latest/App)
带有一个名为 `func` 的 [Function](/docs/guide/functions) 和一个
[服务器](/docs/guide/servers) 名为 `Server`。将这些名称替换为您自己的名称。

<Callout>
  SDK 支持因命令而异；每个部分显示当前支持的语言。
</Callout>

## 部署了什么？

从`info`开始查看哪些功能和服务器属于您的应用程序：

\<CodeTabs languageOrder={\["cli", "python", "javascript", "go"]}>
{#snippet cli()}

```shell
modal app info example-app
```

{/片段}
{#snippet python()}

```python notest
app = modal.App.lookup("example-app")
info = app.info()
print(info.lifecycle)
print(info.functions)
print(info.servers)
```

{/片段}
{#snippet javascript()}

```javascript notest
const app = await modal.apps.fromName("example-app");
const info = await app.info();
console.log(info.lifecycle);
console.log(info.functions);
console.log(info.servers);
```

{/片段}
{#snippet go()}

```go notest
app, _ := mc.Apps.FromName(ctx, "example-app", nil)
info, _ := app.Info(ctx, nil)
fmt.Printf("%+v\n", info.Lifecycle)
fmt.Println(info.Functions)
fmt.Println(info.Servers)
```

{/片段} </CodeTabs>

应用程序信息包括其功能和服务器、状态、部署版本、
创建和部署时间以及创建和部署它的用户。接下来，检查单个功能或服务器。 CLI 命令接受
`APP_NAME/NAME` 标识符或 `info` 返回的 `fu-...` 对象 ID。

\<CodeTabs languageOrder={\["cli", "python", "javascript", "go"]}>
{#snippet cli()}

```shell
modal function info example-app/func
modal server info example-app/Server
```

{/片段}
{#snippet python()}

```python notest
function = modal.Function.from_name("example-app", "func")
server = modal.Server.from_name("example-app", "Server")
print(function.info())
print(server.info())
```

{/片段}
{#snippet javascript()}

```javascript notest
const fn = await modal.functions.fromName("example-app", "func");
console.log(await fn.info());
```

{/片段}
{#snippet go()}

```go notest
fn, _ := mc.Functions.FromName(ctx, "example-app", "func", nil)
info, err := fn.Info(ctx, nil)
if err != nil {
	panic(err)
}
fmt.Printf("%+v\n", info)
```

{/片段} </CodeTabs>

功能和服务器信息包括模态`Image`、请求的硬件资源、
执行设置、自动缩放配置以及任何配置的网络设置。

## 我的部署正常吗？

检查配置后，使用 `stats` 获取活动摘要
超过一个时间窗口。默认窗口是最近一小时；这些例子
使用最后 15 分钟：

\<CodeTabs languageOrder={\["cli", "python", "javascript", "go"]}>
{#snippet cli()}

```shell
modal function stats example-app/func --since 15m
modal server stats example-app/Server --since 15m
```

{/片段}
{#snippet python()}

```python notest
until = datetime.now(timezone.utc)
since = until - timedelta(minutes=15)
function = modal.Function.from_name("example-app", "func")
server = modal.Server.from_name("example-app", "Server")
print(function.stats(since=since, until=until))
print(server.stats(since=since, until=until))
```

{/片段}
{#snippet javascript()}

```javascript notest
const fn = await modal.functions.fromName("example-app", "func");
const until = new Date();
const since = new Date(until.getTime() - 15 * 60 * 1000);
console.log(await fn.stats({ since, until }));
```

{/片段}
{#snippet go()}

```go notest
fn, _ := mc.Functions.FromName(ctx, "example-app", "func", nil)
until := time.Now().UTC()
since := until.Add(-15 * time.Minute)
stats, _ := fn.Stats(ctx, &modal.FunctionStatsParams{Since: &since, Until: &until})
fmt.Printf("%+v\n", stats)
```

{/片段} </CodeTabs>

对于函数，`stats` 报告成功、失败和超时输入的计数，
以及执行时间和端到端延迟的分布。使用这些
统计数据以发现错误增加或调用速度变慢。

`stats` 命令还显示有多少容器在运行期间启动或出错窗口，在其末尾仍在创建多少个窗口，以及
容器启动时间。这些可以帮助您调查重复的容器
失败或启动缓慢。

对于服务器，`stats` 报告相同的容器统计信息以及请求
按 HTTP 状态代码显示的延迟分布和请求计数。服务器正在运行
支持的 LLM 推理引擎（例如 SGLang 或 vLLM）也会报告推理
指标，例如第一个令牌的时间。

<Callout>
  统计数据是尽最大努力提供的，可能会延迟或不完整。
  给予新生成的流量出现的时间。它们的目的是为了调查，而不是为了
用于推动自动缩放决策。
</Callout>

## 随着时间的推移，部署的表现如何？

`stats` 总结时间窗口，`metrics` 返回时间序列
部署的功能或服务器。这些显示了测量如何成功
函数调用或 GPU 利用率在该窗口内发生变化。比较系列
调查诸如 GPU 在流量高峰期间是否未得到充分利用等问题。

首先，发现可用的系列及其单位：

\<CodeTabs languageOrder={\["cli", "python", "javascript", "go"]}>
{#snippet cli()}

```shell
modal function metrics example-app/func
modal server metrics example-app/Server
```

{/片段}
{#snippet python()}

```python notest
function = modal.Function.from_name("example-app", "func")
schema = function.metrics.schema()
print(schema)
```

{/片段}
{#snippet javascript()}

```javascript notest
const fn = await modal.functions.fromName("example-app", "func");
const schema = await fn.metrics.schema();
console.log(schema);
```

{/片段}
{#snippet go()}```go notest
fn, _ := mc.Functions.FromName(ctx, "example-app", "func", nil)
schema, err := fn.Metrics.Schema(ctx, nil)
if err != nil {
	panic(err)
}
fmt.Println(schema)
```

{/片段} </CodeTabs>

默认 CLI 输出列出了可用指标及其单位。导出
测量，选择具有 `--group` 的度量组，然后选择 `--json` 或 `--csv`。
我们建议将此命令的输出通过管道传输到文件中，尤其是在调用时
在代理工具中，以防止原始数据耗尽上下文。

在Python和JavaScript SDK中，使用`schema()`发现函数指标
和 `export()` 获取他们的测量结果。在 Go 中，使用 `Metrics.Schema()` 和
`Metrics.Export()`：

\<CodeTabs languageOrder={\["cli", "python", "javascript", "go"]}>
{#snippet cli()}

```shell
modal function metrics example-app/func \
    --group calls --group containers --group cpu \
    --since 1h --bucket-size 1m --json > function-metrics.json
modal server metrics example-app/Server \
    --group requests --group containers --group gpu \
    --since 1h --bucket-size 1m --csv > server-metrics.csv
```

{/片段}
{#snippet python()}

```python notest
function = modal.Function.from_name("example-app", "func")
until = datetime.now(timezone.utc)
since = until - timedelta(hours=1)
metrics = function.metrics.export(
    groups=["calls", "containers", "cpu"],
    since=since,
    until=until,
    bucket_size=timedelta(minutes=1),
)

for point in metrics.series["successful_calls_count"].points:
    print(point.time, point.value)

find_spike_in_traffic(metrics.series["succesfull_calls_count"])
```

{/片段}
{#snippet javascript()}

```javascript notest
const fn = await modal.functions.fromName("example-app", "func");
const until = new Date();
const since = new Date(until.getTime() - 60 * 60 * 1000);
const metrics = await fn.metrics.export({
  groups: ["calls", "containers", "cpu"],
  since,
  until,
  bucketSizeSecs: 60,
});

for (const point of metrics.series["successful_calls_count"].points) {
  console.log(point.time, point.value);
}

findSpikeInTraffic(metrics.series["successful_calls_count"]);
```

{/片段}
{#snippet go()}

```go notest
fn, _ := mc.Functions.FromName(ctx, "example-app", "func", nil)
until := time.Now().UTC()
since := until.Add(-time.Hour)
bucketSize := time.Minute
metrics, err := fn.Metrics.Export(ctx, &modal.FunctionMetricsExportParams{
	Groups:     []string{"calls", "containers", "cpu"},
	Since:      &since,
	Until:      &until,
	BucketSize: &bucketSize,
})
if err != nil {
	panic(err)
}

for _, point := range metrics.Series["successful_calls_count"].Points {
	if point.Value == nil {
		fmt.Println(point.Time, "missing")
	} else {
		fmt.Println(point.Time, *point.Value)
	}
}

FindSpikeInTraffic(metrics.Series["successful_calls_count"])
```

{/片段} </CodeTabs>

这些示例将最后一小时的测量结果导出到一分钟的存储桶中。每个
Bucket 总结了那一分钟的测量结果。

SDK 结果包含按指标名称键入的 `series` 映射（Go 中的`Series`）。每个
系列包括其单位、描述和要点。一个点的 `time` 是
存储桶的开始时间，其 `value` 为 `None` (Python)、`null` (JavaScript) 或 `nil` (Go)
当无法进行观察时。

## 部署处理了哪些调用或请求？要调查单个调用或请求，请使用 `calls` 作为函数和
`requests` 服务器：

* `calls` 列出函数输入及其状态、执行时间和容器
  身份证。添加 `--show-function-call-id` 以包含函数调用 ID。
* `requests` 列出服务器 HTTP 请求及其路径、状态代码和时间
  信息。

列出 10 个最近的输入或请求：

```shell
modal function calls example-app/func --tail 10
modal server requests example-app/Server --tail 10
```

要调查特定时间窗口，请使用 `--since` 和（可选）`--until`。
添加 `--json` 返回结构化输出以在脚本中使用：

```shell
modal function calls example-app/func --since 15m --json
modal server requests example-app/Server --since 15m --json
```

## 容器内发生了什么？

一旦发现故障或意外行为，请使用 `logs` 查看
了解详情。日志包含代码写入的消息、异常和系统
输出。这些示例获取过去 15 分钟的日志：

\<CodeTabs languageOrder={\["cli", "python", "javascript", "go"]}>
{#snippet cli()}

```shell
modal function logs example-app/func --since 15m --timestamps
modal server logs example-app/Server --since 15m --timestamps
```

{/片段}
{#snippet python()}

```python notest
function = modal.Function.from_name("example-app", "func")
until = datetime.now(timezone.utc)
since = until - timedelta(minutes=15)
for entry in function.logs.fetch(since=since, until=until):
    print(entry.timestamp, entry.source, entry.message)
```

{/片段}
{#snippet javascript()}

```javascript notest
const fn = await modal.functions.fromName("example-app", "func");
const until = new Date();
const since = new Date(until.getTime() - 15 * 60 * 1000);
for await (const entry of fn.logs.fetch({ since, until })) {
  console.log(entry.timestamp, entry.source, entry.message);
}
```

{/片段}
{#snippet go()}

```go notest
fn, _ := mc.Functions.FromName(ctx, "example-app", "func", nil)
until := time.Now().UTC()
since := until.Add(-15 * time.Minute)
entries, err := fn.Logs.Fetch(ctx, since, &modal.FunctionLogFetchParams{Until: &until})
if err != nil {
	panic(err)
}
for entry, err := range entries {
	if err != nil {
		panic(err)
	}
	fmt.Println(entry.Timestamp, entry.Source, entry.Message)
}
```

{/片段} </CodeTabs>

要获取最新日志，请在 CLI 中使用 `--tail`
或者 Go 中的 `logs.tail` (`Logs.Tail`)。
更改计数，或使用 `--since` 和 `--until` 选择历史间隔。

要在新日志到达时查看它们，请在 CLI 中使用 `--follow` 或 `logs.stream()`（Go 中的`Logs.Stream()`）。 CLI 将继续执行，直到通过 Ctrl+C 显式停止为止；
SDK 公开了一个 `timeout` 参数。

\<CodeTabs languageOrder={\["cli", "python", "javascript", "go"]}>
{#snippet cli()}

```shell
modal function logs example-app/func --follow --timestamps
```

{/片段}
{#snippet python()}

```python notest
function = modal.Function.from_name("example-app", "func")
for entry in function.logs.stream():
    print(entry.timestamp, entry.source, entry.message)
```

{/片段}
{#snippet javascript()}

```javascript notest
const fn = await modal.functions.fromName("example-app", "func");
for await (const entry of fn.logs.stream()) {
  console.log(entry.timestamp, entry.source, entry.message);
}
```

{/片段}
{#snippet go()}

```go notest
fn, err := mc.Functions.FromName(ctx, "example-app", "func", nil)
if err != nil {
	panic(err)
}
entries, err := fn.Logs.Stream(ctx, nil)
if err != nil {
	panic(err)
}
for entry, err := range entries {
	if err != nil {
		panic(err)
	}
	fmt.Println(entry.Timestamp, entry.Source, entry.Message)
}
```

{/片段} </CodeTabs>

默认情况下，SDK 流会无限期等待。在没有新的一段时间后停止
条目，在 Python 中传递 `timeout`（以秒为单位），在 JavaScript 中传递 `timeoutMs`，或者
Go 中的 `Timeout` `modal.LogStreamParams`。
当上下文被取消时，Go 流也会停止。

## 把它放在一起

监控部署涉及从广泛到具体的转变。例如：

1. 使用 `modal app list` 列出您环境中的应用程序
2. 对于给定的应用程序，获取其`info`
3. 对于其功能之一，获取其`stats`
4. 如果出现问题，例如许多失败的函数调用，请获取最近的 `calls`
5. 使用 `logs --function-call-id` 查看给定调用的日志

这只是建议的工作流程； CLI 和 SDK 功能的设计目的是
可以组合起来执行任意分析的通用工具。