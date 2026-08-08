# App

App references a deployed Modal App.

```go
type App struct {
	AppID       string
	Name        string
	Environment string
}
```

## FromName

*Accessed via `client.Apps`*

```go
FromName(ctx context.Context, name string, params *AppFromNameParams) (*App, error)
```

FromName references an App with a given name, creating a new App if necessary.

**Parameters** (`AppFromNameParams`)

AppFromNameParams are options for client.Apps.FromName.

* `Environment` (`string`)
* `CreateIfMissing` (`bool`)
