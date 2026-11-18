# AppStats

App-wide statistics over \[since, until), with current Functions and Servers indexed by name.

Lifecycle metadata describes the App when queried, including for historical windows.

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
