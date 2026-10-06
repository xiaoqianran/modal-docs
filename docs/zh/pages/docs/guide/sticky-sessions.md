<!-- modal-docs: machine-translated zh-CN from English source -->

# 粘性会话

粘性会话支持需要强容器亲和性保证的请求的[服务器](/docs/guide/servers)工作负载。这对于允许 WebSocket 连接重新连接到同一容器、支持协作编辑器、游戏以及用于语音和/或视频的多用户房间等应用程序非常有用。

然后，客户端可以在服务器容器上启动一个或多个会话。在会话的生命周期内，对会话发出的所有请求都将路由到同一个容器。会话处于活动状态，直到明确终止或在 `idle_timeout` 秒（默认情况下为 600 秒）内没有任何正在进行的请求。只要容器托管活动会话，容器就会保持活动状态，直到达到容器的最大运行时间。

相比之下，[Modal Servers](/docs/guide/servers#request-routing) 中内置的亲和性路由是尽力而为的提示：路由代理散列一个 `Modal-Routing-Affinity-Key` 标头，将请求偏向容器，但该容器仍然可以随时缩小或替换。

## 定义具有粘性会话的服务器
用户可以通过使用`@modal.sessioned()`装饰器与`@app.server()`一起向服务器添加粘性会话功能。将装饰器添加到活动服务器应用程序将开始拒绝任何没有附加会话令牌的新流量。

```python
@app.server()
@modal.sessioned()
class Server:

    @modal.enter()
    def startup(self):
        ...
```

注意：`@modal.sessioned()`只能应用于[服务器](/docs/guide/servers)。

## 启动并使用粘性会话

会话有一个生命周期，在此期间它们可以为属于它的一个或多个请求提供服务。调用 `Server.sessions.start()` 创建一个会话并将其分配给一个容器，必要时旋转一个容器，并返回一个 `session_id` 和一个会话令牌。任何携带令牌作为 `Modal-Authorization: Bearer <token>` 标头的 HTTP 请求（包括 WebSocket 握手）都会确定性地路由到该容器。

一旦达到配置的空闲超时，会话就会自然结束。也可以是
通过终止请求显式结束。终止的会话等待任何正在进行的会话
请求完成，拒绝任何新请求。

```python notest
server = modal.Server.from_name("my-app", "Server")

session_creds = server.sessions.start(idle_timeout=600)

headers = {"Modal-Authorization": f"Bearer {session_creds.token}"}
requests.get(server.get_url(), headers=headers).raise_for_status()

server.sessions.terminate(session_creds.token)
```

也可以使用原始 HTTP 请求在 SDK 外部管理会话。在下面的示例中，`PROXY_AUTH_TOKEN`是组合`wk-<id>.ws-<secret>`格式的[代理令牌](/docs/guide/webhook-proxy-auth)，`SESSION_TOKEN`是启动会话时返回的令牌：

```bash
# Start a session with a 600s idle timeout.
curl -X POST "$SERVER_URL/_modal/sessions/start" \
  -H "Authorization: Bearer $PROXY_AUTH_TOKEN" \
  -H "x-modal-server-session-idle-timeout: 600"
# Returns {"session_id": "sd-...", "token": "..."}

# Make a request to the session.
curl "$SERVER_URL/some/path" \
  -H "Modal-Authorization: Bearer $SESSION_TOKEN"

# Terminate the session early.
curl -X POST "$SERVER_URL/_modal/sessions/terminate" \
  -H "Authorization: Bearer $PROXY_AUTH_TOKEN" \
  -H "x-modal-server-session-token: $SESSION_TOKEN"
```

## 授权
启动或终止会话遵循正常的[服务器请求身份验证](/docs/guide/servers#request-authentication)。

要发出属于会话的请求，请将其会话令牌包含在 `Modal-Authorization: Bearer <token>` 标头中。不需要[代理令牌](/docs/guide/webhook-proxy-auth)。即使服务器设置了`unauthenticated=True`，也需要会话令牌。任何对会话服务器的非会话流量（即没有会话令牌的请求）都会被拒绝，此类工作负载应使用服务器。

对于浏览器客户端，请求还可以通过将令牌作为 `modal_session_token` 查询参数传递来进行身份验证。代理按顺序检查 `Modal-Authorization` 标头、查询参数或会话 cookie。使用查询参数进行身份验证的请求将被重定向到设置了会话 cookie 的同一 URL。

在将请求转发到容器之前，所有模态授权查询参数和标头都会被删除。

```bash
# On first visit: authenticate via the query parameter.
curl -i "$SERVER_URL/?modal_session_token=$SESSION_TOKEN"
# HTTP/1.1 307 Temporary Redirect
# location: <SERVER_URL>/
# set-cookie: __Host-modal-session-token=<token>; Path=/; Secure; HttpOnly; SameSite=Lax
# cache-control: no-store

# A browser follows the redirect automatically and is left with the cookie.
# subsequent requests need neither the header nor the query parameter.
curl -i "$SERVER_URL/" --cookie "__Host-modal-session-token=$SESSION_TOKEN"
# HTTP/1.1 200 OK
```

通过在升级请求之前发出引导 HTTP 请求以将查询参数令牌交换为会话 cookie，来支持 WebSocket 请求。

## 会话并发和自动缩放
带有`@modal.sessioned`装饰器的服务器还支持设置最大并发和目标并发。与分别基于[输入](/docs/guide/servers#concurrency-and-autoscaling)和[并发请求](/docs/guide/functions#autoscaling-and-parallelism)进行扩展的函数和服务器不同，会话服务器的并发单位是会话。单个容器在任何给定时间最多允许 `max_concurrency`（默认为 1000 个）活动会话。当目标并发未设置时，它默认为`max_concurrency`，超出此限制的附加会话启动请求会触发附加容器的扩展（除非达到`max_containers`）。 `max_concurrency` 每个容器的会话上限为 1000 个。

为了实现更积极的自动缩放，即使有可用空间，服务器也可以指定目标并发数，其中`0 < target_concurrency <= max_concurrency <= 1000`。

其他服务器自动缩放控制，例如还可以设置放大/缩小窗口、缓冲容器等以进行进一步调整。有关更多详细信息，请参阅[服务器并发和自动缩放](/docs/guide/servers#concurrency-and-autoscaling)。

## 排队
与对非会话服务器的请求不同，如果无法将请求路由到容器，就会立即拒绝，会话创建会排队等待最多 5 分钟的容量。排队仅适用于会话启动。