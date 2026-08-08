# SidecarContainer

A handle to a sidecar container running in a Sandbox.

EXPERIMENTAL: the API is subject to change.

```typescript
class SidecarContainer {
  readonly containerId: string; // The fully qualified container ID.
  readonly containerName: string; // The logical name of the container within the Sandbox.
  get filesystem(): SandboxFilesystem; // Namespace for filesystem APIs scoped to this sidecar container.
}
```

## exec

```typescript
async exec(
  command: string[],
  params?: SidecarExecParams & { mode?: "text" },
): Promise<ContainerProcess<string>>
async exec(
  command: string[],
  params: SidecarExecParams & { mode: "binary" },
): Promise<ContainerProcess<Uint8Array>>
```

Run a command in the sidecar container and return the process handle.

**Parameters** (`SidecarExecParams`)

Options for `SidecarContainer.exec()`.

* `mode?` (`StreamMode`): Specifies text or binary encoding for input and output streams.
* `stdout?` (`StdioBehavior`): Whether to pipe or ignore standard output.
* `stderr?` (`StdioBehavior`): Whether to pipe or ignore standard error.
* `workdir?` (`string`): Working directory to run the command in.
* `timeoutMs?` (`number`): Timeout for the process in milliseconds. Defaults to 0 (no timeout).
* `env?` (`Record<string, string>`): Environment variables to set for the command.
* `secrets?` (`Secret[]`): `Secret`s to inject as environment variables for the commmand.
* `pty?` (`boolean`): Enable a PTY for the command. When enabled, all output (stdout and stderr from the process) is multiplexed into stdout, and the stderr stream is effectively empty.

## poll

```typescript
async poll(): Promise<number | null>
```

Check if the sidecar container has finished running.

Returns `null` if the container is still running, else the exit code.

## terminate

```typescript
async terminate(): Promise<void>
async terminate(params: { wait: true }): Promise<number>
```

Stop the sidecar container.

The returned exit code is only meaningful when `wait` is true.

**Parameters** (`SidecarTerminateParams`)

Options for `SidecarContainer.terminate()`.

* `wait?` (`boolean`): If true, wait for the sidecar container to terminate.

## wait

```typescript
async wait(): Promise<number>
```

Block until the sidecar container exits, and return its exit code.

## SidecarContainer.filesystem

Namespace for filesystem APIs scoped to this sidecar container.

### copyFromLocal

```typescript
async copyFromLocal(localPath: string, remotePath: string): Promise<void>
```

Copy a local file into the Sandbox.

`remotePath` must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

**Raises:**

* `SandboxFilesystemNotADirectoryError`: a parent component of `remotePath` is not a directory.
* `SandboxFilesystemIsADirectoryError`: `remotePath` points to a directory.
* `SandboxFilesystemPermissionError`: write permission is denied in the Sandbox.
* `SandboxFilesystemError`: the command fails for any other reason.
* `Error`: `localPath` does not exist, is a directory, or cannot be read (`ENOENT`, `EISDIR`, `EACCES`).

### copyToLocal

```typescript
async copyToLocal(remotePath: string, localPath: string): Promise<void>
```

Copy a file from the Sandbox to a local path.

`remotePath` must be an absolute path to a file in the Sandbox.
Parent directories for `localPath` are created if needed. The local file
is overwritten if it already exists.

**Raises:**

* `SandboxFilesystemNotFoundError`: the remote path does not exist.
* `SandboxFilesystemIsADirectoryError`: the remote path points to a directory.
* `SandboxFilesystemFileTooLargeError`: the file exceeds the read size limit.
* `SandboxFilesystemPermissionError`: read permission is denied in the Sandbox.
* `SandboxFilesystemError`: the command fails for any other reason.
* `Error`: `localPath` points to a directory, or writing it is not permitted.

### listFiles

```typescript
async listFiles(remotePath: string): Promise<FileInfo[]>
```

List files and directories in a Sandbox directory.

`remotePath` must be an absolute path to a directory in the Sandbox.
Returns an array of `FileInfo` objects sorted by name.

**Raises:**

* `SandboxFilesystemNotFoundError`: the path does not exist.
* `SandboxFilesystemNotADirectoryError`: the path is not a directory.
* `SandboxFilesystemPermissionError`: read permission is denied.
* `SandboxFilesystemError`: the command fails for any other reason.

### makeDirectory

```typescript
async makeDirectory(
  remotePath: string,
  options?: { createParents?: boolean },
): Promise<void>
```

Create a new directory in the Sandbox.

`remotePath` must be an absolute path in the Sandbox.

When `createParents` is `true` (the default), any missing parent
directories are created and the call is idempotent (succeeds if the
directory already exists). When `createParents` is `false`, the immediate
parent must already exist and the path must not already exist.

**Raises:**

* `SandboxFilesystemNotFoundError`: the parent does not exist and `createParents` is `false`.
* `SandboxFilesystemPathAlreadyExistsError`: the path already exists and `createParents` is `false`.
* `SandboxFilesystemNotADirectoryError`: a path component is not a directory.
* `SandboxFilesystemPermissionError`: creation is not permitted.
* `InvalidError`: the operation is not supported by the mount.
* `SandboxFilesystemError`: the command fails for any other reason.

