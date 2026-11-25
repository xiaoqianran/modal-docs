<!-- modal-docs: machine-translated zh-CN from English source -->

<span id="shared-endpoints"></span>

# 模型 API

<span id="pricing"></span>

使用模型 API 调用开放权重模型并[按代币付费](/docs/guide/model-api-pricing)。模态运行
模型和管理容量。部署自定义权重或配置您自己的权重
容量，请参阅[端点指南](/docs/guide/endpoints)。

<span id="create-a-shared-endpoint"></span>

## 创建模型 API

从[模型 API 仪表板](/model-apis) 创建模型 API。
您需要一个可以访问您的环境的[代理令牌](/docs/guide/webhook-proxy-auth)。
您可以在设置过程中创建一个。

在 CLI 中，使用 `--shared` 并通过 ID 指定模型。例如，要使用 Kimi K3，请运行

```bash
modal endpoint create --shared --model moonshotai/Kimi-K3
```

<span id="send-your-first-request"></span>

## 发送请求

模型 API 支持 OpenAI 兼容 API 和 Anthropic 兼容消息
API。要发送聊天完成请求，请复制服务 URL 和模型名称
从仪表板的请求示例中并使用您的代理令牌凭据。

```bash
export MODAL_PROXY_TOKEN_ID="wk-..."
export MODAL_PROXY_TOKEN_SECRET="ws-..."

curl "<your-model-api-url>/v1/chat/completions" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<model-name>",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

要将模型 API 与编码代理结合使用，请参阅[代理集成](/docs/guide/endpoint-integrations)。

## 并发限制

每个模型对您的工作区可以处理的请求数量都有限制
立刻。对该模型的任何模型 API 的请求都计入相同的限制。
当您到达它时，对该模型的新请求将返回 HTTP `429`。重试它们
具有指数退避和抖动。

您可以在 **共享端点并发限制** 中找到每个模型的限制
[设置→限制](/设置/限制)。

## 请求路由

该模型确定其服务 URL 中显示的路由区域。模态航线
自动请求。为了帮助跨轮重复使用缓存的提示前缀，您
可以在每个请求上发送相同的`Modal-Routing-Affinity-Key`值
谈话。请参阅[亲和性路由](/docs/guide/endpoints#affinity-routing)。

## 欧盟型号

欧盟模型，例如`deepseek-ai/DeepSeek-V4.1-Flash-1017-EU`，保持推理流量
位于欧洲经济区 (EEA) 内，并在仪表板中标记为 **EU**
模型选择器。他们的模型 API 通过 `eu-west` 路由并仅在
欧洲经济区的集装箱。