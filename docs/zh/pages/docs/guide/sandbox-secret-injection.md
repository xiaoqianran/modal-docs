<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙箱秘密注入

<Callout variant="beta">

此功能是实验性的，API 可能会发生变化。有
目前有几个[已知限制](#limitations)。

</Callout>

出站策略允许沙箱调用需要的外部 HTTPS API
身份验证，API 密钥在沙箱内不可见。

沙箱通常用于运行不受信任的代码。将 API 密钥传递给此类代码
因为环境变量是有风险的：沙箱中的任何进程都可以读取自己的
环境并泄露密钥。出站策略通过以下方式避免了这种情况
声明注入出站 HTTPS 请求的标头替换
到给定的域。这种替换发生在沙盒之外，所以秘密
永远不会出现在沙盒环境中。

有关完整的工作演示，请参阅[出站策略
示例](/docs/examples/sandbox_secret_injection)。

## 定义出站策略

出站策略是通过链接构建的不可变配置对象
`with_header_replacement` 来电。每个调用都会添加一个域、一组标头
注入对该域的请求，并且可以选择
[Secret](/docs/guide/secrets) 其密钥可以在标头中引用
价值观。

<CodeTabs>
  {#snippet python()}

```python notest
import modal
import modal.experimental

secret = modal.Secret.from_name("api-token")

outbound_policy = (
    modal.experimental.OutboundPolicy()
    # Inject a secret-backed Authorization header.
    .with_header_replacement(
        domain="example.com",
        secret=secret,
        headers={"Authorization": "Bearer $API_TOKEN"},
    )
    # Inject a static header into requests to another domain.
    .with_header_replacement(
        domain="modal.com",
        headers={"X-Trace-Token": "trace_abcd"},
    )
)
```
{/片段}

{#snippet javascript()}

```javascript notest
import { ExperimentalOutboundPolicy, ModalClient } from "modal";

const modal = new ModalClient();
const secret = await modal.secrets.fromName("api-token");

const outboundPolicy = new ExperimentalOutboundPolicy()
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
```

{/片段}

{#snippet go()}

```go notest
secret, err := mc.Secrets.FromName(ctx, "api-token", nil)
if err != nil {
	return err
}

outboundPolicy := new(modal.ExperimentalOutboundPolicy).
	// Inject a secret-backed Authorization header.
	WithHeaderReplacement(modal.ExperimentalOutboundPolicyHeaderReplacement{
		Domain:  "example.com",
		Secret:  secret,
		Headers: map[string]string{"Authorization": "Bearer $API_TOKEN"},
	}).
	// Inject a static header into requests to another domain.
	WithHeaderReplacement(modal.ExperimentalOutboundPolicyHeaderReplacement{
		Domain:  "modal.com",
		Headers: map[string]string{"X-Trace-Token": "trace_abcd"},
	})
```

{/片段} </CodeTabs>

出站策略在所有标头中最多可以包含 25 个标头值
替换添加到其中。

### 域名匹配

每个标头替换的 `domain` 支持精确的主机名、`*.` 通配符
前缀和一个裸的 `"*"`：

|域名入口|比赛|不匹配|
| ---------------- | ------------------------------------------------- | ----------------- |
| `example.com` | `example.com` | `sub.example.com` || `*.example.com` | `example.com`、`a.example.com`、`a.b.example.com` | `evilexample.com` |
| `*` |任何域 | — |

多个替换条目可以覆盖同一域。全部匹配
替换按添加顺序应用。注入的标头替换
请求中存在的任何同名标头，或者由
沙箱工作负载或任何先前匹配的替代品。

### 标头值模板

标头值支持针对提供的 Secret 的键进行模板化。
在请求时，以 `$` 为前缀的密钥名称将替换为秘密值。
要编写文字 `$`，请将其转义为 `$$`。

没有 `secret` 的替换是静态的，并且使用其标头值
逐字注入到请求中时。

## 将策略附加到沙箱

将策略传递给`Sandbox.create`：

<CodeTabs>
  {#snippet python()}

```python notest
sb = modal.Sandbox.create(
    "python", "agent.py",
    app=app,
    _experimental_outbound_policy=outbound_policy,
)
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  command: ["python", "agent.py"],
  experimentalOutboundPolicy: outboundPolicy,
});
```

{/片段}

{#snippet go()}

```go notest
sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Command:        []string{"python", "agent.py"},
	ExperimentalOutboundPolicy: &outboundPolicy,
})
```

{/片段} </CodeTabs>

此策略在沙盒中是不可见的：任何内容中都没有使用任何秘密
标头替换已添加到沙盒环境中。

## 更新正在运行的沙箱上的策略您可以在正在运行的沙箱上替换出站策略，而无需重新启动它。
更新策略将完全替换之前配置的现有策略。

<CodeTabs>
  {#snippet python()}

```python notest
sb._experimental_update_outbound_policy(
    outbound_policy.with_header_replacement(
        domain="*",
        headers={"X-Sandbox-Id": sb.object_id},
    )
)
```

{/片段}

{#snippet javascript()}

```javascript notest
await sb.experimentalUpdateOutboundPolicy(
  outboundPolicy.withHeaderReplacement({
    domain: "*",
    headers: { "X-Sandbox-Id": sb.sandboxId },
  }),
);
```

{/片段}

{#snippet go()}

```go notest
updated := outboundPolicy.WithHeaderReplacement(modal.ExperimentalOutboundPolicyHeaderReplacement{
	Domain:  "*",
	Headers: map[string]string{"X-Sandbox-Id": sb.SandboxID},
})
err := sb.ExperimentalUpdateOutboundPolicy(ctx, &updated)
if err != nil {
	return err
}
```

{/片段} </CodeTabs>

仅当使用出站创建沙箱时，更新策略才有效
政策。如果您想稍后更新策略，您可以创建一个沙箱
空出站策略。

## 它是如何工作的

当使用出站策略创建沙箱时，Modal 会附加一个小型代理
位于沙箱的出站网络路径上。
端口 443 上的出站 TCP 流量通过代理重定向，该代理读取
的目标域
TLS 中的 [SNI](https://en.wikipedia.org/wiki/Server_Name_Indication)
握手。

如果域与策略规则匹配，则代理**终止 TLS
连接** 使用由证书颁发机构 (CA) 生成的唯一证书
沙盒。 CA 的证书安装到沙箱的信任存储中
在创建时，请参阅 [TLS trust inside the
沙箱](#tls-trust-inside-the-sandbox)。代理注入配置的
标头并通过单独的 TLS 将请求转发到目的地
连接。

如果域不匹配任何规则，则连接通过
未受影响。

只有端口 443 上的 HTTPS 才有资格进行注入。普通 HTTP、其他端口以及
非 TLS 协议永远不会终止或修改。连接使用
加密的客户端问候 (ECH) 对代理隐藏其真实目的地
无需注射即可通过。

## 沙盒内的 TLS 信任

仅当工作负载信任证书颁发机构时，TLS 终止才有效
在代理中使用。在创建时 Modal 将 CA 证书安装在
根文件系统位于`/etc/modal/sandbox-egress-ca.crt`。我们也尝试
如果我们可以识别，请将其附加到该映像具有的任何现有系统 CA 捆绑包中
它。

Modal 还在沙箱中设置通用环境变量，指向
包含 Sandbox CA 证书的 CA 捆绑包：

* `SSL_CERT_FILE`
* `REQUESTS_CA_BUNDLE`
* `CURL_CA_BUNDLE`
* `NODE_EXTRA_CA_CERTS`

如果您选择的 HTTP 客户端无法识别这些环境变量，或者
如果您的系统 CA 捆绑包位于我们不附加 CA 的位置
证书，您需要手动配置客户端来读取该证书
`/etc/modal/sandbox-egress-ca.crt` 的证书。

## 限制

此功能有一些已知的限制。我们正在努力改进此功能，但目前我们知道以下功能不起作用：

* 我们仅支持双向 HTTP/1.1。安装的代理只会
  通过 [ALPN](https://en.wikipedia.org/wiki/Application-Layer_Protocol_Negotiation) 通告 HTTP/1.1
  并且仅在将连接转发到目标时使用 HTTP/1.1。
  这意味着仅 HTTP/2 的流量（包括 gRPC）将不起作用。
* 只有命名的 Secrets 才有效。短暂的秘密（`Secret.from_dict`）不是
  还支持。
* 出境保单不能与`block_network`同时使用，
  `outbound_domain_allowlist`，`outbound_cidr_allowlist`，实验
  `proxy_traffic_via_sidecar`选项，或[内存
  快照](/docs/guide/sandbox-snapshots) (`enable_snapshot`)。
* 出站策略只能应用于主沙盒容器。
  [Sidecar](/docs/guide/sandbox-sidecars) 容器不包括在内。
* 秘密值在创建沙箱时以及在每个沙箱上解析
  `_experimental_update_outbound_policy` 致电。正在运行的沙箱不会获取新值
  如果 Secret 在此之后更新。