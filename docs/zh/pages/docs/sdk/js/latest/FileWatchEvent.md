<!-- modal-docs: machine-translated zh-CN from English source -->

# 文件监视事件

文件系统更改事件。

`paths` 包含受事件影响的绝对路径。对于大多数活动
类型它包含一个条目。重命名操作报告为 `Modify`
events：当源和目的地都在监视范围内时，
`paths` 保持`[source, destination]`；当只有重命名的一侧是
可见，`paths` 持有该单一路径。

```typescript
interface FileWatchEvent {
  readonly eventType: FileWatchEventType;
  readonly paths: string[];
}
```