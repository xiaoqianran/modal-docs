<!-- modal-docs: machine-translated zh-CN from English source -->

# 文件监视事件类型

FileWatchEventType 是文件系统更改事件的类别。

```go
type FileWatchEventType string
```

可能的值为：

* `FileWatchEventTypeAccess` = `"Access"`
* `FileWatchEventTypeCreate` = `"Create"`
* `FileWatchEventTypeModify` = `"Modify"`
* `FileWatchEventTypeRemove` = `"Remove"`
* `FileWatchEventTypeUnknown` = `"Unknown"`