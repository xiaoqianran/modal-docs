<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙盒资源和定价

本页面介绍模态沙箱的资源配置和定价。
有关 CPU 和内存选项的一般文档，请参阅
[预留 CPU 和内存](/docs/guide/resources)。

## 按使用量付费

模态沙箱按秒计费，以较高者为准：
您的资源请求或您的实际使用情况。

当额外的情况下，沙箱可能会超出其 CPU 和内存请求
资源在底层主机上可用。您的要求保证
最低水平的资源，但是当存在空闲容量时，您的沙箱
可以使用更多。您支付`max(request, actual)`。

有关更多详细信息，请参阅资源指南中的[计费](/docs/guide/resources#billing)。

## 配置资源

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

### 资源限制
您可以设置上限来限制沙箱可以爆发的数量。
当人工智能代理控制沙箱内运行的内容时，这特别有用，
因为它可以防止行为不当或对抗性工作负载消耗无限的资源：

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

为了获得最大的成本效益，请根据观察到的使用百分位数而不是峰值来提出请求：
CPU 约为 p50–75，内存约为 p90–95。

如果您观察到的使用情况始终高于您的要求，您可以
主机上遇到资源争用。这可能表现为 OOM 错误或 CPU 限制。

目标应该是设置与基本负载相对应的请求，同时让突发处理偶尔的峰值。

1. 从 CPU 和内存的默认值开始。

2. 运行典型工作负载并观察实际资源使用情况
   在 [模态仪表板](/apps) 中了解您的基线需求。

3. 设置您的请求以匹配您的工作负载持续需要的资源级别。
## GPU 沙箱

您还可以使用 GPU 运行沙箱。请参阅 [GPU 加速](/docs/guide/gpu) 了解可用的
GPU 类型和配置。

与 CPU 沙箱不同，GPU 沙箱受到[抢占](/docs/guide/preemption) 的影响。
设计您的 GPU 工作负载以优雅地处理中断。

## 其他资源

* [沙盒定价](/pricing#sandboxes)：沙盒的当前定价
* [预留CPU和内存](/docs/guide/resources)：CPU、内存和磁盘配置
* [计费](/docs/guide/billing)：计费周期、预算和成本归属