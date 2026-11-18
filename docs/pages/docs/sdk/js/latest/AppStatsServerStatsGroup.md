# AppStatsServerStatsGroup

Totals across current Servers, with individual Server stats keyed by name.

```typescript
interface AppStatsServerStatsGroup {
  total: AppStatsServerCounts;
  byName: Record<string, AppStatsServerStats>;
}
```
