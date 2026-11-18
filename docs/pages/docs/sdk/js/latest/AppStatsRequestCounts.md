# AppStatsRequestCounts

Server requests split into HTTP 1xx/2xx/3xx and all other outcomes, including status zero.

```typescript
interface AppStatsRequestCounts {
  total: number;
  ok: number;
  failed: number;
}
```
