# SidecarContainer

SidecarContainer is a handle to a sidecar container running in a Sandbox.

```go
type SidecarContainer struct {
	ContainerID   string             // ContainerID is the fully qualified container ID.
	ContainerName string             // ContainerName is the logical name of the container within the Sandbox.
	Filesystem    *SandboxFilesystem // Filesystem provides high-level filesystem operations for this container.
}
```

## Exec

```go
Exec(ctx context.Context, command []string, params *SidecarExecParams) (*ContainerProcess, error)
```

Exec runs a command in the sidecar container and returns the process handle.

**Parameters** (`SidecarExecParams`)

SidecarExecParams holds options for \[SidecarContainer.Exec].

* `Stdout` (`StdioBehavior`): Stdout defines whether to pipe or ignore standard output.
* `Stderr` (`StdioBehavior`): Stderr defines whether to pipe or ignore standard error.
* `Workdir` (`string`): Workdir is the working directory to run the command in.
* `Timeout` (`time.Duration`): Timeout is the timeout for command execution. Defaults to 0 (no timeout).
* `Env` (`map[string]string`): Environment variables to set for the command.
* `Secrets` (`[]*Secret`): Secrets to inject as environment variables for the command.
* `PTY` (`bool`): PTY defines whether to enable a PTY for the command. When enabled, all output (stdout and stderr from the process) is multiplexed into stdout, and the stderr stream is effectively empty.

## Poll

```go
Poll(ctx context.Context, _ *SidecarPollParams) (*int, error)
```

Poll checks if the sidecar container has finished running.
Returns nil if the container is still running, else returns the exit code.

**Parameters** (`SidecarPollParams`)

SidecarPollParams holds options for \[SidecarContainer.Poll].

*No configurable options.*

## Terminate

```go
Terminate(ctx context.Context, params *SidecarTerminateParams) (int, error)
```

Terminate stops the sidecar container.

The returned exit code is only meaningful when Wait is true.

**Parameters** (`SidecarTerminateParams`)

SidecarTerminateParams holds options for \[SidecarContainer.Terminate].

* `Wait` (`bool`): Wait, when true, will wait for the sidecar container to terminate.

## Wait

```go
Wait(ctx context.Context, _ *SidecarWaitParams) (int, error)
```

Wait blocks until the sidecar container exits, and returns its exit code.

**Parameters** (`SidecarWaitParams`)

SidecarWaitParams holds options for \[SidecarContainer.Wait].

*No configurable options.*

## SidecarContainer.Filesystem

Filesystem provides high-level filesystem operations for this container.

### CopyFromLocal

```go
CopyFromLocal(ctx context.Context, localPath, remotePath string, params *SandboxFilesystemCopyFromLocalParams) error
```

CopyFromLocal copies a local file into the Sandbox.

remotePath must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

Returns \[SandboxFilesystemNotADirectoryError] if a parent component of
remotePath is not a directory, \[SandboxFilesystemIsADirectoryError] if
remotePath points to a directory, \[SandboxFilesystemPermissionError] if
write permission is denied, or an \*os.PathError if localPath does not
exist, is a directory, or cannot be read.

**Parameters** (`SandboxFilesystemCopyFromLocalParams`)

SandboxFilesystemCopyFromLocalParams holds optional parameters for \[SandboxFilesystem.CopyFromLocal].

*No configurable options.*

### CopyToLocal

```go
CopyToLocal(ctx context.Context, remotePath, localPath string, params *SandboxFilesystemCopyToLocalParams) (retErr error)
```

CopyToLocal copies a file from the Sandbox to a local path.

remotePath must be an absolute path to a file in the Sandbox.
Parent directories for localPath are created if needed. The local file is
overwritten if it already exists.

Returns \[SandboxFilesystemNotFoundError] if the remote path does not exist,
\[SandboxFilesystemIsADirectoryError] if the remote path points to a directory,
\[SandboxFilesystemFileTooLargeError] if the file exceeds the read size limit,
or \[SandboxFilesystemPermissionError] if read permission is denied.

**Parameters** (`SandboxFilesystemCopyToLocalParams`)

SandboxFilesystemCopyToLocalParams holds optional parameters for \[SandboxFilesystem.CopyToLocal].

*No configurable options.*

### ListFiles

