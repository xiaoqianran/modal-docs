<!-- modal-docs: machine-translated zh-CN from English source -->

# 文件监视事件

FileWatchEvent 是 Watch 报告的单个文件系统更改。

Paths 包含受事件影响的绝对路径。对于大多数活动
类型它包含一个条目。重命名操作报告为修改
事件：当源和目的地都在监视范围内时，
范围，Paths 包含 \[源，目的地]；当只有一侧重命名时
可见，Paths 保存该单一路径。

```go
type FileWatchEvent struct {
	EventType FileWatchEventType
	Paths     []string
}
```