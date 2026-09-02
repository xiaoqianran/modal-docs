<!-- modal-docs: machine-translated zh-CN from English source -->

# 网络和安全

沙箱默认是安全的，这意味着默认沙箱具有
无法接受传入的网络连接或访问您的 Modal 资源。

## 出站访问控制

默认情况下，沙箱可以与任何公共 IP 地址建立出站连接。
Modal 提供三个级别的出站网络限制：

|水平|参数|它控制什么 || -------------------------------------- | ------------------------ | | -------------------------------------------------------------------------- |
| **全块** | `block_network=True` |丢弃所有出站流量。                                    |
| **IP 范围白名单** | `outbound_cidr_allowlist` |仅允许流向列出的 CIDR 范围（任何协议）的流量。  |
| **域允许列表** *（测试版）* | `outbound_domain_allowlist` |仅允许 TLS 流量（端口 443）发送至列出的域名。 |

`outbound_cidr_allowlist` 和 `outbound_domain_allowlist` 可以相加组合 - 满足任一条件的流量将被允许通过。

对于高级 HTTPS 检查，实验性 `proxy_traffic_via_sidecar`
选项将来自主容器的端口 443 上的出站 TCP 流量路由到
边车。请参阅[通过
Sidecar](/docs/guide/sandbox-sidecars#routing-https-traffic-through-a-sidecar)
了解详情。

### 阻止所有网络访问

设置`block_network=True`以防止沙箱进行任何出站
连接：

<CodeTabs>
  {#snippet python()}

```python notest
sb = modal.Sandbox.create(
    "python", "my_script.py",
    block_network=True,
    app=app,
)
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  command: ["python", "my_script.py"],
  blockNetwork: true,
});
```

{/片段}

{#snippet go()}

```go notest
sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Command:      []string{"python", "my_script.py"},
	BlockNetwork: true,
})
```

{/片段} </CodeTabs>

当`block_network`启用时，`outbound_cidr_allowlist`，
无法使用`outbound_domain_allowlist`、`inbound_cidr_allowlist`。

### 按 IP 范围限制（CIDR 允许列表）

使用 `outbound_cidr_allowlist` 将出站流量限制到一组 IP范围。所有流向这些范围之外的 IP 的流量（`outbound_domain_allowlist` 允许的流量除外）都会被阻止。

<CodeTabs>
  {#snippet python()}

```python notest
sb = modal.Sandbox.create(
    "sleep", "infinity",
    outbound_cidr_allowlist=["52.0.0.0/8", "10.0.1.0/24"],
    app=app,
)
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  command: ["sleep", "infinity"],
  outboundCidrAllowlist: ["52.0.0.0/8", "10.0.1.0/24"],
});
```

{/片段}

{#snippet go()}

```go notest
sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Command:               []string{"sleep", "infinity"},
	OutboundCIDRAllowlist: &modal.Allowlist{Entries: []string{"52.0.0.0/8", "10.0.1.0/24"}},
})
```

{/片段} </CodeTabs>

### 按域名限制（域白名单）

<Callout variant="beta" />

使用 `outbound_domain_allowlist` 将出站 TLS 流量限制为一组
域名：

<CodeTabs>
  {#snippet python()}

```python notest
sb = modal.Sandbox.create(
    "sleep", "infinity",
    outbound_domain_allowlist=["api.openai.com", "*.github.com"],
    app=app,
)
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  command: ["sleep", "infinity"],
  outboundDomainAllowlist: ["api.openai.com", "*.github.com"],
});
```

{/片段}

{#snippet go()}

```go notest
sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Command:                []string{"sleep", "infinity"},
	OutboundDomainAllowlist: &modal.Allowlist{Entries: []string{"api.openai.com", "*.github.com"}},
})
```

{/片段} </CodeTabs>

设置域白名单后：

* **TLS（端口 443）** 仅允许连接到列出的域。
与非白名单域的连接将被安全阻止并记录到
  沙箱的系统输出流。
* **非 TLS 流量**（HTTP、原始 TCP、UDP）到不在 CIDR 上的 IP
  允许名单被**阻止**。

以 `*.` 为前缀的条目与父域和任何子域匹配：

|允许列表条目 |比赛|不匹配 |
| ---------------- | ------------------------------------------------- | ----------------- |
| `example.com` | `example.com` | `sub.example.com` |
| `*.example.com` | `example.com`、`a.example.com`、`a.b.example.com` | `evilexample.com` |### 在运行时更新网络策略

<Callout variant="alpha">

此 API 是实验性的，具有 [限制](#dynamic-policy-limitations)
将在未来版本中删除。

</Callout>

您可以替换正在运行的 Sandbox 的出站网络策略，而无需
重新启动它。当代理的信任级别在会话中发生变化时，这非常有用 -
例如，在安装依赖项时从广泛访问开始，然后
仅锁定工具需要的域。

<CodeTabs>
  {#snippet python()}

```python notest
# Start with all outbound traffic allowed.
sb = modal.Sandbox.create(
    "sleep", "infinity",
    outbound_domain_allowlist=["*"],
    outbound_cidr_allowlist=["0.0.0.0/0"],
    app=app,
)

# ... later, narrow the policy to only the domains we need.
sb._experimental_set_outbound_network_policy(
    outbound_domain_allowlist=["api.openai.com", "*.github.com"],
)

# Or block all outbound traffic by passing empty allowlists.
sb._experimental_set_outbound_network_policy(
    outbound_domain_allowlist=[],
    outbound_cidr_allowlist=[],
)

# Widen back to allow-all when needed.
sb._experimental_set_outbound_network_policy(
    outbound_domain_allowlist=["*"],
    outbound_cidr_allowlist=["0.0.0.0/0"],
)
```

{/片段}

{#snippet javascript()}

```javascript notest
// Start with all outbound traffic allowed.
const sb = await modal.sandboxes.create(app, image, {
  command: ["sleep", "infinity"],
  outboundDomainAllowlist: ["*"],
  outboundCidrAllowlist: ["0.0.0.0/0"],
});

// ... later, narrow the policy to only the domains we need.
await sb.updateNetworkPolicy({
  outboundDomainAllowlist: ["api.openai.com", "*.github.com"],
  outboundCidrAllowlist: [],
});

// Or block all outbound traffic by passing empty allowlists.
await sb.updateNetworkPolicy({
  outboundDomainAllowlist: [],
  outboundCidrAllowlist: [],
});

// Widen back to allow-all when needed.
await sb.updateNetworkPolicy({
  outboundDomainAllowlist: ["*"],
  outboundCidrAllowlist: ["0.0.0.0/0"],
});
```

{/片段}

{#snippet go()}

```go notest
// Start with all outbound traffic allowed.
sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Command:                []string{"sleep", "infinity"},
	OutboundDomainAllowlist: &modal.Allowlist{Entries: []string{"*"}},
	OutboundCIDRAllowlist:   &modal.Allowlist{Entries: []string{"0.0.0.0/0"}},
})

// ... later, narrow the policy to only the domains we need.
err = sb.UpdateNetworkPolicy(ctx, &modal.SandboxUpdateNetworkPolicyParams{
	OutboundDomainAllowlist: &modal.Allowlist{Entries: []string{"api.openai.com", "*.github.com"}},
	OutboundCIDRAllowlist:   &modal.Allowlist{Entries: []string{}},
})

// Or block all outbound traffic by passing empty allowlists.
err = sb.UpdateNetworkPolicy(ctx, &modal.SandboxUpdateNetworkPolicyParams{
	OutboundDomainAllowlist: &modal.Allowlist{Entries: []string{}},
	OutboundCIDRAllowlist:   &modal.Allowlist{Entries: []string{}},
})

// Widen back to allow-all when needed.
err = sb.UpdateNetworkPolicy(ctx, &modal.SandboxUpdateNetworkPolicyParams{
	OutboundDomainAllowlist: &modal.Allowlist{Entries: []string{"*"}},
	OutboundCIDRAllowlist:   &modal.Allowlist{Entries: []string{"0.0.0.0/0"}},
})
```

{/片段} </CodeTabs>
新政策立即生效。建立了新的联系
政策不再许可被终止。

#### 动态策略限制

* 每个白名单类型必须在创建时设置才能稍后使用。至
  运行时更新`outbound_domain_allowlist`，必须创建沙箱
  与 `outbound_domain_allowlist`（例如 `["*"]`）。这同样适用于
  `outbound_cidr_allowlist` — 如果您愿意，可以使用 `["0.0.0.0/0"]` 创建
  稍后受 CIDR 限制。
* `block_network=True` 与此 API 不兼容。使用空允许列表
  (`[]`) 来阻止所有流量。

## 入站访问控制

使用`inbound_cidr_allowlist`限制哪些IP地址可以连接通过隧道和沙箱连接令牌**入站**到沙箱：

<CodeTabs>
  {#snippet python()}

```python notest
sb = modal.Sandbox.create(
    "python", "-m", "http.server", "8080",
    encrypted_ports=[8080],
    inbound_cidr_allowlist=["203.0.113.0/24"],
    app=app,
)
```

{/片段}

{#snippet javascript()}

```javascript notest
const sb = await modal.sandboxes.create(app, image, {
  command: ["python", "-m", "http.server", "8080"],
  encryptedPorts: [8080],
  inboundCidrAllowlist: ["203.0.113.0/24"],
});
```

{/片段}

{#snippet go()}

```go notest
sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Command:              []string{"python", "-m", "http.server", "8080"},
	EncryptedPorts:       []int{8080},
	InboundCIDRAllowlist: []string{"203.0.113.0/24"},
})
```

{/片段} </CodeTabs>

## 使用 HTTP 和 WebSocket 连接到沙箱

您可以通过生成以下内容向沙箱发出经过身份验证的 HTTP 和 WebSocket 请求：
沙箱连接令牌。他们的工作方式是这样的：

<CodeTabs>
  {#snippet python()}

```python notest
# Start a Sandbox with a server running on port 8080.
sb = modal.Sandbox.create(
    "bash", "-c", "python3 -m http.server 8080",
    app=my_app,
)

# Create a connect token, optionally including arbitrary user metadata.
# Port 8080 is the default and could be omitted here.
creds = sb.create_connect_token(user_metadata={"user_id": "foo"}, port=8080)

# Make an HTTP request, passing the token in the Authorization header.
requests.get(creds.url, headers={"Authorization": f"Bearer {creds.token}"})

# You can also put the token in a `_modal_connect_token` query param.
url = f"{creds.url}/?_modal_connect_token={creds.token}"
ws_url = url.replace("https://", "wss://")
with websockets.connect(ws_url) as socket:
    socket.send("Hello world!")

sb.detach()
```

{/片段}

{#snippet javascript()}

```javascript notest
// Start a Sandbox with a server running on port 8080.
const sb = await modal.sandboxes.create(app, image, {
  command: ["bash", "-c", "python3 -m http.server 8080"],
});

// Create a connect token, optionally including arbitrary user metadata.
// Port 8080 is the default and could be omitted here.
const creds = await sb.createConnectToken({
  userMetadata: '{"user_id": "foo"}',
  port: 8080,
});

// Make an HTTP request, passing the token in the Authorization header.
const response = await fetch(creds.url, {
  headers: { Authorization: `Bearer ${creds.token}` },
});

sb.detach();
```

{/片段}

{#snippet go()}

```go notest
// Start a Sandbox with a server running on port 8080.
sb, err := mc.Sandboxes.Create(ctx, app, image, &modal.SandboxCreateParams{
	Command: []string{"bash", "-c", "python3 -m http.server 8080"},
})

// Create a connect token, optionally including arbitrary user metadata.
// Port 8080 is the default and could be omitted here.
creds, err := sb.CreateConnectToken(ctx, &modal.SandboxCreateConnectTokenParams{
	UserMetadata: `{"user_id": "foo"}`,
	Port:         8080,
})

// Make an HTTP request, passing the token in the Authorization header.
req, _ := http.NewRequestWithContext(ctx, "GET", creds.URL, nil)
req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", creds.Token))
resp, _ := http.DefaultClient.Do(req)

sb.Detach()
```

{/片段} </CodeTabs>

在容器中指定端口上运行的服务器将收到经过身份验证的
带有不可欺骗的 `X-Verified-User-Data` 标头的请求，其值为
JSON 序列化元数据作为 `user_metadata` 传递到
`create_connect_token()`。应用程序可以使用它来
例如，确定访问控制。

使用 Sandbox Connect 代币需要记住以下几点：

1. 默认情况下，请求路由到容器中的8080端口。通行证`port`
   到 `create_connect_token()` 路由到不同的端口。
2. 令牌可以在`Authorization`标头、`_modal_connect_token`中发送
   查询参数，或在 `_modal_connect_token` cookie 中。
3. 如果`_modal_connect_token`设置为查询参数，则结果响应将包含一个 `Set-Cookie` 标头，将其设置为 cookie。
4. `user_metadata`必须是JSON可序列化的并且必须小于512
   序列化后的字符。
5. `user_metadata` 被编码到连接令牌本身中，因此它
   不应包含秘密。

### 转发端口

虽然建议使用[Sandbox Connect Tokens](#connecting-to-sandboxes-with-http-and-websockets)
对于到容器的 HTTP 请求和 WebSocket 连接，您还可以公开
到互联网的原始 TCP 端口。例如，如果您想运行
沙箱内的服务器需要原始 TCP 连接并处理
身份验证本身。
使用 `Sandbox.create` 的 `encrypted_ports` 和 `unencrypted_ports` 参数
指定要转发的端口。然后您可以访问隧道的公共 URL
使用 [`Sandbox.tunnels`](/docs/sdk/py/latest/Sandbox#tunnels) 方法：

```python notest
import requests
import time

sb = modal.Sandbox.create(
    "python",
    "-m",
    "http.server",
    "12345",
    encrypted_ports=[12345],
    app=my_app,
)

tunnel = sb.tunnels()[12345]

time.sleep(1)  # Wait for server to start.

print(f"Connecting to {tunnel.url}...")
print(requests.get(tunnel.url, timeout=5).text)

sb.detach()
```

还可以通过 `h2_ports` 选项创建使用 `HTTP/2` 而不是 `HTTP/1.1` 的加密端口。这将返回
您可以向其发出 H2 (HTTP/2 + TLS) 请求的 URL。如果您想在沙箱内运行 `HTTP/2` 服务器，此功能可能很有用。
这是一个例子：

```python notest
import time

port = 4359
sb = modal.Sandbox.create(
    app=my_app,
    image=my_image,
    h2_ports=[port],
)
p = sb.exec("python", "my_http2_server.py")

tunnel = sb.tunnels()[port]
time.sleep(1)
print(f"Tunnel URL: {tunnel.url}")

sb.detach()
```

有关隧道工作原理的更多详细信息，请参阅[隧道指南](/docs/guide/tunnels)。### 自定义域

<Callout variant="gated-feature">

<a href="/pricing">团队和企业计划</a>提供了沙盒隧道的自定义域。访问<a href="/settings/plans">工作空间设置</a>进行升级。

</Callout>

<Callout variant="beta">

基础设施是生产级的，但加入需要手动设置步骤。

</Callout>

默认情况下，沙盒隧道由 `w.modal.host` 的子域提供服务。
在某些情况下，需要通过自定义域提供隧道服务
出于安全原因。这可以通过手动设置实现。

请注意，隧道自定义域与 Modal 中的其他自定义域不同。
其他自定义域使用`CNAME`转发。对于隧道，我们需要使用
`NS` 记录将域委托给 Modal 的名称服务器。

**1.将（子）域委托给 Modal 的名称服务器。**

将 `NS` 记录添加到指向 Modal 名称服务器的 DNS 区域。例如，
要使用 `sandbox.example.com`，请在您的 DNS 提供商的 DNS 提供商的记录中添加以下记录
控制面板：

|名称 |类型 |价值|
| -------------------- | ---- | -------------------- |
| `sandbox.example.com` | NS | `w-ns-a.modal.host.` |
| `sandbox.example.com` | NS | `w-ns-b.modal.host.` |
| `sandbox.example.com` | NS | `w-ns-c.modal.host.` |
| `sandbox.example.com` | NS | `w-ns-d.modal.host.` |您可以委托您喜欢的任何子域深度（例如`tunnels.a.b.c.example.com`）。

**2.要求 Modal 设置域。**

在 Slack 上联系我们并提供域名。我们将为您启用它
工作区。

**3.通过`custom_domain`到`Sandbox.create`。**

```python notest
import modal

app = modal.App.lookup("my-app", create_if_missing=True)
sb = modal.Sandbox.create(
    "python", "-m", "http.server", "8080",
    encrypted_ports=[8080],
    custom_domain="sandbox.example.com",
    app=app,
)

tunnel = sb.tunnels()[8080]
print(tunnel.url)  # https://[...].sandbox.example.com
```

Modal 将自动提供 TLS 证书。生成的沙箱连接令牌
此沙箱还将使用自定义域。

## 安全模型

沙箱构建在容器运行时 [gVisor](https://gvisor.dev/) 之上
由 Google 提供，提供强大的隔离特性。 gVisor 有自定义逻辑
防止沙箱进行恶意系统调用，为您提供更强的隔离
比大多数其他容器运行时。

此外，沙盒无权访问您的 Modal 中的其他资源
工作区的方式与模态函数的方式[默认](/docs/guide/restricted-access)相同。
因此，任何恶意代码的传播半径都将被限制在沙箱内
容器本身。