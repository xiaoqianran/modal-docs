<!-- modal-docs: machine-translated zh-CN from English source -->

# 实验出站策略

用于替换出站 HTTPS 请求中标头的不可变配置
来自沙盒。

实验性：API 可能会发生变化。

标头值支持使用替换密钥中的键进行模板化：
秘密中的`$`前缀密钥名称被秘密值替换。
文字 `$` 字符写作 `$$`。

秘密值永远不会进入沙箱：它们被解析并注入到
匹配容器外部的请求。

```ts
const secret = await modal.secrets.fromName("api-token");

const outboundPolicy = new modal.ExperimentalOutboundPolicy()
  // Inject a secret-backed Authorization header.
  .withHeaderReplacement({
    domain: "example.com",
    secret,
    headers: { Authorization: "Bearer $API_TOKEN" },
  })
  // Inject a static header into requests to another domain.
  .withHeaderReplacement({
    domain: "modal.com",
    headers: { "X-Trace-Token": "trace_abcd" },
  });

const sb = await modal.sandboxes.create(app, image, {
  experimentalOutboundPolicy: outboundPolicy,
});
```

## withHeaderReplacement

```typescript
withHeaderReplacement(params: {
  domain: string;
  headers: Record<string, string>;
  secret?: Secret;
}): ExperimentalOutboundPolicy
```

返回一个新的 `ExperimentalOutboundPolicy` 并添加了标头替换。

* `params`：.domain 替换范围的域。支持`*.`通配符前缀（匹配顶级域和子域）和裸`"*"`。
* `params`: .headers 标头名称 -> 标头值。值支持引用替换的 `secret` 中的键的 `$KEY` 模板。
* `params`：名为`Secret`（例如来自`client.secrets.fromName`）的.secret，其键可以在标头值模板中引用。静态替换已不是什么秘密。