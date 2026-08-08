# FileWatchEventType

FileWatchEventType is the category of a filesystem change event.

```go
type FileWatchEventType string
```

The possible values are:

* `FileWatchEventTypeAccess` = `"Access"`
* `FileWatchEventTypeCreate` = `"Create"`
* `FileWatchEventTypeModify` = `"Modify"`
* `FileWatchEventTypeRemove` = `"Remove"`
* `FileWatchEventTypeUnknown` = `"Unknown"`
