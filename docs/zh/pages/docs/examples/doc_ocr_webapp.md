<!-- modal-docs: machine-translated zh-CN from English source -->

# 提供一个收据解析网络应用程序

本教程向您展示如何使用 Modal 部署完全无服务器
[React](https://reactjs.org/) + [FastAPI](https://fastapi.tiangolo.com/) 应用程序。

我们将构建一个简单的“收据解析器”Web 应用程序来提交文档解析
任务发送到[另一个示例](https://modal.com/docs/examples/doc_ocr_jobs)中定义的单独模态应用程序，
轮询直到任务完成，并显示
结果。亲自尝试一下
[这里](https://modal-labs-examples--example-doc-ocr-webapp-wrapper.modal.run/)。

它应该看起来像这样：

[![Web应用程序前端](https://modal-cdn.com/doc_ocr_frontend.jpg)](https://modal-labs-examples--example-doc-ocr-webapp-wrapper.modal.run/)

## 基本设置

让我们摆脱导入并定义一个 [`App`](https://modal.com/docs/reference/modal.App)。

```python
from pathlib import Path

import fastapi
import fastapi.staticfiles
import modal

app = modal.App("example-doc-ocr-webapp")

```Modal 可与任何 [ASGI](https://modal.com/docs/guide/webhooks#serving-asgi-and-wsgi-apps) 或
[WSGI](https://modal.com/docs/guide/webhooks#wsgi) Web 框架。这里，我们选择使用[FastAPI](https://fastapi.tiangolo.com/)。

```python
web_app = fastapi.FastAPI()

```

## 定义端点

我们需要两个端点：一个用于接受图像并将其提交到 Modal 作业队列，
另一个用于轮询工作结果。

在`parse`中，我们将把任务提交给[Job]中定义的Function
队列教程](https://modal.com/docs/examples/doc_ocr_jobs)，所以我们先使用
[`Function.lookup`](https://modal.com/docs/reference/modal.Function#lookup)。

我们在函数句柄上调用 [`.spawn()`](https://modal.com/docs/reference/modal.Function#spawn)
我们在上面导入以启动我们的函数而不阻塞结果。 `spawn`回归
函数调用的唯一 ID，然后我们使用它
轮询其结果。

```python
@web_app.post("/parse")
async def parse(request: fastapi.Request):
    parse_receipt = modal.Function.from_name("example-doc-ocr-jobs", "parse_document")

    form = await request.form()
    receipt = await form["receipt"].read()  # type: ignore
    call = parse_receipt.spawn(receipt)
    return {"call_id": call.object_id}


```
`/result` 使用提供的 `call_id` 实例化 `modal.FunctionCall` 对象，并尝试
得到它的结果。如果调用尚未完成，我们返回`202`状态码，表示
服务器仍在工作。

```python
@web_app.get("/result/{call_id}")
async def poll_results(call_id: str):
    function_call = modal.functions.FunctionCall.from_id(call_id)
    try:
        result = await function_call.get.aio(timeout=0)
    except TimeoutError:
        return fastapi.responses.JSONResponse(content="", status_code=202)

    return result


```

现在我们已经定义了端点，我们准备在 Modal 上托管它们。
首先，我们指定我们的依赖项——这里是一个基本的 Debian Linux
安装了 FastAPI 的环境。

```python
image = modal.Image.debian_slim(python_version="3.12").uv_pip_install(
    "fastapi[standard]==0.115.4"
)

```

然后，我们为前端添加静态文件。我们做了[一个简单的 React
应用程序](https://github.com/modal-labs/modal-examples/tree/main/09_job_queues/doc_ocr_frontend)
到达上面定义的两个端点。为了将这些文件打包到我们的应用程序中，我们使用`add_local_dir` 与资源的本地目录，并指定我们想要它们
在我们容器内的`/assets`目录中（`remote_path`）。然后，我们指示 FastAPI [服务
这个静态文件目录](https://fastapi.tiangolo.com/tutorial/static-files/)位于我们的根路径。

```python
local_assets_path = Path(__file__).parent / "doc_ocr_frontend"
image = image.add_local_dir(local_assets_path, remote_path="/assets")

```

我们通过 FastAPI 应用程序为它们提供服务，名称为 `StaticFiles`。

要将我们的 FastAPI 应用程序放在 Modal 上，我们需要从 Python 函数返回它
它被一些额外的装饰器包裹着：

* [`modal.asgi_app`](https://modal.com/docs/reference/modal.asgi_app)
  确保 Modal 系统知道将网络流量路由到它（以及以什么格式）
* [`modal.concurrent`](https://modal.com/docs/reference/modal.concurrent)
  允许同时处理多个请求（例如样式表和 HTML）
* [`app.function`](https://modal.com/docs/reference/modal.App#function)
  将我们的 Python 函数转换为模态函数并定义它所需的基础设施
  （这里，只是依赖项）。

```python
@app.function(image=image)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def wrapper():
    web_app.mount("/", fastapi.staticfiles.StaticFiles(directory="/assets", html=True))
    return web_app


```

## 运行

在开发时，您可以通过执行命令将其作为临时应用程序运行

```shell
modal serve doc_ocr_webapp.py
```

如果成功，这将打印您的应用程序的 URL，您可以在其中导航到该 URL
您的浏览器🎉。

结果应该是这样的：

[![Web应用程序前端](https://modal-cdn.com/doc_ocr_frontend.jpg)](https://modal-labs-examples--example-doc-ocr-webapp-wrapper.modal.run/)

Modal 会监视所有已安装的文件，并在发生任何变化时更新应用程序。
请参阅[这些文档](https://modal.com/docs/guide/webhooks#developing-with-modal-serve)
了解更多详情。

## 部署

要部署您的应用程序，请运行

```shell
modal deploy doc_ocr_webapp.py
```

仅此而已！