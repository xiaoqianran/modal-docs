<!-- modal-docs: machine-translated zh-CN from English source -->

# 具有 SGLang 和 Modal 的低延迟 Nvidia Nemotron 3

在此示例中，我们展示了如何为 Nvidia 的 [Nemotron](https://www.nvidia.com/en-us/ai-data-science/foundation-models/nemotron/) 模型提供服务
在 Modal 上使用 [SGLang](https://github.com/sgl-project/sglang) 实现低延迟。

Nemotron 模型使用稀疏 MoE 矩阵相乘和混合注意力
（混合 Transformer 和 Mamba 层）来交付
高效运行的模型中的强大功能。
您可以在[此处](https://arxiv.org/abs/2512.20856) 的论文中阅读更多内容。

此示例旨在演示运行所需的一切
以最高性能和最低延迟进行推理，
因此它包含 SGLang 和 Modal 的高级功能。
有关 LLM 服务的更简单介绍，请参阅
[这个例子](https://modal.com/docs/examples/llm_inference)。

为了最小化路由开销，我们使用[模态服务器](https://modal.com/docs/guide/servers)，
它使用[Modal上的低延迟路由服务](https://modal.com/blog/serverless-servers)
专为延迟敏感的推理工作负载而设计。
这使我们能够更好地控制路由，但随着能力的增强，责任也随之增加。

## 设置容器镜像

我们的首要任务是定义我们的服务器运行的环境：
[容器`Image`](https://modal.com/docs/guide/images)。

我们从提供的容器镜像开始
[由 SGLang 团队通过 Dockerhub 制作](https://hub.docker.com/r/lmsysorg/sglang/tags)。
当我们这样做时，我们导入远程和本地（用于部署）所需的依赖项。

```python
import asyncio
import json
import subprocess
import time

import aiohttp
import modal

MINUTES = 60  # seconds

sglang_image = (
    modal.Image.from_registry("lmsysorg/sglang:v0.5.11")
    .entrypoint(  # silence chatty logs on container start
        []
    )
    .run_commands(  # clean up Image
        "rm -rf /root/.cache/huggingface"
    )
)

```

### 加载和缓存模型权重

我们将服务[NVIDIA的Nemotron 3 Nano](https://arxiv.org/abs/2512.20856)。
该模型有 300 亿个参数，其中每个代币有 30 亿个参数是活跃的。
为了降低延迟（在[内存限制](https://modal.com/gpu-glossary/perf/memory-bound)
和[计算绑定](https://modal.com/gpu-glossary/perf/compute-bound)设置），
我们选择量化的版本
[4位精度浮点](https://modal.com/llm-almanac/quant-formats)。
这减少了需要加载的数据量
[从GPU RAM到SM SRAM](https://modal.com/gpu-glossary/perf/memory-bandwidth)
在每次前传中。加载更少字节的模型权重也会加快[冷启动](https://modal.com/docs/guide/cold-start)
我们的推理服务器。

```python
MODEL_NAME = "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-NVFP4"

```

我们[从 Hugging Face Hub](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-NVFP4) 加载模型。
如果您经过身份验证，从集线器下载的速度会更快。
因此，我们添加一个 Hugging Face 标记作为 [Modal Secret](https://modal.com/docs/guide/secrets)。
您可以使用 Hugging Face 令牌创建模态秘密
[这里](https://modal.com/secrets)。请务必说出 `huggingface-secret` 的名字！

```python
hf_secret = modal.Secret.from_name("huggingface-secret")

```

我们不想每次启动服务器时都从集线器加载模型。
我们可以从 [Modal Volume](https://modal.com/docs/guide/volumes) 更快地加载它。
典型速度约为 1 到 2 GB/s。

```python
HF_CACHE_VOL = modal.Volume.from_name("huggingface-cache", create_if_missing=True)
HF_CACHE_PATH = "/root/.cache/huggingface"
MODEL_PATH = f"{HF_CACHE_PATH}/{MODEL_NAME}"

```

除了将 Hugging Face Hub 指向路径之外
在我们安装卷的地方，我们还
[开启“高性能”下载](https://huggingface.co/docs/hub/en/models-downloading#faster-downloads),
这可以完全饱和我们的网络带宽。

```python
sglang_image = sglang_image.env(
    {"HF_HUB_CACHE": HF_CACHE_PATH, "HF_XET_HIGH_PERFORMANCE": "1"}
)

```

我们还选择 [GPU](https://modal.com/docs/guide/gpu) 来部署我们的推理服务器。
我们选择【B200 GPU】(https://modal.com/blog/introducing-b200-h200),
提供卓越的性价比
并且支持8位和4位[量化浮点](https://modal.com/llm-almanac/quant-formats)
操作。

```python
GPU_TYPE, N_GPUS = "B200", 1
GPU = f"{GPU_TYPE}:{N_GPUS}"

```

## 定义推理服务器和基础设施

### 选择基础设施以最小化延迟

最大限度地减少延迟需要客户端和服务器在同一地点。

因此，对于 Modal 上的低延迟 LLM 推理服务，您必须选择一个
[云域](https://modal.com/docs/guide/region-selection)
对于运行推理的 GPU 加速容器
以及将请求转发给它们的内部模态代理
作为定义 `@app.server` 的一部分。

在这里，我们假设用户主要位于美洲北半部
并选择为他们服务的`us`云区域。
这最多会导致几十毫秒的往返时间。

```python
REGION = "us"
ROUTING_REGION = "us-west"

```

与 LLM 进行多轮交互的延迟为
当之前的交互回合在 KV 缓存中时，会大幅削减。
KV缓存存储在[GPU RAM](https://modal.com/gpu-glossary/device-hardware/gpu-ram)中，
因此它们不会在副本之间共享。
为了提高缓存命中率，模态服务器
包括基于客户端提供的标头的粘性路由。
详情请参阅下面的客户端代码。

对于生产规模的LLM推理服务，通常有
足够的请求足以证明始终保持至少一个副本运行。
拥有“热”或“活动”副本可以通过跳过缓慢的初始化工作来减少延迟
当新副本启动时会发生这种情况（[“冷启动”](https://modal.com/docs/guide/cold-start)）。
对于 LLM 推理服务器，延迟从几秒到几分钟不等。

为了确保至少一个容器始终可用，
我们可以设置模态函数的`min_containers`
至 `1` 或以上。

但是，由于这是文档代码，我们将其设置为 `0`
以避免临时使用期间出现意外账单。

```python
MIN_CONTAINERS = 0  # set to 1 to ensure one replica is always ready

```

最后，我们需要决定如何扩大和缩小副本
响应负载。如果没有自动缩放，用户的请求将排队
当服务器过载时。即使除了排队之外，还有回复
超过一定的最小数量后，每个用户通常会变慢
并发请求。

因此，我们为在单个容器上运行的输入数量设置了目标
使用 [`target_concurrency`](https://modal.com/docs/reference/modal.concurrent) 参数。

```python
TARGET_INPUTS = 32

```

一般来说，这种选择需要作为
[LLM推理引擎基准测试](https://modal.com/llm-almanac/how-to-benchmark)。

### 使用`modal.Server`控制容器生命周期

我们总结了我们对基础设施所做的所有选择
我们的推理服务器变成了许多 Python 装饰器
我们将其应用于封装逻辑的 Python 类
运行我们的服务器。

关键的装饰器是：

* [`@app.server`](https://modal.com/docs/guide/lifecycle-functions) 定义我们服务的核心。
  我们附加图像、请求 GPU、附加缓存卷、指定区域并配置自动缩放。这个装饰器还将我们的 python 代码转换为 HTTP 服务器（即在所有容器前面使用带有 URL 的代理）。
  包装的代码最终需要在提供的 `port` 上侦听 HTTP 连接。
  详情请参阅[参考文档](https://modal.com/docs/reference/modal.App#server)。

* [`@modal.enter` 和 `@modal.exit`](https://modal.com/docs/guide/lifecycle-functions) 表示
  启动和关闭服务器时应运行该类的哪些方法。

一旦 `modal.enter` 方法退出，Modal 就会考虑一个新的副本准备好接收输入
并且容器接受连接。
为了确保我们在标记为准备好输入之前实际完成服务器的设置，
我们定义一个辅助函数来检查服务器是否完成设置并
向它发送一些测试输入。

我们使用[`requests`库](https://requests.readthedocs.io/en/latest/)
向我们自己发送这些 HTTP 请求
[`localhost`/`127.0.0.1`](https://superuser.com/questions/31824/why-is-localhost-ip-127-0-0-1)。

```python
with sglang_image.imports():
    import requests


def wait_ready(process: subprocess.Popen, timeout: int = 20 * MINUTES):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            check_running(process)
            requests.get(f"http://127.0.0.1:{PORT}/health").raise_for_status()
            return
        except (
            requests.exceptions.ConnectionError,
            requests.exceptions.HTTPError,
        ):
            time.sleep(5)
    raise TimeoutError(f"SGLang server not ready within {timeout} seconds")


def check_running(p: subprocess.Popen):
    if (rc := p.poll()) is not None:
        raise subprocess.CalledProcessError(rc, cmd=p.args)


def warmup():
    payload = {
        "messages": [{"role": "user", "content": "Hello, how are you?"}],
        "max_tokens": 16,
    }
    for _ in range(3):
        requests.post(
            f"http://127.0.0.1:{PORT}/v1/chat/completions", json=payload, timeout=10
        ).raise_for_status()


```

### 额外配置

我们添加了一些额外的配置变量以提高性能。

```python
sglang_image = sglang_image.env(
    {
        "SAFETENSORS_FAST_GPU": "1",
        "NVIDIA_TF32_OVERRIDE": "1",
    }
)

server_args = [
    "--kv-cache-dtype",  # quantize the model's KV cache for a
    "fp8_e4m3",  # slight reduction in accuracy, major reduction in memory
]

```

完成所有这些后，我们就可以定义我们的高性能、低延迟
Nemotron 推理服务器。

```python
app = modal.App(name="example-nemotron-inference")
PORT = 8000


@app.server(
    image=sglang_image,
    gpu=GPU,
    volumes={HF_CACHE_PATH: HF_CACHE_VOL},
    compute_region=REGION,
    min_containers=MIN_CONTAINERS,
    secrets=[hf_secret],
    startup_timeout=20 * MINUTES,  # time to load weights
    port=PORT,  # wrapped code must listen on this port
    routing_region=ROUTING_REGION,  # location of proxies, should overlap with the container regions
    exit_grace_period=15,  # seconds, time to finish up requests when closing down
    target_concurrency=TARGET_INPUTS,
    unauthenticated=True,
)
class Server:
    @modal.enter()
    def startup(self):
        """Start the SGLang server and block until it is healthy, then warm it up."""

        cmd = (
            [
                "sglang",
                "serve",
                "--model-path",
                MODEL_NAME,
                "--served-model-name",
                MODEL_NAME,
                "--host",
                "0.0.0.0",
                "--port",
                f"{PORT}",
                "--tp",
                f"{N_GPUS}",
                "--cuda-graph-max-bs",  # only capture CUDA graphs for batch sizes we're likely to observe
                f"{TARGET_INPUTS * 2}",
                "--enable-metrics",  # expose metrics endpoints for telemetry
                "--decode-log-interval",  # how often to log during decoding, in tokens
                "10",
                "--trust-remote-code",
                "--tool-call-parser",
                "qwen3_coder",
                "--reasoning-parser",
                "nemotron_3",
            ]
            + server_args
        )

        self.process = subprocess.Popen(cmd)
        wait_ready(self.process)
        warmup()

    @modal.exit()
    def stop(self):
        self.process.terminate()


```

## 部署服务器

要在 Modal 上部署服务器，只需运行

```bash
modal deploy nemotron_inference.py
```

这将在 Modal 上创建一个新的应用程序，并为其构建容器映像（如果尚未构建）。

## 与服务器交互部署后，您将看到命令行中出现一个 URL，
类似于`https://your-workspace-name--example-nemotron-inference-server.us-east.modal.direct`。

您可以找到[交互式 Swagger UI 文档](https://swagger.io/tools/swagger-ui/)
在该 URL 的 `/docs` 路由处，即 `https://your-workspace-name--example-nemotron-inference-server.us-east.modal.direct/docs`。
这些文档描述了每条路线并指示了预期的输入和输出
并将请求翻译成`curl`命令。
对于简单的路由，您甚至可以直接从文档页面发送请求。

注意：当没有可用的副本时，Modal 将响应
[503服务不可用状态](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503)。
在浏览器中，您只需点击刷新，直到出现文档页面。
您可以在[模态仪表板](https://modal.com/apps)上查看应用程序及其容器的状态。
## 测试服务器

为了更容易测试服务器设置，我们还包含一个 `local_entrypoint`
用一个简单的客户端访问服务器。

如果执行命令

```bash
modal run nemotron_inference.py
```

服务器的新副本将在 Modal 上启动，同时
下面的代码在您的本地计算机上执行。

可以将其视为在 `if __name__ == "__main__"` 内编写简单的测试
Python 脚本块，但适用于云部署！

```python
@app.local_entrypoint()
async def test(test_timeout=10 * MINUTES, prompt=None, twice=True):
    url = await Server.get_url.aio()

    system_prompt = {
        "role": "system",
        "content": "You are a pirate who can't help but drop sly reminders that he went to Harvard.",
    }
    if prompt is None:
        prompt = "Explain the Singular Value Decomposition."

    content = [{"type": "text", "text": prompt}]

    messages = [  # OpenAI chat format
        system_prompt,
        {"role": "user", "content": content},
    ]

    await probe(url, messages, timeout=test_timeout)
    if twice:
        messages[0]["content"] = "You are Jar Jar Binks."
        print(f"Sending messages to {url}:", *messages, sep="\n\t")
        await probe(url, messages, timeout=10 * MINUTES)


```

该测试依赖于以下两个辅助函数，
它 ping 服务器并等待流的有效响应。

`probe` 辅助函数专门忽略
副本时可能发生的两种类型的错误
正在启动——客户端超时，服务器响应 5XX。
Modal 返回 [503 服务不可用状态](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503)
当模态服务器没有实时副本时。

我们在每个请求中包含一个标头——
`Modal-Session-ID`。
这是客户端模态服务器使用的标头
确定哪些请求应路由到同一个容器
（注意事项如下所述）。

与该键关联的值
用于将请求映射到容器上，以便
当容器集合固定时，请求具有相同值的
被发送到同一个容器。
每个不同的多轮交互将其设置为不同的值
（原型是与聊天机器人的用户对话线程）
提高KV缓存命中率。
此外，当容器集发生变化时（例如由于自动缩放），
重新平衡会话，使负载大致均匀分布，
很像[RAID重新平衡](https://cordero.me/understanding-raid-rebalance-ensuring-optimal-performance-and-data-protection/)。
这确保没有容器最终成为处理过多客户端请求的“热点”。

```python
async def probe(url, messages=None, timeout=20 * MINUTES):
    if messages is None:
        messages = [{"role": "user", "content": "Tell me a joke."}]

    client_id = str(0)  # set this to some string per multi-turn interaction
    # often a UUID per "conversation"
    headers = {"Modal-Session-ID": client_id}
    deadline = time.time() + timeout
    async with aiohttp.ClientSession(base_url=url, headers=headers) as session:
        while time.time() < deadline:
            try:
                await _send_request_streaming(session, messages)
                return
            except asyncio.TimeoutError:
                await asyncio.sleep(1)
            except aiohttp.client_exceptions.ClientResponseError as e:
                if e.status == 503:
                    await asyncio.sleep(1)
                    continue
                raise e
    raise TimeoutError(f"No response from server within {timeout} seconds")


async def _send_request_streaming(
    session: aiohttp.ClientSession, messages: list, timeout: int | None = None
) -> None:
    payload = {"messages": messages, "stream": True}
    headers = {"Accept": "text/event-stream"}

    async with session.post(
        "/v1/chat/completions", json=payload, headers=headers, timeout=timeout
    ) as resp:
        resp.raise_for_status()
        full_text = ""

        async for raw in resp.content:
            line = raw.decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            # Server-Sent Events format: "data: ...."
            if not line.startswith("data:"):
                continue

            data = line[len("data:") :].strip()
            if data == "[DONE]":
                break

            try:
                evt = json.loads(data)
            except json.JSONDecodeError:
                # ignore any non-JSON keepalive
                continue

            delta = (evt.get("choices") or [{}])[0].get("delta") or {}
            chunk = delta.get("content") or delta.get("reasoning_content")

            if chunk:
                print(chunk, end="", flush="\n" in chunk or "." in chunk)
                full_text += chunk
        print()  # newline after stream completes

```