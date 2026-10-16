<!-- modal-docs: translation failed; English fallback -->

# MetricSeries

MetricSeries contains an individual metric's ordered observations.

```go
type MetricSeries struct {
	Name        string
	Unit        string
	Aggregation string
	Description string
	Points      []TimeSeriesPoint
}
```
