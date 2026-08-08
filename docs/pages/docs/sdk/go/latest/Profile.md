# Profile

Profile holds a fully-resolved configuration ready for use by the client.

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