```go
ListFiles(ctx context.Context, remotePath string, params *SandboxFilesystemListFilesParams) ([]FileInfo, error)
```

ListFiles lists files and directories in a Sandbox directory.

remotePath must be an absolute path to a directory in the Sandbox.
Returns a slice of \[FileInfo] objects sorted by name.

Returns \[SandboxFilesystemNotFoundError] if the path does not exist,
\[SandboxFilesystemNotADirectoryError] if the path is not a directory,
or \[SandboxFilesystemPermissionError] if read permission is denied.

**Parameters** (`SandboxFilesystemListFilesParams`)

SandboxFilesystemListFilesParams holds optional parameters for \[SandboxFilesystem.ListFiles].

*No configurable options.*

### MakeDirectory

```go
MakeDirectory(ctx context.Context, remotePath string, params *SandboxFilesystemMakeDirectoryParams) error
```

MakeDirectory creates a new directory in the Sandbox.

remotePath must be an absolute path in the Sandbox.

When params.CreateParents is true (the default when params is nil), any
missing parent directories are created and the call is idempotent (succeeds
if the directory already exists). When false, the immediate parent must
already exist and the path must not already exist.

Returns \[SandboxFilesystemNotFoundError] if the parent does not exist and
CreateParents is false, \[SandboxFilesystemPathAlreadyExistsError] if the
path already exists, \[SandboxFilesystemNotADirectoryError] if a path
component is not a directory, \[SandboxFilesystemPermissionError] if
creation is not permitted, or \[InvalidError] if the mount does not
support this operation.

**Parameters** (`SandboxFilesystemMakeDirectoryParams`)

SandboxFilesystemMakeDirectoryParams holds optional parameters for \[SandboxFilesystem.MakeDirectory].

* `CreateParents` (`*bool`): CreateParents controls whether missing parent directories are created automatically. Defaults to true when nil.

### ReadBytes

```go
ReadBytes(ctx context.Context, remotePath string, params *SandboxFilesystemReadParams) ([]byte, error)
```

ReadBytes reads a file from the Sandbox and returns its contents as bytes.

remotePath must be an absolute path to a file in the Sandbox.

Returns \[SandboxFilesystemNotFoundError] if the path does not exist,
\[SandboxFilesystemIsADirectoryError] if the path points to a directory,
\[SandboxFilesystemFileTooLargeError] if the file exceeds the read size limit,
or \[SandboxFilesystemPermissionError] if read permission is denied.

**Parameters** (`SandboxFilesystemReadParams`)

SandboxFilesystemReadParams holds optional parameters for \[SandboxFilesystem.ReadBytes] and \[SandboxFilesystem.ReadText].

*No configurable options.*

### ReadText

```go
ReadText(ctx context.Context, remotePath string, params *SandboxFilesystemReadParams) (string, error)
```

ReadText reads a file from the Sandbox and returns its contents as a UTF-8 string.

remotePath must be an absolute path to a file in the Sandbox.

Returns \[SandboxFilesystemNotFoundError] if the path does not exist,
\[SandboxFilesystemIsADirectoryError] if the path points to a directory,
\[SandboxFilesystemFileTooLargeError] if the file exceeds the read size limit,
or \[SandboxFilesystemPermissionError] if read permission is denied.

**Parameters** (`SandboxFilesystemReadParams`)

SandboxFilesystemReadParams holds optional parameters for \[SandboxFilesystem.ReadBytes] and \[SandboxFilesystem.ReadText].

*No configurable options.*

### Remove

```go
Remove(ctx context.Context, remotePath string, params *SandboxFilesystemRemoveParams) error
```

Remove a file or directory in the Sandbox.

remotePath must be an absolute path in the Sandbox. When remotePath is a
directory and params.Recursive is false (the default when params is nil),
it is removed only if empty. When Recursive is true, the directory and all
its contents are removed. Recursive removal is not supported on all mounts.

Returns \[SandboxFilesystemNotFoundError] if the path does not exist,
\[SandboxFilesystemDirectoryNotEmptyError] if Recursive is false and the
directory is not empty, \[SandboxFilesystemPermissionError] if removal is
not permitted, or \[InvalidError] if the mount does not support this operation.

**Parameters** (`SandboxFilesystemRemoveParams`)

