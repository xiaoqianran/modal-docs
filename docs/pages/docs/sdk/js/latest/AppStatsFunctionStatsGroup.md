# AppStatsFunctionStatsGroup

Totals across current Functions, with individual Function stats keyed by name.

```typescript
interface AppStatsFunctionStatsGroup {
  total: AppStatsFunctionCounts;
  byName: Record<string, AppStatsFunctionStats>;
}
```
