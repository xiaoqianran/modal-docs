<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 SGLang 和 Modal 部署 DeepSeek-V4-Flash

我们将在这个例子中展示如何服务
[DeepSeek-V4-Flash](https://arxiv.org/abs/2606.19348)，专家混合体 (MoE)
模型总参数为 284B，有效参数为 13B。

它的推理性能与其更大的变体相当，
[DeepSeek-V4-Pro 预览](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)，同时在方面更加紧凑
模型参数。

## 设置容器镜像

目前存在起草者错误地重写状态的问题。
虽然尚未合并，但我们在此应用修复
手动【打开PR】(https://github.com/sgl-project/sglang/pull/32183)
到 SGLang 团队提供的容器镜像。

```python
import json
import shlex
import subprocess
import time
import urllib.error
import urllib.request

import modal

MINUTES = 60  # seconds
GB = 1024  # mb

PR32183_DIFF_URL = (
    "https://github.com/sgl-project/sglang/compare/"
    "5387e23ecd7dde4c383ae857983686e6a73bddf3..."
    "22ef431215b1d8529eaebd8e8c6de9510390afaf.diff"
)
PR32183_DIFF_SHA256 = "ddd65902ba570c158f9d6783604cf7d9f2f13bf41994fcbf330a68ea1909923c"

sglang_image = (
    modal.Image.from_registry("lmsysorg/sglang:nightly-dev-cu13-20260729-16a52bff")
    .entrypoint([])  # silence chatty logs on container start
    .run_commands(
        f"curl -fsSL {PR32183_DIFF_URL} -o /tmp/pr32183.diff",
        f"echo '{PR32183_DIFF_SHA256}  /tmp/pr32183.diff' | sha256sum -c -",
        "cd /sgl-workspace/sglang"
        " && git apply --stat --exclude=test/* /tmp/pr32183.diff"
        " && git apply --exclude=test/* /tmp/pr32183.diff",
        "rm -rf /root/.cache/huggingface",
    )
)

```

### 加载并缓存模型权重和内核

如果您经过身份验证，从 Hugging Face Hub 的下载速度会更快，
因此我们添加一个 Hugging Face 标记作为 [Modal Secret](https://modal.com/docs/guide/secrets)：

```
modal secret create huggingface-secret HF_TOKEN=hf_...
```

```python
MODEL_NAME = "deepseek-ai/DeepSeek-V4-Flash-0731"
MODEL_REVISION = "9e165c30e2704aec5d9d593cce3eebd58bbef1cb"

hf_secret = modal.Secret.from_name("huggingface-secret")

```

我们不想每次启动服务器时都从集线器加载模型。
因此，我们从 [Modal Volume](https://modal.com/docs/guide/volumes) 加载缓存的权重。

```python
HF_CACHE_DIR = "/root/.cache/huggingface"
hf_cache_vol = modal.Volume.from_name("huggingface-cache", create_if_missing=True)

```

我们也想开启
[高性能下载](https://huggingface.co/docs/hub/en/models-downloading#faster-downloads)
使我们的网络带宽完全饱和。

```python
sglang_image = sglang_image.env(
    {"HF_HUB_CACHE": HF_CACHE_DIR, "HF_XET_HIGH_PERFORMANCE": "1"}
)


def download_model(repo_id, revision=None):
    from huggingface_hub import snapshot_download

    snapshot_download(repo_id=repo_id, revision=revision, max_workers=16)


sglang_image = sglang_image.run_function(
    download_model,
    volumes={HF_CACHE_DIR: hf_cache_vol},
    secrets=[hf_secret],
    args=(MODEL_NAME, MODEL_REVISION),
    timeout=4 * 60 * MINUTES,
    cpu=8,
)

```

作为加载过程的一部分，该模型编译 DeepGEMM 和 FlashInfer 内核。
为了避免冷启动时重新编译，我们指定一个 Volume 的路径
供编译后的内核居住。

```python
DG_CACHE_DIR = "/cache/deep_gemm"
FLASHINFER_CACHE_DIR = "/root/.cache/sglang/flashinfer"

dg_cache_vol = modal.Volume.from_name("sglang-deepgemm-cache", create_if_missing=True)
flashinfer_cache_vol = modal.Volume.from_name(
    "flashinfer-autotune-cache", create_if_missing=True
)

sglang_image = sglang_image.env(
    {
        "SGLANG_DG_CACHE_DIR": DG_CACHE_DIR,
        "SGLANG_JIT_DEEPGEMM_FAST_WARMUP": "1",
        "TILELANG_CACHE_DIR": f"{DG_CACHE_DIR}/tilelang",
    }
)

```

## 配置基础设施

我们选择一个 [GPU](https://modal.com/docs/guide/gpu) 来部署我们的推理服务器。
方便的是，单个 B300 可以保存模型权重、KV 缓存和推测解码模块。
它提供卓越的性价比并支持 8 位和 4 位
[量化浮点](https://modal.com/llm-almanac/quant-formats)运算。

```python
GPU_TYPE, GPU_COUNT = "B300", 1
CPU = 8
MEMORY = 96 * GB

```

对于生产规模的LLM推理服务，通常有
足够的请求足以证明始终保持至少一个副本运行。
这对于达到延迟目标尤其重要。
这里我们将`min_containers`设置为`0`，这样您就不会意外产生费用
当你运行完这个例子后。

```python
MIN_CONTAINERS = 0  # set to 1 in production to keep a warm replica

```

Modal 使您能够决定如何扩大和缩小副本
响应负载。如果没有自动缩放，用户的请求将排队
当服务器过载或只是面临更高的延迟时
一旦超过某个最小并发请求数。

```python
TARGET_INPUTS = 24

```

Modal 认为新的副本准备好接收输入，一旦
[`modal.enter`](https://modal.com/docs/guide/lifecycle-functions)
方法已退出并且容器接受连接。
为了确保我们的服务器实际上已准备好输入，
我们定义辅助函数来检查并确保服务器准备就绪
来自容器内和本地客户端。

```python
STARTUP_TIMEOUT = 60 * MINUTES


def is_server_up(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            return response.status == 200
    except (urllib.error.URLError, OSError, TimeoutError):
        return False


def wait_ready(proc: subprocess.Popen):
    url = f"http://localhost:{DEFAULT_PORT}/health"
    print(f"waiting for server to be ready at {url}")

    while True:
        if proc.poll() is not None:
            raise RuntimeError(
                f"SGLang exited with code {proc.returncode} before becoming healthy"
            )
        if is_server_up(url):
            print("server is ready!")
            return
        time.sleep(5)


def warmup():
    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": "Hello, how are you?"}],
        "max_tokens": 16,
    }
    for _ in range(3):
        req = urllib.request.Request(
            f"http://localhost:{DEFAULT_PORT}/v1/chat/completions",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=5 * MINUTES) as resp:
                resp.read()
        except (urllib.error.URLError, OSError, TimeoutError) as exc:
            print(f"warmup request failed, continuing: {exc}")


def wait_for_endpoint(url: str, timeout: int = STARTUP_TIMEOUT) -> None:
    deadline = time.monotonic() + timeout
    health = f"{url.rstrip('/')}/health"
    while True:
        if is_server_up(health):
            return
        if time.monotonic() >= deadline:
            raise TimeoutError("Timed out waiting for the Server endpoint.")
        time.sleep(5)


```

## 定义推理服务器

为了获得最佳性能，我们设置了一些定制的环境变量。

```python
sglang_image = sglang_image.env(
    {
        "NCCL_CUMEM_ENABLE": "1",
        "PYTORCH_CUDA_ALLOC_CONF": "expandable_segments:True",
        "SGLANG_DEFAULT_THINKING": "false",
        "SGLANG_TIMEOUT_KEEP_ALIVE": f"{5 * MINUTES}",
        "TORCHINDUCTOR_COMPILE_THREADS": "1",
    }
)

```

下面的引擎标志来自
[SGLang DeepSeek-V4 食谱](https://docs.sglang.io/cookbook/autoregressive/DeepSeek/DeepSeek-V4#hw=b300\&variant=flash-official\&quant=fp4\&strategy=low-latency\&nodes=single)。

```python
DEFAULT_PORT = 8000


def _server_command() -> list[str]:
    cmd = [
        "sglang",
        "serve",
        "--model-path",
        MODEL_NAME,
        "--served-model-name",
        MODEL_NAME,
        "--revision",
        MODEL_REVISION,
        "--host",
        "0.0.0.0",
        "--port",
        str(DEFAULT_PORT),
        "--tp",
        str(GPU_COUNT),
        "--chunked-prefill-size",
        "4096",
        "--context-length",
        "268000",
        "--cuda-graph-max-bs-decode",
        "64",
        "--decode-log-interval",
        "200",
        "--default-chat-template-kwargs",
        '{"thinking":false}',
        "--disable-flashinfer-autotune",
        "--dist-timeout",
        f"{60 * MINUTES}",
        "--max-running-requests",
        "64",
        "--mem-fraction-static",
        "0.90",
        "--moe-a2a-backend",
        "none",
        "--moe-runner-backend",
        "flashinfer_mxfp4",
        "--reasoning-parser",
        "deepseek-v4",
        "--speculative-algorithm",
        "DSPARK",
        "--swa-full-tokens-ratio",
        "0.1",
        "--tool-call-parser",
        "deepseekv4",
        "--trust-remote-code",
        "--skip-server-warmup",
    ]
    return cmd


```

接下来是定义我们的推理服务器的主要事件。

```python
app = modal.App(name="example-deepseek-v4-flash")


@app.server(
    image=sglang_image,
    gpu=f"{GPU_TYPE}:{GPU_COUNT}",
    volumes={
        HF_CACHE_DIR: hf_cache_vol,
        DG_CACHE_DIR: dg_cache_vol,
        FLASHINFER_CACHE_DIR: flashinfer_cache_vol,
    },
    cpu=CPU,
    memory=MEMORY,
    port=DEFAULT_PORT,
    startup_timeout=STARTUP_TIMEOUT,
    exit_grace_period=25,  # seconds, time to finish up requests when closing down
    min_containers=MIN_CONTAINERS,
    target_concurrency=TARGET_INPUTS,
    unauthenticated=True,
)
class Server:
    @modal.enter()
    def startup(self):
        cmd = _server_command()
        print(shlex.join(cmd))
        self.proc = subprocess.Popen(cmd, start_new_session=True)
        wait_ready(self.proc)
        warmup()

    @modal.exit()
    def stop(self):
        self.proc.terminate()
        self.proc.wait()


```

## 部署服务器

要在 Modal 上部署服务器，只需运行

```bash
modal deploy 06_gpu_and_ml/llm-serving/deepseek_v4_flash.py
```

这将在 Modal 上创建一个新的应用程序，并为其构建容器映像（如果尚未构建）。

## 测试服务器

为了更容易测试服务器设置，我们还包含一个 `local_entrypoint`
用一个简单的客户端访问服务器。

如果执行命令

```bash
modal run 06_gpu_and_ml/llm-serving/deepseek_v4_flash.py
```

服务器的新副本将在 Modal 上启动，同时
下面的代码在您的本地计算机上执行。

这类似于在 `if __name__ == "__main__"` 内运行简单的测试
Python 脚本块，但适用于云部署！

```python
@app.local_entrypoint()
def main(
    prompt: str = "Explain why tech bros and climbers are an increasing phenomenon.",
):
    url = Server.get_url()
    print(f"server url: {url}")
    wait_for_endpoint(url)

    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1024,
        "temperature": 0,
    }
    req = urllib.request.Request(
        f"{url}/v1/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    print(f"sending a request to {url}")
    with urllib.request.urlopen(req, timeout=STARTUP_TIMEOUT) as resp:
        body = json.loads(resp.read())

    message = body["choices"][0]["message"]
    print(message.get("content"))
    print(body.get("usage"))

```