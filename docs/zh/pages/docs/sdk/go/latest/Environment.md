<!-- modal-docs: translation failed; English fallback -->

# Environment

Environment references a Modal Environment and exposes its resource namespaces.

```go
type Environment struct {
	EnvironmentID string
	Name          string
	Apps          EnvironmentAppsService
}
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
