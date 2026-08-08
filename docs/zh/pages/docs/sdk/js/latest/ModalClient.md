<!-- modal-docs: machine-translated zh-CN from English source -->

# 模态客户端

与 Modal 云基础设施交互的主要客户端。

ModalClient 通过服务属性提供对所有 Modal 服务的访问。
创建一个客户端实例并使用其服务属性来管理`App`s，
`Function`s、`Sandbox`es 和其他 Modal 资源。

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();

const app = await modal.apps.fromName("my-app");
const image = modal.images.fromRegistry("python:3.13");
const sb = await modal.sandboxes.create(app, image);
```

```typescript
class ModalClient {
  readonly apps: AppService;
  readonly cloudBucketMounts: CloudBucketMountService;
  readonly cls: ClsService;
  readonly functions: FunctionService;
  readonly functionCalls: FunctionCallService;
  readonly images: ImageService;
  readonly proxies: ProxyService;
  readonly queues: QueueService;
  readonly sandboxes: SandboxService;
  readonly secrets: SecretService;
  readonly volumes: VolumeService;
  readonly profile: Profile;
  readonly logger: Logger;
}
```

## 构造函数

```typescript
new ModalClient(params?: ModalClientParams)
```

**参数** (`ModalClientParams`)

* `tokenId?` (`string`)
* `tokenSecret?` (`string`)
* `environment?` (`string`)
* `endpoint?` (`string`)
* `timeoutMs?` (`number`)
* `maxRetries?` (`number`)
* `maxThrottleWaitSecs?` (`number`)
* `logger?` (`Logger`)
* `logLevel?` (`LogLevel`)* `grpcMiddleware?` (`ClientMiddleware[]`)：应用于所有 API 调用的自定义 gRPC 中间件。这些中间件附加在 Modal 的内置中间件（身份验证、重试逻辑和超时）之后，允许您添加遥测、跟踪或其他可观察性功能。请注意，Modal gRPC API 不被视为公共 API，并且可以在没有警告的情况下进行更改。

## 关闭

```typescript
close(): void
```

## 环境名称

```typescript
environmentName(environment?: string): string
```

## 获取ImageBuilder版本

```typescript
async getImageBuilderVersion(environmentName?: string): Promise<string>
```

通过查询本地配置文件所在的服务器返回镜像生成器版本
优先。

映像生成器版本是环境范围内的服务器设置，因此请传递环境
图像将被内置（例如应用程序的环境）以获取正确的版本。什么时候
省略，则使用配置文件的默认环境。

## 版本

```typescript
version(): string
```