SandboxFilesystemRemoveParams holds optional parameters for \[SandboxFilesystem.Remove].

* `Recursive` (`bool`): Recurisve controls whether contens of a removed directory are recursively removed. Defaults to false when nil.

### Stat

```go
Stat(ctx context.Context, remotePath string, params *SandboxFilesystemStatParams) (*FileInfo, error)
```

Stat returns metadata for a single file, directory, or symlink in the Sandbox.

remotePath must be an absolute path in the Sandbox. If remotePath is a
symlink, the returned \[FileInfo] describes the symlink itself, not the
target it points to.

Returns \[SandboxFilesystemNotFoundError] if the path does not exist,
\[SandboxFilesystemNotADirectoryError] if a non-leaf component of the path
is not a directory, or \[SandboxFilesystemPermissionError] if a path
component is not searchable.

**Parameters** (`SandboxFilesystemStatParams`)

SandboxFilesystemStatParams holds optional parameters for \[SandboxFilesystem.Stat].

*No configurable options.*

### Watch

```go
Watch(
	ctx context.Context,
	remotePath string,
	params *SandboxFilesystemWatchParams,
) (iter.Seq2[FileWatchEvent, error], error)
```

Watch a path in the Sandbox for filesystem changes.

remotePath must be an absolute path in the Sandbox. If it points to a
file, events for that file are reported. If it points to a directory,
events for entries directly inside it are reported. Set params.Recursive
to also receive events for all nested subdirectories. If remotePath is a
symlink, it is followed and events reference paths under the resolved
target.

The returned \[iter.Seq2] yields \[FileWatchEvent] values as changes occur,
until the timeout elapses, the caller breaks from the range loop, ctx is
cancelled, or the Sandbox is terminated. The remote watch process is not
started until iteration begins, so a sequence that is never ranged over
launches nothing.

Set params.Filter to restrict which event types are emitted. A nil filter
permits all types; an empty slice suppresses all events.

A nil params.Timeout watches indefinitely, while a zero params.Timeout
returns immediately without waiting for events. Otherwise the duration is
rounded down to whole seconds, and when it elapses the iterator stops
without returning an error.

Pass nil params for defaults (no filter, non-recursive, no timeout).

Returns \[SandboxFilesystemNotFoundError] if remotePath does not exist,
\[SandboxFilesystemPermissionError] if watch access is denied, or
\[InvalidError] if the filesystem does not support watching.

**Parameters** (`SandboxFilesystemWatchParams`)

SandboxFilesystemWatchParams holds optional parameters for \[SandboxFilesystem.Watch].

* `Filter` (`[]FileWatchEventType`)
* `Recursive` (`bool`)
* `Timeout` (`*time.Duration`): Timeout is the maximum duration to watch. A nil Timeout watches indefinitely, while a zero Timeout returns immediately without waiting for events. Durations are rounded-down to the nearest whole number of seconds.

### WriteBytes

```go
WriteBytes(ctx context.Context, data []byte, remotePath string, params *SandboxFilesystemWriteParams) error
```

WriteBytes writes binary content to a file in the Sandbox.

remotePath must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

Returns \[SandboxFilesystemNotADirectoryError] if a parent component of
remotePath is not a directory, \[SandboxFilesystemIsADirectoryError] if
remotePath points to a directory, or \[SandboxFilesystemPermissionError]
if write permission is denied.

**Parameters** (`SandboxFilesystemWriteParams`)

SandboxFilesystemWriteParams holds optional parameters for \[SandboxFilesystem.WriteBytes] and \[SandboxFilesystem.WriteText].

*No configurable options.*

### WriteText

```go
WriteText(ctx context.Context, data string, remotePath string, params *SandboxFilesystemWriteParams) error
```

WriteText writes UTF-8 text to a file in the Sandbox.

remotePath must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

Returns \[SandboxFilesystemNotADirectoryError] if a parent component of
remotePath is not a directory, \[SandboxFilesystemIsADirectoryError] if
remotePath points to a directory, or \[SandboxFilesystemPermissionError]
if write permission is denied.

**Parameters** (`SandboxFilesystemWriteParams`)

SandboxFilesystemWriteParams holds optional parameters for \[SandboxFilesystem.WriteBytes] and \[SandboxFilesystem.WriteText].

*No configurable options.*
