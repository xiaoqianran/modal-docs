# Image

A container image, used for starting `Sandbox`es.

```typescript
class Image {
  get imageId(): string;
}
```

## fromId

*Accessed via `modal.images`*

```typescript
async fromId(imageId: string): Promise<Image>
```

Creates an `Image` from an Image ID

* `imageId`: Image ID.

## fromName

*Accessed via `modal.images`*

```typescript
async fromName(
  name: string,
  params: ImageFromNameParams = {},
): Promise<Image>
```

Reference a named `Image` that was previously published.

* `name`: Name of the published Image, optionally including a tag as `name:tag`. If no tag is included, `:latest` is used.

**Parameters** (`ImageFromNameParams`)

Optional parameters for `client.images.fromName()`.

* `environment?` (`string`): Modal Environment to resolve the named Image in.

## fromRegistry

*Accessed via `modal.images`*

```typescript
fromRegistry(tag: string, secret?: Secret): Image
```

Creates an `Image` from a raw registry tag, optionally using a `Secret` for authentication.

* `tag`: The registry tag for the Image.
* `secret`: Optional. A Secret containing credentials for registry authentication.

## fromAwsEcr

*Accessed via `modal.images`*

```typescript
fromAwsEcr(tag: string, secret: Secret): Image
```

Creates an `Image` from a raw registry tag, optionally using a `Secret` for authentication.

* `tag`: The registry tag for the Image.
* `secret`: A Secret containing credentials for registry authentication.

## fromGcpArtifactRegistry

*Accessed via `modal.images`*

```typescript
fromGcpArtifactRegistry(tag: string, secret: Secret): Image
```

Creates an `Image` from a raw registry tag, optionally using a `Secret` for authentication.

* `tag`: The registry tag for the Image.
* `secret`: A Secret containing credentials for registry authentication.

## delete

*Accessed via `modal.images`*

```typescript
async delete(imageId: string, _: ImageDeleteParams = {}): Promise<void>
```

Delete an `Image` by ID.

Deletion is irreversible and will prevent Functions/Sandboxes from using the Image.

Note: When building an Image, each chained method call will create an
intermediate Image layer, each with its own ID. Deleting an Image will not
delete any of its intermediate layers, only the image identified by the
provided ID.

**Parameters** (`ImageDeleteParams`)

Optional parameters for `client.images.delete()`.

*No configurable options.*

## build

```typescript
async build(app: App): Promise<Image>
```

Eagerly builds an Image on Modal.

* `app`: App to use to build the Image.

## dockerfileCommands

```typescript
dockerfileCommands(
  commands: string[],
  params?: ImageDockerfileCommandsParams,
): Image
```

Extend an image with arbitrary Dockerfile-like commands.

Each call creates a new Image layer that will be built sequentially.
The provided options apply only to this layer.

* `commands`: Array of Dockerfile commands as strings

**Parameters** (`ImageDockerfileCommandsParams`)

Optional parameters for `Image.dockerfileCommands()`.

* `env?` (`Record<string, string>`): Environment variables to set in the build environment.
* `secrets?` (`Secret[]`): `Secret`s that will be made available as environment variables to this layer's build environment.
* `gpu?` (`string`): GPU reservation for this layer's build environment (e.g. "A100", "T4:2", "A100-80GB:4").
* `forceBuild?` (`boolean`): Ignore cached builds for this layer, similar to 'docker build --no-cache'.

**Returns:** A new Image instance

## publish

```typescript
async publish(name: string, params: ImagePublishParams = {}): Promise<void>
```

Publish this built Image under a stable name and tag.

* `name`: Name to publish the Image under, optionally including a tag as `name:tag`. If no tag is included, `:latest` is used.

**Parameters** (`ImagePublishParams`)

Optional parameters for `Image.publish()`.

* `environment?` (`string`): Modal Environment to publish the named Image in.
