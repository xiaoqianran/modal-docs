# Probe

Probe configures a sandbox readiness probe.

```go
type Probe struct {
}
```

## NewExecProbe

```go
func NewExecProbe(argv []string, params *ExecProbeParams) (*Probe, error)
```

NewExecProbe creates an exec readiness probe.

**Parameters** (`ExecProbeParams`)

* `Interval` (`time.Duration`)

## NewTCPProbe

```go
func NewTCPProbe(port int, params *TCPProbeParams) (*Probe, error)
```

NewTCPProbe creates a TCP readiness probe.

**Parameters** (`TCPProbeParams`)

* `Interval` (`time.Duration`)
