<!-- modal-docs: machine-translated zh-CN from English source -->

# 实验出站策略

ExperimentalOutboundPolicy 是一个不可变的配置，用于替换中的标头
来自沙箱的出站 HTTPS 请求。

实验性：API 可能会发生变化。

秘密值永远不会进入沙箱：它们被解析并注入到
匹配容器外部的请求。

```
secret, _ := client.Secrets.FromName(ctx, "api-token", nil)
outboundPolicy := modal.NewExperimentalOutboundPolicy(
	modal.ExperimentalOutboundPolicyHeaderReplacement{
		Domain:  "example.com",
		Secret:  secret,
		Headers: map`string`string{"Authorization": "Bearer $API_TOKEN"},
	},
	modal.ExperimentalOutboundPolicyHeaderReplacement{
		Domain:  "modal.com",
		Headers: map`string`string{"X-Trace-Token": "trace_abcd"},
	},
)
```

```go
type ExperimentalOutboundPolicy struct {
}
```

## 新实验出站策略

```go
func NewExperimentalOutboundPolicy(replacements ...ExperimentalOutboundPolicyHeaderReplacement) ExperimentalOutboundPolicy
```

NewExperimentalOutboundPolicy 返回带有给定标头替换的 ExperimentalOutboundPolicy。

## 带标题替换

```go
WithHeaderReplacement(replacement ExperimentalOutboundPolicyHeaderReplacement) ExperimentalOutboundPolicy
```

WithHeaderReplacement 返回一个新的 ExperimentalOutboundPolicy，其中添加了标头替换。