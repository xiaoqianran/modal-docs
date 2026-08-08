<!-- modal-docs: machine-translated zh-CN from English source -->

# 容器进程

ContainerProcess 表示在 Modal 容器中运行的进程，允许
与其标准输入/输出/错误流交互。

它是通过在沙箱中执行命令来创建的。

```go
type ContainerProcess struct {
	Stdin  io.WriteCloser
	Stdout io.ReadCloser
	Stderr io.ReadCloser
}
```

## 等等

```go
Wait(ctx context.Context, params *ContainerProcessWaitParams) (int, error)
```

Wait 会阻塞，直到容器进程退出并返回其退出代码。

**参数** (`ContainerProcessWaitParams`)

ContainerProcessWaitParams 是 ContainerProcess.Wait 的选项。

*没有可配置选项。*