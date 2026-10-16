<!-- modal-docs: translation failed; English fallback -->

# AppLifecycle

AppLifecycle contains timestamps and attributions for an App's lifecycle events.
Optional fields are nil when the event or attribution does not apply.

```go
type AppLifecycle struct {
	State      AppState
	Version    *int
	CreatedAt  time.Time
	CreatedBy  string
	DeployedAt *time.Time
	DeployedBy *string
	StoppedAt  *time.Time
	StoppedBy  *string
}
```
