<!-- modal-docs: machine-translated zh-CN from English source -->

# Go SDK 参考

这是 [Modal](https://pkg.go.dev/github.com/modal-labs/modal-client/go) Go SDK 的 API 参考。

## 安装

使用 `go get` 安装库：

```bash
go get github.com/modal-labs/modal-client/go@latest
```

然后您可以将其导入到您的代码中：

```go
import modal "github.com/modal-labs/modal-client/go"
```

需要 Go 1.25.0 或更高版本。

## 配置

身份验证需要 Modal API 令牌/密钥对。凭证按优先级降序从以下来源读取：

* 构造新的[`Client`](/docs/sdk/go/latest/Client)时传递的参数
* `MODAL_TOKEN_ID`和`MODAL_TOKEN_SECRET`环境变量
* `~/.modal.toml` 文件的活动配置文件中的 `token_id` 和 `token_secret` 字段可以在模态仪表板上的[工作区设置](/settings/tokens)中创建API令牌。

还可以使用模态 [CLI](/docs/cli/latest) 创建和管理令牌。 CLI 与 [Python SDK](/docs/sdk/py/latest) 打包在一起，但它也可以作为独立工具安装：

```bash
curl -LsSf uvx.sh/modal/install.sh | sh
```

## 对象

|  |  |
| --- | --- |
| [`App`](/docs/sdk/go/latest/App) | Modal 上代码部署的主要单元 |
| [`Function`](/docs/sdk/go/latest/Function) |由自动扩展容器池支持的无服务器功能 |
| [`Image`](/docs/sdk/go/latest/Image) |容器文件系统的不可变表示 |
| [`Sandbox`](/docs/sdk/go/latest/Sandbox) |用于受限执行的类似流程的界面 |
| [`Secret`](/docs/sdk/go/latest/Secret) |对环境变量的安全引用 |
| [`Volume`](/docs/sdk/go/latest/Volume) |可变分布式存储设备 |

## 范围

Go SDK 的范围比 Modal 的 [Python SDK](/docs/sdk/py/latest) 更有限。也就是说，Python 仍然是唯一受支持的函数运行时，因此定义函数的功能在 Go 中不可用。我们的目标是支持与远程 Modal 对象的大多数交互，包括函数、沙箱、卷等。一些范围内的功能尚未实现；如果这些对您很重要，请联系我们。

## 用法

模态对象类型的实例是通过 [Client](/docs/sdk/go/latest/Client) 类型上的服务方法获取的。

```go
mc, err := modal.NewClient()
if err != nil {
  log.Fatal(err)
}
defer mc.Close()
```

与模态对象实例的交互是通过这些实例上的方法进行的。所有方法都有一个关联的 Params 结构，用于传递可选参数。

### 沙盒

Go SDK 旨在支持 Modal [沙箱](/docs/guide/sandboxes) 的完整功能集：

```go
app, err := mc.Apps.FromName(ctx, "sandbox-app", &modal.AppFromNameParams{CreateIfMissing: true})
if err != nil {
	log.Fatal(err)
}
image := mc.Images.FromRegistry("alpine:3.21", nil)

sb, err := mc.Sandboxes.Create(ctx, app, image, nil)
if err != nil {
	log.Fatal(err)
}
defer sb.Terminate(ctx, nil)

p, err := sb.Exec(ctx, []string{"echo", "Hello from a Sandbox!"}, nil)
if err != nil {
	log.Fatal(err)
}
output, err := io.ReadAll(p.Stdout)
if err != nil {
	log.Fatal(err)
}
fmt.Print(string(output))
```
沙箱在创建时接受许多附加参数来配置其资源、生命周期、限制等：

```go
secret, err := mc.Secrets.FromName(ctx, "github-token", nil)
if err != nil {
	log.Fatal(err)
}

sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Secrets:                 []*modal.Secret{secret},
	Timeout:                 30 * time.Minute,
	CPU:                     2,
	MemoryMiB:               2048,
	OutboundDomainAllowlist: &modal.Allowlist{Entries: []string{"github.com", "*.githubusercontent.com"}},
})
if err != nil {
	log.Fatal(err)
}
defer sb.Terminate(ctx, nil)
```

### 功能

已部署应用程序中的模态函数可以从 Go 程序中[查找并调用](/docs/guide/trigger-deployed-functions)：

```go
f, err := mc.Functions.FromName(ctx, "my-app", "echo", nil)
if err != nil {
	log.Fatal(err)
}

result, err := f.Remote(ctx, []any{"Hello, Modal!"}, nil)

var remoteErr modal.RemoteError
if errors.As(err, &remoteErr) {
	log.Fatalf("remote call failed: %s", remoteErr.Exception)
} else if err != nil {
	log.Fatal(err)
}

response, ok := result.(string)
if !ok {
	log.Fatalf("expected a string result, got %T", result)
}
fmt.Println(response)
```

同步和异步[调用方法](/docs/guide/function-inplication-methods) 均受支持：

```go
fc, err := f.Spawn(ctx, []any{"Hello, Modal!"}, nil)
if err != nil {
	log.Fatal(err)
}

result, err := fc.Get(ctx, nil)
if err != nil {
	log.Fatal(err)
}
fmt.Println(result)
```

Go SDK 目前不支持批量调用。

## 错误

错误类型记录在[错误](/docs/sdk/go/latest/Errors)页面上。错误以值的形式返回并实现标准的`error`接口；使用`errors.As`来匹配它们。

## 版本控制

Go SDK 版本使用语义版本控制。该库目前处于测试版 (0.X) 状态。 `0.X.0` 版本中可能包含重大更改。