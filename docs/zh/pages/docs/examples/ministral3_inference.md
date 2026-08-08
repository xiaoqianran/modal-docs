<!-- modal-docs: machine-translated zh-CN from English source -->

# 具有 vLLM 和 Modal 的无服务器 Ministral 3

在此示例中，我们展示了如何在 Modal 上提供 Mistral 的 Ministral 3 视觉语言模型。

[Ministral 3](https://huggingface.co/collections/mistralai/ministral-3-more)模型系列
在基准测试中与 Qwen 3-VL 车型系列相媲美
（详情请参阅型号卡）。

我们还提供了缩短冷启动时间的说明
使用 Modal 实现一个数量级的长期运行部署
[CPU + GPU 内存快照](https://modal.com/docs/guide/memory-snapshot)。

## 设置容器镜像

我们的首要任务是定义我们的服务器运行的环境：
[容器`Image`](https://modal.com/docs/guide/custom-container)。我们将使用 [vLLM 推理服务器](https://docs.vllm.ai)。
vLLM 可以与 `uv pip` 一起安装，因为 Modal [提供 CUDA 驱动程序](https://modal.com/docs/guide/cuda)。

```python
import json
import socket
import subprocess
from typing import Any

import aiohttp
import modal

MINUTES = 60  # seconds
VLLM_PORT = 8000

app = modal.App("example-ministral3-inference")

vllm_image = (
    modal.Image.from_registry("nvidia/cuda:12.9.0-devel-ubuntu22.04", add_python="3.12")
    .entrypoint([])
    .uv_pip_install(
        "vllm==0.13.0",
        "huggingface-hub==0.36.0",
        "flashinfer-python==0.5.3",
    )
)

```

## 下载Ministral 权重

我们还需要下载模型权重。
我们将从 Hugging Face Hub 中检索它们。

为了加快模型加载速度，我们将切换 `HIGH_PERFORMANCE`
Hugging Face 的 [Xet 后端](https://huggingface.co/docs/hub/en/xet/index) 的标志。

```python
vllm_image = vllm_image.env({"HF_XET_HIGH_PERFORMANCE": "1"})

```

[Ministral 3模型系列](https://huggingface.co/collections/mistralai/ministral-3-more)
包含多种型号：

* 3B、8B 和 14B 尺寸
* 基础模型以及指令和推理微调模型
* BF16 和 FP8 量化

所有这些都可以在 Apache 2.0 开源许可证下使用。
我们将使用 8B 模型的 FP8 指令变体：

```python
MODEL_NAME = "mistralai/Ministral-3-8B-Instruct-2512"

```

[Tensor Cores](https://modal.com/gpu-glossary/device-hardware/tensor-core) 中对 FP8 格式的本机硬件支持
仅限于最新的[流式多处理器架构](https://modal.com/gpu-glossary/device-hardware/streaming-multiprocessor-architecture)，
比如 Modal 的 [Hopper H100/H200 和 Blackwell B200 GPU](https://modal.com/blog/introducing-b200-h200)。

在 80 GB VRAM 下，单个 H100 GPU 有足够的空间来存储 8B FP8 模型权重（~8 GB）
和一个非常大的KV缓存。单个 H100 也足以为 14B 模型提供全精度服务，
但没有足够的 KV 空间（尽管仍然足以处理完整的序列长度）。

```python
N_GPU = 1

```

### 使用模态卷进行缓存模态函数是无服务器的：当不使用它们时，
它们的底层容器和所有临时资源都停止运行，
GPU、内存、网络连接和本地磁盘等都被释放。

我们可以通过挂载来保存保存的文件
[模态音量](https://modal.com/docs/guide/volumes) --
持久的远程文件系统。

我们将使用两个体积：一个用于拥抱脸部的权重
另一个用于 vLLM 的编译工件。

```python
hf_cache_vol = modal.Volume.from_name("huggingface-cache", create_if_missing=True)
vllm_cache_vol = modal.Volume.from_name("vllm-cache", create_if_missing=True)

```

## 为 Ministral 3 提供 vLLM 服务

我们通过启动 Modal 函数在 Modal 上为 Ministral 3 提供服务
充当 [`web_server`](https://modal.com/docs/guide/webhooks)
并在子进程中启动 vLLM 服务器
（通过`vllm serve`命令）。
### 使用快照改善冷启动时间

启动 vLLM 服务器可能会很慢——
几十秒到几分钟。大部分时间
花费在推理代码的 JIT 编译上。

我们可以跳过大部分工作并将启动时间减少 10 倍
使用Modal的[内存快照](https://modal.com/docs/guide/memory-snapshot)，
它序列化 CPU 和 GPU 内存的内容。

这给代码增加了相当多的复杂性。
如果您正在寻找一个最小的示例，请参阅
我们的[`vllm_inference`示例](https://modal.com/docs/examples/vllm_inference)。

我们需要设置一些额外的配置值：

```python
vllm_image = vllm_image.env(
    {
        "VLLM_SERVER_DEV_MODE": "1",  # allow use of "Sleep Mode"
        "TORCHINDUCTOR_COMPILE_THREADS": "1",  # improve compatibility with snapshots
    }
)

```设置 `DEV_MODE` 标志允许我们使用 `sleep`/`wake_up` 端点
将服务器切换为“睡眠模式”和“睡眠模式”。

```python
with vllm_image.imports():
    import requests


def sleep(level=1):
    requests.post(
        f"http://localhost:{VLLM_PORT}/sleep?level={level}"
    ).raise_for_status()


def wake_up():
    requests.post(f"http://localhost:{VLLM_PORT}/wake_up").raise_for_status()


```

睡眠模式有助于内存快照。
当服务器休眠时，模型权重被卸载到 CPU 内存，并且 KV 缓存被清空。
有关详细信息，请参阅 [vLLM 文档](https://docs.vllm.ai/en/stable/features/sleep_mode/)。

我们还需要两个辅助函数。
首先，`wait_ready`，忙轮询服务器直到它上线。

```python
def wait_ready(proc: subprocess.Popen):
    while True:
        try:
            socket.create_connection(("localhost", VLLM_PORT), timeout=1).close()
            return
        except OSError:
            if proc.poll() is not None:
                raise RuntimeError(f"vLLM exited with {proc.returncode}")


```

一旦服务器上线，我们`warmup`就会通过一些请求进行推断。
这对于捕获不可序列化的 JIT 编译工件非常重要，
像 CUDA 图和一些 Torch 编译输出，
在我们的快照中。

```python
def warmup():
    payload = {
        "model": "llm",
        "messages": [{"role": "user", "content": "Who are you?"}],
        "max_tokens": 16,
    }

    for ii in range(3):
        requests.post(
            f"http://localhost:{VLLM_PORT}/v1/chat/completions",
            json=payload,
            timeout=300,
        ).raise_for_status()


```

### 定义服务器
我们构建我们的网络服务模态函数
通过装饰一个常规的 Python 类。
装饰器包括一些配置
部署选项，包括 GPU 和卷等资源
以及容器缩减的超时。
您可以阅读有关选项的更多信息
[这里](https://modal.com/docs/reference/modal.App#function)。

我们控制内存快照和容器启动行为
通过装饰类的方法。

我们启动服务器，预热它，然后让它进入睡眠状态
在`start`方法中。这个方法有`modal.enter`
装饰器以确保它在新容器启动时运行我们通过 `snap=True` 打开内存快照。

以下方法`wake_up`调用`wake_up`
端点，然后等待服务器准备就绪。
它在`start`方法之后运行，因为它是稍后定义的
在代码中还有 `modal.enter` 装饰器。
它具有 `snap=False`，因此它不包含在快照中。

最后，我们将vLLM服务器连接到互联网
使用 [`modal.web_server`](https://modal.com/docs/guide/webhooks#non-asgi-web-servers) 装饰器。

```python
@app.cls(
    image=vllm_image,
    gpu=f"H100:{N_GPU}",
    scaledown_window=15 * MINUTES,  # how long should we stay up with no requests?
    timeout=10 * MINUTES,  # how long should we wait for container start?
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
    enable_memory_snapshot=True,
    experimental_options={"enable_gpu_snapshot": True},
)
@modal.concurrent(  # how many requests can one replica handle? tune carefully!
    max_inputs=32
)
class VllmServer:
    @modal.enter(snap=True)
    def start(self):
        cmd = [
            "vllm",
            "serve",
            "--uvicorn-log-level=info",
            MODEL_NAME,
            "--served-model-name",
            MODEL_NAME,
            "llm",
            "--host",
            "0.0.0.0",
            "--port",
            str(VLLM_PORT),
            "--gpu_memory_utilization",
            str(0.95),
        ]

        # assume multiple GPUs are for splitting up large matrix multiplications
        cmd += ["--tensor-parallel-size", str(N_GPU)]

        # add mistral config arguments
        cmd += [
            "--tokenizer_mode",
            "mistral",
            "--config_format",
            "mistral",
            "--load_format",
            "mistral",
            "--tool-call-parser",
            "mistral",
            "--enable-auto-tool-choice",
        ]

        # add config arguments for snapshotting

        cmd += [
            "--enable-sleep-mode",
            # make KV cache predictable / small
            "--max-num-seqs",
            "2",
            "--max-model-len",
            "12288",
            "--max-num-batched-tokens",
            "12288",
        ]

        print(*cmd)

        self.vllm_proc = subprocess.Popen(cmd)

        wait_ready(self.vllm_proc)

        warmup()

        sleep()

    @modal.enter(snap=False)
    def wake_up(self):
        wake_up()
        wait_ready(self.vllm_proc)

    @modal.web_server(port=VLLM_PORT, startup_timeout=10 * MINUTES)
    def serve(self):
        pass

    @modal.exit()
    def stop(self):
        self.vllm_proc.terminate()


```

## 部署服务器

要在 Modal 上部署 API，只需运行

```bash
modal deploy ministral3_inference.py
```

这将在 Modal 上创建一个新应用程序，如果尚未构建，则为其构建容器镜像，
并部署应用程序。

## 与服务器交互
部署后，您将看到命令行中出现一个 URL，
类似`https://your-workspace-name--example-ministral3-inference-serve.modal.run`。

您可以找到[交互式 Swagger UI 文档](https://swagger.io/tools/swagger-ui/)
在该 URL 的 `/docs` 路由处，即 `https://your-workspace-name--example-ministral-inference-serve.modal.run/docs`。
这些文档描述了每条路线并指示了预期的输入和输出
并将请求翻译成`curl`命令。

对于像`/health`这样的简单路由，它检查服务器是否响应，
您甚至可以直接从文档发送请求。

要在 Python 中以编程方式与 API 交互，我们推荐使用 `openai` 库。

## 测试服务器为了更容易测试服务器设置，我们还包含一个 `local_entrypoint`
进行健康检查然后访问服务器。

如果执行命令

```bash
modal run ministral3_inference.py
```

服务器的新副本将在 Modal 上启动，同时
下面的代码在您的本地计算机上执行。

可以将其视为在 `if __name__ == "__main__"` 内编写简单的测试
Python 脚本块，但适用于云部署！

```python
@app.local_entrypoint()
async def test(test_timeout=10 * MINUTES, content=None, twice=True):
    url = VllmServer().serve.get_web_url()

    system_prompt = {
        "role": "system",
        "content": "You are a pirate who can't help but drop sly reminders that he went to Harvard.",
    }
    if content is None:
        image_url = "https://static.wikia.nocookie.net/essentialsdocs/images/7/70/Battle.png/revision/latest?cb=20220523172438"

        content = [
            {
                "type": "text",
                "text": "What action do you think I should take in this situation?"
                " List all the possible actions and explain why you think they are good or bad.",
            },
            {"type": "image_url", "image_url": {"url": image_url}},
        ]

    messages = [  # OpenAI chat format
        system_prompt,
        {"role": "user", "content": content},
    ]

    async with aiohttp.ClientSession(base_url=url) as session:
        print(f"Running health check for server at {url}")
        async with session.get("/health", timeout=test_timeout - 1 * MINUTES) as resp:
            up = resp.status == 200
        assert up, f"Failed health check for server at {url}"
        print(f"Successful health check for server at {url}")

        print(f"Sending messages to {url}:", *messages, sep="\n\t")
        await _send_request(session, "llm", messages, timeout=1 * MINUTES)
        if twice:
            messages[0]["content"] = """Yousa culled Jar Jar Binks.
            Always be talkin' in da Gungan style, like thisa, okeyday?
            Helpin' da user with big big enthusiasm, makin' tings bombad clear!"""
            print(f"Sending messages to {url}:", *messages, sep="\n\t")
            await _send_request(session, "llm", messages, timeout=1 * MINUTES)


async def _send_request(
    session: aiohttp.ClientSession, model: str, messages: list, timeout: int
) -> None:
    # `stream=True` tells an OpenAI-compatible backend to stream chunks
    payload: dict[str, Any] = {
        "messages": messages,
        "model": model,
        "stream": True,
        "temperature": 0.15,
    }

    headers = {"Content-Type": "application/json", "Accept": "text/event-stream"}

    async with session.post(
        "/v1/chat/completions", json=payload, headers=headers, timeout=timeout
    ) as resp:
        async for raw in resp.content:
            resp.raise_for_status()
            # extract new content and stream it
            line = raw.decode().strip()
            if not line or line == "data: [DONE]":
                continue
            if line.startswith("data: "):  # SSE prefix
                line = line[len("data: ") :]

            chunk = json.loads(line)
            assert (
                chunk["object"] == "chat.completion.chunk"
            )  # or something went horribly wrong
            print(chunk["choices"][0]["delta"]["content"], end="")
    print()


```

### 测试内存快照

使用 `modal run` 创建一个临时模态应用程序，
而不是部署的模态应用程序。
短暂的模态应用程序是短暂的，
所以他们关闭快照。

要测试服务器的内存快照版本，
首先使用`modal deploy`进行部署
然后与客户打交道。

您应该观察启动改进
几次冷启动后
（通常少于五个）。
如果您想在测试期间查看加速情况，
我们建议前往您的已部署应用程序
[模态仪表板](https://modal.com/apps)
并在容器满足请求后手动停止容器。

您可以使用下面的客户端代码来测试端点。
可以用命令运行

```
python ministral3_inference.py
```

```python
if __name__ == "__main__":
    import asyncio

    # after deployment, we can use the class from anywhere
    VllmServer = modal.Cls.from_name("example-ministral3-inference", "VllmServer")
    server = VllmServer()

    async def test(url):
        messages = [{"role": "user", "content": "Tell me a joke."}]
        async with aiohttp.ClientSession(base_url=url) as session:
            await _send_request(session, "llm", messages, timeout=10 * MINUTES)

    try:
        print("calling inference server")
        asyncio.run(test(server.serve.get_web_url()))
    except modal.exception.NotFoundError as e:
        raise Exception(
            f"To take advantage of GPU snapshots, deploy first with modal deploy {__file__}"
        ) from e

```