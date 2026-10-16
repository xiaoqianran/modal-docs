<!-- modal-docs: translation failed; English fallback -->

# AppInfo

AppInfo describes an App's lifecycle and member Functions and Servers.

```go
type AppInfo struct {
	AppID       string
	Description string
	Lifecycle   AppLifecycle
	Functions   map[string]string // Function name to Function ID.
	Servers     map[string]string // Server name to Function ID.
}
```
