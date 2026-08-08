<!-- modal-docs: machine-translated zh-CN from English source -->

# 用于 JavaScript 和 Go 的模态 SDK

<Callout variant="beta" />

Modal 还提供了 SDK，支持使用 JavaScript/TypeScript 和 Go 项目中的 Modal 函数和沙箱。

虽然 Python 是构建 Modal 应用程序和实现 Modal 函数的主要语言，但这些 SDK 支持以下用例：

* 在 JS/Go 项目中使用沙箱，安全执行任意命令，运行不受信任的用户代码，或作为 AI 代理的安全环境。
* 直接调用 Modal Functions，无需将其定义为公共 Web Function 并通过 HTTP 请求寻址
* 直接从 JS/Go 与卷、秘密、队列等模态资源交互。

我们正在努力实现与主要 Modal Python SDK 的功能对等，尽管定义 Modal 函数可能仍然是 Python 独有的。

## 安装

有关安装说明，请参阅 GitHub 上的 [JavaScript](https://github.com/modal-labs/modal-client/tree/main/js) 和 [Go](https://github.com/modal-labs/modal-client/tree/main/go) 的自述文件。

## JavaScript/TypeScript

`modal` 软件包[通过 npm 分发](https://www.npmjs.org/package/modal)。详情请参见【JS API参考文档】(https://modal-labs.github.io/libmodal/)。

### 简单的 JavaScript 示例

```ts
import { ModalClient } from "modal";

const modal = new ModalClient();

const app = await modal.apps.fromName("libmodal-example", {
  createIfMissing: true,
});

// Create a Sandbox with the specified Image, and mount a Volume
const volume = await modal.volumes.fromName("libmodal-example-volume", {
  createIfMissing: true,
});
const image = modal.images.fromRegistry("alpine:3.21");
const sb = await modal.sandboxes.create(app, image, {
  volumes: { "/mnt/volume": volume },
});
const p = await sb.exec(["cat", "/mnt/volume/message.txt"]);
console.log(`Message: ${await p.stdout.readText()}`);
await sb.terminate();

// Call a previously deployed Modal Function
const echo = await modal.functions.fromName("libmodal-example", "echo");
console.log(await echo.remote(["Hello world!"]));
```

[GitHub 上还有更多示例](https://github.com/modal-labs/modal-client/blob/main/js/README.md#documentation)。

＃＃ 去
`modal-go` 软件包是[通过 go get 安装的](https://pkg.go.dev/github.com/modal-labs/modal-client/go)。详情请参阅【Go API 参考文档】(https://pkg.go.dev/github.com/modal-labs/modal-client/go#section-documentation)。

### 简单的 Go 示例

```go
package main

import (
	"context"
	"fmt"
	"io"

	modal "github.com/modal-labs/modal-client/go"
)

func main() {
	// Skipping err handling throughout for brevity
	ctx := context.Background()

	mc, _ := modal.NewClient()

	app, _ := mc.Apps.FromName(ctx, "libmodal-example", &modal.AppFromNameParams{CreateIfMissing: true})

	// Create a Sandbox with the specified Image, and mount a Volume
	volume, _ := mc.Volumes.FromName(ctx, "libmodal-example-volume", &modal.VolumeFromNameParams{CreateIfMissing: true})
	image := mc.Images.FromRegistry("alpine:3.21", nil)
	sb, _ := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
		Volumes: map[string]*modal.Volume{"/mnt/volume": volume},
	})
	defer sb.Terminate(context.Background(), nil)
	p, _ := sb.Exec(ctx, []string{"cat", "/mnt/volume/message.txt"}, nil)
	stdout, _ := io.ReadAll(p.Stdout)
	fmt.Printf("Message: %s\n", stdout)

	// Call a previously deployed Modal Function
	echo, _ := mc.Functions.FromName(ctx, "libmodal-example", "echo", nil)
	result, _ := echo.Remote(ctx, []any{"Hello world!"}, nil)
	fmt.Println(result)
}
```

[GitHub 上还有更多示例](https://github.com/modal-labs/modal-client/blob/main/go/README.md#documentation)。

## 支持

JS 和 Go Modal SDK 正在积极开发中，我们很高兴听到您的反馈。如果您有疑问或建议，请联系[Modal Community Slack](https://modal.com/slack)。