<!-- modal-docs: machine-translated zh-CN from English source -->

# 共享端点

共享端点服务于模型的子集
来自 Modal 管理池的 [Modal 库](https://modal.com/library)。每个型号
可用于共享端点 也可用于
[专用端点](/docs/guide/dedicated-endpoints)。图书馆显示了哪些
各型号支持的服务模式。 Modal 管理硬件和自动缩放，
并且使用量按令牌计费。

## 创建共享端点

从创建共享端点
仪表板中的 [**端点**](https://modal.com/endpoints) 选项卡。

端点准备就绪后，仪表板将提供其 URL、型号名称和
请求示例。共享端点始终需要
[代理令牌](/docs/guide/endpoints#proxy-tokens)。

## 并发限制

共享端点对并发进行中的请求具有特定于模型的限制。
该限制在您的所有使用相同模型的共享端点之间共享。
工作区。超过限制的请求会收到 HTTP `429` 响应；重试
具有指数退避和抖动。

需要时使用[专用端点](/docs/guide/dedicated-endpoints)
隔离或可配置的容量。

## 定价

当您创建端点时及其使用情况视图中会显示令牌率。制作人员
您的计划中包含的内容不能用于共享端点。封顶
自付费用，请参阅[支出限制](/docs/guide/budgets#spend-limits)。

共享端点请求通过`us-west`路由并且始终需要
认证。 Modal 管理其基础设施和容量。