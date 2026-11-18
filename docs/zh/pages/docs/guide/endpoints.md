<!-- modal-docs: machine-translated zh-CN from English source -->

# 端点

模态端点让您可以部署
[支持的开放模型](/docs/guide/supported-models) - 或您自己的自定义
权重——作为生产就绪的推理 API。

* **快速推理** - 调整开源服务引擎，具有推测性
  在 Modal 的低延迟请求代理后面支持解码。
* **托管基础设施** - Modal 处理配置、路由和
  容量管理。
* **开放且可检查** — 使用熟悉的 OpenAI 和 Anthropic 兼容 API；
  [检查或调整生成的源](/docs/guide/dedicated-endpoints#view-the- generated-source)
  在专用端点后面。

有两种服务模式可供选择：

|              | [共享端点](/docs/guide/shared-endpoints) | [专用端点](/docs/guide/dedicated-endpoints) |
| ------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **最适合** |快速、完全托管的推理 |隔离容量和定制模型|
| **型号** | [共享模型](/docs/guide/supported-models#shared-endpoint-models) | [专用模型](/docs/guide/supported-models#dedicated-endpoint-models)，加上自定义权重 |
| **计费** |每个代币|计算资源|| **容量** |由莫代尔管理|可配置的自动缩放，包括缩放至零 |

## 创建端点

从[支持的模型](/docs/guide/supported-models)中选择一个模型，
列出各型号支持的服务模式。下面的两个 CLI 示例都需要
[代理令牌](#proxy-tokens)。

CLI 默认创建专用端点：

```bash
modal endpoint create --model Qwen/Qwen3.5-4B
```

通过 `--shared` 创建共享端点：

```bash
modal endpoint create --shared --model moonshotai/Kimi-K3
```

该命令打印端点 ID 和仪表板链接以跟踪配置。
您还可以从以下位置创建端点
仪表板中的 [**端点**](https://modal.com/endpoints) 选项卡。了解更多
关于型号，请浏览
[模型库](https://modal.com/library)。

## 代理代币

共享端点始终需要
[代理令牌](/docs/guide/webhook-proxy-auth)。专用端点需要一个
默认情况下。使用 CLI 创建一个：

```bash
modal workspace proxy-tokens create
```

将令牌 ID 和密钥与句点 (`.`) 连接起来，并将它们作为不记名令牌传递：

```
Authorization: Bearer wk-<id>.ws-<secret>
```

组合值可以用作 OpenAI 兼容客户端中的 API 密钥。
请参阅[代理令牌](/docs/guide/webhook-proxy-auth)了解环境范围和其他身份验证选项。还可以使用以下命令创建专用端点
`--unauthenticated`。

## 调用端点

共享端点和专用端点上的文本生成模型都可以调用
通过 OpenAI 兼容的聊天完成 (`/v1/chat/completions`)，
完成 (`/v1/completions`) 和响应 (`/v1/responses`) API 或
与人类兼容的消息 API (`/v1/messages`)。嵌入模型可以是
通过 OpenAI 兼容的 Embeddings API (`/v1/embeddings`) 调用。

### URL 和型号名称

端点的基本 URL 是其主机名，创建后显示在仪表板中
以及`modal endpoint info`；例如，
`https://my-endpoint.us-west.modal.direct`。将 `model` 设置为
仪表板请求示例中显示的值。您还可以找回
通过 OpenAI 兼容模型 API：

```bash
curl "<your-endpoint-url>/v1/models" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET"
```

还可以通过位于以下位置的推理网关访问共享端点：
`https://inference.us-west.modal.direct`。在这种情况下，将 `model` 设置为端点的
主机名 (`my-endpoint.us-west.modal.direct`)。

### 发送请求

此示例使用聊天完成 API 和
[代理令牌](#proxy-tokens):

<CodeTabs>
  {#snippet cli()}

```bash
curl "<your-endpoint-url>/v1/chat/completions" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<model-name>",
    "messages": [{ "role": "user", "content": "Hello!" }]
  }'
```

{/片段}

{#snippet python()}

```python notest
import os

from openai import OpenAI

client = OpenAI(
    base_url="<your-endpoint-url>/v1",
    api_key=f"{os.environ['MODAL_PROXY_TOKEN_ID']}.{os.environ['MODAL_PROXY_TOKEN_SECRET']}",
)

completion = client.chat.completions.create(
    model="<model-name>",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(completion.choices[0].message.content)
```

{/片段}

{#snippet javascript()}

```typescript notest
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "<your-endpoint-url>/v1",
  apiKey: `${process.env.MODAL_PROXY_TOKEN_ID}.${process.env.MODAL_PROXY_TOKEN_SECRET}`,
});

const completion = await client.chat.completions.create({
  model: "<model-name>",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(completion.choices[0].message.content);
```

{/片段}

</CodeTabs>

对于服务器发送的事件，传递`"stream": true`。令牌使用情况报告在
最终的流式传输块。请参阅[端点集成](/docs/guide/endpoint-integrations)进行连接
将 OpenCode、Codex 和 Claude Code 等编码代理连接到共享端点。

## 亲和路由

LLM 服务引擎缓存提示前缀的 KV 状态，因此请求
当它到达相同的位置时，重用早期请求的前缀是最快的
容器。多轮对话和代理循环，每个请求重复
前几轮，受益最大。

要将一个对话的请求放在一起，请发送相同的路由密钥
每个文件上的 `Modal-Routing-Affinity-Key` 标头。路由键是
任意字符串；每次对话、任务或代理运行时使用一个。

```bash
curl "<your-endpoint-url>/v1/chat/completions" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET" \
  -H "Modal-Routing-Affinity-Key: $CUSTOM_CONVERSATION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<model-name>",
    "messages": [{ "role": "user", "content": "Hello!" }]
  }'
```
选择与共享前缀匹配的路由键：

* **每次对话一键**，而不是每个用户或应用程序。单键
  由许多不相关的对话共享，将所有流量集中在一个对话上
  容器。
* **当前缀更改时使用新密钥**，例如在压缩或
  总结了一个很长的背景。缓存的前缀不再适用，并且新的密钥
  让请求移动到具有可用容量的容器。

请注意，当端点
秤或容器被更换或超载。