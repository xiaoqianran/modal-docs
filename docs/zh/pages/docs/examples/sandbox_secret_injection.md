<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用出站策略将机密注入沙盒 HTTPS 请求

[沙箱](https://modal.com/docs/guide/sandboxes)常用于代理
它将运行不受信任的代码。沙盒提供了很好的安全边界
包含不受信任的代码，但代理可能需要访问某些外部
通过网络调用 API 来完成有用的工作。如果 API 需要 API 令牌
对于授权，我们可能不愿意将其交给运行在
沙箱，因为它可能决定将其渗透并将其发送给某人
不应该有权访问令牌。

【出境政策】(https://modal.com/docs/guide/sandbox-secret-injection)
通过将标头注入*外部*的出站 HTTPS 请求来解决此问题
沙盒。这个秘密永远不会出现在沙盒环境中，但我们可以
仍然对我们的 API 进行授权调用。

此示例代表部署了模拟天气 API 的外部 API
作为模态 [Web 函数](https://modal.com/docs/guide/webhooks)。它需要
`Authorization: Bearer <key>` 标头，沙箱工作负载永远不会
看到了。

```python
import hmac
import os
import textwrap
from urllib.parse import urlparse

import fastapi
import modal
import modal.experimental

app = modal.App.lookup("example-sandbox-outbound-policy", create_if_missing=True)

MINUTES = 60  # seconds

```

## 部署模拟认证 API

作为外部经过身份验证的 API 的替代品，我们部署了一个小型 Web
根据存储在 a 中的值检查 `Authorization` 标头的函数
模态[秘密](https://modal.com/docs/guide/secrets)。
请注意，这不是有关网络安全的教程。这不是一个生产
等级授权方案，请不要这样对待。

```python
SECRET_NAME = "example-outbound-policy-api-key"
API_KEY = "hunter2"
modal.Secret.objects.create(SECRET_NAME, {"API_KEY": API_KEY}, allow_existing=True)
api_secret = modal.Secret.from_name(SECRET_NAME, required_keys=["API_KEY"])


web_app = modal.App("example-outbound-policy-api")
web_image = modal.Image.debian_slim().uv_pip_install("fastapi[standard]==0.139.2")


@web_app.function(image=web_image, secrets=[api_secret], serialized=True)
@modal.fastapi_endpoint()
def weather(request: fastapi.Request):
    expected = os.environ["API_KEY"]
    auth = request.headers.get("authorization", "")
    if not hmac.compare_digest(auth, f"Bearer {expected}"):
        raise fastapi.HTTPException(status_code=401, detail="unauthorized")

    response = {
        "city": request.query_params.get("city", "Tokyo"),
        "temperature_c": 21,
        "conditions": "sunny",
    }
    return response


with modal.enable_output():
    web_app.deploy()
    image = modal.Image.debian_slim().build(app)

api_url = weather.get_web_url()
if not api_url:
    raise RuntimeError("expected a web URL for the weather endpoint")
api_host = urlparse(api_url).hostname

```

## 定义出站策略

我们可以定义一个带有标头替换的出站策略，该标头替换使用
使用 API 密钥提供机密，并将其注入到来自某个服务器的传出 HTTPS 请求中
沙盒。我们将替换范围限制为单个域，这样就不会泄漏
对可能从沙箱内调用的其他服务的秘密。

```python
outbound_policy = modal.experimental.OutboundPolicy().with_header_replacement(
    domain=api_host,
    secret=api_secret,
    headers={"Authorization": "Bearer $API_KEY"},
)

```

## 创建沙箱并调用API

我们创建一个使用出站策略的沙箱。我们可以使用以下方式调用 API
来自沙盒的 Python 发出简单的 HTTPS 请求。请注意，我们不
在这里附加任何标题。

```python
sb = modal.Sandbox.create(
    "sleep",
    str(5 * MINUTES),
    app=app,
    image=image,
    _experimental_outbound_policy=outbound_policy,
)


def call_api() -> tuple[str, str]:
    script = textwrap.dedent(f"""
        import http.client

        client = http.client.HTTPSConnection({api_host!r})
        client.request('GET', '/?city=Tokyo')
        response = client.getresponse()
        print(response.status)
        print(response.read().decode())
    """)
    p = sb.exec("python", "-c", script)
    p.wait()
    status, _, body = p.stdout.read().partition("\n")
    return status.strip(), body


status, body = call_api()
print(body)

```

我们断言 API 接受了调用。如果没有出境政策，这
会返回 401。

```python
assert status == "200", body
assert "temperature_c" in body

```

与此同时，沙盒环境中的关键并不存在：

```python
p = sb.exec("printenv")
p.wait()
assert API_KEY not in p.stdout.read()

```

## 清理

```python
sb.terminate()

```