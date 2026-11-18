# SandboxGroupStats

SandboxGroupStats contains statistics for a group of Sandboxes over a time range.

```go
type SandboxGroupStats struct {
	Tags           map[string]*string // Tags holds the value of each name in GroupByTags for the group's Sandboxes, nil where not present.
	Cost           string             // Cost is the total cost in USD as a decimal string, the sum of CostByResource.
	CostByResource map[string]string  // CostByResource holds cost in USD as decimal strings, by billed resource: "CPU", "Memory", and GPU types such as "H100". The resource names are subject to change as Modal's billing model evolves.
}
```
