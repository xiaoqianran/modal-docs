# ObjectMetrics

ObjectMetrics contains samples over the effective UTC-aligned \[Since, Until) range.

```go
type ObjectMetrics struct {
	ObjectID   string
	Since      time.Time
	Until      time.Time
	BucketSize time.Duration
	PointCount int // PointCount includes missing observations across all series.
	Series     map[string]MetricSeries
}
```
