<!-- modal-docs: machine-translated zh-CN from English source -->

# 客户端

客户端公开与 Modal 资源交互的服务。
您不应该直接实例化它，而应使用`NewClient`/`NewClientWithOptions`。

```go
type Client struct {
	Apps              AppService
	CloudBucketMounts CloudBucketMountService
	Cls               ClsService
	Functions         FunctionService
	FunctionCalls     FunctionCallService
	Images            ImageService
	Proxies           ProxyService
	Queues            QueueService
	Sandboxes         SandboxService
	SandboxSnapshots  SandboxSnapshotService
	Secrets           SecretService
	Volumes           VolumeService
}
```

## 新客户

```go
func NewClient() (*Client, error)
```

NewClient 使用从环境变量和 ~/.modal.toml 读取的默认配置文件配置生成一个新客户端。

## 带选项的新客户端

```go
func NewClientWithOptions(params *ClientParams) (*Client, error)
```

NewClientWithOptions 生成新客户端并允许覆盖默认配置文件配置中的选项。

**参数** (`ClientParams`)

ClientParams 定义用于初始化 Modal 客户端的凭据和选项。

* `TokenID` (`string`)
* `TokenSecret` (`string`)
* `Environment` (`string`)
* `Config` (`*config`)
* `Logger` (`*slog.Logger`)
* `MaxThrottleWait` (`*time.Duration`)
* `ControlPlaneClient` (`pb.ModalClientClient`)：ControlPlaneClient 是一个用于测试的自定义 gRPC 客户端。如果提供，客户端将使用它而不是创建自己的连接。通常在测试中与模拟客户端一起使用。
* `ControlPlaneConn` (`*grpc.ClientConn`)：ControlPlaneConn 是 ControlPlaneClient 的底层 gRPC 连接。如果提供，Client.Close() 将关闭此连接以进行正确的清理。对于没有真正连接的模拟客户端，保留 nil。
* `GRPCUnaryInterceptors` (`[]grpc.UnaryClientInterceptor`)：GRPCUnaryInterceptors 允许自定义 gRPC 一元拦截器，用于遥测、跟踪和可观察性。这些附加在 Modal 的内置拦截器（标头注入、身份验证、重试、超时）之后。请注意，Modal gRPC API 不被视为公共 API，并且可以在没有警告的情况下进行更改。
* `GRPCStreamInterceptors` (`[]grpc.StreamClientInterceptor`)：GRPCStreamInterceptors 允许自定义 gRPC 流拦截器，用于遥测、跟踪和可观察性。这些附加在 Modal 的内置流拦截器（标头注入）之后。请注意，Modal gRPC API 不被视为公共 API，并且可以在没有警告的情况下进行更改。

## 关闭

```go
Close()
```

Close 关闭所有 gRPC 连接。

## 版本

```go
Version() string
```

版本返回 SDK 版本。