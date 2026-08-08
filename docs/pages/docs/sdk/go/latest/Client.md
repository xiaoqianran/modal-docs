# Client

Client exposes services for interacting with Modal resources.
You should not instantiate it directly, and instead use \[NewClient]/\[NewClientWithOptions].

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
	Secrets           SecretService
	Volumes           VolumeService
}
```

## NewClient

```go
func NewClient() (*Client, error)
```

NewClient generates a new client with the default profile configuration read from environment variables and ~/.modal.toml.

## NewClientWithOptions

```go
func NewClientWithOptions(params *ClientParams) (*Client, error)
```

NewClientWithOptions generates a new client and allows overriding options in the default profile configuration.

**Parameters** (`ClientParams`)

ClientParams defines credentials and options for initializing the Modal client.

* `TokenID` (`string`)
* `TokenSecret` (`string`)
* `Environment` (`string`)
* `Config` (`*config`)
* `Logger` (`*slog.Logger`)
* `MaxThrottleWait` (`*time.Duration`)
* `ControlPlaneClient` (`pb.ModalClientClient`): ControlPlaneClient is a custom gRPC client for testing. If provided, the client will use this instead of creating its own connection. Typically used with mock clients in tests.
* `ControlPlaneConn` (`*grpc.ClientConn`): ControlPlaneConn is the underlying gRPC connection for ControlPlaneClient. If provided, Client.Close() will close this connection for proper cleanup. Leave nil for mock clients that don't have real connections.
* `GRPCUnaryInterceptors` (`[]grpc.UnaryClientInterceptor`): GRPCUnaryInterceptors allows custom gRPC unary interceptors for telemetry, tracing, and observability. These are appended after Modal's built-in interceptors (header injection, auth, retry, timeout). Note that the Modal gRPC API is not considered a public API, and can change without warning.
* `GRPCStreamInterceptors` (`[]grpc.StreamClientInterceptor`): GRPCStreamInterceptors allows custom gRPC stream interceptors for telemetry, tracing, and observability. These are appended after Modal's built-in stream interceptors (header injection). Note that the Modal gRPC API is not considered a public API, and can change without warning.

## Close

```go
Close()
```

Close closes all gRPC connections.

## Version

```go
Version() string
```

Version returns the SDK version.
