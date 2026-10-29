<!-- modal-docs: machine-translated zh-CN from English source -->

# 共享端点

共享端点服务于以下子集
[支持的模型](/docs/guide/supported-models#shared-endpoint-models) 来自
模态管理池。 Modal 管理硬件和自动缩放，使用情况是
按令牌计费。

## 创建共享端点

通过 `--shared` 从 CLI 创建共享端点：

```bash
modal endpoint create --shared --model moonshotai/Kimi-K3
```

也可以从以下位置创建共享端点
仪表板中的 [**端点**](https://modal.com/endpoints) 选项卡。

端点准备就绪后，仪表板会提供其 URL、型号名称和
请求示例。共享端点始终需要
[代理令牌](/docs/guide/endpoints#proxy-tokens)。

## 并发限制

共享端点对并发正在进行的请求具有特定于模型的限制。
该限制在您的所有使用相同模型的共享端点之间共享。
工作区。超过限制的请求会收到 HTTP `429` 响应；重试
具有指数退避和抖动。

需要时使用[专用端点](/docs/guide/dedicated-endpoints)
隔离或可配置的容量。

## 请求路由

共享端点将每个请求路由到最有可能拥有其资源的容器
提示前缀已缓存。对于多轮对话和代理循环，请发送
`Modal-Routing-Affinity-Key` 会话的每个请求的标头，因此其请求
留在同一个容器中。参见
[亲和路由](/docs/guide/endpoints#affinity-routing)了解如何选择
标头值。

## 定价

每个模型的代币费率列于
[支持的模型](/docs/guide/supported-models#shared-endpoint-models)，并且是
当您创建端点及其使用情况视图时显示。制作人员
您的计划中包含的内容不能用于共享端点。封顶
自付费用，请参阅[支出限制](/docs/guide/budgets#spend-limits)。

共享端点请求通过`us-west`路由并且始终需要
认证。 Modal 管理其基础设施和容量。