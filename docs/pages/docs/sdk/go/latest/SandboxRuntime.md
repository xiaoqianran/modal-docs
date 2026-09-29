# SandboxRuntime

SandboxRuntime is the runtime a Sandbox runs in.

```go
type SandboxRuntime string
```

The possible values are:

* `SandboxRuntimeGVisor` = `"gvisor"` — SandboxRuntimeGVisor runs the Sandbox in a gVisor container.
* `SandboxRuntimeVM` = `"vm"` — SandboxRuntimeVM runs the Sandbox in a virtual machine.
