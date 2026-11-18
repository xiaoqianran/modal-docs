# App

Represents a Modal App.

```typescript
class App {
  readonly appId: string;
  readonly name?: string;
  readonly environmentName?: string;
  get sandboxes(): AppSandboxesManager; // Operations on this App's Sandboxes.
}
```

## fromName

*Accessed via `modal.apps`*

```typescript
async fromName(name: string, params: AppFromNameParams = {}): Promise<App>
```

Reference a deployed `App` by name, or create if it does not exist.

**Parameters** (`AppFromNameParams`)

Optional parameters for `client.apps.fromName()`.

* `environment?` (`string`)
* `createIfMissing?` (`boolean`)

## info

```typescript
async info(params: AppInfoParams = {}): Promise<AppInfo>
```

Return information about this App, including its lifecycle and member Functions and Servers.
By default, returns the snapshot from the previous lookup, listing, or refresh.

**Parameters** (`AppInfoParams`)

Optional parameters for `App.info`.

* `refresh?` (`boolean`): Fetch current information rather than the cached lookup or listing snapshot.

## stats

```typescript
async stats(params: AppStatsParams = {}): Promise<AppStats>
```

Return aggregate Function, Server, and Sandbox statistics for this App.

The default window is the most recent hour. Windows can span at most seven days,
with a start in the past 30 days.

App stats show total call counts, request counts, and the count of active and errored containers in
the time window. The count of sandboxes that finished in the interval as well as the count
that were still running as of the end of the window is also returned.

The available stats and their definitions are subject to change and are provided
on a best-effort basis. They may be delayed or incomplete.

**Parameters** (`AppStatsParams`)

Optional parameters for `App.stats`.

* `since?` (`Date`): The beginning of the time range, inclusive. Defaults to an hour before `until`.
* `until?` (`Date`): The end of the time range, exclusive. Defaults to the current time.

```ts
const stats = await app.stats();
console.log(stats.functions.total.calls.failed);
console.log(stats.functions.byName["embed"].counts.containers.errors);
```

## stop

```typescript
async stop(_: AppStopParams = {}): Promise<void>
```

Stop the App.

Stopping an App terminates all of its running containers and Sandboxes and
prevents new inputs from being processed.

**Parameters** (`AppStopParams`)

Optional parameters for `App.stop()`.

*No configurable options.*

## App.sandboxes

Operations on this App's Sandboxes.

### stats

```typescript
async *stats(
  params: SandboxStatsParams,
): AsyncGenerator<SandboxGroupStats, void, unknown>
```

Return statistics for this App's Sandboxes over a time range, optionally grouped by tag values.

The maximum time range is 7 days.

Yields `SandboxGroupStats` objects, one per combination of tag values, with the following fields:

* `tags`: the value of each name in `groupByTags` for the group's Sandboxes, `null` where not present.
* `cost`: total cost in USD as a decimal string, the sum of `costByResource`.
* `costByResource`: cost in USD as decimal strings, by billed resource: `CPU`, `Memory`, and GPU types such as
  `H100`. The resource names are subject to change as Modal's billing model evolves.

**Parameters** (`SandboxStatsParams`)

Parameters for `app.sandboxes.stats()`.

* `since` (`Date`): The beginning of the time range, inclusive, on a UTC hour boundary.
* `until?` (`Date`): The end of the time range, exclusive, on a UTC hour boundary. If omitted, this defaults to the current time.
* `groupByTags?` (`string[]`): Tag names to group by. Sandboxes with the same values for these names form one group; a name not present on a Sandbox counts as `null`. If omitted, all matching Sandboxes are returned as a single group with `tags: {}`.
* `tags?` (`Record<string, string>`): Only include Sandboxes that match all of these tag names and values.

**Raises:**

* `InvalidError`: If the time range is invalid or there are more than 10,000 groups.

```ts
const since = new Date(Math.floor(Date.now() / 3600_000) * 3600_000 - 24 * 3600_000);
for await (const group of app.sandboxes.stats({ since, groupByTags: ["team"] })) {
  console.log(group.tags, group.cost, group.costByResource);
}
```
