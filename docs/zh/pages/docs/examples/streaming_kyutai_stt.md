<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 Kyutai STT 流转录

此示例演示了在 Modal 上使用 Kyutai STT 部署流式音频转录服务。

[Kyutai STT](https://kyutai.org/next/stt)是一个自动语音识别/转录模型
它旨在对音频流进行操作，而不是对完整的音频文件进行操作。
有关其“延迟流”架构的详细信息，请参阅链接的博客文章。

## 设置

我们首先导入一些基本包和 Modal SDK。

```python
import asyncio
import base64
import time
from pathlib import Path

import modal

```

然后我们定义一个模态应用程序和一个
[图片](https://modal.com/docs/guide/images)
与我们的语音到文本系统的依赖性。

```python
app = modal.App(name="example-streaming-kyutai-stt")

stt_image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "moshi==0.2.9", "fastapi==0.116.1", "huggingface-hub==0.33.5", "julius==0.2.7"
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1"})
)

```

缺少一项依赖项：模型权重。

不要将它们包含在图像中或在每次函数启动时加载它们，
我们将它们添加到模态 [Volume](https://modal.com/docs/guide/volumes)。
卷就像所有模态函数都可以访问的共享磁盘。

有关在 Modal 上处理模型权重的模式的更多详细信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

```python
MODEL_NAME = "kyutai/stt-1b-en_fr"

hf_cache_vol = modal.Volume.from_name(f"{app.name}-hf-cache", create_if_missing=True)
hf_cache_vol_path = Path("/root/.cache/huggingface")
volumes = {hf_cache_vol_path: hf_cache_vol}

```

## 在 Modal 上运行 Kyutai STT 推理

现在我们准备添加运行语音转文本模型的代码。

我们使用模态 [Cls](https://modal.com/docs/guide/lifecycle-functions)
这样我们就可以从推理中分离出模型加载和设置代码。
有关 Clses 生命周期管理和 Modal 冷启动惩罚减少的更多信息，请参阅
[本指南](https://modal.com/docs/guide/cold-start)。

我们还定义了多种访问底层流STT服务的方式——
通过 [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)，
对于浏览器等 Web 客户端，
并通过模态 [队列](https://modal.com/docs/guide/queues)
对于 Python 客户端。

再加上用于操作音频字节流和输出文本的代码
导致一个相当大的班级！但这里并没有什么太复杂的事情。

```python
MINUTES = 60


@app.cls(image=stt_image, gpu="l40s", volumes=volumes, timeout=10 * MINUTES)
class STT:
    BATCH_SIZE = 1

    @modal.enter()
    def enter(self):
        import torch
        from huggingface_hub import snapshot_download
        from moshi.models import LMGen, loaders

        start_time = time.monotonic_ns()

        print("Loading model...")
        snapshot_download(MODEL_NAME)

        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        checkpoint_info = loaders.CheckpointInfo.from_hf_repo(MODEL_NAME)
        self.mimi = checkpoint_info.get_mimi(device=self.device)
        self.frame_size = int(self.mimi.sample_rate / self.mimi.frame_rate)

        self.moshi = checkpoint_info.get_moshi(device=self.device)
        self.lm_gen = LMGen(self.moshi, temp=0, temp_text=0)

        self.mimi.streaming_forever(self.BATCH_SIZE)
        self.lm_gen.streaming_forever(self.BATCH_SIZE)

        self.text_tokenizer = checkpoint_info.get_text_tokenizer()

        self.audio_silence_prefix_seconds = checkpoint_info.stt_config.get(
            "audio_silence_prefix_seconds", 1.0
        )
        self.audio_delay_seconds = checkpoint_info.stt_config.get(
            "audio_delay_seconds", 5.0
        )
        self.padding_token_id = checkpoint_info.raw_config.get(
            "text_padding_token_id", 3
        )

        # warmup gpus
        for _ in range(4):
            codes = self.mimi.encode(
                torch.zeros(self.BATCH_SIZE, 1, self.frame_size).to(self.device)
            )
            for c in range(codes.shape[-1]):
                tokens = self.lm_gen.step(codes[:, :, c : c + 1])
                if tokens is None:
                    continue
        torch.cuda.synchronize()

        print(f"Model loaded in {round((time.monotonic_ns() - start_time) / 1e9, 2)}s")

    def reset_state(self):
        # reset llm chat history for this input
        self.mimi.reset_streaming()
        self.lm_gen.reset_streaming()

    async def transcribe(self, pcm, all_pcm_data):
        import numpy as np
        import torch

        if pcm is None:
            yield all_pcm_data
            return
        if len(pcm) == 0:
            yield all_pcm_data
            return

        if pcm.shape[-1] == 0:
            yield all_pcm_data
            return

        if all_pcm_data is None:
            all_pcm_data = pcm
        else:
            all_pcm_data = np.concatenate((all_pcm_data, pcm))

        # infer on each frame
        while all_pcm_data.shape[-1] >= self.frame_size:
            chunk = all_pcm_data[: self.frame_size]
            all_pcm_data = all_pcm_data[self.frame_size :]

            with torch.no_grad():
                chunk = torch.from_numpy(chunk)
                chunk = chunk.unsqueeze(0).unsqueeze(0)  # (1, 1, frame_size)
                chunk = chunk.expand(
                    self.BATCH_SIZE, -1, -1
                )  # (batch_size, 1, frame_size)
                chunk = chunk.to(device=self.device)

                # inference on audio chunk
                codes = self.mimi.encode(chunk)

                # language model inference against encoded audio
                for c in range(codes.shape[-1]):
                    text_tokens, vad_heads = self.lm_gen.step_with_extra_heads(
                        codes[:, :, c : c + 1]
                    )
                    if text_tokens is None:
                        # model is silent
                        yield all_pcm_data
                        return
                    if vad_heads:
                        pr_vad = vad_heads[2][0, 0, 0].cpu().item()
                        if pr_vad > 0.5:
                            # end of turn detected
                            yield all_pcm_data
                            return

                    assert text_tokens.shape[1] == self.lm_gen.lm_model.dep_q + 1

                    text_token = text_tokens[0, 0, 0].item()
                    if text_token not in (0, 3):
                        text = self.text_tokenizer.id_to_piece(text_token)
                        text = text.replace("▁", " ")
                        yield text

        yield all_pcm_data

    @modal.asgi_app()
    def api(self):
        import sphn
        from fastapi import FastAPI, Response, WebSocket, WebSocketDisconnect

        web_app = FastAPI()

        @web_app.get("/status")
        async def status():
            return Response(status_code=200)

        @web_app.websocket("/ws")
        async def transcribe_websocket(ws: WebSocket):
            await ws.accept()

            opus_stream_inbound = sphn.OpusStreamReader(self.mimi.sample_rate)
            transcription_queue = asyncio.Queue()

            print("Session started")
            tasks = []

            # asyncio to run multiple loops concurrently within single websocket connection
            async def recv_loop():
                """
                Receives Opus stream across websocket, appends into inbound queue.
                """
                nonlocal opus_stream_inbound
                while True:
                    data = await ws.receive_bytes()

                    if not isinstance(data, bytes):
                        print("received non-bytes message")
                        continue
                    if len(data) == 0:
                        print("received empty message")
                        continue
                    opus_stream_inbound.append_bytes(data)

            async def inference_loop():
                """
                Runs streaming inference on inbound data, and if any response audio is created, appends it to the outbound stream.
                """
                nonlocal opus_stream_inbound, transcription_queue
                all_pcm_data = None

                while True:
                    await asyncio.sleep(0.001)

                    pcm = opus_stream_inbound.read_pcm()
                    async for msg in self.transcribe(pcm, all_pcm_data):
                        if isinstance(msg, str):
                            transcription_queue.put_nowait(msg)
                        else:
                            all_pcm_data = msg

            async def send_loop():
                """
                Reads outbound data, and sends it across websocket
                """
                nonlocal transcription_queue
                while True:
                    data = await transcription_queue.get()

                    if data is None:
                        continue

                    msg = b"\x01" + bytes(
                        data, encoding="utf8"
                    )  # prepend "\x01" as a tag to indicate text
                    await ws.send_bytes(msg)

            # run all loops concurrently
            try:
                tasks = [
                    asyncio.create_task(recv_loop()),
                    asyncio.create_task(inference_loop()),
                    asyncio.create_task(send_loop()),
                ]
                await asyncio.gather(*tasks)

            except WebSocketDisconnect:
                print("WebSocket disconnected")
                await ws.close(code=1000)
            except Exception as e:
                print("Exception:", e)
                await ws.close(code=1011)  # internal error
                raise e
            finally:
                for task in tasks:
                    task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
                self.reset_state()

        return web_app

    @modal.method()
    async def transcribe_queue(self, q: modal.Queue):
        import tempfile

        import sphn

        all_pcm_data = None

        while True:
            chunk = await q.get.aio(partition="audio")
            if chunk is None:
                await q.put.aio(None, partition="transcription")
                break

            # to avoid having to encode the audio and retrieve with OpusStreamReader:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                tmp.write(chunk)
                tmp.flush()
                pcm, _ = sphn.read(tmp.name)
                pcm = pcm.squeeze(0)

            async for msg in self.transcribe(pcm, all_pcm_data):
                if isinstance(msg, str):
                    await q.put.aio(msg, partition="transcription")
                else:
                    all_pcm_data = msg


```

## 运行本地Python客户端来测试流式STT

我们可以在相同的生产模态基础设施上测试此代码
我们将通过编写一个快速的 `local_entrypoint` 进行测试来部署它。

我们只需要一些辅助函数来控制音频字节流
并从本地 Python 转录文本。

它们使用模态队列与已部署的函数进行异步通信。

```python
async def chunk_audio(data: bytes, chunk_size: int):
    for i in range(0, len(data), chunk_size):
        yield data[i : i + chunk_size]


async def send_audio(audio_bytes: bytes, q: modal.Queue, chunk_size: int, rtf: int):
    async for chunk in chunk_audio(audio_bytes, chunk_size):
        await q.put.aio(chunk, partition="audio")
        await asyncio.sleep(chunk_size / chunk_size / rtf)
    await q.put.aio(None, partition="audio")


async def receive_text(q: modal.Queue):
    break_counter, break_every = 0, 20
    while True:
        data = await q.get.aio(partition="transcription")
        if data is None:
            break
        print(data, end="")
        break_counter += 1
        if break_counter >= break_every:
            print()
            break_counter = 0


```

现在我们编写快速测试，从 URL 加载音频
然后通过a将其传递给远程函数

如果您运行此示例

```bash
modal run streaming_kyutai_stt.py
```

你会的

1.在Modal上部署最新版本的代码
2. 启动新的 GPU 来处理转录
3. 从 Hugging Face 或 Modal Volume 缓存加载模型
4. 将音频发送到新的 GPU 容器，进行转录，并在本地接收并打印。

对于除了 Modal 之外没有任何依赖项的单个 Python 文件来说，这还不错！

```python
@app.local_entrypoint()
async def test(
    chunk_size: int = 24_000,  # bytes
    rtf: int = 1000,
    audio_url: str = "https://github.com/kyutai-labs/delayed-streams-modeling/raw/refs/heads/main/audio/bria.mp3",
):
    from urllib.request import urlopen

    print(f"Downloading audio file from {audio_url}")
    audio_bytes = urlopen(audio_url).read()
    print(f"Downloaded {len(audio_bytes)} bytes")

    print("Starting transcription")
    start_time = time.monotonic_ns()
    async with modal.Queue.ephemeral() as q:
        await STT().transcribe_queue.spawn.aio(q)
        send = asyncio.create_task(send_audio(audio_bytes, q, chunk_size, rtf))
        recv = asyncio.create_task(receive_text(q))
        await asyncio.gather(send, recv)
    print(
        f"\nTranscription complete in {round((time.monotonic_ns() - start_time) / 1e9, 2)}s"
    )


```

## 在 Web 上部署流式 STT 服务

我们已经为我们的流 STT 服务编写了一个 Web 后端 --
这就是上面模态 Cl 中带有 WebSocket 的 FastAPI API。

我们还可以部署 Web 前端。为了保持几乎完全“纯Python”，
我们这里使用 [FastHTML](https://www.fastht.ml/) 库，
但您也可以部署带有 FastAPI 或 Node 后端的 JavaScript 前端。

我们确实使用了一些 JS 来在浏览器中进行音频处理。
我们使用 `add_local_dir` 将其添加到模态图像中。
您可以在[此处](https://github.com/modal-labs/modal-examples/tree/main/06_gpu_and_ml/speech-to-text/streaming-kyutai-stt-frontend)找到前端文件。

```python
web_image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install("python-fasthtml==0.12.20")
    .add_local_dir(
        Path(__file__).parent / "streaming-kyutai-stt-frontend", "/root/frontend"
    )
)

```

您可以使用以下方式部署此前端

```bash
modal deploy streaming_kyutai_stt.py
```

然后通过打印的 `ui` URL 与其进行交互。

```python
@app.function(image=web_image, timeout=10 * MINUTES)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def ui():
    import fasthtml.common as fh

    modal_logo_svg = open("/root/frontend/modal-logo.svg").read()
    modal_logo_base64 = base64.b64encode(modal_logo_svg.encode()).decode()
    app_js = open("/root/frontend/audio.js").read()

    fast_app, rt = fh.fast_app(
        hdrs=[
            # audio recording libraries
            fh.Script(
                src="https://cdn.jsdelivr.net/npm/opus-recorder@latest/dist/recorder.min.js"
            ),
            fh.Script(
                src="https://cdn.jsdelivr.net/npm/opus-recorder@latest/dist/encoderWorker.min.js"
            ),
            fh.Script(
                src="https://cdn.jsdelivr.net/npm/ogg-opus-decoder/dist/ogg-opus-decoder.min.js"
            ),
            # styling
            fh.Link(
                href="https://fonts.googleapis.com/css?family=Inter:300,400,600",
                rel="stylesheet",
            ),
            fh.Script(src="https://cdn.tailwindcss.com"),
            fh.Script("""
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                ground: "#0C0F0B",
                                primary: "#9AEE86",
                                "accent-pink": "#FC9CC6",
                                "accent-blue": "#B8E4FF",
                            },
                        },
                    },
                };
            """),
        ],
    )

    @rt("/")
    def get():
        return (
            fh.Title("Kyutai Streaming STT"),
            fh.Body(
                fh.Div(
                    fh.Div(
                        fh.Div(
                            id="text-output",
                            cls="flex flex-col-reverse overflow-y-auto max-h-64 pr-2",
                        ),
                        cls="w-full overflow-y-auto max-h-64",
                    ),
                    cls="bg-gray-800 rounded-lg shadow-lg w-full max-w-xl p-6",
                ),
                fh.Footer(
                    fh.Span(
                        "Built with ",
                        fh.A(
                            "Kyutai",
                            href="https://github.com/kyutai-labs/delayed-streams-modeling",
                            target="_blank",
                            rel="noopener noreferrer",
                            cls="underline",
                        ),
                        " and",
                        cls="text-sm font-medium text-gray-300 mr-2",
                    ),
                    fh.A(
                        fh.Img(
                            src=f"data:image/svg+xml;base64,{modal_logo_base64}",
                            alt="Modal logo",
                            cls="w-24",
                        ),
                        cls="flex items-center p-2 rounded-lg bg-gray-800 shadow-lg hover:bg-gray-700 transition-colors duration-200",
                        href="https://modal.com",
                        target="_blank",
                        rel="noopener noreferrer",
                    ),
                    cls="fixed bottom-4 inline-flex items-center justify-center",
                ),
                fh.Script(app_js),
                cls="relative bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4",
            ),
        )

    return fast_app

```