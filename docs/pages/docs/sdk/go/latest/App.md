# App

App references a Modal App.

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

## Info

```go
Info(ctx context.Context, params *AppInfoParams) (*AppInfo, error)
```

Info returns the snapshot from the previous lookup, listing, or refresh.
Set Refresh to fetch current lifecycle information and member Function and Server IDs.
The returned information is a copy that callers can modify independently.

**Parameters** (`AppInfoParams`)

AppInfoParams are options for App.Info.

* `Refresh` (`bool`): Refresh fetches current information instead of the cached snapshot.
