<!-- modal-docs: machine-translated zh-CN from English source -->

# 请求超时

Web 功能请求应该快速完成，最好在一段时间内完成
几秒钟。所有 Web 功能类型
([`modal.fastapi_endpoint`](/docs/sdk/py/latest/fastapi_endpoint),
[`modal.asgi_app`](/docs/sdk/py/latest/asgi_app),
[`modal.wsgi_app`](/docs/sdk/py/latest/wsgi_app),
和 [`modal.web_server`](/docs/sdk/py/latest/web_server))
强制执行 150 秒的最大 HTTP 请求超时。然而，
底层模态函数可以有更长的[超时](/docs/guide/timeouts)。

如果该函数需要超过 150 秒才能完成，HTTP 状态 303
返回重定向响应，指向带有特殊查询的原始 URL
链接该请求的参数。这是您的函数的*结果 URL*。
大多数网络浏览器允许最多 20 个此类重定向，有效地允许最多
对于 Web Functions，请求超时前需要 50 分钟（20 \* 150 秒）。

（**注意：** 这不适用于需要
[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)，自从
您的代码不会及时返回响应，服务器无法响应
填充 CORS 标头。）

某些库和工具可能需要您添加标志或选项才能
自动遵循重定向，例如`curl -L ...` 或 `http --follow ...`。
*结果 URL* 可以重新加载，而不会触发新的请求。它会阻塞
直到请求完成。

（**注：** 截至 2025 年 3 月，Python 标准库的 `urllib` 模块具有
默认情况下，任何单个 URL 的最大重定向数设置为 4（[来源](https://github.com/python/cpython/blob/main/Lib/urllib/request.py)），这会将总超时限制为 12.5 分钟（5 \* 150 s = 750 s），除非覆盖此设置。）

## 轮询解决方案

有时，能够轮询结果而不是等待结果会很有用
长时间运行的 HTTP 请求。最简单的方法就是让您的网络
端点产生一个 `modal.Function` 调用并返回函数调用 id
另一个端点可用于轮询已提交函数的状态。这是一个
示例：

```python
import fastapi

import modal


image = modal.Image.debian_slim().pip_install("fastapi[standard]")
app = modal.App(image=image)

web_app = fastapi.FastAPI()


@app.function()
@modal.asgi_app()
def fastapi_app():
    return web_app


@app.function()
def slow_operation():
    ...


@web_app.post("/accept")
async def accept_job(request: fastapi.Request):
    call = slow_operation.spawn()
    return {"call_id": call.object_id}


@web_app.get("/result/{call_id}")
async def poll_results(call_id: str):
    function_call = modal.FunctionCall.from_id(call_id)
    try:
        return function_call.get(timeout=0)
    except TimeoutError:
        http_accepted_code = 202
        return fastapi.responses.JSONResponse({}, status_code=http_accepted_code)
```

[*Document OCR Web App*](/docs/examples/doc_ocr_webapp) 是一个使用
这个图案。