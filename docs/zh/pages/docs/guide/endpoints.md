<!-- modal-docs: machine-translated zh-CN from English source -->

# 端点

模态端点允许您从以下位置部署模型
[模态库](https://modal.com/library) - 或您自己的自定义权重 - 作为
生产就绪的推理 API。

* **快速推理** - 调整开源服务引擎，具有推测性
  在 Modal 的低延迟请求代理后面支持解码。
* **托管基础设施** - Modal 处理配置、路由和
  容量管理。
* **开放且可检查** — 使用熟悉的 OpenAI 和 Anthropic 兼容 API；
  [检查或调整生成的源](/docs/guide/dedicated-endpoints#view-the- generated-source)
  在专用端点后面。

有两种服务模式可供选择：

|              | [共享端点](/docs/guide/shared-endpoints) | [专用端点](/docs/guide/dedicated-endpoints) |
| ------------ | ------------------------------------------------ | ------------------------------------------------------ |
| **最适合** |快速、完全托管的推理 |隔离容量和定制模型|
| **型号** |模态库中选定的模型 |所有模态库模型，以及自定义权重 |
| **计费** |每个代币 |计算资源|
| **容量** |由莫代尔管理|可配置的自动缩放，包括缩放至零 |

## 创建端点

浏览[模态库](https://modal.com/library)选择模型并查看
支持哪些服务模式。然后从以下位置创建一个端点
仪表板中的 [**端点**](https://modal.com/endpoints) 选项卡。

## 代理代币

共享端点始终需要
[代理令牌](/docs/guide/webhook-proxy-auth)。专用端点需要一个默认情况下。使用 CLI 创建一个：

```bash
modal workspace proxy-tokens create
```

将令牌 ID 和密钥与句点 (`.`) 连接起来，并将它们作为不记名令牌传递：

```
Authorization: Bearer wk-<id>.ws-<secret>
```

组合值可以用作 OpenAI 兼容客户端中的 API 密钥。
请参阅[代理令牌](/docs/guide/webhook-proxy-auth)了解环境范围和
其他身份验证选项。还可以使用以下命令创建专用端点
`--unauthenticated`。

## 调用端点

共享端点和专用端点上的文本生成模型都可以调用
通过 OpenAI 兼容的聊天完成和响应 API 或
与人类兼容的消息 API。嵌入模型可以通过以下方式调用
兼容 OpenAI 的嵌入 API。

仪表板显示端点 URL 和模型名称。此示例使用聊天
完成 API 和[代理令牌](#proxy-tokens)：

```bash
curl "<your-endpoint-url>/v1/chat/completions" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<model-name>",
    "messages": [{ "role": "user", "content": "Hello!" }]
  }'
```

请参阅[端点集成](/docs/guide/endpoint-integrations)进行连接
编码代理（例如 OpenCode 和 Codex）到共享端点。