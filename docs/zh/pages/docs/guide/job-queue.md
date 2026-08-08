<!-- modal-docs: machine-translated zh-CN from English source -->

# 作业处理

Modal可以作为一个可扩展的作业队列来处理提交的异步任务
来自 Web 应用程序或任何其他 Python 应用程序。这允许您卸载多达 100 万个
将长时间运行或资源密集型任务转移到 Modal，而您的主应用程序
保持响应。

## 使用 .spawn() 创建作业

使用 Modal 作为作业队列的基本模式涉及三个关键步骤：

1. 使用`modal deploy`定义并部署作业处理功能。
2. 使用提交作业
   [`modal.Function.spawn()`](/docs/sdk/py/latest/Function#spawn)
3. 使用轮询作业结果[`modal.FunctionCall.get()`](/docs/sdk/py/latest/FunctionCall#get)

这是一个可以使用 `modal run my_job_queue.py` 运行的简单示例：

```python
# my_job_queue.py
import modal

app = modal.App("my-job-queue")

@app.function()
def process_job(data):
    # Perform the job processing here
    return {"result": data}

def submit_job(data):
    # Since the `process_job` function is deployed, need to first look it up
    process_job = modal.Function.from_name("my-job-queue", "process_job")
    call = process_job.spawn(data)
    return call.object_id

def get_job_result(call_id):
    function_call = modal.FunctionCall.from_id(call_id)
    try:
        result = function_call.get(timeout=5)
    except modal.exception.OutputExpiredError:
        result = {"result": "expired"}
    except TimeoutError:
        result = {"result": "pending"}
    return result

@app.local_entrypoint()
def main():
    data = "my-data"

    # Submit the job to Modal
    call_id = submit_job(data)
    print(get_job_result(call_id))
```

在这个例子中：

* `process_job` 是执行实际作业处理的模态函数。
  要在 Modal 上部署 `process_job` 功能，请运行
  `modal deploy my_job_queue.py`。
* `submit_job` 通过首先查找部署的 `process_job` 来提交新作业
  函数，然后使用作业数据调用`.spawn()`。它返回唯一的 ID
  生成的函数调用。
* `get_job_result` 尝试检索先前提交的作业的结果
  使用 [`FunctionCall.from_id()`](/docs/sdk/py/latest/FunctionCall#from_id) 和
  [`FunctionCall.get()`](/docs/sdk/py/latest/FunctionCall#get)。
[`FunctionCall.get()`](/docs/sdk/py/latest/FunctionCall#get) 无限期等待
  默认情况下。它需要一个可选的超时参数来指定最大超时时间
  等待的秒数，可以设置为 0 以轮询输出
  立即。在这里，如果作业尚未完成，我们将返回一个待处理的
  回应。
* `.spawn()` 的结果可通过 `FunctionCall.get()` 访问，最多可达
  完成后7天。在此期限之后，我们将返回过期的响应。

[文档 OCR Web 应用程序](/docs/examples/doc_ocr_webapp) 是一个使用
这个图案。

## 与 Web 框架集成

您可以轻松地将作业队列模式与 FastAPI 等 Web 框架集成。
这是一个示例，假设您已经部署了 `process_job`
带有 `modal deploy` 的莫代尔如上所述。如果您没有，这个例子将不起作用
尚未部署您的应用程序。

```python
# my_job_queue_endpoint.py
import modal

image = modal.Image.debian_slim().pip_install("fastapi[standard]")
app = modal.App("fastapi-modal", image=image)


@app.function()
@modal.asgi_app()
@modal.concurrent(max_inputs=20)
def fastapi_app():
    from fastapi import FastAPI

    web_app = FastAPI()

    @web_app.post("/submit")
    async def submit_job_endpoint(data):
        process_job = modal.Function.from_name("my-job-queue", "process_job")

        call = await process_job.spawn.aio(data)
        return {"call_id": call.object_id}


    @web_app.get("/result/{call_id}")
    async def get_job_result_endpoint(call_id: str):
        function_call = modal.FunctionCall.from_id(call_id)
        try:
            result = await function_call.get.aio(timeout=0)
        except modal.exception.OutputExpiredError:
            return fastapi.responses.JSONResponse(content="", status_code=404)
        except TimeoutError:
            return fastapi.responses.JSONResponse(content="", status_code=202)

        return result

    return web_app
```

在这个例子中：

* `/submit`端点接受作业数据，使用提交新作业
  `await process_job.spawn.aio()`，并将作业的ID返回给客户端。
* `/result/{call_id}`端点允许客户端轮询作业的
  使用作业 ID 的结果。如果作业尚未完成，则返回 202
  状态代码指示作业仍在处理中。如果工作
过期后，它会返回 404 状态代码以指示未找到该作业。

您可以通过使用 `modal serve` 来尝试此应用程序：

```shell
modal serve my_job_queue_endpoint.py
```

然后通过 `curl` 与其端点交互：

```shell
# Make a POST request to your app endpoint with.
$ curl -X POST $YOUR_APP_ENDPOINT/submit?data=data
{"call_id":"fc-XXX"}

# Use the call_id value from above.
$ curl -X GET $YOUR_APP_ENDPOINT/result/fc-XXX
```

## 扩展性和可靠性

Modal 根据工作负载自动扩展作业队列，启动新的作业队列
根据需要同时处理作业的实例。它还提供内置
自动重试和超时处理等可靠性功能。

您可以通过配置来自定义作业队列的行为
`@app.function()` 装饰器，具有以下选项
[`retries`](/docs/guide/retries#function-retries),
[`timeout`](/docs/guide/timeouts#timeouts)，以及
[`max_containers`](/docs/guide/scale#configuring-autoscaling-behavior)。