### readBytes

```typescript
async readBytes(remotePath: string): Promise<Uint8Array>
```

Read a file from the Sandbox and return its contents as bytes.

`remotePath` must be an absolute path to a file in the Sandbox.

**Raises:**

* `SandboxFilesystemNotFoundError`: the path does not exist.
* `SandboxFilesystemIsADirectoryError`: the path points to a directory.
* `SandboxFilesystemFileTooLargeError`: the file exceeds the read size limit.
* `SandboxFilesystemPermissionError`: read permission is denied.
* `SandboxFilesystemError`: the command fails for any other reason.

### readText

```typescript
async readText(remotePath: string): Promise<string>
```

Read a file from the Sandbox and return its contents as a UTF-8 string.

`remotePath` must be an absolute path to a file in the Sandbox.

**Raises:**

* `SandboxFilesystemNotFoundError`: the path does not exist.
* `SandboxFilesystemIsADirectoryError`: the path points to a directory.
* `SandboxFilesystemFileTooLargeError`: the file exceeds the read size limit.
* `SandboxFilesystemPermissionError`: read permission is denied.
* `SandboxFilesystemError`: the command fails for any other reason.

### remove

```typescript
async remove(
  remotePath: string,
  options?: { recursive?: boolean },
): Promise<void>
```

Remove a file or directory in the Sandbox.

`remotePath` must be an absolute path in the Sandbox. When `remotePath`
is a directory and `recursive` is `false` (the default), it is removed
only if empty. When `recursive` is `true`, the directory and all its
contents are removed. Recursive removal is not supported on all mounts —
`CloudBucketMount` does not support it.

**Raises:**

* `SandboxFilesystemNotFoundError`: the path does not exist.
* `SandboxFilesystemDirectoryNotEmptyError`: `recursive` is `false` and the directory is not empty.
* `SandboxFilesystemPermissionError`: removal is not permitted.
* `InvalidError`: the operation is not supported by the mount.
* `SandboxFilesystemError`: the command fails for any other reason.

### stat

```typescript
async stat(remotePath: string): Promise<FileInfo>
```

Return metadata for a single file, directory, or symlink in the Sandbox.

`remotePath` must be an absolute path in the Sandbox. If `remotePath` is
a symlink, the returned `FileInfo` describes the symlink itself, not
the target it points to.

**Raises:**

* `SandboxFilesystemNotFoundError`: the path does not exist.
* `SandboxFilesystemNotADirectoryError`: a non-leaf component of the path is not a directory.
* `SandboxFilesystemPermissionError`: a path component is not searchable.
* `SandboxFilesystemError`: the command fails for any other reason.

### watch

```typescript
async *watch(
  remotePath: string,
  params: {
    filter?: FileWatchEventType[];
    recursive?: boolean;
    timeoutMs?: number;
  } = {},
): AsyncIterable<FileWatchEvent>
```

Watch a path in the Sandbox for filesystem changes.

`remotePath` must be an absolute path in the Sandbox. If it points to a
file, events for that file are reported. If it points to a directory,
events for entries directly inside it are reported. Set `recursive: true`
to also receive events for all nested subdirectories. If `remotePath` is
a symlink, it is followed and events reference paths under the resolved
target.

Yields `FileWatchEvent` objects as changes occur, until either the
timeout elapses, the iterator is closed, or the Sandbox is terminated.

Optionally restrict the kinds of events emitted to those included in
`filter`. An undefined `filter` permits all types; passing an empty array
suppresses all events.

`timeoutMs` is truncated to whole seconds. Omit it to watch indefinitely.
When the timeout elapses, the iterator stops without raising an exception.

**Raises:**

* `SandboxFilesystemNotFoundError`: `remotePath` does not exist.
* `SandboxFilesystemPermissionError`: watch access is denied.
* `InvalidError`: the filesystem does not support watching.
* `SandboxFilesystemError`: the command fails for any other reason.

### writeBytes

```typescript
async writeBytes(
  data: Uint8Array | ArrayBuffer | Buffer,
  remotePath: string,
): Promise<void>
```

Write binary content to a file in the Sandbox.

`remotePath` must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

**Raises:**

* `TypeError`: `data` is not a `Uint8Array`, `ArrayBuffer`, or `Buffer`.
* `SandboxFilesystemNotADirectoryError`: a parent component of `remotePath` is not a directory.
* `SandboxFilesystemIsADirectoryError`: `remotePath` points to a directory.
* `SandboxFilesystemPermissionError`: write permission is denied.
* `SandboxFilesystemError`: the command fails for any other reason.

### writeText

```typescript
async writeText(data: string, remotePath: string): Promise<void>
```

Write UTF-8 text to a file in the Sandbox.

`remotePath` must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

**Raises:**

* `TypeError`: `data` is not a string.
* `SandboxFilesystemNotADirectoryError`: a parent component of `remotePath` is not a directory.
* `SandboxFilesystemIsADirectoryError`: `remotePath` points to a directory.
* `SandboxFilesystemPermissionError`: write permission is denied.
* `SandboxFilesystemError`: the command fails for any other reason.
