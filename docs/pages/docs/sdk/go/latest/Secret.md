# Secret

Secret represents a Modal Secret.

```go
type Secret struct {
	SecretID string
	Name     string
}
```

## FromName

*Accessed via `client.Secrets`*

```go
FromName(ctx context.Context, name string, params *SecretFromNameParams) (*Secret, error)
```

FromName references a Secret by its name.

**Parameters** (`SecretFromNameParams`)

SecretFromNameParams are options for finding Modal Secrets.

* `Environment` (`string`)
* `RequiredKeys` (`[]string`)

## FromMap

*Accessed via `client.Secrets`*

```go
FromMap(ctx context.Context, keyValuePairs map[string]string, params *SecretFromMapParams) (*Secret, error)
```

FromMap creates a Secret from a map of key-value pairs.

**Parameters** (`SecretFromMapParams`)

SecretFromMapParams are options for creating a Secret from a key/value map.

* `Environment` (`string`)

## Delete

*Accessed via `client.Secrets`*

```go
Delete(ctx context.Context, name string, params *SecretDeleteParams) error
```

Delete deletes a named Secret.

Warning: Deletion is irreversible and will affect any Apps currently using the Secret.

**Parameters** (`SecretDeleteParams`)

SecretDeleteParams are options for client.Secrets.Delete.

* `Environment` (`string`)
* `AllowMissing` (`bool`)
