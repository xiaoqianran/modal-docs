# Volume

Volume represents a Modal Volume that provides persistent storage.

```go
type Volume struct {
	VolumeID string
	Name     string
}
```

## FromName

*Accessed via `client.Volumes`*

```go
FromName(ctx context.Context, name string, params *VolumeFromNameParams) (*Volume, error)
```

FromName references a Volume by its name.

**Parameters** (`VolumeFromNameParams`)

VolumeFromNameParams are options for finding Modal Volumes.

* `Environment` (`string`)
* `CreateIfMissing` (`bool`)

## Ephemeral

*Accessed via `client.Volumes`*

```go
Ephemeral(ctx context.Context, params *VolumeEphemeralParams) (*Volume, error)
```

Ephemeral creates a nameless, temporary Volume, that persists until CloseEphemeral is called, or the process exits.

**Parameters** (`VolumeEphemeralParams`)

VolumeEphemeralParams are options for client.Volumes.Ephemeral.

* `Environment` (`string`)

## Delete

*Accessed via `client.Volumes`*

```go
Delete(ctx context.Context, name string, params *VolumeDeleteParams) error
```

Delete deletes a named Volume.

Warning: Deletion is irreversible and will affect any Apps currently using the Volume.

**Parameters** (`VolumeDeleteParams`)

VolumeDeleteParams are options for client.Volumes.Delete.

* `Environment` (`string`)
* `AllowMissing` (`bool`)

## CloseEphemeral

```go
CloseEphemeral()
```

CloseEphemeral deletes an ephemeral Volume, only used with VolumeEphemeral.

## WithMountOptions

```go
WithMountOptions(options *VolumeMountOptionsParams) *Volume
```

WithMountOptions configures how a Volume is mounted. Fields left as nil on options preserve
the corresponding value from any previous WithMountOptions call on the same Volume (stacking).

**Parameters** (`VolumeMountOptionsParams`)

VolumeMountOptionsParams are options for mounting a Volume. Fields are pointers so unset values
preserve the corresponding option from a previous WithMountOptions call (stacking).

* `ReadOnly` (`*bool`)
* `SubPath` (`*string`)
