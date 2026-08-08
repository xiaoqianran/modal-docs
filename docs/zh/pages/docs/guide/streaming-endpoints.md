<!-- modal-docs: machine-translated zh-CN from English source -->

# 流媒体端点

Modal `fastapi_endpoint`s 支持使用 FastAPI 的流式响应
[`StreamingResponse`](https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse)
类。此类接受异步生成器、同步生成器或
任何实现了
[*迭代器协议*](https://docs.python.org/3/library/stdtypes.html#typeiter),
并且可以与模态函数一起使用！

## 简单的例子

这个简单的例子将 Modal 的 `@modal.fastapi_endpoint` 装饰器与
`StreamingResponse` 对象产生实时 SSE 响应。

```python
import time

def fake_event_streamer():
    for i in range(10):
        yield f"data: some data {i}\n\n".encode()
        time.sleep(0.5)


@app.function(image=modal.Image.debian_slim().pip_install("fastapi[standard]"))
@modal.fastapi_endpoint()
def stream_me():
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        fake_event_streamer(), media_type="text/event-stream"
    )
```

如果您提供此 Web 功能并使用 `curl` 点击它，您将看到 10 个 SSE
事件在约 5 秒的时间内逐渐出现在您的终端中。

```shell
curl --no-buffer https://modal-labs--example-streaming-stream-me.modal.run
````text/event-stream` 的 MIME 类型在此示例中很重要，因为它告诉我们
下游 Web 服务器立即返回响应，而不是缓冲
它们以字节块的形式存在（这对于压缩来说更有效）。

您仍然可以返回其他内容类型，例如流中的大文件，但它们
不保证作为实时事件到达。

## 使用 `.remote` 流式传输响应

包装生成器函数体的模态函数可以传递其响应
直接进入`StreamingResponse`。如果您想要的话，这特别有用
在一个由基于 CPU 的 Web 调用的模态函数中进行一些 GPU 处理
端点模态函数。

```python
@app.function(gpu="any")
def fake_video_render():
    for i in range(10):
        yield f"data: finished processing some data from GPU {i}\n\n".encode()
        time.sleep(1)


@app.function(image=modal.Image.debian_slim().pip_install("fastapi[standard]"))
@modal.fastapi_endpoint()
def hook():
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        fake_video_render.remote_gen(), media_type="text/event-stream"
    )
```
## 使用 `.map` 和 `.starmap` 流式传输响应

您还可以将模态函数并行化与流响应结合起来，
使应用程序能够通过分包到数十个来服务请求
容器并迭代地将结果块返回给客户端。

```python
@app.function()
def map_me(i):
    return f"segment {i}\n"


@app.function(image=modal.Image.debian_slim().pip_install("fastapi[standard]"))
@modal.fastapi_endpoint()
def mapped():
    from fastapi.responses import StreamingResponse
    return StreamingResponse(map_me.map(range(10)), media_type="text/plain")
```

此代码片段将跨容器传播十个`map_me(i)`执行，并且
完成后返回每个字符串响应部分。默认情况下，结果将是
已订购，但如果没有必要，请传递 `order_outputs=False` 作为关键字
`.map` 调用的参数。

### 异步流

上面的例子使用了一个同步发电机，它自动在其上运行
自己的线程，但在异步应用程序中，在 `.map` 或 `.starmap` 上循环
call 可以阻塞事件循环。这将阻止 `StreamingResponse`
迭代地将响应部分返回给客户端。

为了避免这种情况，您可以使用 `.aio()` 方法来转换同步 `.map`
进入其异步版本。此外，其他阻塞调用应该卸载到
使用 `asyncio.to_thread()` 分离线程。例如：

```python
@app.function(gpu="any", image=modal.Image.debian_slim().pip_install("fastapi[standard]"))
@modal.fastapi_endpoint()
async def transcribe_video(request):
    from fastapi.responses import StreamingResponse

    segments = await asyncio.to_thread(split_video, request)
    return StreamingResponse(wrapper(segments), media_type="text/event-stream")


# Notice that this is an async generator.
async def wrapper(segments):
    async for partial_result in transcribe_video.map.aio(segments):
        yield "data: " + partial_result + "\n\n"
```

## 更多示例

* 上面给出的简单示例的完整代码可用
  [在我们的模态示例 Github 存储库中](https://github.com/modal-labs/modal-examples/blob/main/07_web_endpoints/streaming.py)。
* [使用 OpenAI 的耳语模型进行流式 Youtube 视频转录的端到端示例。](https://github.com/modal-labs/modal-examples/blob/main/06_gpu_and_ml/openai_whisper/streaming/main.py)