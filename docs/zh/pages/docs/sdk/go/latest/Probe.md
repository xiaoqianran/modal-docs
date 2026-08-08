<!-- modal-docs: machine-translated zh-CN from English source -->

# 探针

探针配置沙箱就绪探针。

```go
type Probe struct {
}
```

## 新执行探针

```go
func NewExecProbe(argv []string, params *ExecProbeParams) (*Probe, error)
```

NewExecProbe 创建一个执行就绪探针。

**参数** (`ExecProbeParams`)

* `Interval` (`time.Duration`)

## 新的TCPProbe

```go
func NewTCPProbe(port int, params *TCPProbeParams) (*Probe, error)
```

NewTCPProbe 创建 TCP 就绪探测。

**参数** (`TCPProbeParams`)

* `Interval` (`time.Duration`)