<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用程序

应用程序引用模态应用程序。

```go
type App struct {
	AppID       string
	Name        string
	Environment string
	Sandboxes   *AppSandboxesManager // Sandboxes provides operations on this App's Sandboxes.
}
```

## 来自姓名

*通过`client.Apps`访问*

```go
FromName(ctx context.Context, name string, params *AppFromNameParams) (*App, error)
```

FromName 引用具有给定名称的应用程序，如有必要，创建一个新应用程序。

**参数** (`AppFromNameParams`)

AppFromNameParams 是 client.Apps.FromName 的选项。

* `Environment` (`string`)
* `CreateIfMissing` (`bool`)

## 信息

```go
Info(ctx context.Context, params *AppInfoParams) (*AppInfo, error)
```

信息返回先前查找、列出或刷新的快照。
设置“刷新”以获取当前生命周期信息以及成员函数和服务器 ID。
返回的信息是一个副本，调用者可以独立修改。

**参数** (`AppInfoParams`)

AppInfoParams 是 App.Info 的选项。* `Refresh` (`bool`)：刷新获取当前信息而不是缓存的快照。

## 统计数据

```go
Stats(ctx context.Context, params *AppStatsParams) (*AppStats, error)
```

统计信息返回此应用程序的聚合函数、服务器和沙箱统计信息。
默认窗口是最近一小时。 Windows 最多可以持续 7 天，
从过去 30 天内开始。

应用程序统计信息显示总调用计数、请求计数以及活动计数和
时间窗口内出现错误的容器。他们还计算完成的沙箱
在间隔中以及截至窗口结束时仍在运行的那些。

可用的统计数据及其定义可能会发生变化，并已提供
在尽最大努力的基础上。它们可能会延迟或不完整。

```go
app, err := client.Apps.FromName(ctx, "my-app", nil)
if err != nil {
	return err
}
stats, err := app.Stats(ctx, nil)
if err != nil {
	return err
}
fmt.Println(stats.Functions.Total.Calls.Failed)
fmt.Println(stats.Functions.ByName["embed"].Counts.Containers.Errors)
```

**参数** (`AppStatsParams`)

AppStatsParams 包含 App.Stats 的选项。

* `Since` (`*time.Time`)：Since 包含在内，默认为 Until 之前一小时。
* `Until` (`*time.Time`): Until 是独占的，默认为当前时间。

## 停止

```go
Stop(ctx context.Context, params *AppStopParams) error
```

Stop 停止应用程序。

停止应用程序会终止其所有正在运行的容器和沙箱，并且
阻止处理新的输入。

**参数** (`AppStopParams`)

AppStopParams 是 App.Stop 的选项。

*没有可配置选项。*

## 应用程序沙箱

沙箱提供对此应用程序沙箱的操作。

### 统计数据

```go
Stats(ctx context.Context, params *SandboxStatsParams) (iter.Seq2[SandboxGroupStats, error], error)
```

统计信息返回一段时间范围内应用程序沙箱的统计信息，可以选择按标签值分组。

最大时间范围为 7 天。

它为每个标签值组合生成一个 SandboxGroupStats。如果参数不正确，则返回 InvalidError
无效，如果服务器拒绝该时间范围或超过 10,000 个，则在迭代期间产生
组。迭代过程中还会产生其他 RPC 错误。

```go
since := time.Now().UTC().Truncate(time.Hour).Add(-24 * time.Hour)
groups, err := app.Sandboxes.Stats(ctx, &modal.SandboxStatsParams{Since: &since, GroupByTags: []string{"team"}})
if err != nil {
	return err
}
for group, err := range groups {
	if err != nil {
		return err
	}
	fmt.Println(group.Tags, group.Cost, group.CostByResource)
}
```

**参数** (`SandboxStatsParams`)

SandboxStatsParams 包含 AppSandboxesManager.Stats 的选项。
* `Since` (`*time.Time`)：因为是 UTC 小时边界上时间范围的开始（含）。必需的。
* `Until` (`*time.Time`)：直到是 UTC 小时边界上时间范围的结束（不包括在内）。如果为零，则默认为当前时间。
* `GroupByTags` (`[]string`): GroupByTags 列出要分组的标签名称。这些名称具有相同值的沙箱形成一组；沙盒中不存在的名称视为零。如果为空，则所有匹配的沙箱将作为带有空标签的单个组返回。
* `Tags` (`map[string]string`)：标签仅包括与所有这些标签名称和值匹配的沙箱。