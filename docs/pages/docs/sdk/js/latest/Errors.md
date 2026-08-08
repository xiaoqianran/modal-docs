# Errors

## AlreadyExistsError

A resource already exists.

```typescript
class AlreadyExistsError extends Error
```

## ClientClosedError

Thrown when attempting operations on a detached Sandbox.

```typescript
class ClientClosedError extends Error
```

## ConflictError

The current state of a resource conflicts with the requested operation.

```typescript
class ConflictError extends Error
```

## FunctionTimeoutError

Function execution exceeds the allowed time limit.

```typescript
class FunctionTimeoutError extends Error
```

## InternalFailure

A retryable internal error from Modal.

```typescript
class InternalFailure extends Error
```

## InvalidError

A request or other operation was invalid.

```typescript
class InvalidError extends Error
```

## NotFoundError

Some resource was not found.

```typescript
class NotFoundError extends Error
```

## QueueEmptyError

The Queue is empty.

```typescript
class QueueEmptyError extends Error
```

## QueueFullError

The Queue is full.

```typescript
class QueueFullError extends Error
```

## RemoteError

An error on the Modal server, or a Python exception.

```typescript
class RemoteError extends Error
```

## SandboxFilesystemDirectoryNotEmptyError

A directory was expected to be empty but is not.

```typescript
class SandboxFilesystemDirectoryNotEmptyError extends SandboxFilesystemError
```

## SandboxFilesystemError

Errors from invalid Sandbox FileSystem operations.

```typescript
class SandboxFilesystemError extends Error
```

## SandboxFilesystemFileTooLargeError

A file exceeds the maximum allowed size for a read operation.

```typescript
class SandboxFilesystemFileTooLargeError extends SandboxFilesystemError
```

## SandboxFilesystemIsADirectoryError

A file operation was attempted on a path that resolves to a directory.

```typescript
class SandboxFilesystemIsADirectoryError extends SandboxFilesystemError
```

## SandboxFilesystemNotADirectoryError

A directory operation encountered a path component that is not a directory.

```typescript
class SandboxFilesystemNotADirectoryError extends SandboxFilesystemError
```

## SandboxFilesystemNotFoundError

A file or directory is not found.

```typescript
class SandboxFilesystemNotFoundError extends SandboxFilesystemError
```

## SandboxFilesystemPathAlreadyExistsError

A path already exists and the operation requires it to be absent.

```typescript
class SandboxFilesystemPathAlreadyExistsError extends SandboxFilesystemError
```

## SandboxFilesystemPermissionError

Permission is denied for a file operation.

```typescript
class SandboxFilesystemPermissionError extends SandboxFilesystemError
```

## SandboxTimeoutError

Sandbox operations that exceed the allowed time limit.

```typescript
class SandboxTimeoutError extends Error
```

## TimeoutError

An operation exceeds the allowed time limit.

```typescript
class TimeoutError extends Error
```
