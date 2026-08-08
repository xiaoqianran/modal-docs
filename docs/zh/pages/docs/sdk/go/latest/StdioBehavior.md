<!-- modal-docs: machine-translated zh-CN from English source -->

# StdioBehavior

StdioBehavior 定义标准输入/输出/错误流的行为方式。

```go
type StdioBehavior string
```

可能的值为：

* `Pipe` = `"pipe"` — Pipe 允许沙箱通过管道传输流。
* `Ignore` = `"ignore"` — Ignore 忽略流，这意味着它们将不可用。