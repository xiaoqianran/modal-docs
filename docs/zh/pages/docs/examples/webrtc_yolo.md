<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 WebRTC 和 YOLO 进行实时目标检测

此示例演示如何使用 Modal 和 WebRTC 构建无服务器实时流应用程序。
示例应用程序使用 YOLO 检测网络摄像头视频中的对象。

请参阅以下来自 WebRTC OG 和 [Daily](https://www.daily.co/) 联合创始人 [Kwindla Kramer](https://machine-theory.com/) 课程中此示例的现场演示的剪辑。

<center>
<video controls autoplay muted>
<source src="https://modal-cdn.com/example-webrtc_yolo.mp4" type="video/mp4">
</video>
</center>

您也可以[此处](https://modal-labs-examples--example-webrtc-yolo-webcamobjdet-web.modal.run)尝试我们的部署。

## 什么是 WebRTC？WebRTC（Web 实时通信）是一种用于点之间实时媒体流的 [IETF 互联网协议](https://www.rfc-editor.org/rfc/rfc8825) 和 [W3C API 规范](https://www.w3.org/TR/webrtc/)
通过互联网或万维网。
它之所以如此有效，并且与其他基于网络的双向通信协议（例如 WebSockets）不同，是因为它是专门为实时媒体流而构建的。
它主要是为使用 JavaScript API 的浏览器应用程序设计的，但[也存在其他语言的 API](https://www.webrtc-developers.com/did-i-choose-the-right-webrtc-stack/)。
我们将使用 Pipecat 的 [`SmallWebRTCTransport`](https://docs.pipecat.ai/api-reference/server/services/transport/small-webrtc) 构建我们的应用程序。

### WebRTC 应用程序由什么组成？

一个简单的 WebRTC 应用程序通常由三个参与者组成：

1. 发起连接的对等方，
2. 响应连接的对等方，以及
3. 在两个对等点之间传递一些初始消息的服务器。

首先，一个对等点通过提供自身描述（其媒体源、编解码器功能、互联网协议 (IP) 寻址信息等）来启动连接，这些描述通过服务器中继到另一个对等点。
然后，另一个对等方要么通过提供其自身功能的兼容描述来接受该要约，要么如果无法进行兼容配置则拒绝该要约。
这个过程在WebRTC世界中被称为“信令”，有时也称为“协商”，而中介它的服务器通常被称为“信令服务器”。

一旦同行就配置达成一致，就会短暂暂停以建立通信......然后您就可以开始工作了。

![基本 WebRTC 架构](https://modal-cdn.com/cdnbot/just_webrtc-1oic3iems_a4a8e77c.webp) <small>基本 WebRTC 应用架构</small>

显然，幕后还有更多的事情发生。
如果您想了解详细信息，我们建议您查看 [RFC](https://www.rfc-editor.org/rfc/rfc8825) 或 [更全面的解释器](https://webrtcforthecurious.com/)。
在本文档中，我们将重点介绍如何构建一个 WebRTC 应用程序，其中一个或多个对等点在 Modal 的无服务器云基础设施上运行。
如果您只是想快速开始使用 WebRTC 进行小型内部服务或黑客项目，请查看
[我们的 FastRTC 示例](https://modal.com/docs/examples/fastrtc_flip_webcam)。

## 如何在 Modal 上运行 WebRTC 应用程序？

Modal 将 Python 代码转变为可扩展的云服务。
当您调用模态函数时，您将获得一个副本。
如果在返回之前再调用 999 次，则您将拥有 1000 个副本。
当您的函数全部返回时，您将旋转至 0 个副本。

使这成为可能的模态编程模型的核心约束是函数调用是无状态的和独立的。
换句话说，正确编写的模态函数不会在运行之间将信息存储在内存中（尽管它们可能会将数据缓存到临时本地磁盘以提高效率），并且它们不会创建在函数调用返回后必须继续运行才能使应用程序正确的进程或任务。

另一方面，WebRTC 应用程序需要在多步骤协议中来回传递消息，并且 API 会生成多个“代理”（不，不涉及 AI，只是进程），这些“代理”在幕后工作，包括管理点对点 (P2P) 连接本身。
这意味着当我们的函数中的应用程序逻辑完成时，流可能才刚刚开始。

![Modal 编程模型和 WebRTC 信令](https://modal-cdn.com/cdnbot/flow_comparisong6iibzq3_638bdd84.webp) <small>Modal 的无状态编程模型（左）和 WebRTC 的有状态信令（右）</small>

为了确保我们正确利用 Modal 的自动缩放和并发功能，我们需要将信令和流生命周期与 Modal 函数调用生命周期保持一致。

我们为此推荐的架构如下所示。

![Modal 上的 WebRTC](https://modal-cdn.com/cdnbot/webrtcdv9r193o_8efc6c14.webp) <small>Modal 上的 WebRTC 的干净架构</small>

它使用以下方式处理客户端对等点和信令服务器之间的消息传递
单个函数调用中的 HTTP (`POST /offer`)。
（Modal 的 Web 层将 HTTP 映射到函数调用，详细信息[此处](https://modal.com/blog/serverless-http)）。
我们[`.spawn`](https://modal.com/docs/reference/modal.Function#spawn)`/offer`端点内的云对等点
并通过 [`modal.Dict`](https://modal.com/docs/reference/modal.Dict) 传递 SDP 报价。

一旦 GPU 对等方发布 SDP *答案*，信令请求就会返回。
当 P2P 连接已“关闭”时，我们将从调用返回到云对等点。
这样，我们的 WebRTC 应用程序就可以受益于 Modal 中内置的所有自动缩放和并发逻辑
使用户能够交付高效的云应用程序。

由于 Pipecat 的 `SmallWebRTCTransport` 处理 aiortc 对等连接、ICE 和媒体轨道，
应用程序代码只需实现接收视频帧、运行 YOLO 并将带注释的帧发回的逻辑。
使用 [`app.cls`](https://modal.com/docs/reference/modal.App#cls) 和 Modal [生命周期挂钩](https://modal.com/docs/guide/lifecycle-functions) 装饰 GPU 对等体，然后就可以在 Modal 上部署了。

## 检测网络摄像头镜头中的对象

对于我们的 WebRTC 应用程序，我们将获取客户端的视频流，在 Modal 上使用 A100 GPU 运行 [YOLO](https://docs.ultralytics.com/tasks/detect/) 对象检测器，然后将带注释的视频流回客户端。
通过此设置，我们可以实现每帧 2-4 毫秒的推理时间和低于视频帧速率的 RTT（通常每帧 30 毫秒左右）。

让我们开始吧！

### 设置

我们将从一个简单的容器 [Image](https://modal.com/docs/guide/images) 开始，然后

* 将其设置为正确使用 TensorRT 和 ONNX 运行时，从而将延迟降至最低，
* 安装处理视频所需的库`opencv`和`ffmpeg`，以及
* 安装 Pipecat 的 WebRTC 额外版本以及必要的 Python 包。

```python
import asyncio
import os
import time
from pathlib import Path

import modal

py_version = "3.12"
tensorrt_ld_path = f"/usr/local/lib/python{py_version}/site-packages/tensorrt_libs"

VIDEO_WIDTH = 640
VIDEO_HEIGHT = 480
```

首次运行 YOLO 下载 + ONNX/TRT 图形构建可能需要几分钟
空体积；缓存冷启动约为 15-20 秒。不管怎样，绑定 /offer 等待。

```python
ANSWER_TIMEOUT_SECS = 300.0
MINUTES = 60

video_processing_image = (
    modal.Image.debian_slim(python_version=py_version)  # matching ld path
    # update locale as required by onnx
    .apt_install("locales")
    .run_commands(
        "sed -i '/^#\\s*en_US.UTF-8 UTF-8/ s/^#//' /etc/locale.gen",  # use sed to uncomment
        "locale-gen en_US.UTF-8",  # set locale
        "update-locale LANG=en_US.UTF-8",
    )
    .env({"LD_LIBRARY_PATH": tensorrt_ld_path, "LANG": "en_US.UTF-8"})
    # install system dependencies
    .apt_install("python3-opencv", "ffmpeg")
    .run_commands("printf 'onnxruntime\\n' > /tmp/onnxruntime-excludes.txt")
    # install Python dependencies
    .uv_pip_install(
        "pipecat-ai[webrtc]==1.5.0",
        "fastapi==0.115.12",
        "huggingface-hub[hf_xet]==0.30.2",
        "onnxruntime-gpu==1.21.0",
        "opencv-python==4.11.0.86",
        "tensorrt==10.9.0.34",
        "torch==2.7.0",
        extra_options="--excludes /tmp/onnxruntime-excludes.txt",
    )
)

```

### 在卷上缓存权重和计算图

我们还需要创建一个 Modal [Volume](https://modal.com/docs/guide/volumes) 来跨副本存储我们需要的东西 --
主要是模型权重和 ONNX 推理图，还有一些其他工件，例如视频文件，其中
我们将写出处理后的视频流进行测试。有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

我们第一次运行该应用程序、下载模型并构建 ONNX 推理图将需要几分钟的时间。
之后，我们可以从 Volume 加载缓存的权重和图表，这将每个容器的启动时间减少到大约 15 秒。

```python
CACHE_VOLUME = modal.Volume.from_name("webrtc-yolo-cache", create_if_missing=True)
CACHE_PATH = Path("/cache")
cache = {CACHE_PATH: CACHE_VOLUME}

app = modal.App("example-webrtc-yolo")

```

### 作为 Pipecat GPU 对等体实现 YOLO 对象检测

我们的应用程序需要使用 YOLO 处理传入的视频轨道，并将带注释的视频轨道返回给源对等点。

为了实现 GPU 对等，我们需要：

* 用`@app.cls`装饰我们的班级。我们为其配备了 A100 GPU。
* 将 YOLO 加载到 `@modal.enter()` 中，这样每个容器都会发生一次。
* 实施`run_pipeline`。这是我们连接 Pipecat 的 `SmallWebRTCTransport` 的地方
到一个`YOLOProcessor`，它注释每个帧并将其返回到源对等点。
  管道分为三个阶段：`transport.input()`→`YOLOProcessor`→`transport.output()`。

我们还没有讨论过[TURN服务器](https://datatracker.ietf.org/doc/html/rfc5766)，
但只要知道如果您想在复杂（例如运营商级）NAT 或防火墙配置中使用 WebRTC，它们是必要的。
免费服务有严格的限制，因为 TURN 服务器的运行成本很高（需要大量带宽和状态管理）。
另一方面，[STUN](https://datatracker.ietf.org/doc/html/rfc5389) 服务器本质上只是回显服务器，因此有许多免费服务可用。
如果您不提供 TURN 服务器，您仍然可以使用任意数量的免费 STUN 服务器进行 NAT 遍历，在许多网络上为您的应用程序提供服务。

ICE 服务器通过信令`modal.Dict` 传递。
STUN 模式不需要凭据并且适用于许多网络。
如果 STUN 还不够，TURN 模式可以使用免费的
[开放中继TURN服务器](https://www.metered.ca/tools/openrelay/)通过小型CPU
挂载 Modal [Secret](https://modal.com/docs/guide/secrets) 的函数称为
`turn-credentials`（在[此处](https://modal.com/secrets)创建秘密）
[此处](https://dashboard.metered.ca/login?tool=turnserver)) 注册。
对于生产或顽固的 NAT，请考虑为您运行 TURN 的托管提供商，例如 [Daily](https://www.daily.co/)。
我们还使用 `@modal.concurrent` 装饰器来允许对等体的多个实例在一个 GPU 上运行。

**设置区域**

互联网应用中的大部分延迟来自于通信双方之间的距离——
互联网的运行速度是光速的两倍，但速度并没有那么快。
为了最大限度地减少此约束下的延迟，P2P 连接的物理距离
使用网络摄像头的对等点和 GPU 容器之间的距离需要保持尽可能短。
我们将使用 `cls` 装饰器的 `region` 参数来设置 GPU 容器的区域。
您应该将其设置为距离您的用户最近的区域。
更多信息请参见【区域选择】(https://modal.com/docs/guide/region-selection)指南。

```python
@app.cls(
    image=video_processing_image,
    gpu="A100-40GB",
    volumes=cache,
    region="us-east",  # set to your region
    timeout=30 * MINUTES,
)
@modal.concurrent(
    target_inputs=2,  # try to stick to just two peers per GPU container
    max_inputs=3,  # but allow up to three
)
class ObjDet:
    @modal.enter()
    def load_model(self):
        self.yolo_model = get_yolo_model(CACHE_PATH)

    @modal.method()
    async def run_pipeline(self, d: modal.Dict):
        from pipecat.pipeline.pipeline import Pipeline
        from pipecat.pipeline.worker import PipelineWorker
        from pipecat.transports.base_transport import TransportParams
        from pipecat.transports.smallwebrtc.connection import (
            IceServer,
            SmallWebRTCConnection,
        )
        from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
        from pipecat.workers.runner import WorkerRunner

        offer = await d.get.aio("offer")
        ice_servers = [
            IceServer(**ice_server) for ice_server in await d.get.aio("ice_servers")
        ]

        webrtc_connection = SmallWebRTCConnection(ice_servers)
        await webrtc_connection.initialize(sdp=offer["sdp"], type=offer["type"])

        transport = SmallWebRTCTransport(
            webrtc_connection=webrtc_connection,
            params=TransportParams(
                audio_in_enabled=False,
                audio_out_enabled=False,
                video_in_enabled=True,
                video_out_enabled=True,
                video_out_is_live=True,
                video_out_width=VIDEO_WIDTH,
                video_out_height=VIDEO_HEIGHT,
            ),
        )

        pipeline = Pipeline(
            [
                transport.input(),
                get_yolo_processor(self.yolo_model),
                transport.output(),
            ]
        )
        # Pipecat defaults assume a voice agent (idle cancel on missing speech frames,
        # RTVI to the client). This is a video-only pipeline with a plain browser client.
        worker = PipelineWorker(
            pipeline,
            idle_timeout_secs=None,
            enable_rtvi=False,
            enable_turn_tracking=False,
        )

        async def end_session(reason: str):
            print(f"Video Processor connection {webrtc_connection.pc_id}: {reason}")
            await worker.cancel()

        @transport.event_handler("on_client_connected")
        async def on_client_connected(transport, client):
            print(
                f"Video Processor connection {webrtc_connection.pc_id}: client connected"
            )
            await transport.capture_participant_video("camera")

        @transport.event_handler("on_client_disconnected")
        async def on_client_disconnected(transport, client):
            await end_session("client disconnected")

        @webrtc_connection.event_handler("failed")
        async def on_failed(connection):
            await end_session("connection failed")

        @webrtc_connection.event_handler("closed")
        async def on_closed(connection):
            await end_session("connection closed")

        answer = webrtc_connection.get_answer()
        if answer is None:
            raise RuntimeError("Pipecat produced no SDP answer after initialize()")
        await d.put.aio("answer", answer)

        runner = WorkerRunner(handle_sigint=False)
        await runner.add_workers(worker)
        await runner.run()


```

### 实现一个信令服务器

信令服务器要简单得多。
它服务于浏览器 UI 和 `POST /offer`。每次报价都会产生 `ObjDet.run_pipeline`
并等待 [`modal.Dict`](https://modal.com/docs/reference/modal.Dict) 上的 SDP 答复。

服务器是 ICE 配置的来源：客户端 POST `ice_server_type`
（`stun` 或 `turn`）与 SDP 优惠；服务器构建一次 ICE 服务器
GPU 对等点并在 `GET /ice-servers` 上为浏览器公开相同的列表。
我们还将安装一个前端，它使用 WebRTC JavaScript API 从浏览器传输对等方的网络摄像头。
JavaScript 和 HTML 文件与此示例一起位于 [Github 存储库](https://github.com/modal-labs/modal-examples/tree/main/07_web/webrtc/frontend) 中。

```python
this_directory = Path(__file__).parent.resolve()
server_image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install("fastapi[standard]==0.115.12")
    .add_local_dir(this_directory / "frontend", remote_path="/frontend")
)


@app.cls(image=server_image, timeout=10 * MINUTES)
class WebcamObjDet:
    @modal.asgi_app()
    def web(self):
        from fastapi import FastAPI, HTTPException, Request
        from fastapi.responses import HTMLResponse
        from fastapi.staticfiles import StaticFiles

        web_app = FastAPI()
        web_app.mount("/static", StaticFiles(directory="/frontend"))

        @web_app.get("/")
        async def root():
            html = open("/frontend/index.html").read()
            return HTMLResponse(content=html)

        @web_app.get("/ice-servers")
        async def ice_servers(mode: str = "stun"):
            try:
                return {
                    "ice_servers": await resolve_ice_servers(use_turn=(mode == "turn"))
                }
            except Exception as e:
                raise HTTPException(status_code=503, detail=str(e)) from e

        @web_app.post("/offer")
        async def offer(request: Request):
            body = await request.json()
            sdp = body.get("sdp")
            offer_type = body.get("type")
            if not sdp or not offer_type:
                raise HTTPException(status_code=400, detail="missing sdp or type")

            use_turn = body.get("ice_server_type") == "turn"
            try:
                ice_servers = await resolve_ice_servers(use_turn=use_turn)
            except Exception as e:
                raise HTTPException(status_code=503, detail=str(e)) from e

            async with modal.Dict.ephemeral() as d:
                await d.put.aio("ice_servers", ice_servers)
                await d.put.aio("offer", {"sdp": sdp, "type": offer_type})

                call = await ObjDet().run_pipeline.spawn.aio(d)
                deadline = time.monotonic() + ANSWER_TIMEOUT_SECS
                try:
                    while True:
                        if await request.is_disconnected():
                            raise HTTPException(
                                status_code=499, detail="client disconnected"
                            )
                        answer = await d.get.aio("answer")
                        if answer is not None:
                            return answer

                        # Fail fast if the GPU peer exited; re-read answer first in case
                        # it was published in the gap between the get above and call.get.
                        peer_done = False
                        peer_error = None
                        try:
                            await call.get.aio(timeout=0)
                        except TimeoutError:
                            pass
                        except Exception as e:
                            peer_done = True
                            peer_error = e
                        else:
                            peer_done = True

                        if peer_done:
                            answer = await d.get.aio("answer")
                            if answer is not None:
                                return answer
                            if peer_error is not None:
                                raise HTTPException(
                                    status_code=502,
                                    detail=f"GPU peer failed before SDP answer: {peer_error}",
                                ) from peer_error
                            raise HTTPException(
                                status_code=502,
                                detail="GPU peer finished without SDP answer",
                            )

                        if time.monotonic() >= deadline:
                            raise HTTPException(
                                status_code=504,
                                detail="timed out waiting for SDP answer",
                            )
                        await asyncio.sleep(0.1)
                except BaseException:
                    await call.cancel.aio()
                    raise

        return web_app


```

## 附录

本页的其余部分并不是在 Modal 上运行 WebRTC 应用程序的核心，
但为了完整性而包含在内。

### ICE 助手

STUN 是一个公共 Google 服务器。 TURN 凭证来自 `turn-credentials` Secret
通过一个小型 CPU 功能，因此信号 Cls 本身不需要知道 STUN 模式下的凭据。

```python
def ice_servers_for_mode(use_turn: bool) -> list[dict]:
    stun = [{"urls": "stun:stun.l.google.com:19302"}]
    if not use_turn:
        return stun

    username = os.environ.get("TURN_USERNAME")
    credential = os.environ.get("TURN_CREDENTIAL")
    if not username or not credential:
        raise RuntimeError(
            "TURN mode needs Modal Secret 'turn-credentials' "
            "(TURN_USERNAME, TURN_CREDENTIAL)"
        )
    creds = {"username": username, "credential": credential}
    return [
        {"urls": "stun:stun.relay.metered.ca:80"},  # STUN is free, no creds needed
        # for TURN, sign up for the free service here: https://www.metered.ca/tools/openrelay/
        {"urls": "turn:standard.relay.metered.ca:80"} | creds,
        {"urls": "turn:standard.relay.metered.ca:80?transport=tcp"} | creds,
        {"urls": "turn:standard.relay.metered.ca:443"} | creds,
        {"urls": "turns:standard.relay.metered.ca:443?transport=tcp"} | creds,
    ]


@app.function(
    image=modal.Image.debian_slim(python_version="3.12"),
    secrets=[modal.Secret.from_name("turn-credentials")],
)
def lookup_turn_ice_servers() -> list[dict]:
    return ice_servers_for_mode(use_turn=True)


async def resolve_ice_servers(*, use_turn: bool) -> list[dict]:
    if use_turn:
        return await lookup_turn_ice_servers.remote.aio()
    return ice_servers_for_mode(use_turn=False)


```

### YOLO 辅助函数下面的两个助手设置了 YOLO 模型并创建了我们的自定义 Pipecat 框架处理器。

第一个，`get_yolo_model`，设置 ONNXRuntime 并加载模型权重。
我们在`ObjDet`的`@modal.enter()`方法中调用它
这样每个容器只发生一次。

```python
def get_yolo_model(cache_path):
    import onnxruntime

    from .yolo import YOLOv10

    onnxruntime.preload_dlls()
    return YOLOv10(cache_path)


```

第二个，`get_yolo_processor`，创建一个自定义 Pipecat `FrameProcessor`
对每个视频帧执行对象检测。
我们在`run_pipeline`中称此为每个对等连接发生一次。
带注释的帧让处理器保持传入帧的大小；那么交通
在 `VIDEO_WIDTH` × `VIDEO_HEIGHT` 处发射它们。

```python
def get_yolo_processor(yolo_model):
    import cv2
    import numpy as np
    from pipecat.frames.frames import InputImageRawFrame, OutputImageRawFrame
    from pipecat.processors.frame_processor import FrameProcessor

    class YOLOProcessor(FrameProcessor):
        conf_threshold = 0.15

        def __init__(self, model):
            super().__init__()
            self.yolo_model = model

        # this is the essential method we need to implement
        # to create a custom FrameProcessor
        async def process_frame(self, frame, direction):
            await super().process_frame(frame, direction)

            if not isinstance(frame, InputImageRawFrame):
                await self.push_frame(frame, direction)
                return

            width, height = frame.size
            image = np.frombuffer(frame.image, dtype=np.uint8).reshape(
                (height, width, 3)
            )
            if frame.format == "RGB":
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            resized = cv2.resize(
                image,
                (self.yolo_model.input_width, self.yolo_model.input_height),
            )
            detected = self.yolo_model.detect_objects(resized, self.conf_threshold)
            out = cv2.resize(detected, (width, height))
            out_rgb = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
            await self.push_frame(
                OutputImageRawFrame(
                    image=out_rgb.tobytes(),
                    size=(width, height),
                    format="RGB",
                )
            )

    return YOLOProcessor(yolo_model)


```

### 在 Modal 上测试 WebRTC 应用程序
正如任何经验丰富的网络实时应用程序开发人员都会告诉您的那样，
测试并确保正确性是相当困难的。我们花了几乎一样多的时间
正如我们编写的那样，为该应用程序设计适当的测试过程并进行故障排除
应用程序本身！

您可以在 GitHub 存储库中找到测试代码[此处](https://github.com/modal-labs/modal-examples/tree/main/07_web/webrtc/webrtc_yolo_test.py)。