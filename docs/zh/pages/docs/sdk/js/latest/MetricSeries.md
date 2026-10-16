<!-- modal-docs: translation failed; English fallback -->

# MetricSeries

An individual metric series with points ordered by time.

```typescript
interface MetricSeries {
  name: string;
  unit: string;
  aggregation: string;
  description: string;
  points: TimeSeriesPoint[];
}
```
