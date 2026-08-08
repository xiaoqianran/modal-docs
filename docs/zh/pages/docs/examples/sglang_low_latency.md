<!-- modal-docs: machine-translated zh-CN from English source -->

# 具有 SGLang 和 Modal 的低延迟 Qwen 3.6

在此示例中，我们展示了如何在 Modal 上以低延迟提供 [SGLang](https://github.com/sgl-project/sglang)。

此示例旨在演示运行所需的一切
以最高性能和最低延迟进行推理，
因此它包含 SGLang 和 Modal 的高级功能。
有关 LLM 服务的更简单介绍，请参阅
[这个例子](https://modal.com/docs/examples/llm_inference)。

为了最小化路由开销，我们使用`@app.server`，
它在 Modal 上使用新的低延迟路由服务，专为延迟敏感的推理工作负载而设计。
这使我们能够更好地控制路由，但随着能力的增强，责任也随之增加。

## 设置容器镜像

我们的首要任务是定义我们的服务器运行的环境：
[容器`Image`](https://modal.com/docs/guide/images)。

我们从提供的容器镜像开始
[由 SGLang 团队通过 Dockerhub 制作](https://hub.docker.com/r/lmsysorg/sglang/tags)。
经过一番清理后，我们安装了具有一些低延迟技巧的更新版本
Modal 团队正在为 SGLang 做出贡献（如下所述）。

当我们这样做时，我们导入远程和本地（用于部署）所需的依赖项。

```python
import asyncio
import json
import os
import subprocess
import time

import aiohttp
import modal

MINUTES = 60  # seconds
GIT_SHA = "5244693e308eaf05da17f28cca6bcc922270fd3c"

sglang_image = (
    modal.Image.from_registry("lmsysorg/sglang:v0.5.12.post1-cu130")
    .entrypoint(
        []  # silence chatty logs on container start
    )
    .run_commands(
        "rm -rf /root/.cache/huggingface"  # clean up image
    )
    .uv_pip_install(
        f"git+https://github.com/sgl-project/sglang.git@{GIT_SHA}#subdirectory=python"
    )
)

```
我们还选择 [GPU](https://modal.com/docs/guide/gpu) 来部署我们的推理服务器。
我们选择【H100 GPU】(https://modal.com/blog/introducing-h100),
提供卓越的性价比
并支持[8位浮点运算](https://modal.com/llm-almanac/quant-formats)，即
相关[GPU内核](https://modal.com/gpu-glossary/device-software/kernel)中良好支持的最低精度
跨越各种模型架构。

下面，我们讨论GPU数量的选择。

```python
GPU_TYPE, N_GPUS = "H100!", 2
GPU = f"{GPU_TYPE}:{N_GPUS}"

```

### 加载和缓存模型权重

我们将服务【阿里巴巴Qwen 3.6 LLM】(https://qwen.ai/blog?id=qwen3.6)。
为了降低延迟，我们选择具有 3B 个主动参数的 35B 专家混合模型采用较低精度浮点格式 (FP8)。
专家稀疏性和较低精度减少了需要加载的数据量
[从GPU RAM到SM SRAM](https://modal.com/gpu-glossary/perf/memory-bandwidth)
在每次前传中。

```python
MODEL_NAME = "Qwen/Qwen3.6-35B-A3B-FP8"
MODEL_REVISION = (  # pin revision id to avoid nasty surprises!
    "95a723d08a9490559dae23d0cff1d9466213d989"  # latest commit as of 2026-04-23, from release
)

```

我们[从 Hugging Face Hub](https://huggingface.co/collections/Qwen/qwen36) 加载模型。

但我们不想每次启动服务器时都从 Hub 加载模型。
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
### 缓存编译工件

模型权重并不是我们想要缓存的唯一内容。

通常，像 SGLang 这样的 LLM 推理服务器不直接提供自己的内核。
他们从各种来源获取高性能内核。

从版本 `0.5.12` 开始，SGLang 的默认内核后端
用于 FP8 矩阵乘法 (`fp8-gemm-backend`)
关于Hopper [SM架构](https://modal.com/gpu-glossary/device-hardware/streaming-multiprocessor-architecture)
像 H100 这样的 GPU
[深GEMM](https://github.com/deepseek-ai/DeepGEMM)
由 DeepSeek 提供。

这些内核的二进制文件不包含在 SGLang Docker 映像中，因此
必须是[JIT编译](https://modal.com/gpu-glossary/host-software/nvrtc)。
我们也将它们存储在模态体积中。

```python
DG_CACHE_VOL = modal.Volume.from_name("deepgemm-cache", create_if_missing=True)
DG_CACHE_PATH = "/root/.cache/deep_gemm"

```

JIT DeepGEMM 内核默认处于启用状态，但我们通过环境变量显式启用它们。

```python
sglang_image = sglang_image.env({"SGLANG_ENABLE_JIT_DEEPGEMM": "1"})

```

我们通过在 `subprocess` 中运行 `sglang.compile_deep_gemm` 来触发编译
从 Python 函数开始。

```python
def compile_deep_gemm():
    import os

    if int(os.environ.get("SGLANG_ENABLE_JIT_DEEPGEMM", "1")):
        subprocess.run(
            f"python3 -m sglang.compile_deep_gemm --model-path {MODEL_NAME} --revision {MODEL_REVISION} --tp {N_GPUS}",
            shell=True,
        )


```

我们在 Modal 上运行这个 Python 函数作为构建图像的一部分
这样它就可以访问适当的 GPU 以及我们的模型和编译工件的缓存。

```python
sglang_image = sglang_image.run_function(
    compile_deep_gemm,
    volumes={DG_CACHE_PATH: DG_CACHE_VOL, HF_CACHE_PATH: HF_CACHE_VOL},
    gpu=GPU,
)

```

## 配置 SGLang 以实现最小延迟

像 SGLang 这样的 LLM 推理引擎配备了各种“旋钮”来调整性能。

要确定适当的配置来实现延迟和吞吐量服务目标，
我们推荐[特定于应用程序的基准测试](https://modal.com/llm-almanac/how-to-benchmark)
以[已发布的通用基准](https://modal.com/llm-almanac/advisor)为指导。

在这里，我们假设主要目标是最小化每个请求的延迟，而不考虑吞吐量
（因此考虑到成本）并介绍一些关键选择。

每个请求延迟的主要贡献者是移动所有模型权重的时间（数 GB）
来自[GPU RAM](https://modal.com/gpu-glossary/device-hardware/gpu-ram)
进入[流式多处理器中的SRAM](https://modal.com/gpu-glossary/device-hardware/streaming-multiprocessor)，
在处理请求的过程中必须至少执行一次——
天真地，每个请求每个令牌一次。
所花费的时间受到以下限制
[内存带宽](https://modal.com/gpu-glossary/perf/memory-bandwidth)
这两个存储之间的数据量在现代数据中心 GPU 上约为每秒 TB 量级。
对于千兆字节规模的模型，生成令牌将需要几毫秒的时间——
或用户习惯的千代币响应的整秒。

我们使用两种策略来减少[内存限制](https://modal.com/gpu-glossary/perf/memory-bound)工作负载中的延迟：

* 跨多个 GPU 运行，以获得更多聚合带宽和更快的加载速度，并具有张量并行性

* 每次加载生成更多令牌，并进行推测解码

### 通过张量并行增加有效内存带宽
在两台 H100 上运行 SGLang 将使我们的效率加倍
[内存带宽](https://modal.com/gpu-glossary/perf/memory-bandwidth)
在大矩阵乘法期间。

矩阵也称为张量，因此该策略利用了
矩阵乘法中固有的并行性被称为“张量并行性”。

实际加速通常小于基于可用带宽的“餐巾纸数学”获得的加速 -
在开发此示例时，我们观察到从一台 H100 转向两台 H100 时速度提高了约 30%，而不是 100%。

### 通过推测解码并行化令牌生成

Transformer 和循环语言模型按顺序生成文本：
步骤 `i` 的模型输出是步骤 `i+1` 输入的一部分。
根据阿姆达尔定律，连续工作成为瓶颈
随着并行度的增加，其他步骤变得更快。

解决方案是在每一步中生成更多代币。
在不改变模型行为的情况下实现此目的的主要技术称为
[*推测解码*](https://developer.nvidia.com/blog/an-introduction-to-speculative-decoding-for-reducing-latency-in-ai-inference/),
它“推测”许多草稿令牌并与主要模型并行验证它们。

推测解码技术本身有许多参数，其中最重要的是
其中是用于生成草稿令牌的技术。
基于 n 元语法的简单技术是一个很好的起点。
许多模型在发布时都内置了基于以下的推测：
[多令牌预测](https://docs.vllm.ai/projects/ascend/en/main/user_guide/feature_guide/Multi_Token_Prediction.html),
在 SGLang 中也称为 [EAGLE](https://arxiv.org/abs/2401.15077)。

但我们最喜欢的技术是[DFLASH](https://arxiv.org/abs/2602.06036)
它并行运行草稿令牌生成，增加了草稿模型的
算术强度。

```python
speculative_config = {
    "speculative-algorithm": "DFLASH",
    "speculative-draft-model-path": "z-lab/Qwen3.6-35B-A3B-DFlash",
    "speculative-draft-model-revision": "42d3b34d588423cdae7ba8f53a8cf7789346a719",
    "mamba-scheduler-strategy": "extra_buffer",  # required for spec dec with Qwen 3.X hybrid arch
}

```

我们从[模型卡]（https://huggingface.co/z-lab/Qwen3.6-35B-A3B-DFlash）调整该投机者的默认配置。
特别是，我们使用较小的草案代币数量`8`，即最小值，
而不是默认的`16`。我们在这里使用 FP8 量化模型
并且测试提示是创意写作任务，因此接受长度
通常低于 `8` 并且额外的块没有足够的
接受的令牌值得额外的计算。

```python
speculative_config |= {
    "speculative-num-draft-tokens": 8,
}

speculative_env = {
    "SGLANG_ENABLE_OVERLAP_PLAN_STREAM": "1",  # never block the GPU!
}

```

请注意，与张量并行不同，
推测性解码不适合
[计算限制](https://modal.com/gpu-glossary/perf/compute-bound)
工作负载，因为它通常会增加对
[算术带宽](https://modal.com/gpu-glossary/perf/arithmetic-bandwidth)。
因此，对于允许更大批量请求的工作负载，
在数十到数百的规模上，不建议推测解码。

## 定义推理服务器和基础设施
### 选择基础设施以最小化延迟

最大限度地减少延迟需要客户端和服务器在同一地点。

因此，对于 Modal 上的低延迟 LLM 推理服务，您必须选择一个
[云域](https://modal.com/docs/guide/region-selection)
对于运行推理的 GPU 加速容器
以及将请求转发给它们的内部模态代理
作为定义模态服务器的一部分。

在这里，我们假设用户主要位于美洲北半部
并选择为他们服务的`us`云区域。
这最多会导致几十毫秒的往返时间。

```python
REGION = "us"

```

与 LLM 多轮交互的延迟为
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
当服务器过载时。即使除了排队之外，还有回复超过一定的最小数量后，每个用户通常会变慢
并发请求。

因此，我们为在单个容器上运行的输入数量设置了目标
使用 [`target_concurrency`](https://modal.com/docs/reference/modal.concurrent) 参数。

```python
TARGET_INPUTS = 10

```

一般来说，这种选择需要作为
[LLM推理机基准测试](https://modal.com/llm-almanac/how-to-benchmark)。

### 使用`modal.Server`控制容器生命周期

我们总结了我们对基础设施所做的所有选择
我们的推理服务器变成了许多 Python 装饰器
我们将其应用于封装逻辑的 Python 类
运行我们的服务器。

关键的装饰器是：

* [`@app.server`](https://modal.com/docs/guide/lifecycle-functions) 定义我们服务的核心。
我们附加图像、请求 GPU、附加缓存卷、指定区域并配置自动缩放。
  这个装饰器还将我们的 python 代码转换为 HTTP 服务器（即在所有容器前面使用带有 URL 的代理）。
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
            subprocess.CalledProcessError,
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

完成所有这些后，我们就可以定义我们的高性能、低延迟
LLM 推理服务器。

```python
app = modal.App(name="example-server-sglang-low-latency")
PORT = 8000
ROUTING_REGION = "us-west"


@app.server(
    image=sglang_image,
    gpu=GPU,
    volumes={HF_CACHE_PATH: HF_CACHE_VOL, DG_CACHE_PATH: DG_CACHE_VOL},
    compute_region=REGION,
    min_containers=MIN_CONTAINERS,
    startup_timeout=20 * MINUTES,
    port=PORT,  # wrapped code must listen on this port
    routing_region=ROUTING_REGION,  # location of proxies, should be close to Cls region
    exit_grace_period=15,  # seconds, time to finish up requests when closing down
    target_concurrency=TARGET_INPUTS,
    unauthenticated=True,
)
class SGLang:
    @modal.enter()
    def startup(self):
        """Start the SGLang server and block until it is healthy, then warm it up and put it to sleep."""
        cmd = [
            "python",
            "-m",
            "sglang.launch_server",
            "--model-path",
            MODEL_NAME,
            "--revision",
            MODEL_REVISION,
            "--served-model-name",
            MODEL_NAME,
            "--host",
            "0.0.0.0",
            "--port",
            f"{PORT}",
            "--tp",  # use all GPUs to split up tensor-parallel operations
            f"{N_GPUS}",
            "--cuda-graph-max-bs",  # only capture CUDA graphs for batch sizes we're likely to observe
            f"{TARGET_INPUTS * 2}",
            "--enable-metrics",  # expose metrics endpoints for telemetry
            "--decode-log-interval",  # how often to log during decoding, in tokens
            "10",
            "--mem-fraction",  # leave space for speculative model
            "0.8",
            "--trust-remote-code",  # for speculative model
        ]

        cmd += [  # add speculative config
            item for k, v in speculative_config.items() for item in (f"--{k}", str(v))
        ]

        self.process = subprocess.Popen(cmd, env=os.environ | speculative_env)
        wait_ready(self.process)
        warmup()

    @modal.exit()
    def stop(self):
        self.process.terminate()


```

## 部署服务器

要在 Modal 上部署服务器，只需运行

```bash
modal deploy sglang_low_latency.py
```
这将在 Modal 上创建一个新的应用程序，并为其构建容器映像（如果尚未构建）。

## 与服务器交互

部署后，您将看到命令行中出现一个 URL，
类似于`https://your-workspace-name--example-sglang-low-latency-sglang.us-west.modal.direct`。

您可以找到[交互式 Swagger UI 文档](https://swagger.io/tools/swagger-ui/)
在该 URL 的 `/docs` 路由处，即 `https://your-workspace-name--example-sglang-low-latency-sglang.us-west.modal.direct/docs`。
这些文档描述了每条路线并指示了预期的输入和输出
并将请求翻译成`curl`命令。
对于简单的路由，您甚至可以直接从文档页面发送请求。

注意：当没有可用的副本时，Modal 将响应[503服务不可用状态](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503)。
在浏览器中，您只需点击刷新，直到出现文档页面。
您可以在[模态仪表板](https://modal.com/apps)上查看应用程序及其容器的状态。

## 测试服务器

为了更轻松地测试服务器设置，我们还包含一个 `local_entrypoint`
用一个简单的客户端访问服务器。

如果执行命令

```bash
modal run sglang_low_latency.py
```

服务器的新副本将在 Modal 上启动，同时
下面的代码在您的本地计算机上执行。

可以将其视为在 `if __name__ == "__main__"` 内编写简单的测试
Python 脚本块，但适用于云部署！

```python
@app.local_entrypoint()
async def test(test_timeout=10 * MINUTES, prompt=None, twice=True):
    url = await SGLang.get_url.aio()

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
        await probe(url, messages, timeout=test_timeout)


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
这是模态服务器的客户端使用的标头
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
async def probe(url, messages=None, timeout=5 * MINUTES):
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
            chunk = delta.get("content")

            if chunk:
                print(chunk, end="", flush="\n" in chunk or "." in chunk)
                full_text += chunk
        print()  # newline after stream completes

```