# FileWatchEvent

FileWatchEvent is a single filesystem change reported by Watch.

Paths contains the absolute path(s) affected by the event. For most event
types it holds a single entry. Rename operations are reported as Modify
events: when both the source and destination fall within the watched,
scope, Paths holds \[source, destination]; when only one side of the rename
is visible, Paths holds that single path.

```go
type FileWatchEvent struct {
	EventType FileWatchEventType
	Paths     []string
}
```
