# Sandbox resources and pricing

This page covers resource configuration and pricing for Modal Sandboxes.

Modal Sandboxes differ from many other sandbox providers on two dimensions:

* Modal Sandboxes have elastic resourcing. They automatically "burst" beyond their CPU and memory requests.
* You're charged `max(request, actual)` for both CPU and memory. When bursting, charging `max(request, actual)`
  means you only pay for active-resources.

Sandbox [workloads tend to have highly variable resource usage](https://modal.com/blog/sandbox-bursting), so this burst model tends to result in prices far lower than most sandbox providers.

See [Billing](/docs/guide/resources#billing) in the resource guide for more details.

## Pay for what you use

By default, each Sandbox requests 0.125 CPU cores and 128 MiB of memory and
bursts beyond that as needed.

Modal schedules and packs Sandboxes onto hosts so that additional CPU and memory is available the vast majority of the time. The worst case is an out-of-memory eviction, and Modal backs its burst model with an eviction probability SLO of less than 0.0001% per minute for Sandboxes above their request but under 8 GiB (about 1 eviction per 694 Sandbox-days). Because Sandboxes can reliably burst to use additional resources, most workloads don't need to set a resource request for their Sandboxes.

Not setting a resource request means you only pay for the resources your Sandbox is
actively using each second, with the small default request as the minimum.

## Setting resource requests

Requesting resources guarantees your Sandbox a minimum amount of CPU and memory.
You are charged for requested resources for the lifetime of your Sandbox, regardless of
whether the resources are being used.

Set CPU and memory requests using the `cpu` and `memory` parameters when creating your Sandbox.
The `cpu` parameter specifies physical CPU cores (1 core = 2 vCPUs),
and `memory` specifies MiB:

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

{/snippet}

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

{/snippet}

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

{/snippet} </CodeTabs>

For details on default values and maximum limits, see
[Reserving CPU and memory](/docs/guide/resources).

## Setting resource limits

You can set upper limits to cap how much a Sandbox can burst.
Limits are particularly useful when an AI agent controls what runs inside the Sandbox,
as they prevent misbehaving or adversarial workloads from consuming unbounded resources.
They also let you evaluate agents on bounded resources, like when running evals.

<CodeTabs>
  {#snippet python()}

```python notest
sb = modal.Sandbox.create(
    cpu=(0.5, 4.0),       # Request 0.5 cores, limit to 4 cores
    memory=(512, 2048),   # Request 512 MiB, limit to 2048 MiB
    app=app,
)
```

{/snippet}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  cpu: 0.5,
  cpuLimit: 4.0,
  memoryMiB: 512,
  memoryLimitMiB: 2048,
});
```

{/snippet}

{#snippet go()}

```go notest
sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	CPU:            0.5,    // Request 0.5 cores
	CPULimit:       4.0,    // Limit to 4 cores
	MemoryMiB:      512,    // Request 512 MiB
	MemoryLimitMiB: 2048,   // Limit to 2048 MiB
})
```

{/snippet} </CodeTabs>

See [Resource limits](/docs/guide/resources#resource-limits) for details on
how CPU and memory limits behave.

## Tuning your requests

The Sandboxes tab on an App page has metrics to help you monitor your bursting and, if needed, find the right request size:
**CPU Per Sandbox**, **Memory Per Sandbox**, **CPU Pressure Per Sandbox**, and
**Exit Reasons**.

![Resource-sizing charts on the Sandboxes metrics tab](https://modal-cdn.com/cdnbot/resource-sizing-chartswb81a46v_6e4fd1b8.webp)

CPU Per Sandbox and Memory Per Sandbox show percentiles of how much CPU and
memory your Sandboxes actually use. And CPU Pressure Per Sandbox and Exit Reasons
tell you if a request is too low. CPU Pressure Per Sandbox tracks time Sandboxes
spent stalled waiting for CPU; Exit Reasons tracks Sandboxes evicted while
exceeding their memory request.

1. Start with the [default request values](#pay-for-what-you-use) for CPU
   and memory, which are used when you omit the `cpu` and `memory` parameters.

2. Run your typical workload and check CPU Per Sandbox and Memory Per
   Sandbox to see your actual usage.

3. Check CPU Pressure Per Sandbox and Exit Reasons to confirm that throttling and
   evictions are at acceptable levels.

4. If evictions are higher than needed, raise the resource request based on your observed usage.

## Disk

Sandboxes have the same [disk limits](/docs/guide/resources#disk-limits) as
other Modal containers, and their disk size cannot be increased. On the
[VM runtime](/docs/guide/sandboxes#runtimes), the root filesystem is a fixed
512 GiB.

## GPU Sandboxes

You can also run Sandboxes with GPUs. See [GPU acceleration](/docs/guide/gpu) for available
GPU types and configuration. GPU Sandboxes are only supported with
[`runtime="gvisor"`](/docs/guide/sandboxes#runtimes).

Unlike CPU Sandboxes, GPU Sandboxes are subject to [preemption](/docs/guide/preemption).
Design your GPU workloads to handle interruptions gracefully.

## Cost attribution

The [cost attribution tools in the billing guide](/docs/guide/billing#attributing-costs)
let you attribute spend by App, including costs aggregated over all of an App's
Sandboxes.

For a more granular breakdown of Sandbox cost, use `App.sandboxes.stats()` to query
costs over a time range, grouped by the values of
[Sandbox tags](/docs/guide/sandboxes#tagging). This example prints the last 24 hours of
cost for each value of the `major_version` tag:

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

{/snippet}

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

{/snippet}

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

{/snippet} </CodeTabs>

Each group has a total cost in USD and a breakdown by billed resource, such as
`CPU`, `Memory`, and GPU type.

* `since`, and `until` if you pass it, must be on a UTC hour boundary, and a
  query can span at most 7 days.
* Sandboxes that don't have a tag you group by are still counted, with a null
  value for that tag.
* To filter by tag, pass `tags`. Only Sandboxes that have all
  of those tags and values are included.
* Costs don't account for credits or reservations, so your invoice may be lower.

For all parameters and return types, see the SDK reference
([Python](/docs/sdk/py/latest/App#sandboxesstats),
[JavaScript](/docs/sdk/js/latest/App#appsandboxes),
[Go](/docs/sdk/go/latest/App#appsandboxes)).

## Additional resources

* [Sandbox pricing](/pricing#sandboxes): current pricing for Sandboxes
* [Reserving CPU and memory](/docs/guide/resources): CPU, memory, and disk configuration
* [Billing](/docs/guide/billing): billing cycles, budgets, and cost attribution
