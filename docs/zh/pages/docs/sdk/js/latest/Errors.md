<!-- modal-docs: machine-translated zh-CN from English source -->

# 错误

## 已经存在错误

资源已存在。

```typescript
class AlreadyExistsError extends Error
```

## 客户端关闭错误

尝试对分离的沙箱进行操作时抛出。

```typescript
class ClientClosedError extends Error
```

## 冲突错误

资源的当前状态与请求的操作冲突。

```typescript
class ConflictError extends Error
```

## 函数超时错误

函数执行超出了允许的时间限制。

```typescript
class FunctionTimeoutError extends Error
```

## 内部故障

Modal 中的可重试内部错误。

```typescript
class InternalFailure extends Error
```

## 无效错误

请求或其他操作无效。

```typescript
class InvalidError extends Error
```

## 未发现错误

未找到某些资源。

```typescript
class NotFoundError extends Error
```

## 队列空错误

队列是空的。

```typescript
class QueueEmptyError extends Error
```## 队列满错误

队列已满。

```typescript
class QueueFullError extends Error
```

## 远程错误

Modal 服务器上的错误，或 Python 异常。

```typescript
class RemoteError extends Error
```

## SandboxFilesystemDirectoryNotEmptyError

目录本应为空，但实际并非如此。

```typescript
class SandboxFilesystemDirectoryNotEmptyError extends SandboxFilesystemError
```

## Sandbox文件系统错误

无效沙盒文件系统操作导致的错误。

```typescript
class SandboxFilesystemError extends Error
```

## SandboxFilesystemFileTooLargeError

文件超出了读取操作允许的最大大小。

```typescript
class SandboxFilesystemFileTooLargeError extends SandboxFilesystemError
```

## SandboxFilesystemIsADirectoryError

尝试对解析为目录的路径进行文件操作。

```typescript
class SandboxFilesystemIsADirectoryError extends SandboxFilesystemError
```

## SandboxFilesystemNotADirectoryError
目录操作遇到了不是目录的路径组件。

```typescript
class SandboxFilesystemNotADirectoryError extends SandboxFilesystemError
```

## SandboxFilesystemNotFoundError 异常

未找到文件或目录。

```typescript
class SandboxFilesystemNotFoundError extends SandboxFilesystemError
```

## SandboxFilesystemPathAlreadyExistsError

路径已存在，但操作要求该路径不存在。

```typescript
class SandboxFilesystemPathAlreadyExistsError extends SandboxFilesystemError
```

## Sandbox文件系统权限错误

文件操作的权限被拒绝。

```typescript
class SandboxFilesystemPermissionError extends SandboxFilesystemError
```

## 沙箱超时错误

超过允许时间限制的沙箱操作。

```typescript
class SandboxTimeoutError extends Error
```

## 超时错误

操作超出允许的时间限制。

```typescript
class TimeoutError extends Error
```