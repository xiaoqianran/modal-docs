<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数当前统计

FunctionCurrentStats 表示正在运行的函数的统计信息。

```go
type FunctionCurrentStats struct {
	Backlog         int
	NumTotalRunners int
}
```