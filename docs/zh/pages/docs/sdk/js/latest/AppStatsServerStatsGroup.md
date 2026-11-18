<!-- modal-docs: machine-translated zh-CN from English source -->

# AppStatsServerStatsGroup

当前服务器的总计，以及按名称键入的各个服务器统计信息。

```typescript
interface AppStatsServerStatsGroup {
  total: AppStatsServerCounts;
  byName: Record<string, AppStatsServerStats>;
}
```