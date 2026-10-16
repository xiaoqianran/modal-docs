# ObjectMetrics

Exported metrics over the effective, UTC-aligned \[since, until) range.

```typescript
interface ObjectMetrics {
  objectId: string;
  since: Date;
  until: Date;
  bucketSizeSecs: number;
  /** Total points across series, including missing observations. */
  pointCount: number;
  series: Record<string, MetricSeries>;
}
```
