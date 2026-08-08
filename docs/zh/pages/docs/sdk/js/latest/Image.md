<!-- modal-docs: machine-translated zh-CN from English source -->

# 图片

容器镜像，用于启动`Sandbox`es。

```typescript
class Image {
  get imageId(): string;
}
```

## 来自 ID

*通过`modal.images`访问*

```typescript
async fromId(imageId: string): Promise<Image>
```

从图像 ID 创建 `Image`

* `imageId`：图像 ID。

## 来自姓名

*通过`modal.images`访问*

```typescript
async fromName(
  name: string,
  params: ImageFromNameParams = {},
): Promise<Image>
```

参考之前发布的名为`Image`的内容。

* `name`：发布的图像的名称，可以选择包含标签`name:tag`。如果不包含标签，则使用`:latest`。

**参数** (`ImageFromNameParams`)

`client.images.fromName()` 的可选参数。

* `environment?` (`string`): 解析命名图像的模态环境。

## 来自注册表

*通过`modal.images`访问*

```typescript
fromRegistry(tag: string, secret?: Secret): Image
```从原始注册表标签创建 `Image`，可以选择使用 `Secret` 进行身份验证。

* `tag`：镜像的注册表标签。
* `secret`：可选。包含注册表身份验证凭据的 Secret。

## 来自AwsEcr

*通过`modal.images`访问*

```typescript
fromAwsEcr(tag: string, secret: Secret): Image
```

从原始注册表标签创建 `Image`，可以选择使用 `Secret` 进行身份验证。

* `tag`：镜像的注册表标签。
* `secret`：包含注册表身份验证凭据的 Secret。

## 来自GcpArtifactRegistry

*通过`modal.images`访问*

```typescript
fromGcpArtifactRegistry(tag: string, secret: Secret): Image
```

从原始注册表标签创建 `Image`，可以选择使用 `Secret` 进行身份验证。

* `tag`：镜像的注册表标签。
* `secret`：包含注册表身份验证凭据的 Secret。

## 删除

*通过`modal.images`访问*

```typescript
async delete(imageId: string, _: ImageDeleteParams = {}): Promise<void>
```

按 ID 删除 `Image`。

删除是不可逆的，并且将阻止函数/沙箱使用该图像。

注意：构建图像时，每个链式方法调用都会创建一个
中间Image层，每个层都有自己的ID。删除图像不会
删除其任何中间层，仅删除由
提供的身份证件。

**参数** (`ImageDeleteParams`)

`client.images.delete()` 的可选参数。

*没有可配置选项。*

## 构建

```typescript
async build(app: App): Promise<Image>
```急切地在 Modal 上构建图像。

* `app`：用于构建图像的应用程序。

## dockerfile 命令

```typescript
dockerfileCommands(
  commands: string[],
  params?: ImageDockerfileCommandsParams,
): Image
```

使用任意类似 Dockerfile 的命令扩展镜像。

每次调用都会创建一个将按顺序构建的新图像层。
提供的选项仅适用于该层。

* `commands`：Dockerfile 命令字符串数组

**参数** (`ImageDockerfileCommandsParams`)

`Image.dockerfileCommands()` 的可选参数。

* `env?` (`Record<string, string>`): 在构建环境中设置的环境变量。
* `secrets?` (`Secret[]`): `Secret` 将作为环境变量提供给该层的构建环境。
* `gpu?` (`string`)：该层构建环境的 GPU 预留（例如“A100”、“T4:2”、“A100-80GB:4”）。
* `forceBuild?` (`boolean`)：忽略该层的缓存构建，类似于“docker build --no-cache”。

**返回：** 一个新的 Image 实例

## 发布

```typescript
async publish(name: string, params: ImagePublishParams = {}): Promise<void>
```

以稳定的名称和标签发布此构建的图像。

* `name`：发布图像的名称，可以选择包含一个标签：`name:tag`。如果不包含标签，则使用`:latest`。

**参数** (`ImagePublishParams`)

`Image.publish()` 的可选参数。

* `environment?` (`string`)：用于发布命名图像的模态环境。