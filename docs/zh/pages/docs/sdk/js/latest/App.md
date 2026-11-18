<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用程序

代表模态应用程序。

```typescript
class App {
  readonly appId: string;
  readonly name?: string;
  readonly environmentName?: string;
  get sandboxes(): AppSandboxesManager; // Operations on this App's Sandboxes.
}
```

## 来自姓名

*通过`modal.apps`访问*

```typescript
async fromName(name: string, params: AppFromNameParams = {}): Promise<App>
```

按名称引用已部署的`App`，如果不存在则创建。

**参数** (`AppFromNameParams`)

`client.apps.fromName()` 的可选参数。

* `environment?` (`string`)
* `createIfMissing?` (`boolean`)

## 信息

```typescript
async info(params: AppInfoParams = {}): Promise<AppInfo>
```

返回有关此应用程序的信息，包括其生命周期以及成员函数和服务器。
默认情况下，返回上次查找、列出或刷新的快照。

**参数** (`AppInfoParams`)

`App.info` 的可选参数。

* `refresh?` (`boolean`)：获取当前信息而不是缓存的查找或列出快照。

## 统计数据

```typescript
async stats(params: AppStatsParams = {}): Promise<AppStats>
```返回此应用程序的聚合函数、服务器和沙箱统计信息。

默认窗口是最近一小时。 Windows 最多可以持续 7 天，
从过去 30 天内开始。

应用程序统计信息显示总调用计数、请求计数以及活动容器和错误容器的计数
时间窗口。时间间隔内完成的沙箱数量以及计数
截至窗口结束仍在运行的那些也被返回。

可用的统计数据及其定义可能会发生变化，并已提供
在尽最大努力的基础上。它们可能会延迟或不完整。
**参数** (`AppStatsParams`)

`App.stats` 的可选参数。

* `since?` (`Date`)：时间范围的开始（含）。默认为 `until` 之前一小时。
* `until?` (`Date`)：时间范围结束，独占。默认为当前时间。

```ts
const stats = await app.stats();
console.log(stats.functions.total.calls.failed);
console.log(stats.functions.byName["embed"].counts.containers.errors);
```

## 停止

```typescript
async stop(_: AppStopParams = {}): Promise<void>
```

停止应用程序。

停止应用程序会终止其所有正在运行的容器和沙箱，并且
阻止处理新的输入。

**参数** (`AppStopParams`)

`App.stop()` 的可选参数。

*没有可配置选项。*

## 应用程序.沙箱

在此应用程序的沙箱上进行操作。

### 统计数据

```typescript
async *stats(
  params: SandboxStatsParams,
): AsyncGenerator<SandboxGroupStats, void, unknown>
```返回一段时间范围内此应用程序沙箱的统计信息，可以选择按标签值分组。

最大时间范围为 7 天。

产生 `SandboxGroupStats` 对象，每个标签值组合一个，具有以下字段：

* `tags`：组沙箱的`groupByTags`中每个名称的值，`null`不存在。
* `cost`：以美元为单位的总成本（十进制字符串），`costByResource` 的总和。
* `costByResource`：以美元为单位的十进制字符串成本，按计费资源：`CPU`、`Memory` 和 GPU 类型，例如
  `H100`。随着 Modal 计费模型的发展，资源名称可能会发生变化。

**参数** (`SandboxStatsParams`)

`app.sandboxes.stats()` 的参数。
* `since` (`Date`)：UTC 小时边界上的时间范围的开始（含）。
* `until?` (`Date`)：时间范围的结束点（不包括 UTC 小时边界）。如果省略，则默认为当前时间。
* `groupByTags?` (`string[]`)：分组依据的标签名称。这些名称具有相同值的沙箱形成一组；沙盒中未出现的名称算作 `null`。如果省略，所有匹配的沙箱将作为带有 `tags: {}` 的单个组返回。
* `tags?` (`Record<string, string>`)：仅包含与所有这些标签名称和值匹配的沙箱。

**加薪：**

* `InvalidError`：如果时间范围无效或者组数超过10000组。

```ts
const since = new Date(Math.floor(Date.now() / 3600_000) * 3600_000 - 24 * 3600_000);
for await (const group of app.sandboxes.stats({ since, groupByTags: ["team"] })) {
  console.log(group.tags, group.cost, group.costByResource);
}
```