<!-- modal-docs: machine-translated zh-CN from English source -->

# 异常

特定于模态的异常类型。

**关于`grpclib.GRPCError`迁移的注释**

从历史上看，Modal SDK 可以传播 `grpclib.GRPCError` 异常
到用户代码。  从 v1.3 开始，我们正在优雅地迁移到
在这些情况下总是引发模态异常类型。以免破坏用户
依赖于捕获 `grpclib.GRPCError` 的代码，Modal 异常的子集
类型暂时继承自`grpclib.GRPCError`。

我们鼓励用户迁移当前捕获 `grpclib.GRPCError` 的任何代码
来捕获适当的模态异常类型。以下映射当前正在使用 GRPCError 状态代码和 Modal 异常类型之间的关系：

```
CANCELLED -> ServiceError
UNKNOWN -> ServiceError
INVALID_ARGUMENT -> InvalidError
DEADLINE_EXCEEDED -> ServiceError
NOT_FOUND -> NotFoundError
ALREADY_EXISTS -> AlreadyExistsError
PERMISSION_DENIED -> PermissionDeniedError
RESOURCE_EXHAUSTED -> ResourceExhaustedError
FAILED_PRECONDITION -> ConflictError
ABORTED -> ConflictError
OUT_OF_RANGE -> InvalidError
UNIMPLEMENTED -> UnimplementedError
INTERNAL -> InternalError
UNAVAILABLE -> ServiceError
DATA_LOSS -> DataLossError
UNAUTHENTICATED -> AuthError
```

## 已经存在错误

```python
class AlreadyExistsError(modal.exception.Error, modal.exception._GRPCErrorWrapper)
```

当资源创建与现有资源冲突时引发。

## 异步使用警告

```python
class AsyncUsageWarning(UserWarning)
```

在异步上下文中使用阻塞 Modal 接口时发出警告。

## 验证错误

```python
class AuthError(modal.exception.Error, modal.exception._GRPCErrorWrapper)
```

当客户端缺少身份验证或身份验证无效时引发。

## 客户端关闭

```python
class ClientClosed(modal.exception.Error)
```

## 冲突错误

```python
class ConflictError(modal.exception.InvalidError, modal.exception._GRPCErrorWrapper)
```

当请求和当前系统状态之间发生资源冲突时引发。

## 连接错误

```python
class ConnectionError(modal.exception.Error)
```

当连接到 Modal 服务器时出现问题时引发。

## 数据丢失错误

```python
class DataLossError(modal.exception.Error, modal.exception._GRPCErrorWrapper)
```
当数据丢失或损坏时引发。

## 弃用错误

```python
class DeprecationError(UserWarning)
```

当使用已弃用的 Modal 功能或 API 时发出 UserWarning 类别。

## 反序列化错误

```python
class DeserializationError(modal.exception.Error)
```

当反序列化期间遇到错误时，提出该错误以提供更多上下文。

## 错误

```python
class Error(Exception)
```

