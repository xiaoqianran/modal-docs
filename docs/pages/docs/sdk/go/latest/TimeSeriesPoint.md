# TimeSeriesPoint

TimeSeriesPoint is an observation at a UTC-aligned bucket start.

```go
type TimeSeriesPoint struct {
	Time  time.Time
	Value *float64 // Value is nil for missing observations; observed zeroes remain zero.
}
```
