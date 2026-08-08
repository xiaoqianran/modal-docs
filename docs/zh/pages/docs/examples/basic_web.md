<!-- modal-docs: machine-translated zh-CN from English source -->

# 你好万维网！

Modal 可以轻松地将 Python 函数转变为无服务器 Web 服务：
通过浏览器访问它们或从任何使用 HTTP 的客户端调用它们，所有这些
无需担心设置服务器或管理基础设施。

本教程展示了[“到达 200 的时间”](https://shkspr.mobi/blog/2021/05/whats-your-apis-time-to-200/)最短的路径：
[`modal.fastapi_endpoint`](https://modal.com/docs/reference/modal.fastapi_endpoint)。

在 Modal 上，Web Functions 拥有 Modal Functions 的所有超能力：
它们可以[用 GPU 加速](https://modal.com/docs/guide/gpu)，
他们可以访问[秘密](https://modal.com/docs/guide/secrets)或[卷](https://modal.com/docs/guide/volumes)，
并且它们[自动缩放](https://modal.com/docs/guide/cold-start)以处理更多流量。

在底层，我们使用 [FastAPI 库](https://fastapi.tiangolo.com/)，
其中有[高质量文档](https://fastapi.tiangolo.com/tutorial/)，
贯穿本教程的链接。

## 使用单个装饰器将模态函数转换为 API 端点

当您将 `@app.function` 装饰器添加到 Python 函数时，模态函数已经可以远程访问
并运行`modal deploy`，你就可以让你的[其他Python函数调用它](https://modal.com/docs/guide/trigger-deployed-functions)。

这很好，但是如果您想与使用不同语言运行代码的人分享您编写的内容，那么这并没有多大帮助 -
或者根本不运行代码！
这就是互联网的大部分力量的来源：在不同的计算机系统之间共享信息和功能。

因此，我们提供了 `fastapi_endpoint` 装饰器来将您的模态函数包装在网络通用语言中：HTTP。
看起来是这样的：

```python
import modal

image = modal.Image.debian_slim().uv_pip_install("fastapi[standard]")
app = modal.App(name="example-basic-web", image=image)


@app.function()
@modal.fastapi_endpoint(
    docs=True  # adds interactive documentation in the browser
)
def hello():
    return "Hello world!"


```

您可以通过运行 `modal serve basic_web.py` 将此 Web 函数公开到互联网。
在输出中，您应该看到以 `hello-dev.modal.run` 结尾的 URL。
如果您导航到此 URL，您应该会在浏览器中看到 `"Hello world!"` 消息。

您还可以找到由 OpenAPI 和 Swagger 提供支持的交互式文档，
如果您将 `/docs` 添加到 URL 末尾。
通过本文档，您可以与端点进行交互，发送 HTTP 请求并接收 HTTP 响应。
欲了解更多详情，请参阅[FastAPI文档](https://fastapi.tiangolo.com/features/#automatic-docs)。

通过使用 `modal serve` 运行应用程序，您创建了一个临时端点，如果您中断终端，该端点就会消失。
这些临时端点非常适合调试——当您保存对任何依赖文件的更改时，端点将重新部署。
尝试将消息更改为其他内容，点击保存，然后在浏览器中点击刷新或重新发送
来自`/docs`或命令行的请求。您应该会看到新消息，以及终端中显示重新部署和请求的日志。

当您准备好持久部署 Web Function 时，请运行 `modal deploy basic_web.py`。
现在，即使您关闭终端或关闭计算机，您的功能也将可用。

## 将数据发送到 Web 函数

上面的函数有点愚蠢：它总是返回相同的消息。

大多数函数都需要输入才能发挥作用。有两种方法可以将数据发送到 Web 函数：

* 在 URL 中作为 [查询参数](#sending-data-in-query-parameters)
* 在 [请求正文](#sending-data-in-the-request-body) 中作为 JSON

### 在查询参数中发送数据

默认情况下，函数的参数被视为查询参数：
它们是从 URL 末尾提取的，应将它们添加到表单中
`?arg1=foo&arg2=bar`。

从Python方面来看，几乎没有什么可做的：

```python
@app.function()
@modal.fastapi_endpoint(docs=True)
def greet(user: str) -> str:
    return f"Hello {user}!"


```

如果您已经在运行 `modal serve basic_web.py`，则可以通过终端中打印的以 `greet-dev.modal.run` 结尾的 URL 来使用此功能。

我们提供 Python 类型提示来获取文档中的类型信息
[自动验证](https://fastapi.tiangolo.com/tutorial/query-params-str-validations/)。
例如，如果您直接导航到 `greet` 的 URL，您将收到详细的错误消息
表明缺少`user`参数。请导航至 `/docs` 查看如何构建请求。

您可以在[FastAPI文档](https://fastapi.tiangolo.com/tutorial/query-params/)中阅读有关查询参数的更多信息。

### 在请求正文中发送数据

对于更大、更复杂的数据，通常最好在 HTTP 请求正文中发送数据。
该正文的格式为 [JSON](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON)，
网络上最常见的数据交换格式。

要设置接受 JSON 数据的 Web 函数，请向函数添加带有 `dict` 类型提示的参数。
该参数将使用请求正文中发送的数据填充。

```python
@app.function()
@modal.fastapi_endpoint(method="POST", docs=True)
def goodbye(data: dict) -> str:
    name = data.get("name") or "world"
    return f"Goodbye {name}!"


```

请注意，我们在这里为 `method` 参数指定了 `"POST"` 值。
该参数定义函数将响应的 HTTP 请求方法，
默认为`"GET"`。
如果您在浏览器中访问 `goodbye` 功能的 URL，
你会收到 405 Method Not allowed 错误，因为浏览器默认只发送 GET 请求。
虽然这在技术上是与查询参数和请求主体不同的问题
您可以定义一个函数来接受 GET 请求并使用正文中的数据，
这是[被认为是不好的形式](https://stackoverflow.com/a/983458)。

导航至 `/docs` 了解有关如何调用该函数的更多信息。
您需要发送带有包含 `name` 键的 JSON 正文的 POST 请求。
要获得与查询参数相同的键入和验证优势，
使用[Pydantic模型](https://fastapi.tiangolo.com/tutorial/body/)
对于这个论点。

您可以在 [FastAPI 文档](https://fastapi.tiangolo.com/tutorial/body/) 中阅读有关请求正文的更多信息。

## 使用 `modal.Cls` 处理昂贵的启动

有时您的函数需要在处理第一个请求之前执行某些操作，
例如从数据库获取值或设置变量的值。
如果该步骤的成本很高，例如[加载大型 ML 模型](https://modal.com/docs/guide/model-weights)，
每次收到请求时都必须这样做真是太遗憾了！

Web Functions 可以是 [`modal.Cls`](https://modal.com/docs/guide/lifecycle-functions#container-lifecycle-functions-and-parameters) 上的方法，
它允许您独立于处理单个请求来管理容器的生命周期。

此示例仅在容器启动时设置 `start_time` 实例变量一次。

```python
@app.cls()
class WebApp:
    @modal.enter()
    def startup(self):
        from datetime import datetime, timezone

        print("🏁 Starting up!")
        self.start_time = datetime.now(timezone.utc)

    @modal.fastapi_endpoint(docs=True)
    def web(self):
        from datetime import datetime, timezone

        current_time = datetime.now(timezone.utc)
        return {"start_time": self.start_time, "current_time": current_time}


```

## 使用代理身份验证保护 Web Functions

在网络上共享 Python 函数固然很棒，但这并不总是一个好主意
使任何人都可以使用这些功能。

例如，您可能有一个如下所示的函数
运行比调用更昂贵（因此可能会被你的敌人滥用）
或透露您宁愿保守秘密的信息。

保护您的模态 Web 函数，使其不会被触发，除非
由您的[模态工作区](https://modal.com/docs/guide/workspaces) 的成员，
将 `requires_proxy_auth=True` 标志添加到 `fastapi_endpoint` 装饰器。

```python
@app.function(gpu="h100")
@modal.fastapi_endpoint(requires_proxy_auth=True, docs=False)
def expensive_secret():
    return "I didn't care for 'The Godfather'. It insists upon itself."


```

当您使用 `modal serve` 或 `modal deploy` 时，`expensive-secret` 端点 URL 仍会打印到输出中，以及“🔑”表情符号，表明它受到代理身份验证的保护。
如果您通过浏览器访问该 URL，您将得到一个
[`401 Unauthorized`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401) 响应错误代码。
您还应该检查此应用程序的仪表板页面（位于 `modal` 命令输出最顶部打印的 URL）
所以你可以看到没有容器被启动来处理请求——这个授权完全在 Modal 的基础设施内部处理。

您可以通过[创建代理身份验证令牌](https://modal.com/settings/proxy-auth-tokens)来触发Web Function
然后将令牌 ID 和密钥包含在 `Modal-Key` 和 `Modal-Secret` 标头中。

从命令行来看，这可能看起来像

```shell
export TOKEN_ID=wk-1234abcd
export TOKEN_SECRET=ws-1234abcd
curl -H "Modal-Key: $TOKEN_ID" \
     -H "Modal-Secret: $TOKEN_SECRET" \
     https://your-workspace-name--expensive-secret.modal.run
```

有关更多详细信息，请参阅
[代理认证指南](https://modal.com/docs/guide/webhook-proxy-auth)。

## 接下来怎么办？

Modal 的 `fastapi_endpoint` 装饰器是专为相对简单的 Web 应用程序而设计的——
您想要向 Web 公开的一个或几个独立的 Python 函数。

三个额外的装饰器允许您通过更好的控制来服务更复杂的 Web 应用程序：

* [`asgi_app`](https://modal.com/docs/guide/webhooks#asgi) 为符合ASGI标准的应用程序提供服务，
  像[FastAPI](https://fastapi.tiangolo.com/)
* [`wsgi_app`](https://modal.com/docs/guide/webhooks#wsgi) 为符合 WSGI 标准的应用程序提供服务，
  像[烧瓶](https://flask.palletsprojects.com/)
* [`web_server`](https://modal.com/docs/guide/webhooks#non-asgi-web-servers) 为任何侦听端口的应用程序提供服务