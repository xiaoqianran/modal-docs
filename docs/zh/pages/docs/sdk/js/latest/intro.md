<!-- modal-docs: machine-translated zh-CN from English source -->

# JavaScript SDK 参考

这是 [Modal](https://www.npmjs.com/package/modal) JavaScript SDK 的 API 参考。

## 安装

从 npm 安装库：

```bash
npm install modal
```

该 SDK 使用 TypeScript 编写，并提供完整的类型定义。它适用于服务器端 Node.js (Node 22+)、Deno 和 Bun 项目。 ES 模块和 CommonJS 格式都捆绑在一起，因此您可以使用`import`或`require()`。

## 配置

身份验证需要 Modal API 令牌/密钥对。凭证按优先级降序从以下来源读取：* 构造新的[`ModalClient`](/docs/sdk/js/latest/ModalClient)时传递的参数
* `MODAL_TOKEN_ID`和`MODAL_TOKEN_SECRET`环境变量
* `~/.modal.toml` 文件的活动配置文件中的 `token_id` 和 `token_secret` 字段

可以在模态仪表板上的[工作区设置](/settings/tokens)中创建API令牌。

还可以使用模态 [CLI](/docs/cli/latest) 创建和管理令牌。 CLI 与 [Python SDK](/docs/sdk/py/latest) 打包在一起，但它也可以作为独立工具安装：

```bash
curl -LsSf uvx.sh/modal/install.sh | sh
```

## 对象

|                                            |                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| [`App`](/docs/sdk/js/latest/App) | Modal 上代码部署的主要单元 |
| [`Function`](/docs/sdk/js/latest/Function) |由自动扩展容器池支持的无服务器功能 |
| [`Image`](/docs/sdk/js/latest/Image) |容器文件系统的不可变表示 |
| [`Sandbox`](/docs/sdk/js/latest/Sandbox) |用于受限执行的类似流程的界面 || [`Secret`](/docs/sdk/js/latest/Secret) |对环境变量的安全引用 |
| [`Volume`](/docs/sdk/js/latest/Volume) |可变分布式存储设备 |

## 范围

JS SDK 的范围比 Modal 的 [Python SDK](/docs/sdk/py/latest) 更有限。也就是说，Python 仍然是唯一受支持的 Function 运行时，因此定义 Function 的功能在 JS 中不可用。我们的目标是支持与远程 Modal 对象的大多数交互，包括函数、沙箱、卷等。一些范围内的功能尚未实现；如果这些对您很重要，请联系我们。
## 用法

Modal 对象类型的实例是通过 [ModalClient](/docs/sdk/js/latest/ModalClient) 上的服务方法获取的：

```typescript
import { ModalClient } from "modal";

const modal = new ModalClient();
```

与模态对象实例的交互是通过这些实例上的方法进行的。大多数方法都有一个关联的 Params 类型，用于传递可选参数。

### 沙盒

JS SDK 旨在支持 Modal [Sandboxes](/docs/guide/sandboxes) 的完整功能集：

```typescript
const app = await modal.apps.fromName("sandbox-app", {
  createIfMissing: true,
});
const image = modal.images.fromRegistry("alpine:3.21");

const sb = await modal.sandboxes.create(app, image, { command: ["cat"] });

await sb.stdin.writeText("Hello from a Sandbox!");
await sb.stdin.close();
console.log(await sb.stdout.readText());

await sb.terminate();
```

沙箱在创建时接受许多附加参数来配置其资源、生命周期、限制等：

```typescript
const secret = await modal.secrets.fromName("github-token");

const sb = await modal.sandboxes.create(app, image, {
  secrets: [secret],
  timeoutMs: 30 * 60 * 1000,
  cpu: 2,
  memoryMiB: 2048,
  outboundDomainAllowlist: ["github.com", "*.githubusercontent.com"],
});
```

### 功能

已部署应用程序中的模态函数可以从 JS/TS 程序[查找并调用](/docs/guide/trigger-deployed-functions)：

```typescript
const echo = await modal.functions.fromName("my-app", "echo");

// Call the Function with args
let ret = await echo.remote(["Hello, Modal!"]);
console.log(ret);

// Call the Function with kwargs
ret = await echo.remote([], { s: "Hello, Modal!" });
console.log(ret);
```

所有函数调用方法都可用：

```typescript
const functionCall = await echo.spawn(["Hello, Modal!"]);
const ret = await functionCall.get();
console.log(ret);
```

## 错误

错误类型记录在[错误](/docs/sdk/js/latest/Errors)页面上。方法抛出类型错误类；使用`instanceof`来匹配它们。

## 版本控制

JS SDK 版本使用语义版本控制。该库目前处于测试版 (0.X) 状态。 `0.X.0` 版本中可能包含重大更改。