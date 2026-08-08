<!-- modal-docs: machine-translated zh-CN from English source -->

# 代理令牌

使用代理令牌防止未经授权的客户端访问您的[端点](/docs/guide/endpoints)、[服务器](/docs/guide/servers) 和[Web Functions](/docs/guide/webhooks)。代理令牌可以在 [仪表板设置](/settings/proxy-auth-tokens) 中或使用 [`modal workspace proxy-tokens`](/docs/cli/latest/workspace#modal-workspace-proxy-tokens) CLI 创建。

## 认证模型

默认情况下，端点和服务器需要身份验证。要接受公共流量，请将 `--unauthenticated` 传递给 `modal endpoint create` 或在 [`@app.server()`](/docs/sdk/py/latest/App#server) 装饰器中设置 `unauthenticated=True`：

```python notest
@app.server()
class Private:
    ...


@app.server(unauthenticated=True)
class Public:
    ...
```相比之下，Web Functions 默认情况下是**公开可用的**。通过在 [`fastapi_endpoint`](/docs/sdk/py/latest/fastapi_endpoint)、[`asgi_app`](/docs/sdk/py/latest/asgi_app)、[`wsgi_app`](/docs/sdk/py/latest/wsgi_app) 中设置 `requires_proxy_auth=True` 启用身份验证，或[`web_server`](/docs/sdk/py/latest/web_server) 装饰器：

```python
@app.function()
@modal.fastapi_endpoint()
def public():
    return "hello world"


@app.function()
@modal.fastapi_endpoint(requires_proxy_auth=True)
def private():
    return "hello friend"
```

`public` 端点可以被互联网上的任何客户端访问：

```bash
curl https://public-url--goes-here.modal.run
```

`private`端点不能：

```bash
curl --fail-with-body https://private-url--goes-here.modal.run
# modal-http: missing credentials for proxy authorization
# curl: (22) The requested URL returned error: 401
# https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
```

## 验证请求

代理令牌由令牌 ID / 令牌秘密对组成。通过在 HTTP 标头中传递该对来验证请求。它们可以作为单独的 `Modal-Key` 和 `Modal-Secret` 标头发送：

```bash
export TOKEN_ID=wk-1234abcd
export TOKEN_SECRET=ws-1234abcd
curl -H "Modal-Key: $TOKEN_ID" \
     -H "Modal-Secret: $TOKEN_SECRET" \
     https://private-url--goes-here.modal.run
```
或者，它们可以与句点 (`.`) 连接并作为单个 `Authorization: Bearer` 标头传递：

```bash
export TOKEN_ID=wk-1234abcd
export TOKEN_SECRET=ws-1234abcd
curl -H "Authorization: Bearer $TOKEN_ID.$TOKEN_SECRET" \
     https://private-url--goes-here.modal.run
```

这与 OpenAI API 使用的方案 (`Authorization: Bearer <api-key>`) 相同，因此组合值可以用作任何 OpenAI 兼容客户端或网关中的 API 密钥。

## 环境范围

在启用 RBAC 的工作区上，令牌的范围仅限于特定环境。有关更多信息，请参阅 [RBAC 指南](/docs/guide/rbac#proxy-tokens)。