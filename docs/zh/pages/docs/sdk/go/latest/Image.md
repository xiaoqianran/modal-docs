<!-- modal-docs: machine-translated zh-CN from English source -->

# 图片

Image 表示模态图像，可用于创建沙箱。

```go
type Image struct {
	ImageID string
}
```

## 来自注册表

*通过`client.Images`访问*

```go
FromRegistry(tag string, params *ImageFromRegistryParams) *Image
```

FromRegistry 从公共或私有映像注册表构建模态映像，无需任何更改。

**参数** (`ImageFromRegistryParams`)

ImageFromRegistryParams 是用于从注册表创建映像的选项。

* `Secret` (`*Secret`)

## 来自AwsEcr

*通过`client.Images`访问*

```go
FromAwsEcr(tag string, secret *Secret, params *ImageFromAwsEcrParams) *Image
```

FromAwsEcr 从 AWS ECR 标签创建图像

**参数** (`ImageFromAwsEcrParams`)

ImageFromAwsEcrParams 是 ImageService.FromAwsEcr 的选项。

*没有可配置选项。*

## 来自GcpArtifactRegistry*通过`client.Images`访问*

```go
FromGcpArtifactRegistry(tag string, secret *Secret, params *ImageFromGcpArtifactRegistryParams) *Image
```

FromGcpArtifactRegistry 从 GCP ArtifactRegistry 标签创建图像。

**参数** (`ImageFromGcpArtifactRegistryParams`)

ImageFromGcpArtifactRegistryParams 是 ImageService.FromGcpArtifactRegistry 的选项。

*没有可配置选项。*

## 来自 ID

*通过`client.Images`访问*

```go
FromID(ctx context.Context, imageID string, params *ImageFromIDParams) (*Image, error)
```

FromID 根据 ID 查找图像

**参数** (`ImageFromIDParams`)

ImageFromIDParams 是 ImageService.FromID 的选项。

*没有可配置选项。*

## 来自姓名

*通过`client.Images`访问*

```go
FromName(ctx context.Context, name string, params *ImageFromNameParams) (*Image, error)
```

FromName 引用先前发布的命名图像。
名称可以包含一个标签，如 name:tag;如果不包含标签，则使用 :latest。
**参数** (`ImageFromNameParams`)

ImageFromNameParams 是 ImageService.FromName 的选项。

* `Environment` (`string`)

## 删除

*通过`client.Images`访问*

```go
Delete(ctx context.Context, imageID string, params *ImageDeleteParams) error
```

删除按 ID 删除图像。

删除是不可逆的，并且将阻止函数/沙箱使用该图像。

注意：构建图像时，每个链式方法调用都会创建一个
中间Image层，每个层都有自己的ID。删除图像不会
删除其任何中间层，仅删除由
提供的身份证件。

**参数** (`ImageDeleteParams`)

ImageDeleteParams 是用于删除图像的选项。

*没有可配置选项。*

## 构建

```go
Build(ctx context.Context, app *App, params *ImageBuildParams) (*Image, error)
```

Build 急切地在 Modal 上构建图像。

**参数** (`ImageBuildParams`)

ImageBuildParams 是 Image.Build 的选项。

*没有可配置选项。*

## Dockerfile 命令

```go
DockerfileCommands(commands []string, params *ImageDockerfileCommandsParams) *Image
```

DockerfileCommands 使用任意类似 Dockerfile 的命令扩展镜像。

每次调用都会创建一个将按顺序构建的新图像层。
提供的选项仅适用于该层。

**参数** (`ImageDockerfileCommandsParams`)

ImageDockerfileCommandsParams 是 Image.DockerfileCommands() 的选项。

* `Env` (`map[string]string`): 在构建环境中设置的环境变量。
* `Secrets` (`[]*Secret`)：将作为环境变量提供给该层的构建环境的秘密。
* `GPU` (`string`)：该层构建环境的 GPU 预留（例如“A100”、“T4:2”、“A100-80GB:4”）。
* `ForceBuild` (`bool`): 忽略该层的缓存构建，类似于“docker build --no-cache”。

## 发布

```go
Publish(ctx context.Context, name string, params *ImagePublishParams) error
```

发布以稳定的名称和标签发布此构建的图像。
名称可以包含一个标签，如 name:tag;如果不包含标签，则使用 :latest。

**参数** (`ImagePublishParams`)

ImagePublishParams 是 Image.Publish 的选项。

* `Environment` (`string`)