所有模态错误的基类。参见[`modal.exception`](https://modal.com/docs/sdk/py/latest/exception)
对于专门的错误类。

**使用**

```python notest
import modal

try:
    ...
except modal.Error:
    # Catch any exception raised by Modal's systems.
    print("Responding to error...")
```

## 执行超时错误

```python
class ExecTimeoutError(modal.exception.TimeoutError)
```

当容器进程超出其执行持续时间限制并超时时引发。

## 执行错误

```python
class ExecutionError(modal.exception.Error)
```

当运行时发生意外情况时引发。## 文件系统执行错误

```python
class FilesystemExecutionError(modal.exception.Error)
```

在容器文件系统操作期间引发未知错误时引发。

## 函数超时错误

```python
class FunctionTimeoutError(modal.exception.TimeoutError)
```

当函数超出其执行持续时间限制并超时时引发。

## 图像构建错误

```python
class ImageBuildError(modal.exception.RemoteError)
```

当镜像构建失败时引发。

使用 `image_id` 属性来引用失败的图像，例如获取构建日志。

## 输入取消

```python
class InputCancellation(BaseException)
```

当任务取消当前输入时引发

故意使用 BaseException 而不是 Exception，这样就不会得到
被可能用于重试的未指定用户异常子句捕获
其他控制流。

## 交互超时错误

```python
class InteractiveTimeoutError(modal.exception.TimeoutError)
```

当交互式前端尝试连接到容器时超时时引发。

## 内部错误

```python
class InternalError(modal.exception.Error, modal.exception._GRPCErrorWrapper)
```

当 Modal 系统中发生内部错误时引发。

## 内部故障

```python
class InternalFailure(modal.exception.Error)
```

可重试的内部错误。

## 无效错误

```python
class InvalidError(modal.exception.Error, modal.exception._GRPCErrorWrapper)
```

当用户执行无效操作时引发。

## 日志获取错误

```python
class LogsFetchError(modal.exception.Error)
```

尝试获取过多日志时引发。

## 模块不可安装

```python
class ModuleNotMountable(Exception)
```

## 安装上传超时错误

```python
class MountUploadTimeoutError(modal.exception.TimeoutError)
```

当装载上传超时时引发。

## 未发现错误

```python
class NotFoundError(modal.exception.Error, modal.exception._GRPCErrorWrapper)
```当未找到请求的资源时引发。

## 输出过期错误

```python
class OutputExpiredError(modal.exception.TimeoutError)
```

当输出超过过期时间并超时时引发。

## 权限拒绝错误

```python
class PermissionDeniedError(modal.exception.Error, modal.exception._GRPCErrorWrapper)
```

当用户无权执行请求的操作时引发。

## 远程错误

```python
class RemoteError(modal.exception.Error)
```

当模态服务器上发生错误时引发。

## 请求大小错误

```python
class RequestSizeError(modal.exception.Error)
```

当操作产生 gRPC 请求但因太大而被服务器拒绝时引发。

## 资源耗尽错误

```python
class ResourceExhaustedError(modal.exception.Error, modal.exception._GRPCErrorWrapper)
```

当服务器端资源耗尽时引发，例如配额或速率限制。

## SandboxFilesystemDirectoryNotEmptyError

```python
class SandboxFilesystemDirectoryNotEmptyError(modal.exception.SandboxFilesystemError)
```
当目录不为空时引发。

## Sandbox文件系统错误

```python
class SandboxFilesystemError(modal.exception.Error)
```

沙箱文件系统错误的基类。

## SandboxFilesystemFileTooLargeError

```python
class SandboxFilesystemFileTooLargeError(modal.exception.SandboxFilesystemError)
```

当文件超过沙箱中读取操作允许的最大大小时引发。

## SandboxFilesystemIsADirectoryError

```python
class SandboxFilesystemIsADirectoryError(modal.exception.SandboxFilesystemError)
```

当沙箱中的文件操作应针对非目录文件而针对目录时引发。

## SandboxFilesystemNotADirectoryError

```python
class SandboxFilesystemNotADirectoryError(modal.exception.SandboxFilesystemError)
```

当沙箱中的路径组件不是目录时引发。

## SandboxFilesystemNotFoundError 异常

```python
class SandboxFilesystemNotFoundError(modal.exception.SandboxFilesystemError)
```

当沙箱中找不到文件或目录时引发。

## SandboxFilesystemPathAlreadyExistsError

```python
class SandboxFilesystemPathAlreadyExistsError(modal.exception.SandboxFilesystemError)
```

当路径已存在且操作要求路径不存在时引发。

## Sandbox文件系统权限错误

```python
class SandboxFilesystemPermissionError(modal.exception.SandboxFilesystemError)
```

当沙箱中的文件操作权限被拒绝时引发。

## 沙箱终止错误

```python
class SandboxTerminatedError(modal.exception.Error)
```

当沙箱因内部原因终止时引发。

## 沙箱超时错误

```python
class SandboxTimeoutError(modal.exception.TimeoutError)
```

当沙箱超过其执行持续时间限制并超时时引发。

## 序列化错误

```python
class SerializationError(modal.exception.Error)
```

当序列化过程中遇到错误时，提出该错误以提供更多上下文。

## 服务器警告
```python
class ServerWarning(UserWarning)
```

警告源自 Modal 服务器并在客户端代码中重新发出。

## 服务错误

```python
class ServiceError(modal.exception.Error, modal.exception._GRPCErrorWrapper)
```

当基本客户端/服务器通信中发生错误时引发。

## 快照创建错误

```python
class SnapshotCreationError(modal.exception.Error)
```

当沙盒无法创建退出快照时引发。

## 超时错误

```python
class TimeoutError(modal.exception.Error)
```

模态超时的基类。

## 未实现的错误

```python
class UnimplementedError(modal.exception.Error, modal.exception._GRPCErrorWrapper)
```

当请求的操作未实现或不支持时引发。

## 版本错误

```python
class VersionError(modal.exception.Error)
```

当当前的 Modal 客户端版本不受支持时引发。

## 卷上传超时错误

```python
class VolumeUploadTimeoutError(modal.exception.TimeoutError)
```

当卷上传超时时引发。

## 工作空间管理错误

```python
class WorkspaceManagementError(modal.exception.Error)
```

当管理工作区时发生错误时引发。

## 模拟\_抢占

```python
simulate_preemption(wait_seconds, jitter_seconds=0)
```

用于模拟 `wait_seconds` 秒后抢占中断的实用程序。
第一个中断是 SIGINT 信号。 30秒后，一秒
中断将被触发。

第二个中断模拟 SIGKILL，不应被捕获。
可以选择在第一次中断之前添加零到 `jitter_seconds` 秒的额外等待时间。

**使用**

```python notest
import time
from modal.exception import simulate_preemption

simulate_preemption(3)

try:
    time.sleep(4)
except KeyboardInterrupt:
    print("got preempted") # Handle interrupt
    raise
```

有关抢占的更多详细信息，请参阅https://modal.com/docs/guide/preemption
处理。