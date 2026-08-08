# ModalClient

The main client for interacting with Modal's cloud infrastructure.

ModalClient provides access to all Modal services through service properties.
Create a client instance and use its service properties to manage `App`s,
`Function`s, `Sandbox`es, and other Modal resources.

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

## constructor

```typescript
new ModalClient(params?: ModalClientParams)
```

**Parameters** (`ModalClientParams`)

* `tokenId?` (`string`)
* `tokenSecret?` (`string`)
* `environment?` (`string`)
* `endpoint?` (`string`)
* `timeoutMs?` (`number`)
* `maxRetries?` (`number`)
* `maxThrottleWaitSecs?` (`number`)
* `logger?` (`Logger`)
* `logLevel?` (`LogLevel`)
* `grpcMiddleware?` (`ClientMiddleware[]`): Custom gRPC middleware to be applied to all API calls. These middleware are appended after Modal's built-in middleware (authentication, retry logic, and timeouts), allowing you to add telemetry, tracing, or other observability features. Note that the Modal gRPC API is not considered a public API, and can change without warning.

## close

```typescript
close(): void
```

## environmentName

```typescript
environmentName(environment?: string): string
```

## getImageBuilderVersion

```typescript
async getImageBuilderVersion(environmentName?: string): Promise<string>
```

Returns the image builder version by querying the server where the local profile takes
precedence.

The image builder version is an environment-scoped server setting, so pass the environment
the image will be built in (e.g. an App's environment) to fetch the correct version. When
omitted, the profile's default environment is used.

## version

```typescript
version(): string
```
