<!-- modal-docs: translation failed; English fallback -->

# LogEntry

```go
type LogEntry struct {
	Timestamp  time.Time
	Source     LogSource
	Message    string
	ObjectID   string
	ContextIDs []string
}
```
