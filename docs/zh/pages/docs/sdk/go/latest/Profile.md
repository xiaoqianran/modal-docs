<!-- modal-docs: machine-translated zh-CN from English source -->

# 简介

配置文件保存了可供客户端使用的完全解析的配置。

```go
type Profile struct {
	ServerURL                 string
	TokenID                   string
	TokenSecret               string
	OAuthRefreshToken         string
	OAuthClientID             string
	OAuthClientSecret         string
	OAuthJWTKey               string
	Environment               string
	ImageBuilderVersion       string
	LogLevel                  string
	MaxThrottleWait           *time.Duration // MaxThrottleWait controls server-driven (throttle) retries. nil = no limit; 0 = disable server-driven retries entirely; >0 = cap total wait to this many seconds.
	SandboxChannelIdleTimeout time.Duration  // SandboxChannelIdleTimeout is how long a Sandbox connection may sit idle before the client gives it up. The Sandbox stays usable: the next operation reconnects. Zero keeps connections open until the client closes.
	SandboxV2                 bool           // SandboxV2 is set by the MODAL_SANDBOX_V2 environment variable or the sandbox_v2 profile key in .modal.toml.
}
```