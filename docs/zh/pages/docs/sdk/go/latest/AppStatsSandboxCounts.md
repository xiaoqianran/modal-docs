<!-- modal-docs: machine-translated zh-CN from English source -->

# AppStatsSandboxCounts

AppStatsSandboxCounts 统计窗口中完成的沙箱以及那些
截至截止时间仍处于活动状态。总计已完成+上线。

```go
type AppStatsSandboxCounts struct {
	Total, Finished, Live uint64
}
```