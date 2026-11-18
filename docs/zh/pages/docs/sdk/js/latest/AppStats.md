<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用统计

应用程序范围内的统计数据\[since, Until)，当前函数和服务器按名称索引。

生命周期元数据在查询时描述应用程序，包括历史窗口。

```typescript
interface AppStats {
  since: Date;
  until: Date;
  functions: AppStatsFunctionStatsGroup;
  servers: AppStatsServerStatsGroup;
  sandboxes: AppStatsSandboxCounts;
  lifecycle: AppLifecycle;
  deploymentCount?: number;
}
```