<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙箱运行时

SandboxRuntime 是 Sandbox 运行的运行时。

```go
type SandboxRuntime string
```

可能的值为：

* `SandboxRuntimeGVisor` = `"gvisor"` — SandboxRuntimeGVisor 在 gVisor 容器中运行沙箱。
* `SandboxRuntimeVM` = `"vm"` — SandboxRuntimeVM 在虚拟机中运行 Sandbox。