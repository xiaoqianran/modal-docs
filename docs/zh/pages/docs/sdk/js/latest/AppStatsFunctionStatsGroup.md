<!-- modal-docs: machine-translated zh-CN from English source -->

# AppStatsFunctionStatsGroup

当前功能的总计，以及按名称键入的各个功能统计数据。

```typescript
interface AppStatsFunctionStatsGroup {
  total: AppStatsFunctionCounts;
  byName: Record<string, AppStatsFunctionStats>;
}
```