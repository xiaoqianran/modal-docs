<!-- modal-docs: machine-translated zh-CN from English source -->

# 端点

在 Modal 的托管上部署生产就绪的 LLM 推理端点
使用单个命令的基础设施：

```bash
modal endpoint create --model Qwen/Qwen3.5-4B
```

端点支持开放模型权重和您自己的自定义微调，
源自 Hugging Face 存储库或模态体积。

它们提供了许多内置功能：

* **默认情况下快速推理** - 每个端点都以低延迟运行
  在经过调整的开源推理引擎上请求代理，并具有 SOTA 推测
  在配方支持的任何地方进行解码。
* **基于使用的定价** — 您只需为端点使用的*计算*付费，
  这样您就可以从我们的计算引擎优化中获益。
* **缩放到零自动缩放** - 端点在负载下放大并缩小到零
  空闲时，无需手动调整。

本页是模态端点的高级指南。

## 开始使用

Modal 支持从以下位置部署预训练的开放和自定义权重模型
以下家庭：

* 奎文
*基米
*杰玛4
* 深度搜索
* 内动管
* GPT-OSS
* 广义线性模型

在 [**端点**](https://modal.com/endpoints) 选项卡上浏览完整目录
在仪表板中。

旋转 `Qwen/Qwen3.5-4B` 的端点：

```bash
modal endpoint create --model Qwen/Qwen3.5-4B
```

Modal 解析模型，选择兼容的配方，然后开始配置。
该命令会打印端点 ID 和仪表板链接，您可以在其中观看它
上线。您还可以从以下位置创建端点
仪表板中的 [**Endpoints**](https://modal.com/endpoints) 选项卡 — 表单
收集相同的选项。

如果省略 `name` 参数，Modal 会从模型中派生一个
（`Qwen/Qwen3.5-4B` → `qwen3-5-4b`）。

## 代理代币

默认情况下，端点经过身份验证。要呼叫一个，您需要一个
[代理令牌](/docs/guide/webhook-proxy-auth) 对，您可以使用以下命令创建
命令行界面：

```bash
modal workspace proxy-tokens create
```

这将打印令牌 ID (`wk-...`) 和秘密 (`ws-...`)。秘密只被展示在创建时并且以后无法检索，因此请将其存储在安全的地方。

如果您的工作区启用了 [RBAC](/docs/guide/rbac)，您还需要
将新令牌与您将在其中创建的环境显式关联
端点：

```bash
modal workspace proxy-tokens allow wk-... main
```

要验证请求，请将令牌 ID 和密钥与句点 (`.`) 结合起来，然后
将它们作为单个 `Authorization: Bearer` 标头传递：

```
Authorization: Bearer wk-<id>.ws-<secret>
```

这与 OpenAI API 使用的方案相同 (`Authorization: Bearer <api-key>`)，
因此您可以在任何 OpenAI 兼容客户端中使用组合值作为 API 密钥
或网关。

该令牌还可以用作单独的 `Modal-Key` 和 `Modal-Secret` 标头，即
当您需要为另一个令牌保留 `Authorization` 标头时很有用：

```
Modal-Key: wk-...
Modal-Secret: ws-...
```

您还可以使用以下方式向经过身份验证的端点发出请求
[`modal curl`](/docs/cli/latest/curl) 实用程序。这执行透明
使用您的 Modal API 凭证进行身份验证，尽管 API 身份验证
增加了一些延迟，因此它最适合基本测试和演示。

要创建接受未经身份验证的请求的端点，请传递
`--unauthenticated`。

## 调用您的端点

端点上线后，它会在以下位置提供 OpenAI Chat Completions API：
端点 URL - 显示在仪表板中。应用程序编程接口
在 `/v1` 下提供服务，要传递的模型名称是基本模型存储库 ID（对于
目录和卷模型）或您的自定义 Hugging Face 存储库 ID。

使用 `POST` 请求发送聊天完成，传递您的
[代理令牌](#proxy-tokens) 作为不记名令牌：

```bash
curl "<your-endpoint-url>/v1/chat/completions" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<base-model-repo-id>",
    "messages": [{ "role": "user", "content": "Hello!" }]
  }'
```

或者使用 `Modal-Key` 和 `Modal-Secret` 标头：

```bash
curl "<your-endpoint-url>/v1/chat/completions" \
  -H "Modal-Key: $MODAL_PROXY_TOKEN_ID" \
  -H "Modal-Secret: $MODAL_PROXY_TOKEN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<base-model-repo-id>",
    "messages": [{ "role": "user", "content": "Hello!" }]
  }'
```

由于端点与 OpenAI 兼容，因此您可以将任何 OpenAI 客户端指向它
通过设置基本 URL 和 API 密钥。例如，使用 OpenAI Python SDK：

```python notest
from openai import OpenAI

client = OpenAI(
    base_url="<your-endpoint-url>/v1",
    api_key="wk-<id>.ws-<secret>",
)

client.chat.completions.create(
    model="<base-model-repo-id>",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

请参阅[端点集成](/docs/guide/endpoint-integrations)进行连接
编码代理（例如 OpenCode 和 Codex）到共享端点。

## 提供自定义权重

将端点指向微调的检查点而不是目录模型。一个
自定义模型始终针对目录中的基本模型提供服务：传递该模型
带有 `--model` 的基本模型，以便 Modal 可以选择兼容的配方，然后指向
您的体重带有 `--custom-hf-*` 或 `--custom-volume-*` 标志。

来自 Hugging Face 存储库（使用 `--custom-hf-token` 进行门控或私人存储库）：

```bash
modal endpoint create \
  --name my-ft \
  --model Qwen/Qwen3.6-27B \
  --custom-hf-repo aisingapore/Qwen-SEA-LION-v4.5-27B-IT \
  --custom-hf-revision da42f2c0984d716fb2032e4176d81adfac98c630
```

从模态体（模型目录必须包含`config.json`）：

```bash
modal endpoint create \
  --name my-volume-ft \
  --model Qwen/Qwen3.5-4B \
  --custom-volume-name my-volume \
  --custom-volume-path /checkpoints/1234
```

## 选择运行位置

两个放置控件：* **路由区域** (`--routing-region`) — 请求代理的锚定位置。
  选择距离您的呼叫者最近的区域：`us-west`（默认）、`us-east`、
  `ca-central`、`eu-west` 或 `ap-south`。
* **计算布局** (`--compute-region`, `--colocate-compute`) — 默认情况下，
  莫代尔按可用性放置容器。通过`--compute-region`进行选择
  其中容器独立于请求路由运行。您可以重复
  允许在多个区域进行调度的选项。或者，通过
  `--colocate-compute` 使用路由区域。

选择独立于请求路由的计算区域：

```bash
modal endpoint create \
  --model Qwen/Qwen3.5-4B \
  --routing-region us-east \
  --compute-region us-west
```

或者在路由区域运行计算：

```bash
modal endpoint create \
  --model Qwen/Qwen3.5-4B \
  --routing-region us-east \
  --colocate-compute
```

使用 `--compute-region` 或 `--colocate-compute` 选择计算区域
产生[区域选择乘数](/docs/guide/region-selection#pricing)。

## 管理端点

您可以列出环境中的所有端点及其当前状态。

```bash
modal endpoint list --env prod
modal endpoint list --env prod --json  # Contains more details
```

当您不再需要某个端点时，将其停止。这会破坏它的服务
容器并停止计费。

```bash
modal endpoint stop qwen3-5-4b --env prod
```

## 查看源码

Modal 端点是使用 Modal SDK 构建的，并利用我们的新功能
高性能[服务器](/docs/guide/servers) 原语。您可以看到
通过导航到端点仪表板中的“源”面板来查看底层代码。

## 定价

端点对其容器在运行时使用的 GPU 和 CPU 进行计费，地址为
标准模态计算速率。由于默认情况下端点缩放为零，因此您
空闲时无需支付任何计算费用。您可以调整自动缩放配置
在 UI 中覆盖。区域固定应用
[区域选择乘数](https://modal.com/pricing)。

## 可以使用积分的地方

您的计划中包含的积分不能用于支付共享端点费用
用法。其他学分继续适用。所有其他端点账单的使用情况
照常计算，仍然可以用积分支付。

要限制自付费用，请参阅[支出限制](/docs/guide/budgets#spend-limits)。