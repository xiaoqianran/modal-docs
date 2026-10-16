<!-- modal-docs: translation failed; English fallback -->

# MetricsSchema

MetricsSchema describes a group and all its individual series.

```go
type MetricsSchema struct {
	Name        string
	Definitions []MetricDefinition
}
```
