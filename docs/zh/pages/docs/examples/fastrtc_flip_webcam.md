<!-- modal-docs: machine-translated zh-CN from English source -->

# 在 Modal 上运行 FastRTC 应用

[FastRTC](https://fastrtc.org/) 是一个用于网络实时通信的 Python 库。
此示例演示如何在 Modal 上的云中运行简单的 FastRTC 应用程序。

它旨在帮助您在 Modal 上启动并运行实时流应用程序
尽快。如果您有兴趣在 Modal 上运行生产级 WebRTC 应用程序，
请参阅[此示例](https://modal.com/docs/examples/webrtc_yolo)。

在此示例中，我们将网络摄像头视频从浏览器流式传输到 Modal 上的容器，
视频被翻转、注释并以不到 100 毫秒的延迟发送回来。你可以尝试一下[这里](https://modal-labs-examples--example-fastrtc-flip-webcam-ui.modal.run/)
或者直接深入代码并自行运行。

## 在 Modal 上设置 FastRTC

首先我们导入`modal` SDK
并用它来定义一个[容器图像](https://modal.com/docs/guide/images)
具有 FastRTC 和相关依赖项。

```python
import modal

web_image = modal.Image.debian_slim(python_version="3.12").uv_pip_install(
    "fastapi[standard]==0.115.4",
    "fastrtc==0.0.23",
    "gradio==5.7.1",
    "opencv-python-headless==4.11.0.86",
)

```

然后，我们将其设置为模态 [App](https://modal.com/docs/guide/apps) 上的默认图像。

```python
app = modal.App("example-fastrtc-flip-webcam", image=web_image)

```

### 在 Modal 上配置 WebRTC 流

FastRTC 在底层使用 WebRTC
[API](https://www.w3.org/TR/webrtc/) 和
[协议](https://datatracker.ietf.org/doc/html/rfc8825)。

WebRTC 提供低延迟（“实时”）点对点通信
对于Web应用程序，重点是音频和视频。
考虑到Web最初设计时是一个平台
用于文本和图像的高延迟、客户端-服务器通信，
这绝非易事！

除了实现这种通信的协议之外，
WebRTC 包括用于描述和操作音频/视频流的 API。
在这个演示中，我们设置了一些简单的参数，例如网络摄像头的方向
和最小帧速率。请参阅
[`MediaTrackConstraints` 的 MDN Web 文档](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints)
了解更多。

```python
TRACK_CONSTRAINTS = {
    "width": {"exact": 640},
    "height": {"exact": 480},
    "frameRate": {"min": 30},
    "facingMode": {  # https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/facingMode
        "ideal": "user"
    },
}

```

理论上，互联网是为点对点通信而设计的
一直到其核心，即互联网协议 (IP)：仅在 IP 地址之间发送数据包。
实际上，当代互联网上的点对点通信充满了困难，
从限制性防火墙到挑剔的解决方法
[IPv4地址耗尽](https://www.a10networks.com/glossary/what-is-ipv4-exhaustion/),
像[运营商级网络地址转换（CGNAT）]（https://en.wikipedia.org/wiki/Carrier-grade_NAT）。

因此建立点对点连接可能会非常复杂。
执行此操作的协议称为交互式连接建立 (ICE)。
[本 RFC](https://datatracker.ietf.org/doc/html/rfc8445#section-2) 中对其进行了描述。

ICE 涉及对等方交换可能使用的连接列表。
我们在这里使用一个相当简单的设置，我们在 Modal 上的同行使用
[NAT 会话遍历实用程序 (STUN)](https://datatracker.ietf.org/doc/html/rfc5389)
服务器由谷歌提供。 STUN 服务器基本上只是向客户端反映他们的信息
当他们与之交谈时，会显示 IP 地址和端口号。 Modal 上的对等方进行通信
将该信息发送给试图连接到它的其他对等点 - 在本例中，浏览器试图共享网络摄像头源。
请注意 URL 中使用 `stun` 和端口 `19302` 代替
一些更熟悉的东西，比如 `http` 和端口 `80`。

```python
RTC_CONFIG = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]}


```

## 在 Modal 上运行 FastRTC 应用

FastRTC 建立在 [Gradio](https://www.gradio.app/docs) 之上
用于在 Python 中定义 Web UI 的库。
反过来，Gradio 兼容[异步服务器网关接口 (ASGI)](https://asgi.readthedocs.io/en/latest/)
异步 Python Web 服务器的协议，例如
[FastAPI](https://fastrtc.org/userguide/streams/),
所以我们可以使用Modal的云平台托管它
[`modal.asgi_app`装饰器](https://modal.com/docs/guide/webhooks#serving-asgi-and-wsgi-apps)
与[模态函数](https://modal.com/docs/guide/apps)。

但在此之前，我们需要考虑限制：
关于有多少个对等点可以连接到 Modal 上的一个实例
以及他们可以保持联系多久。
我们选择了一些合理的默认值来展示它们如何交互
与模态函数的部署参数。
您需要根据您的应用程序调整这些！

```python
MAX_CONCURRENT_STREAMS = 10  # number of peers per instance on Modal

MINUTES = 60  # seconds
TIME_LIMIT = 10 * MINUTES  # time limit


@app.function(
    # gradio requires sticky sessions
    # so we limit the number of concurrent containers to 1
    # and allow that container to handle concurrent streams
    max_containers=1,
    scaledown_window=TIME_LIMIT + 1 * MINUTES,  # add a small buffer to time limit
)
@modal.concurrent(max_inputs=MAX_CONCURRENT_STREAMS)  # inputs per container
@modal.asgi_app()  # ASGI on Modal
def ui():
    import fastrtc  # WebRTC in Gradio
    import gradio as gr  # WebUIs in Python
    from fastapi import FastAPI  # asynchronous ASGI server framework
    from gradio.routes import mount_gradio_app  # connects Gradio and FastAPI

    with gr.Blocks() as blocks:  # block-wise UI definition
        gr.HTML(  # simple HTML header
            "<h1 style='text-align: center'>"
            "Streaming Video Processing with Modal and FastRTC"
            "</h1>"
        )

        with gr.Column():  # a column of UI elements
            fastrtc.Stream(  # high-level media streaming UI element
                modality="video",
                mode="send-receive",
                handler=flip_vertically,  # handler -- handle incoming frame, produce outgoing frame
                ui_args={"title": "Click 'Record' to flip your webcam in the cloud"},
                rtc_configuration=RTC_CONFIG,
                track_constraints=TRACK_CONSTRAINTS,
                concurrency_limit=MAX_CONCURRENT_STREAMS,  # limit simultaneous connections
                time_limit=TIME_LIMIT,  # limit time per connection
            )

    return mount_gradio_app(app=FastAPI(), blocks=blocks, path="/")


```

要亲自尝试一下，请运行

```bash
modal serve 07_web/fastrtc_flip_webcam.py
```
并前往终端中显示的 `modal.run` URL。
您还可以查看应用程序的仪表板
通过出现在其下方的 `modal.com` URL。

`modal serve`命令生成一个热重载开发服务器——
尝试编辑上面的`ui_args`中的`title`并观察服务器重新部署。

此临时部署与您的终端会话相关联。
要永久部署，请运行

```bash
modal deploy 07_web_endponts/fastrtc_flip_webcam.py
```

请注意，Modal 是一个无服务器平台，具有[基于使用的定价](https://modal.com/pricing)，
因此，当不使用该应用程序时，它会停止运行并且不会花费您任何费用。

## 附录

这个 FastRTC 应用程序非常类似于“hello world”或“echo server”
FastRTC 的功能：它只是翻转传入的网络摄像头流并添加一条“hello”消息。
该逻辑如下所示。

```python
def flip_vertically(image):
    import cv2
    import numpy as np

    image = image.astype(np.uint8)

    if image is None:
        print("failed to decode image")
        return

    # flip vertically and caption to show video was processed on Modal
    image = cv2.flip(image, 0)
    lines = ["Hello from Modal!"]
    caption_image(image, lines)

    return image


def caption_image(
    img, lines, font_scale=0.8, thickness=2, margin=10, font=None, color=None
):
    import cv2

    if font is None:
        font = cv2.FONT_HERSHEY_SIMPLEX
    if color is None:
        color = (127, 238, 100, 128)  # Modal Green

    # get text sizes
    sizes = [cv2.getTextSize(line, font, font_scale, thickness)[0] for line in lines]
    if not sizes:
        return

    # position text in bottom right
    pos_xs = [img.shape[1] - size[0] - margin for size in sizes]

    pos_ys = [img.shape[0] - margin]
    for _width, height in reversed(sizes[:-1]):
        next_pos = pos_ys[-1] - 2 * height
        pos_ys.append(next_pos)

    for line, pos in zip(lines, zip(pos_xs, reversed(pos_ys))):
        cv2.putText(img, line, pos, font, font_scale, color, thickness)

```