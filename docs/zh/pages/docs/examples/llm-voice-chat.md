<!-- modal-docs: machine-translated zh-CN from English source -->

# QuiLLMan：与 Moshi 语音聊天

[QuiLLMan](https://github.com/modal-labs/quillman) 是一款基于 Modal 构建的完整语音聊天应用程序：您说话，聊天机器人就会回复！

其核心是 Kyutai Lab 的 [Moshi](https://github.com/kyutai-labs/moshi) 模型，这是一种语音到语音的语言模型，可以持续倾听、计划和响应用户。

得益于双向 Websocket 流和 [Opus 音频压缩](https://opus-codec.org/)，良好的互联网上的响应时间几乎是瞬时的，与人类语音的节奏紧密匹配。

您可以在[此处](https://modal-labs--quillman-web.modal.run/)找到现场演示。

![奎尔曼](https://github.com/user-attachments/assets/afda5874-8509-4f56-9f25-d734b8f1c40a)

从 React 前端到模型后端，一切都以无服务器方式部署在 Modal 上，使其能够自动扩展并确保您只需为所使用的计算付费。

本页面提供了 [GitHub 存储库](https://github.com/modal-labs/quillman) 的高级演练。

## 代码概述

传统上，构建像 QuiLLMan 这样计算量大的双向流 Web 应用程序需要大量工作，而且要使其健壮且可扩展以处理许多并发用户尤其困难。

但对于 Modal，它就像编写两个不同的类并运行 CLI 命令一样简单。

我们的项目结构如下所示：
1. [Moshi Websocket Server](https://modal.com/docs/examples/llm-voice-chat#moshi-websocket-server)：加载Moshi模型的实例并与客户端保持双向Websocket连接。
2. [React Frontend](https://modal.com/docs/examples/llm-voice-chat#react-frontend)：运行客户端交互逻辑。

让我们更详细地了解每个组件。

### FastAPI 服务器

前端和后端均通过 [FastAPI 服务器](https://fastapi.tiangolo.com/) 提供服务，这是一个用于构建 REST API 的流行 Python Web 框架。

在 Modal 上，可以通过用 [`@app.asgi_app()`](https://modal.com/docs/sdk/py/latest/asgi_app) 装饰函数或类方法并返回 FastAPI 应用程序来将其暴露给 Web 流量。然后，您可以随意配置 FastAPI 服务器，包括添加中间件、提供静态文件和运行 Websocket。

### Moshi Websocket 服务器

传统上，语音到语音聊天应用程序需要三个不同的模块：语音到文本、文本到文本和文本到语音。在这些模块之间传递数据会引入瓶颈，并可能限制应用程序的速度并强制进行逐轮对话，这可能会让人感觉不自然。

Kyutai Lab 的 [Moshi](https://github.com/kyutai-labs/moshi) 将所有模式捆绑到一个模型中，这减少了延迟并使应用程序变得更加简单。
在底层，Moshi 使用 [Mimi](https://huggingface.co/kyutai/mimi) 流编码器/解码器模型来维护不间断的音频输入和输出流。编码后的音频由[语音文本基础模型](https://huggingface.co/kyutai/moshiko-pytorch-bf16)处理，该模型使用内部独白来确定何时以及如何响应。

使用流模型会带来一些在推理后端中不常见的挑战：

1. 该模型是“有状态的”，这意味着它保留了迄今为止的对话上下文。这意味着模型实例不能在用户会话之间共享，因此我们必须为每个用户会话运行一个唯一的 GPU，这通常不是一件容易的事！
2.模型是*流式*，所以它周围的接口并不像POST请求那么简单。我们必须找到一种流式传输音频数据的方法，并且速度足够快以实现无缝播放。

我们使用一些 Modal 功能在 `src/moshi.py` 中解决了这两个问题。

为了解决有状态问题，我们只需为每个并发用户启动一个新的 GPU。
使用莫代尔就很容易！

```python notest
@app.cls(
    image=image,
    gpu="A10G",
    scaledown_window=300,
    ...
)
class Moshi:
    # ...
```
通过此设置，如果有新用户连接，则会创建一个新的 GPU 实例！当任何用户断开连接时，其模型的状态将被重置，并且该 GPU 实例将返回到热池以供重复使用（最多 300 秒）。请注意，每个用户的 GPU 并不便宜，但这是确保用户会话隔离的最简单方法。

对于流式传输，我们使用 FastAPI 对双向 Websocket 的支持。这允许客户端在会话开始时建立单个连接，并双向传输音频数据。

正如 FastAPI 服务器可以从 Modal 函数运行一样，它也可以附加到 Modal 类方法，从而允许我们将预热的 Moshi 模型耦合到 Websocket 会话。

```python notest
@modal.asgi_app()
def web(self):
    from fastapi import FastAPI, Response, WebSocket, WebSocketDisconnect

    web_app = FastAPI()
    @web_app.websocket("/ws")
    async def websocket(ws: WebSocket):
        with torch.no_grad():
            await ws.accept()

            # handle user session

            # spawn loops for async IO
            async def recv_loop():
                while True:
                    data = await ws.receive_bytes()
                    # send data into inference stream...

            async def send_loop():
                while True:
                    await asyncio.sleep(0.001)
                    msg = self.opus_stream_outbound.read_bytes()
                    # send inference output to user ...
```

要为 Moshi 模块运行[开发服务器](https://modal.com/docs/guide/webhooks#developing-with-modal-serve)，请从存储库的根目录运行此命令。

```shell
modal serve -m src.moshi
```

在终端输出中，您将找到用于创建 Websocket 连接的 URL。

### 反应前端

前端是一个静态 React 应用程序，位于 `src/frontend` 目录中，并由 `src/app.py` 提供服务。

我们使用[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)来录制用户麦克风的音频并播放模型的音频响应。
为了高效的音频传输，我们使用[Opus编解码器](https://opus-codec.org/)来压缩网络上的音频。 [`opus-recorder`](https://github.com/chris-rudmin/opus-recorder) 和 [`ogg-opus-decoder`](https://github.com/eshaz/wasm-audio-decoders/tree/master/src/ogg-opus-decoder) 库支持 Opus 录制和播放。

要提供前端资产，请从存储库的根目录运行此命令。

```shell
modal serve -m src.app
```

由于 `src/app.py` 导入了 `src/moshi.py` 模块，因此 `serve` 命令也将 Moshi websocket 服务器作为其自己的端点。

## 部署

当您准备好上线时，请使用 `deploy` 命令将应用程序部署到 Modal。

```shell
modal deploy -m src.app
```

## 盗用这个例子

整个示例的代码是[可在 GitHub 上获取](https://github.com/modal-labs/quillman)，因此请随意派生它并使其成为您自己的！