<!-- modal-docs: machine-translated zh-CN from English source -->

# 简介

配置文件保存了可供客户端使用的完全解析的配置。

```go
type Profile struct {
	ServerURL           string
	TokenID             string
	TokenSecret         string
	Environment         string
	ImageBuilderVersion string
	LogLevel            string
	MaxThrottleWait     *time.Duration // MaxThrottleWait controls server-driven (throttle) retries. nil = no limit; 0 = disable server-driven retries entirely; >0 = cap total wait to this many seconds.
}
```