# AppStatsSandboxCounts

AppStatsSandboxCounts counts Sandboxes that finished in the window and those
that are live as of the Until cutoff. Total is Finished + Live.

```go
type AppStatsSandboxCounts struct {
	Total, Finished, Live uint64
}
```
