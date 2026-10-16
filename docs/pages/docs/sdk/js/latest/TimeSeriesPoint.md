# TimeSeriesPoint

An observation at a UTC-aligned bucket start.

```typescript
interface TimeSeriesPoint {
  time: Date;
  /** Missing observations are null; observed zeroes remain zero. */
  value: number | null;
}
```
