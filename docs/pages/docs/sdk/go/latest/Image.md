# Image

Image represents a Modal Image, which can be used to create Sandboxes.

```go
type Image struct {
	ImageID string
}
```

## FromRegistry

*Accessed via `client.Images`*

```go
FromRegistry(tag string, params *ImageFromRegistryParams) *Image
```

FromRegistry builds a Modal Image from a public or private image registry without any changes.

**Parameters** (`ImageFromRegistryParams`)

ImageFromRegistryParams are options for creating an Image from a registry.

* `Secret` (`*Secret`)

## FromAwsEcr

*Accessed via `client.Images`*

```go
FromAwsEcr(tag string, secret *Secret, params *ImageFromAwsEcrParams) *Image
```

FromAwsEcr creates an Image from an AWS ECR tag

**Parameters** (`ImageFromAwsEcrParams`)

ImageFromAwsEcrParams are options for ImageService.FromAwsEcr.

*No configurable options.*

## FromGcpArtifactRegistry

*Accessed via `client.Images`*

```go
FromGcpArtifactRegistry(tag string, secret *Secret, params *ImageFromGcpArtifactRegistryParams) *Image
```

FromGcpArtifactRegistry creates an Image from a GCP Artifact Registry tag.

**Parameters** (`ImageFromGcpArtifactRegistryParams`)

ImageFromGcpArtifactRegistryParams are options for ImageService.FromGcpArtifactRegistry.

*No configurable options.*

## FromID

*Accessed via `client.Images`*

```go
FromID(ctx context.Context, imageID string, params *ImageFromIDParams) (*Image, error)
```

FromID looks up an Image from an ID

**Parameters** (`ImageFromIDParams`)

ImageFromIDParams are options for ImageService.FromID.

*No configurable options.*

## FromName

*Accessed via `client.Images`*

```go
FromName(ctx context.Context, name string, params *ImageFromNameParams) (*Image, error)
```

FromName references a named Image that was previously published.
The name may include a tag as name:tag; if no tag is included, :latest is used.

**Parameters** (`ImageFromNameParams`)

ImageFromNameParams are options for ImageService.FromName.

* `Environment` (`string`)

## Delete

*Accessed via `client.Images`*

```go
Delete(ctx context.Context, imageID string, params *ImageDeleteParams) error
```

Delete deletes an Image by ID.

Deletion is irreversible and will prevent Functions/Sandboxes from using the Image.

Note: When building an Image, each chained method call will create an
intermediate Image layer, each with its own ID. Deleting an Image will not
delete any of its intermediate layers, only the image identified by the
provided ID.

**Parameters** (`ImageDeleteParams`)

ImageDeleteParams are options for deleting an Image.

*No configurable options.*

## Build

```go
Build(ctx context.Context, app *App, params *ImageBuildParams) (*Image, error)
```

Build eagerly builds an Image on Modal.

**Parameters** (`ImageBuildParams`)

ImageBuildParams are options for Image.Build.

*No configurable options.*

## DockerfileCommands

```go
DockerfileCommands(commands []string, params *ImageDockerfileCommandsParams) *Image
```

DockerfileCommands extends an image with arbitrary Dockerfile-like commands.

Each call creates a new Image layer that will be built sequentially.
The provided options apply only to this layer.

**Parameters** (`ImageDockerfileCommandsParams`)

ImageDockerfileCommandsParams are options for Image.DockerfileCommands().

* `Env` (`map[string]string`): Environment variables to set in the build environment.
* `Secrets` (`[]*Secret`): Secrets that will be made available as environment variables to this layer's build environment.
* `GPU` (`string`): GPU reservation for this layer's build environment (e.g. "A100", "T4:2", "A100-80GB:4").
* `ForceBuild` (`bool`): Ignore cached builds for this layer, similar to 'docker build --no-cache'.

## Publish

```go
Publish(ctx context.Context, name string, params *ImagePublishParams) error
```

Publish publishes this built Image under a stable name and tag.
The name may include a tag as name:tag; if no tag is included, :latest is used.

**Parameters** (`ImagePublishParams`)

ImagePublishParams are options for Image.Publish.

* `Environment` (`string`)
