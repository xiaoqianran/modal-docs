# ContainerProcess

ContainerProcess represents a process running in a Modal container, allowing
interaction with its standard input/output/error streams.

It is created by executing a command in a Sandbox.

```go
type ContainerProcess struct {
	Stdin  io.WriteCloser
	Stdout io.ReadCloser
	Stderr io.ReadCloser
}
```

## Wait

```go
Wait(ctx context.Context, params *ContainerProcessWaitParams) (int, error)
```

Wait blocks until the container process exits and returns its exit code.

**Parameters** (`ContainerProcessWaitParams`)

ContainerProcessWaitParams are options for ContainerProcess.Wait.

*No configurable options.*
