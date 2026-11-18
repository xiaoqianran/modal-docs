# Environment

Environment references a Modal Environment and exposes its resource namespaces.

```go
type Environment struct {
	EnvironmentID string
	Name          string
	Apps          EnvironmentAppsService
}
```

## FromContext

*Accessed via `client.Environments`*

```go
FromContext(ctx context.Context) (*Environment, error)
```

FromContext looks up an Environment object using the current context.

This method returns the Environment that is defined by the local configuration
(i.e., the Environment set in `ClientParams`, your active profile, or the
MODAL\_ENVIRONMENT environment variable), or it fetches the default environment
from the server when not defined locally. If called inside a Modal container,
it will return the Environment that container is associated with.

```go
env, err := client.Environments.FromContext(ctx)
if err != nil {
	return err
}
fmt.Println(env.EnvironmentID, env.Name)
```

## FromName

*Accessed via `client.Environments`*

```go
FromName(ctx context.Context, name string, params *EnvironmentFromNameParams) (*Environment, error)
```

FromName looks up an Environment by name, optionally creating it if it does not exist.

**Parameters** (`EnvironmentFromNameParams`)

EnvironmentFromNameParams are options for client.Environments.FromName.

* `CreateIfMissing` (`bool`)

## Environment.Apps

EnvironmentAppsService accesses Apps in an Environment.

### List

```go
List(ctx context.Context) (iter.Seq2[*App, error], error)
```

List yields handles for live Apps, excluding stopped and disabled Apps.
Listing Apps does not create Apps. RPC errors are yielded during iteration.

## client.Environments.Objects

Objects provides methods for creating, listing, and deleting Environments.

### Create

```go
Create(ctx context.Context, name string, params *EnvironmentCreateParams) error
```

Create creates an Environment with the given name.

**Parameters** (`EnvironmentCreateParams`)

EnvironmentCreateParams are options for client.Environments.Objects.Create.

* `Restricted` (`bool`): Restricted limits access to users with explicitly assigned Environment roles.
* `DefaultRole` (`string`): DefaultRole is the default Environment role for workspace members.

### List

```go
List(ctx context.Context) (iter.Seq2[*Environment, error], error)
```

List yields Environment handles without additional lookup requests.
RPC errors are yielded during iteration.

### Delete

```go
Delete(ctx context.Context, name string) error
```

Delete permanently deletes an Environment and all objects in it.
