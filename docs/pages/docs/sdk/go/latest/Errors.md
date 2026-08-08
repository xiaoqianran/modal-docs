# Errors

## AlreadyExistsError

AlreadyExistsError is returned when a resource already exists.

```go
type AlreadyExistsError struct {
	Exception string
}
```

## ClientClosedError

ClientClosedError is returned when Sandbox operations exceed the allowed time limit.

```go
type ClientClosedError struct {
	Exception string
}
```

## ExecTimeoutError

ExecTimeoutError is returned when a container exec exceeds its execution duration limit.

```go
type ExecTimeoutError struct {
	Exception string
}
```

## ExecutionError

ExecutionError is returned when something unexpected happened during runtime.

```go
type ExecutionError struct {
	Exception string
}
```

## FunctionTimeoutError

FunctionTimeoutError is returned when a Function execution exceeds the allowed time limit.

```go
type FunctionTimeoutError struct {
	Exception string
}
```

## InternalFailure

InternalFailure is a retryable internal error from Modal.

```go
type InternalFailure struct {
	Exception string
}
```

## InvalidError

InvalidError represents an invalid request or operation.

```go
type InvalidError struct {
	Exception string
}
```

## NotFoundError

NotFoundError is returned when a resource is not found.

```go
type NotFoundError struct {
	Exception string
}
```

## QueueEmptyError

QueueEmptyError is returned when an operation is attempted on an empty Queue.

```go
type QueueEmptyError struct {
	Exception string
}
```

## QueueFullError

QueueFullError is returned when an operation is attempted on a full Queue.

```go
type QueueFullError struct {
	Exception string
}
```

## RemoteError

RemoteError represents an error on the Modal server, or a Python exception.

```go
type RemoteError struct {
	Exception string
}
```

## SandboxFilesystemDirectoryNotEmptyError

SandboxFilesystemDirectoryNotEmptyError is returned when a non-recursive remove operation targets a non-empty directory.

```go
type SandboxFilesystemDirectoryNotEmptyError struct {
	Exception string
}
```

## SandboxFilesystemError

SandboxFilesystemError is returned for unexpected or unclassified sandbox filesystem errors.

```go
type SandboxFilesystemError struct {
	Exception string
}
```

## SandboxFilesystemFileTooLargeError

SandboxFilesystemFileTooLargeError is returned when a file exceeds the allowed read size.

```go
type SandboxFilesystemFileTooLargeError struct {
	Exception string
}
```

## SandboxFilesystemIsADirectoryError

SandboxFilesystemIsADirectoryError is returned when a file operation targets a directory.

```go
type SandboxFilesystemIsADirectoryError struct {
	Exception string
}
```

## SandboxFilesystemNotADirectoryError

SandboxFilesystemNotADirectoryError is returned when a directory operation targets a non-directory path.

```go
type SandboxFilesystemNotADirectoryError struct {
	Exception string
}
```

## SandboxFilesystemNotFoundError

SandboxFilesystemNotFoundError is returned when a path does not exist in the sandbox filesystem.

```go
type SandboxFilesystemNotFoundError struct {
	Exception string
}
```

## SandboxFilesystemPathAlreadyExistsError

SandboxFilesystemPathAlreadyExistsError is returned when a create operation targets an existing path.

```go
type SandboxFilesystemPathAlreadyExistsError struct {
	Exception string
}
```

## SandboxFilesystemPermissionError

SandboxFilesystemPermissionError is returned when the sandbox filesystem denies access.

```go
type SandboxFilesystemPermissionError struct {
	Exception string
}
```

## SandboxTimeoutError

SandboxTimeoutError is returned when Sandbox operations exceed the allowed time limit.

```go
type SandboxTimeoutError struct {
	Exception string
}
```

## TimeoutError

TimeoutError is returned when an operation exceeds the allowed time limit.

```go
type TimeoutError struct {
	Exception string
}
```
