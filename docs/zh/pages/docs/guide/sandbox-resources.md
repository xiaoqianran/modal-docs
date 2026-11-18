<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙盒资源和定价

本页面介绍模态沙箱的资源配置和定价。

模态沙箱与许多其他沙箱提供商在两个方面有所不同：

* 模态沙箱具有弹性资源。它们会自动“爆发”超出其 CPU 和内存请求。
* 您需要支付 CPU 和内存费用 `max(request, actual)`。爆裂时充电`max(request, actual)`
  意味着您只需为活动资源付费。

沙箱[工作负载往往具有高度可变的资源使用](https://modal.com/blog/sandbox-bursting)，因此这种突发模型往往会导致价格远低于大多数沙箱提供商。

有关更多详细信息，请参阅资源指南中的[计费](/docs/guide/resources#billing)。

## 按使用量付费

默认情况下，每个 Sandbox 请求 0.125 个 CPU 核心和 128 MiB 内存，
根据需要爆发超出该范围。
Modal 将沙盒调度并打包到主机上，以便在绝大多数时间有额外的 CPU 和内存可用。最坏的情况是内存不足的驱逐，Modal 支持其突发模型，对于高于其请求但低于 8 GiB 的沙箱，每分钟驱逐概率 SLO 低于 0.0001%（每 694 个沙箱天大约有 1 次驱逐）。由于沙箱可以可靠地爆发以使用额外的资源，因此大多数工作负载不需要为其沙箱设置资源请求。

不设置资源请求意味着您只需为您的 Sandbox 所使用的资源付费
积极利用每一秒，以较小的默认请求为最小值。

## 设置资源请求

请求资源可以保证您的沙盒拥有最低数量的 CPU 和内存。
无论沙盒的生命周期如何，您都需要为所请求的资源付费
资源是否正在被使用。

创建沙盒时使用 `cpu` 和 `memory` 参数设置 CPU 和内存请求。
`cpu`参数指定物理CPU核心（1个核心= 2个vCPU），
并且`memory`指定MiB：

<CodeTabs>
  {#snippet python()}

```python notest
import modal

app = modal.App.lookup("my-app", create_if_missing=True)

sb = modal.Sandbox.create(
    cpu=0.5,
    memory=512,
    app=app,
)
```

{/片段}

{#snippet javascript()}

```javascript notest
import { ModalClient } from "modal";

const modal = new ModalClient();
const app = await modal.apps.fromName("my-app", { createIfMissing: true });
const image = modal.images.fromRegistry("python:3.13-slim");

const sb = await modal.sandboxes.create(app, image, {
  cpu: 0.5,
  memoryMiB: 512,
});
```

{/片段}

{#snippet go()}

```go notest
package main

import (
	"context"

	modal "github.com/modal-labs/modal-client/go"
)

func main() {
	ctx := context.Background()
	mc, _ := modal.NewClient()

	app, _ := mc.Apps.FromName(ctx, "my-app", &modal.AppFromNameParams{
		CreateIfMissing: true,
	})
	image := mc.Images.FromRegistry("python:3.13-slim", nil)

	sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
		CPU:       0.5,
		MemoryMiB: 512,
	})
}
```
{/片段} </CodeTabs>

有关默认值和最大限制的详细信息，请参阅
[预留 CPU 和内存](/docs/guide/resources)。

## 设置资源限制

您可以设置上限来限制沙箱可以爆发的数量。
当人工智能代理控制沙箱内运行的内容时，限制特别有用，
因为它们可以防止行为不当或对抗性工作负载消耗无限的资源。
它们还允许您评估有限资源上的代理，例如运行评估时。

<CodeTabs>
  {#snippet python()}

```python notest
sb = modal.Sandbox.create(
    cpu=(0.5, 4.0),       # Request 0.5 cores, limit to 4 cores
    memory=(512, 2048),   # Request 512 MiB, limit to 2048 MiB
    app=app,
)
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  cpu: 0.5,
  cpuLimit: 4.0,
  memoryMiB: 512,
  memoryLimitMiB: 2048,
});
```

{/片段}

{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	CPU:            0.5,    // Request 0.5 cores
	CPULimit:       4.0,    // Limit to 4 cores
	MemoryMiB:      512,    // Request 512 MiB
	MemoryLimitMiB: 2048,   // Limit to 2048 MiB
})
```

{/片段} </CodeTabs>

有关详细信息，请参阅[资源限制](/docs/guide/resources#resource-limits)
CPU 和内存限制的行为方式。

## 调整你的请求

应用程序页面上的“沙箱”选项卡具有可帮助您监控突发情况的指标，并在需要时找到正确的请求大小：
**每个沙箱的 CPU**、**每个沙箱的内存**、**每个沙箱的 CPU 压力**以及
**退出原因**。

![沙箱指标选项卡上的资源大小图表](https://modal-cdn.com/cdnbot/resource-sizing-chartswb81a46v_6e4fd1b8.webp)

每个沙箱的 CPU 和每个沙箱的内存显示 CPU 和内存的百分位数
您的沙箱实际使用的内存。每个沙箱的 CPU 压力和退出原因
告诉您请求是否太低。每个沙箱的 CPU 压力跟踪时间沙箱
花在等待 CPU 上；退出原因跟踪被逐出的沙箱
超出了他们的内存请求。

1. 从CPU的[默认请求值](#pay-for-what-you-use)开始
   和内存，当省略 `cpu` 和 `memory` 参数时使用。

2. 运行典型工作负载并检查每个沙箱的 CPU 和每个内存
   沙盒以查看您的实际使用情况。

3. 检查每个沙箱的 CPU 压力和退出原因，以确认节流和
   驱逐处于可接受的水平。

4. 如果驱逐量高于所需数量，请根据您观察到的使用情况提出资源请求。

## 磁盘

沙盒具有相同的[磁盘限制](/docs/guide/resources#disk-limits)
其他 Modal 容器，其磁盘大小无法增加。上
[VM运行时](/docs/guide/sandboxes#runtimes)，根文件系统是固定的
512 GiB。

## GPU 沙箱

您还可以使用 GPU 运行沙箱。请参阅 [GPU 加速](/docs/guide/gpu) 了解可用的
GPU 类型和配置。 GPU 沙箱仅支持
[`runtime="gvisor"`](/docs/guide/sandboxes#runtimes)。
与 CPU 沙箱不同，GPU 沙箱受到[抢占](/docs/guide/preemption) 的影响。
设计您的 GPU 工作负载以优雅地处理中断。

## 成本归因

[计费指南中的成本归因工具](/docs/guide/billing#attributing-costs)
让您按应用程序归因支出，包括所有应用程序的汇总成本
沙箱。

更精细的沙盒成本细分，可以使用`App.sandboxes.stats()`查询
一段时间范围内的成本，按以下值分组
[沙盒标签](/docs/guide/sandboxes#tagging)。此示例打印过去 24 小时的`major_version` 标签每个值的成本：

<CodeTabs>
  {#snippet python()}

```python notest
from datetime import datetime, timedelta, timezone

app = modal.App.lookup("my-app")

this_hour = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
since = this_hour - timedelta(days=1)

for group in app.sandboxes.stats(since=since, group_by_tags=["major_version"]):
    print(group.tags["major_version"], group.cost, group.cost_by_resource)
```

{/片段}

{#snippet javascript()}

```javascript notest
const app = await modal.apps.fromName("my-app");

const HOUR_MS = 60 * 60 * 1000;
const thisHour = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
const since = new Date(thisHour - 24 * HOUR_MS);

for await (const group of app.sandboxes.stats({
  since,
  groupByTags: ["major_version"],
})) {
  console.log(group.tags.major_version, group.cost, group.costByResource);
}
```

{/片段}

{#snippet go()}

```go notest
app, _ := mc.Apps.FromName(ctx, "my-app", nil)

since := time.Now().UTC().Truncate(time.Hour).Add(-24 * time.Hour)

groups, err := app.Sandboxes.Stats(ctx, &modal.SandboxStatsParams{
	Since:       &since,
	GroupByTags: []string{"major_version"},
})
if err != nil {
	panic(err)
}
for group, err := range groups {
	if err != nil {
		panic(err)
	}
	version := "(untagged)"
	if value := group.Tags["major_version"]; value != nil {
		version = *value
	}
	fmt.Println(version, group.Cost, group.CostByResource)
}
```

{/片段} </CodeTabs>

每个组都有以美元为单位的总成本以及按计费资源的细分，例如
`CPU`、`Memory` 和 GPU 类型。

* `since` 和 `until` 如果您通过了它，则必须位于 UTC 小时边界上，并且
  查询最多可以跨越 7 天。
* 没有分组标签的沙箱仍然会被计算在内，并且为空
  该标签的值。
* 要按标签过滤，请传递`tags`。只有沙盒具备所有功能
  包括这些标签和值。
* 费用不计入积分或预订，因此您的发票可能会较低。

有关所有参数和返回类型，请参阅 SDK 参考
([Python](/docs/sdk/py/latest/App#sandboxesstats),
[JavaScript](/docs/sdk/js/latest/App#appsandboxes),
[转到](/docs/sdk/go/latest/App#appsandboxes))。

## 其他资源

* [沙盒定价](/pricing#sandboxes)：沙盒的当前定价
* [预留CPU和内存](/docs/guide/resources)：CPU、内存和磁盘配置
* [计费](/docs/guide/billing)：计费周期、预算和成本归属