<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 Gemma 和 vLLM 运行 OpenAI 兼容的 LLM 推理

在此示例中，我们展示了如何在 Modal 上以 OpenAI 兼容模式运行 vLLM 服务器。

LLM 不仅仅做模型语言：他们聊天、生成 JSON 和 XML、运行代码等等。
这使得他们的界面变得复杂，远远超出了“文本输入、文本输出”的范围。
OpenAI 的 API 已成为该接口的标准，
它受到 [vLLM](https://docs.vllm.ai/en/latest/) 等开源 LLM 服务框架的支持。

此示例旨在演示在 Modal 上部署 LLM 推理的基础知识。
有关如何优化性能的更多信息，请参阅
[本指南](https://modal.com/docs/guide/high-performance-llm-inference)
并查看我们的
[LLM工程师年鉴](https://modal.com/llm-almanac)。

我们的示例存储库还包括用于运行客户端和 OpenAI 兼容 API 负载测试的脚本
[这里](https://github.com/modal-labs/modal-examples/tree/main/06_gpu_and_ml/llm-serving/openai_compatible)。

## 设置容器镜像

我们的首要任务是定义我们的服务器运行的环境：
[容器`Image`](https://modal.com/docs/guide/custom-container)。
vLLM 可以与 `uv pip` 一起安装，因为 Modal [提供 CUDA 驱动程序](https://modal.com/docs/guide/cuda)。

```python
import json
from typing import Any

import aiohttp
import modal

vllm_image = (
    modal.Image.from_registry("nvidia/cuda:12.9.0-devel-ubuntu22.04", add_python="3.12")
    .entrypoint([])
    .uv_pip_install("vllm==0.21.0")
    .env(
        {
            "HF_XET_HIGH_PERFORMANCE": "1",  # faster model transfers
            "VLLM_LOG_STATS_INTERVAL": "1",  # more frequent metrics logging
        }
    )
)

```

## 下载模型权重

我们将运行一个预训练的基础模型——
[Google 的 Gemma 4](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/)。
它还可以将图像、视频和音频作为输入，
虽然我们不会在这里使用它。

我们将使用 26BA4B 变体，[`google/gemma-4-26B-A4B-it`](https://huggingface.co/google/gemma-4-26B-A4B-it)。
该变体经过推理能力训练，使其能够
提高其生成的响应的质量。
它有 `26B`illion 个参数，其中 `4B`illion 是 `A`active
在处理每个令牌时。

您可以通过更改下面的字符串将此模型替换为另一个模型，
不过您可能还需要调整一些服务器配置。
单个 H200 GPU 具有足够的 VRAM 来存储这个 26,000,000,000 个参数模型
以及一个大的KV缓存。

```python
MODEL_NAME = "google/gemma-4-26B-A4B-it"
MODEL_REVISION = "47b6801b24d15ff9bcd8c96dfaea0be9ed3a0301"  # avoid nasty surprises when repos update!

```

虽然 vLLM 会按需从 Hugging Face 下载权重，
我们想缓存它们，这样我们就不会在每次服务器启动时都这样做。
我们将使用 [Modal Volumes](https://modal.com/docs/guide/volumes) 作为缓存。
模态卷本质上是一个“共享磁盘”，所有模态函数都可以像普通磁盘一样访问它。
有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

```python
hf_cache_vol = modal.Volume.from_name("huggingface-cache", create_if_missing=True)

```

我们还将在 Modal Volume 中缓存一些 vLLM 的 JIT 编译工件。

```python
vllm_cache_vol = modal.Volume.from_name("vllm-cache", create_if_missing=True)

```

## 配置 vLLM

### 权衡快速启动和代币生成性能
vLLM 采用动态和即时编译来维持额外的性能，而无需编写太多自定义内核，
例如通过 Torch 编译器和 CUDA 图形捕获。
这些编译功能会产生延迟，以换取生成过程中更低的延迟和更高的吞吐量。
此延迟通常为数十秒到几分钟，从缓存加载时减少到约十秒。
我们通过下面的 `FAST_BOOT` 变量来控制这种权衡。

```python
FAST_BOOT = False

```

如果您运行的 LLM 服务经常从 0 开始扩展（频繁[“冷启动”](https://modal.com/docs/guide/cold-start)）
您可能想将其设置为`True`，或考虑[GPU内存快照](https://modal.com/docs/guide/memory-snapshots)。
当您迭代服务器配置时，设置此项也很有用。

如果您运行的 LLM 服务通常运行多个副本，请将其设置为 `False` 以提高性能。

有关`FAST_BOOT`控制的参数的详细信息，请参阅下面的代码。

### 特定于型号的配置

几乎所有模型都需要通过命令行标志进行一定量的配置，
尤其是为了达到最佳性能。

我们在下面的代码中设置这些标志，大致遵循
[vLLM 文档中的使用指南](https://docs.vllm.ai/projects/recipes/en/latest/Google/Gemma4.html)。

例如，我们关闭多模式功能以节省 [GPU RAM](https://modal.com/gpu-glossary/device-hardware/gpu-ram)，
然后我们激活[内置多令牌预测（MTP）]（https://blog.google/innovation-and-ai/technology/developers-tools/multi-token-prediction-gemma-4/）
推测性解码可在较低并发情况下提高吞吐量。

```python
SPECULATIVE_MODEL_NAME = "google/gemma-4-26B-A4B-it-assistant"
SPECULATIVE_MODEL_REVISION = "f188f476dc11dd5bb3014dc861529d316bce49d3"

```

有关为自己的法学硕士服务时可以期望的性能的更多信息，请参阅
[我们的LLM引擎性能基准](https://modal.com/llm-almanac)。

## 构建 vLLM 引擎并为其提供服务

下面的类生成一个在端口 8000 侦听的 vLLM 实例，为我们的模型提供请求。
我们将其包装在 [`@app.server`](https://modal.com/docs/guide/servers) 装饰器中将其连接到互联网。

服务器通过`subprocess.Popen`运行在独立进程中，并且只开始接受请求
一旦模型启动并且进程准备好侦听配置的端口。

```python
app = modal.App("example-vllm-inference")

N_GPU = 1
MINUTES = 60  # seconds
VLLM_PORT = 8000
ROUTING_REGION = "us-east"


@app.server(
    image=vllm_image,
    gpu=f"H200:{N_GPU}",
    scaledown_window=15 * MINUTES,  # how long should we stay up with no requests?
    startup_timeout=10 * MINUTES,  # how long should we wait for container start?
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
    port=VLLM_PORT,
    routing_region=ROUTING_REGION,
    target_concurrency=100,  # how many requests can one replica handle? tune carefully!
    unauthenticated=True,  # to make the endpoint publicly accessible
)
class Server:
    @modal.enter()
    def start(self):
        import subprocess

        cmd = [
            "vllm",
            "serve",
            MODEL_NAME,
            "--revision",
            MODEL_REVISION,
            "--served-model-name",
            MODEL_NAME,
            "llm",
            "--host",
            "0.0.0.0",
            "--port",
            str(VLLM_PORT),
            "--uvicorn-log-level=info",
            "--async-scheduling",
        ]

        # enforce-eager disables both Torch compilation and CUDA graph capture
        # default is no-enforce-eager. see the --compilation-config flag for tighter control
        cmd += ["--enforce-eager" if FAST_BOOT else "--no-enforce-eager"]

        # assume multiple GPUs are for splitting up large matrix multiplications
        cmd += ["--tensor-parallel-size", str(N_GPU)]

        # add model-specific configuration
        cmd += [
            # skip multimedia support, just language
            "--limit-mm-per-prompt",
            json.dumps({"image": 0, "video": 0, "audio": 0}),
            # enable reasoning and tool use
            "--enable-auto-tool-choice",
            "--reasoning-parser",
            "gemma4",
            "--tool-call-parser",
            "gemma4",
        ]

        # add speculative decoding
        cmd += [
            "--speculative-config",
            json.dumps(
                {
                    "model": SPECULATIVE_MODEL_NAME,
                    "revision": SPECULATIVE_MODEL_REVISION,
                    "num_speculative_tokens": 4,
                }
            ),
        ]

        print(*cmd)

        self.process = subprocess.Popen(cmd)

    @modal.exit()
    def stop(self):
        self.process.terminate()


```

## 部署服务器

要在 Modal 上部署 API，只需运行

```bash
modal deploy vllm_inference.py
```

这将在 Modal 上创建一个新应用程序，如果尚未构建，则为其构建容器镜像，
并部署应用程序。

## 与服务器交互

部署后，您将看到命令行中出现一个 URL，
类似于`https://your-workspace-name--example-vllm-inference-server.us-east.modal.direct`。

要在 Python 中以编程方式与 API 交互，我们推荐使用 `openai` 库。
请参阅示例存储库中的 `client.py` 脚本
[这里](https://github.com/modal-labs/modal-examples/tree/main/06_gpu_and_ml/llm-serving/openai_compatible)
试一试：

```bash
# pip install openai==1.76.0
python openai_compatible/client.py
```

## 测试服务器

为了更容易测试服务器设置，我们还包含一个 `local_entrypoint`
进行健康检查然后访问服务器。然而，与模态函数相反
当服务器没有活动容器时，请求将被拒绝，并显示 503 服务不可用状态。
因此，我们必须在客户端代码中手动处理这个问题。

如果执行命令

```bash
modal run vllm_inference.py
```

服务器的新副本将在 Modal 上启动，同时
下面的代码在您的本地计算机上执行。

可以将其视为在 `if __name__ == "__main__"` 内编写简单的测试
Python 脚本块，但适用于云部署！

```python
@app.local_entrypoint()
async def test(test_timeout=15 * MINUTES, content=None, twice=True):
    import asyncio
    import time

    url = await Server.get_url.aio()

    system_prompt = {
        "role": "system",
        "content": "You are a pirate who can't help but drop sly reminders that he went to Harvard.",
    }
    if content is None:
        content = "Explain the singular value decomposition."

    messages = [  # OpenAI chat format
        system_prompt,
        {"role": "user", "content": content},
    ]

    async with aiohttp.ClientSession(base_url=url) as session:
        print(f"Running health check for server at {url}")
        deadline = time.time() + test_timeout - 1 * MINUTES
        while time.time() < deadline:
            async with session.get(
                "/health", timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status == 200:
                    break
                if resp.status == 503:
                    await asyncio.sleep(1)
                    continue
                assert False, (
                    f"Failed health check for server at {url}: HTTP {resp.status}"
                )
        else:
            assert False, f"Failed health check for server at {url}"
        print(f"Successful health check for server at {url}")

        print(f"Sending messages to {url}:", *messages, sep="\n\t")
        await _send_request(session, "llm", messages)
        if twice:
            messages[0]["content"] = "You are Jar Jar Binks."
            print(f"Sending messages to {url}:", *messages, sep="\n\t")
            await _send_request(session, "llm", messages)


async def _send_request(
    session: aiohttp.ClientSession, model: str, messages: list
) -> None:
    # `stream=True` tells an OpenAI-compatible backend to stream chunks
    payload: dict[str, Any] = {"messages": messages, "model": model, "stream": True}
    # explicitly enable thinking for this model
    payload["chat_template_kwargs"] = {"enable_thinking": True}

    headers = {"Content-Type": "application/json", "Accept": "text/event-stream"}

    async with session.post(
        "/v1/chat/completions", json=payload, headers=headers
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
            delta = chunk["choices"][0]["delta"]
            content = (
                delta.get("content")
                or delta.get("reasoning")
                or delta.get("reasoning_content")
            )
            if content:
                print(content, end="")
            else:
                print("\n", chunk)
    print()


```

我们还提供了一个使用负载测试设置的基本示例
`load_test.py` 脚本中的`locust` [此处](https://github.com/modal-labs/modal-examples/tree/main/06_gpu_and_ml/llm-serving/openai_compatible)：

```bash
modal run openai_compatible/load_test.py
```