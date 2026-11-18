# AppStatsSandboxCounts

Sandboxes that finished in the window and those that are live as of the until cutoff.

Total is finished + live.

```typescript
interface AppStatsSandboxCounts {
  total: number;
  finished: number;
  live: number;
}
```
