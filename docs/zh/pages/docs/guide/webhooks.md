<!-- modal-docs: machine-translated zh-CN from English source -->

# 网络功能

本指南介绍了如何使用 Modal 设置 Web Functions。

所有部署的模态函数都可以[从任何其他 Python 应用程序调用](/docs/guide/trigger-deployed-functions)
使用模态客户端库。我们还提供多种公开方式
您通过网络为非 Python 客户端提供的 Functions。

您可以用一行代码[将任何 Python 函数转换为 Web 函数](#simple-endpoints)
的代码，您可以使用[提供完整的应用程序](#serving-asgi-and-wsgi-apps)
FastAPI、Django 或 Flask 等框架，或者您也可以
[提供任何使用 HTTP 并侦听端口的服务](#non-asgi-web-servers)。

下面我们将介绍每种方法，假设您熟悉 Modal 之外的 Web 应用程序。
有关 Modal 上基本 Web 功能的详细演练，旨在帮助刚接触 Web 应用程序的开发人员，
请参阅[本教程](/docs/examples/basic_web)。

## 简单端点

使 Python 函数可通过网络寻址的最简单方法是使用
[`@modal.fastapi_endpoint`装饰器](/docs/sdk/py/latest/fastapi_endpoint):

```python
image = modal.Image.debian_slim().pip_install("fastapi[standard]")


@app.function(image=image)
@modal.fastapi_endpoint()
def f():
    return "Hello world!"
```

该装饰器将模态函数包装在
[FastAPI 应用程序](#how-do-web-functions-run-in-the-cloud)。
*注意：在 v0.73.82 之前，此函数被命名为 `@modal.web_endpoint`*。

### 使用 `modal serve` 进行开发

您可以通过运行以下命令将此代码作为临时应用程序运行

```shell
modal serve server_script.py
```

其中 `server_script.py` 是代码的文件名。这将创建一个
脚本运行期间的临时应用程序（直到您按 Ctrl-C 停止它）。
它创建一个临时 URL，您可以像任何其他 REST 端点一样使用该 URL。这个
URL 位于公共互联网上。

当任何支持的应用程序时，`modal serve`命令将实时更新应用程序
文件发生变化。

在使用包含 Web 的应用程序时，实时更新特别有用
端点，因为对 Web 函数处理程序所做的任何更改几乎都会显示出来
立即，无需手动重新启动应用程序。

### 使用 `modal deploy` 进行部署

您还可以部署您的应用程序并在云中创建持久的Web Function
通过运行`modal deploy`：

<Asciinema recordingId="jYpIj1nL6JI9cw4W77GV2l5Wl" />

### 传递参数

使用`@modal.fastapi_endpoint`时，可以添加
[查询参数](https://fastapi.tiangolo.com/tutorial/query-params/) 其中
将作为参数传递给您的函数。例如

```python
image = modal.Image.debian_slim().pip_install("fastapi[standard]")


@app.function(image=image)
@modal.fastapi_endpoint()
def square(x: int):
    return {"square": x**2}
```

如果您使用包含 `x` 参数的 URL 编码查询字符串来点击此按钮，
该函数将接收该值作为参数：

```
$ curl https://modal-labs--web-function-square-dev.modal.run?x=42
{"square":1764}
```
如果您想使用 `POST` 请求，可以使用 `method` 参数
`@modal.fastapi_endpoint` 设置 HTTP 谓词。要接受任何有效的 JSON 对象，
[使用 `dict` 作为类型注释](https://fastapi.tiangolo.com/tutorial/body-nested-models/?h=dict#bodies-of-arbitrary-dicts)
FastAPI 将处理剩下的事情。

```python
image = modal.Image.debian_slim().pip_install("fastapi[standard]")


@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def square(item: dict):
    return {"square": item['x']**2}
```

这将创建一个采用 JSON 主体的端点：

```
$ curl -X POST -H 'Content-Type: application/json' --data-binary '{"x": 42}' https://modal-labs--web-function-square-dev.modal.run
{"square":1764}
```

这通常是最简单的入门方法，但请注意 FastAPI 建议
你使用的
[键入 Pydantic 模型](https://fastapi.tiangolo.com/tutorial/body/) 以便
获得自动验证和文档。 FastAPI 还允许您将数据传递给
以其他方式实现 Web 功能，例如
[表格数据](https://fastapi.tiangolo.com/tutorial/request-forms/) 和
[文件上传](https://fastapi.tiangolo.com/tutorial/request-files/)。

## Web Functions 如何在云端运行？

请注意，Web 函数与 Modal 上的其他所有内容一样，仅在需要时运行
到。当你第一次点击 URL 时，它将启动容器，
这可能需要几秒钟。 Modal 使容器保持短暂的存活状态
期间，以防有后续请求。如果有很多要求的话
Modal 可能会扩展更多并行运行的容器。

对于快捷方式 `@modal.fastapi_endpoint` 装饰器，Modal 将您的函数包装在
[FastAPI](https://fastapi.tiangolo.com/)应用程序。这意味着
[图片](/docs/guide/images)
您的函数使用的必须安装了 FastAPI，并且您编写的函数
需要遵循其请求和响应
[语义](https://fastapi.tiangolo.com/tutorial)。网络功能可以使用
FastAPI 的所有强大功能，例如用于自动验证的 Pydantic 模型，
输入的查询和路径参数以及响应类型。

这是所有内容，结合了 Modal 运行函数的能力
具有 FastAPI 表达能力的用户定义容器：

```python
import modal
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

image = modal.Image.debian_slim().pip_install("fastapi[standard]", "boto3")
app = modal.App(image=image)


class Item(BaseModel):
    name: str
    qty: int = 42


@app.function()
@modal.fastapi_endpoint(method="POST")
def f(item: Item):
    import boto3
    # do things with boto3...
    return HTMLResponse(f"<html>Hello, {item.name}!</html>")
```

这个函数的调用方式如下：

```bash
curl -d '{"name": "Erik", "qty": 10}' \
    -H "Content-Type: application/json" \
    -X POST https://ecorp--web-demo-f-dev.modal.run
```

或者在 Python 中使用 [`requests`](https://pypi.org/project/requests/) 库：

```python
import requests

data = {"name": "Erik", "qty": 10}
requests.post("https://ecorp--web-demo-f-dev.modal.run", json=data, timeout=10.0)
```

## 为 ASGI 和 WSGI 应用程序提供服务

您还可以提供任何用以下语言编写的应用程序
[ASGI](https://asgi.readthedocs.io/en/latest/) 或
[WSGI](https://en.wikipedia.org/wiki/Web_Server_Gateway_Interface)-兼容
Modal 上的 Web 框架。

ASGI 提供对异步 Web 框架的支持。 WSGI 提供支持
同步网络框架。

### ASGI 应用程序 - FastAPI、FastHTML、Starlette

对于 ASGI 应用程序，您可以创建一个用以下修饰的函数
[`@modal.asgi_app`](/docs/sdk/py/latest/asgi_app) 返回对
您的网络应用程序：

```python
image = modal.Image.debian_slim().pip_install("fastapi[standard]")

@app.function(image=image)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, Request

    web_app = FastAPI()


    @web_app.post("/echo")
    async def echo(request: Request):
        body = await request.json()
        return body

    return web_app
```

现在，和以前一样，当您将此脚本部署为模态应用程序时，您将获得一个 URL
您可以点击的应用程序：

<Asciinema recordingId="fNSKPUK5hiiFgQEx0pDaMCYBg" />

`@modal.concurrent` 装饰器支持单个容器
利用异步的优势一次处理多个输入
ASGI 应用程序中的事件循环。请参阅[本指南](/docs/guide/concurrent-inputs)
了解详情。

#### ASGI 寿命

虽然我们建议使用 [`@modal.enter`](https://modal.com/docs/guide/lifecycle-functions#enter) 来定义容器生命周期挂钩，但我们也支持 [ASGI 生命周期协议](https://asgi.readthedocs.io/en/latest/specs/lifespan.html)。生命周期从容器启动时开始，通常是在第一次请求时。这是使用 [FastAPI](https://fastapi.tiangolo.com/advanced/events/#lifespan) 的示例：

```python
import modal

app = modal.App("fastapi-lifespan-app")

image = modal.Image.debian_slim().pip_install("fastapi[standard]")

@app.function(image=image)
@modal.asgi_app()
def fastapi_app_with_lifespan():
    from fastapi import FastAPI, Request

    def lifespan(wapp: FastAPI):
        print("Starting")
        yield
        print("Shutting down")

    web_app = FastAPI(lifespan=lifespan)

    @web_app.get("/")
    async def hello(request: Request):
        return "hello"

    return web_app
```

### WSGI 应用程序 - Django、Flask

您可以使用以下方式提供 WSGI 应用程序
[`@modal.wsgi_app`](/docs/sdk/py/latest/wsgi_app) 装饰器：

```python
image = modal.Image.debian_slim().pip_install("flask")


@app.function(image=image)
@modal.concurrent(max_inputs=100)
@modal.wsgi_app()
def flask_app():
    from flask import Flask, request

    web_app = Flask(__name__)


    @web_app.post("/echo")
    def echo():
        return request.json

    return web_app
```请参阅[Flask 文档](https://flask.palletsprojects.com/en/2.1.x/deploying/asgi/)
有关使用 Flask 作为 WSGI 应用程序的更多信息。

由于 WSGI 应用程序是同步的，因此并发输入将在单独的服务器上运行
线程。有关详细信息，请参阅[本指南](/docs/guide/concurrent-inputs)。

## 非 ASGI Web 服务器

并非所有 Web 框架都提供 ASGI 或 WSGI 接口。例如，
[`aiohttp`](https://docs.aiohttp.org/) 和 [`tornado`](https://www.tornadoweb.org/)
使用他们自己的异步网络绑定，而其他人则喜欢
[`text-generation-inference`](https://github.com/huggingface/text-generation-inference)
实际上公开了一个作为子进程运行的基于 Rust 的 HTTP 服务器。

对于这些情况，您可以使用
[`@modal.web_server`](/docs/sdk/py/latest/web_server) 装饰器“暴露”
容器上的端口：
```python
@app.function()
@modal.concurrent(max_inputs=100)
@modal.web_server(8000)
def my_file_server():
    import subprocess
    subprocess.Popen("python -m http.server -d / 8000", shell=True)
```

就像 Modal 上的所有函数一样，这只是按需运行。函数是
在容器启动时执行，在根目录创建文件服务器。
当您点击 URL 时，您的请求将被路由到正在侦听的文件服务器
港口`8000`。

对于 `@modal.web_server` 函数，您需要确保应用程序绑定到
外部网络接口，而不仅仅是本地主机。这通常意味着绑定
到`0.0.0.0`而不是`127.0.0.1`。

例如，请参阅我们如何提供服务 [Streamlit](/docs/examples/serve_streamlit) 的示例以及
模态上的 [vLLM](/docs/examples/vllm_inference)。

## 通过参数化函数提供多种配置

在 Modal 上启动 ASGI/WSGI 应用程序或 Web 服务器的 Python 函数
不能接受争论。

允许客户端配置的一种简单模式是使用
[参数化函数](/docs/guide/parametrized-functions)。各有不同
参数值的选择将创建一个独特的自动缩放
容器池。

```python
@app.cls()
@modal.concurrent(max_inputs=100)
class Server:
    root: str = modal.parameter(default=".")

    @modal.web_server(8000)
    def files(self):
        import subprocess
        subprocess.Popen(f"python -m http.server -d {self.root} 8000", shell=True)
```

这些值在 URL 中作为查询参数提供：

```bash
curl https://ecorp--server-files.modal.run		# use the default value
curl https://ecorp--server-files.modal.run?root=.cache  # use a different value
curl https://ecorp--server-files.modal.run?root=%2F	# don't forget to URL encode!
```

有关详细信息，请参阅[参数化函数指南](/docs/guide/parametrized-functions)。

## WebSockets
带有`@modal.web_server`、`@modal.asgi_app`或`@modal.wsgi_app`注释的函数也支持
WebSocket 协议。请咨询您的 Web 框架以获取适当的文档
关于如何将 WebSockets 与该库一起使用。

Modal 上的 WebSockets 为每个连接维护一个函数调用，这可以是
对于保持状态很有用。大多数时候，您需要设置您的
处理函数[允许并发输入](/docs/guide/concurrent-inputs)，
它允许同时处理多个 WebSocket 连接
同一个容器。

我们支持完整的 WebSocket 协议
[RFC 6455](https://www.rfc-editor.org/rfc/rfc6455)，但我们还没有
支持 [RFC 8441](https://www.rfc-editor.org/rfc/rfc8441)（基于 WebSockets
HTTP/2) 或 [RFC 7692](https://datatracker.ietf.org/doc/html/rfc7692)
（`permessage-deflate`扩展）。每条 WebSocket 消息最大可达 2 MiB。

## 性能和扩展

如果 Web Function 收到请求时没有活动容器，它将
体验“冷启动”。请查阅指南页面
[冷启动性能](/docs/guide/cold-start) 了解有关何时的更多信息
功能将冷启动并建议如何减轻影响。

如果您的函数使用`@modal.concurrent`，则对同一个函数进行多个请求
URL 可以由同一个容器处理。超出此限制，需额外
容器将启动以水平扩展您的应用程序。当您到达
函数对容器的限制，请求将排队等待处理。

Modal 上的每个工作区对总操作都有速率限制。对于新帐户，
这被设置为每秒 200 个函数调用或 HTTP 请求，其中
突发倍数为 5 秒。如果达到速率限制，超出的请求将返回
[429状态码](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429),
您需要与我们[联系](mailto:support@modal.com)
提高限制。

Web Function 请求正文最大可达 4 GiB，其响应正文为
大小不受限制。

## 身份验证

Modal 通过 [代理] 提供一流的 Web 功能保护
代币](https://modal.com/docs/guide/webhook-proxy-auth)。代理代币
通过要求传入密钥和秘密组合来保护 Web Functions
`Modal-Key` 和 `Modal-Secret` 标头。 Modal 作为代理，拒绝
未经授权访问您的端点的请求。

我们还支持保护 Web 服务器安全的传统技术。

### 基于令牌的身份验证

无论您使用哪种框架，这都很容易实现。例如，如果
当您在 FastAPI 中使用 `@modal.fastapi_endpoint` 或 `@modal.asgi_app` 时，您
可以像这样验证 Bearer 令牌：

```python
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import modal

image = modal.Image.debian_slim().pip_install("fastapi[standard]")
app = modal.App("auth-example", image=image)

auth_scheme = HTTPBearer()


@app.function(secrets=[modal.Secret.from_name("my-web-auth-token")])
@modal.fastapi_endpoint()
async def f(request: Request, token: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    import os

    print(os.environ["AUTH_TOKEN"])

    if token.credentials != os.environ["AUTH_TOKEN"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Function body
    return "success!"
```
这假设您有一个名为的 [Modal Secret](https://modal.com/secrets)
已创建`my-web-auth-token`，内容为`{AUTH_TOKEN: secret-random-token}`。
现在，URL 将返回 401 状态代码，除非您使用
正确的 `Authorization` 标头集（请注意，您必须在令牌前添加前缀
`Bearer `):

```bash
curl --header "Authorization: Bearer secret-random-token" https://modal-labs--auth-example-f.modal.run
```

### 客户端IP地址

您可以访问发出请求的客户端的 IP 地址。这个可以用
用于地理位置、白名单、黑名单和速率限制。

```python
from fastapi import Request

import modal

image = modal.Image.debian_slim().pip_install("fastapi[standard]")
app = modal.App(image=image)


@app.function()
@modal.fastapi_endpoint()
def get_ip_address(request: Request):
    return f"Your IP address is {request.client.host}"
```