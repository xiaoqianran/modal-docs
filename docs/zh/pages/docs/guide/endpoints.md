<!-- modal-docs: machine-translated zh-CN from English source -->

<span id="dedicated-endpoints"></span><span id="configuration"></span>

# 端点

模态端点让您可以部署
[支持的开放模型](/docs/guide/supported-models) - 或您自己的自定义
权重——作为专用容量上的生产就绪推理 API。

* 快速推理——经过调整的开源服务引擎，具有推测性
  在 Modal 的低延迟请求代理后面支持解码。
* 托管基础设施——Modal 处理配置、路由和
  容量管理。
* 开放且可检查——使用熟悉的 OpenAI 和 Anthropic 兼容 API；
  [检查或调整生成的源](#view-the- generated-source)
  在端点后面。

有关 Modal 管理容量的按令牌付费推断，请参阅[模型 API](/docs/guide/model-apis)。

<span id="create-a-dedicated-endpoint"></span>

## 创建端点

从[支持的型号](/docs/guide/supported-models)中选择一个型号。
默认情况下，创建端点需要 [代理令牌](#proxy-tokens)
访问目标环境。如果您的工作区使用 RBAC，请确保
在运行命令之前已授予令牌访问权限。

CLI 默认使用专用容量：

```bash
modal endpoint create --model Qwen/Qwen3.5-4B
```

Modal 选择兼容的服务配方并开始配置。命令
打印端点 ID 和仪表板链接以跟踪配置。
如果您的环境允许公共端点，请添加 `--unauthenticated` 来创建
没有代理令牌的一个。

您还可以从[Endpoints](https://modal.com/endpoints)创建一个Endpoint
仪表板中的选项卡。选择创建端点（或浏览空的所有模型）
列表）并选择`Qwen/Qwen3.5-4B`。如果您需要代理令牌，请选择创建
向导中的令牌。然后单击创建端点。

## 代理代币

使用 CLI 创建 [代理令牌](/docs/guide/webhook-proxy-auth)：

```bash
modal workspace proxy-tokens create
```

在启用了 RBAC 的工作区中，使用以下命令授予新令牌访问权限
`modal workspace proxy-tokens allow <token-id> <environment-name>`。保存以下请求示例的令牌 ID 和密钥。

## 调用端点

可以调用 Endpoints 上的文本生成模型
通过 OpenAI 兼容的聊天完成 (`/v1/chat/completions`)，
完成 (`/v1/completions`) 和响应 (`/v1/responses`) API 或
Anthropic-compatible Messages API (`/v1/messages`).嵌入模型可以是
通过 OpenAI 兼容的 Embeddings API (`/v1/embeddings`) 调用。

### URL 和型号名称

端点的基本 URL 是其主机名，创建后显示在仪表板中
并在`modal endpoint info`；例如，
`https://my-endpoint.us-west.modal.direct`。将 `model` 设置为
value shown in the dashboard's request examples. If you create an Endpoint with
`--name`，将该名称用作`model`。您还可以找回
通过 OpenAI 兼容模型 API：

```bash
export MODAL_PROXY_TOKEN_ID="wk-..."
export MODAL_PROXY_TOKEN_SECRET="ws-..."

curl "<your-endpoint-url>/v1/models" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET"
```

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
最终的流式传输块。

## 查看生成的源码

端点是一个模态应用程序，使用相同的原语构建Modal SDK，包括 [`@app.server()`](/docs/guide/servers)。打开
**源**视图来检查其生成的`serve.py`。您可以复制并调整它
当您需要完全控制服务堆栈时，将代码写入您自己的模态应用程序。

## 提供自定义权重

自定义重量使用兼容的服务配方
[端点模型](/docs/guide/supported-models#dedicated-endpoint-models)。使用 `--model` 传递该模型，
然后提供来自拥抱面或模态体积的权重。

来自拥抱的脸：

```bash
modal endpoint create \
  --name my-fine-tune \
  --model Qwen/Qwen3.6-27B \
  --custom-hf-repo aisingapore/Qwen-SEA-LION-v4.5-27B-IT \
  --custom-hf-revision da42f2c0984d716fb2032e4176d81adfac98c630
```

将 `--custom-hf-token` 用于门禁或私有存储库。

从包含 `config.json` 文件的模态体：

```bash
modal endpoint create \
  --name my-volume-model \
  --model Qwen/Qwen3.5-4B \
  --custom-volume-name my-volume \
  --custom-volume-path /checkpoints/1234
```

## 配置容量和放置
默认情况下，端点在负载下按比例放大，在空闲时缩小至零。
从仪表板配置最小、最大和缓冲区容器。

路由区域控制请求进入 Modal 的位置。计算布局
控制容器运行的位置。独立设置它们：

```bash
modal endpoint create \
  --model Qwen/Qwen3.5-4B \
  --routing-region us-east \
  --compute-region us-west
```

使用 `--colocate-compute` 来在路由区域中运行计算。固定
计算到一个区域会产生
[区域选择乘数](/docs/guide/region-selection#pricing)。

<span id="request-routing"></span>

## 亲和路由

LLM 服务引擎缓存提示前缀的 KV 状态，因此请求
当它到达相同的位置时，重用早期请求的前缀是最快的
容器。多轮对话和代理循环，每个请求重复
前几轮，受益最大。

端点从服务器继承[亲和性路由](/docs/guide/servers#request-routing)。
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

## 指标

**活动**视图显示随时间变化的请求量。使用**响应**进行检查
个人请求和**容器**检查为其提供服务的容器。

对于文本生成模型，**指标**将**推理指标**分开，即延迟、
吞吐量、正在运行和排队的请求、缓存使用情况和推测
解码——来自**服务器指标**，例如自动缩放和CPU、内存、网络、
和 GPU 利用率。

## 基准测试

对于文本生成模型，**Benchmark** 视图可以运行可重复的实时模型
或针对实时端点的代理工作负载。基准产生流量，
触发自动缩放，并产生通常的计算成本。

将结果视为时间点测量：车队规模、位置和冷量
开始都会影响他们。
<span id="manage-a-dedicated-endpoint"></span>

## 管理端点

列出环境中的端点：

```bash
modal endpoint list --env prod
```

当您不再需要端点时停止它：

```bash
modal endpoint stop my-endpoint --env prod
```

停止端点是永久性的。它会拆除服务应用程序并
删除其托管模型缓存；端点无法重新启动。

## 定价

端点对 GPU、CPU、内存和其他使用的资源进行计费
他们的容器以标准模态计算速率。端点缩放为零
不产生计算费用。