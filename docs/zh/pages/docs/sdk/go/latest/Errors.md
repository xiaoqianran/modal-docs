<!-- modal-docs: machine-translated zh-CN from English source -->

# 错误

## 已经存在错误

当资源已经存在时，会返回AlreadyExistsError。

```go
type AlreadyExistsError struct {
	Exception string
}
```

## 客户端关闭错误

当Sandbox操作超过允许的时间限制时，会返回ClientClosedError。

```go
type ClientClosedError struct {
	Exception string
}
```

## 冲突错误

当资源的当前状态发生冲突时，返回 ConflictError
与请求的操作。

```go
type ConflictError struct {
	Exception string
}
```

## 执行超时错误

当容器执行超出其执行持续时间限制时，将返回 ExecTimeoutError。

```go
type ExecTimeoutError struct {
	Exception string
}
```

## 执行错误

当运行时发生意外情况时，会返回 ExecutionError。

```go
type ExecutionError struct {
	Exception string
}
```

## 函数超时错误

当函数执行超过允许的时间限制时，将返回 FunctionTimeoutError。

```go
type FunctionTimeoutError struct {
	Exception string
}
```

## 内部故障

InternalFailure 是 Modal 的可重试内部错误。

```go
type InternalFailure struct {
	Exception string
}
```

## 无效错误

InvalidError 表示无效的请求或操作。

```go
type InvalidError struct {
	Exception string
}
```

## 未发现错误

未找到资源时返回 NotFoundError。

```go
type NotFoundError struct {
	Exception string
}
```

## 队列空错误

当尝试对空队列执行操作时，将返回 QueueEmptyError。

```go
type QueueEmptyError struct {
	Exception string
}
```

## 队列满错误

当尝试对已满的队列执行操作时，将返回 QueueFullError。

```go
type QueueFullError struct {
	Exception string
}
```

## 远程错误
RemoteError 表示 Modal 服务器上的错误，或 Python 异常。

```go
type RemoteError struct {
	Exception string
}
```

## SandboxFilesystemDirectoryNotEmptyError

当非递归删除操作针对非空目录时，会返回 SandboxFilesystemDirectoryNotEmptyError。

```go
type SandboxFilesystemDirectoryNotEmptyError struct {
	Exception string
}
```

## Sandbox文件系统错误

对于意外或未分类的沙箱文件系统错误，将返回 SandboxFilesystemError。

```go
type SandboxFilesystemError struct {
	Exception string
}
```

## SandboxFilesystemFileTooLargeError

当文件超出允许的读取大小时，会返回 SandboxFilesystemFileTooLargeError。

```go
type SandboxFilesystemFileTooLargeError struct {
	Exception string
}
```

## SandboxFilesystemIsADirectoryError

当文件操作针对目录时，会返回 SandboxFilesystemIsADirectoryError。

```go
type SandboxFilesystemIsADirectoryError struct {
	Exception string
}
```

## SandboxFilesystemNotADirectoryError

当目录操作针对非目录路径时，会返回 SandboxFilesystemNotADirectoryError。

```go
type SandboxFilesystemNotADirectoryError struct {
	Exception string
}
```

## SandboxFilesystemNotFoundError 异常

当沙箱文件系统中不存在路径时，返回 SandboxFilesystemNotFoundError。

```go
type SandboxFilesystemNotFoundError struct {
	Exception string
}
```

## SandboxFilesystemPathAlreadyExistsError

当创建操作针对现有路径时，会返回 SandboxFilesystemPathAlreadyExistsError。

```go
type SandboxFilesystemPathAlreadyExistsError struct {
	Exception string
}
```

## Sandbox文件系统权限错误
当沙箱文件系统拒绝访问时，返回 SandboxFilesystemPermissionError。

```go
type SandboxFilesystemPermissionError struct {
	Exception string
}
```

## 沙箱超时错误

当Sandbox操作超过允许的时间限制时，返回SandboxTimeoutError。

```go
type SandboxTimeoutError struct {
	Exception string
}
```

## 快照创建错误

当没有为 Sandbox 生成快照图像时，会返回 SnapshotCreationError。

```go
type SnapshotCreationError struct {
	Exception string
}
```

## 超时错误

当操作超过允许的时间限制时，将返回TimeoutError。

```go
type TimeoutError struct {
	Exception string
}
```