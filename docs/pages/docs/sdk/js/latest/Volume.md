# Volume

Volumes provide persistent storage that can be mounted in Modal `Function`s.

```typescript
class Volume {
  readonly volumeId: string;
  readonly name?: string;
}
```

## fromName

*Accessed via `modal.volumes`*

```typescript
async fromName(name: string, params?: VolumeFromNameParams): Promise<Volume>
```

Reference a `Volume` by its name.

**Parameters** (`VolumeFromNameParams`)

Optional parameters for `client.volumes.fromName()`.

* `environment?` (`string`)
* `createIfMissing?` (`boolean`)

## ephemeral

*Accessed via `modal.volumes`*

```typescript
async ephemeral(params: VolumeEphemeralParams = {}): Promise<Volume>
```

Create a nameless, temporary `Volume`.
It persists until closeEphemeral() is called, or the process exits.

**Parameters** (`VolumeEphemeralParams`)

Optional parameters for `client.volumes.ephemeral()`.

* `environment?` (`string`)

## delete

*Accessed via `modal.volumes`*

```typescript
async delete(name: string, params?: VolumeDeleteParams): Promise<void>
```

Delete a named `Volume`.

Warning: Deletion is irreversible and will affect any Apps currently using the Volume.

**Parameters** (`VolumeDeleteParams`)

Optional parameters for `client.volumes.delete()`.

* `environment?` (`string`)
* `allowMissing?` (`boolean`)

## closeEphemeral

```typescript
closeEphemeral(): void
```

Delete the ephemeral Volume. Only usable with emphemeral Volumes.

## withMountOptions

```typescript
withMountOptions(params: VolumeMountOptionsParams = {}): Volume
```

Configure options used when mounting this Volume. Fields left undefined preserve their value
from any previous withMountOptions call on the same Volume (stacking).

**Parameters** (`VolumeMountOptionsParams`)

Options for mounting a `Volume`.

* `readOnly?` (`boolean`)
* `subPath?` (`string`)
