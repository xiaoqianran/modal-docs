<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 SGLang 在 Modal 上提供 Inkling-Small

[Inkling-Small](https://huggingface.co/thinkingmachines/Inkling-Small) 是一种多式联运
Thinking Machines Lab 的专家混合模型，接受文本、图像和音频。
它的解码器结合了滑动窗口和全注意力层，以降低长时间的成本
上下文推断。

此示例服务于需要 Blackwell GPU (B200/B300s) 的 NVFP4 检查点
支持其原生四位张量核心路径。

引擎标志遵循 SGLang 的
[食谱](https://docs.sglang.io/cookbook/autoregressive/ThinkingMachines/Inkling-Small#hw=b300\&variant=default\&quant=nvfp4\&strategy=mtp\&nodes=single)。

有关高效服务大型模型的更多信息，请参阅
【高性能LLM推理指南】(https://modal.com/docs/guide/high-performance-llm-inference)。有关 Modal 上的 LLM 服务的更简单介绍，请参阅
[这个例子](https://modal.com/docs/examples/llm_inference)。

```python
import json
import subprocess
import time
import urllib.error
import urllib.request

import modal

```

## 设置容器镜像

```python
SGLANG_IMAGE = (
    "lmsysorg/sglang:dev-inkling-dspark"
    "@sha256:fbea1a4e25b26660dbc2384a27ead8817e9b7670f257b5c3143e0450d14524d7"
)

image = modal.Image.from_registry(SGLANG_IMAGE).entrypoint(
    []  # silence chatty logs on entry
)

```

### 加载模型权重

将权重缓存在模态 [Volume](https://modal.com/docs/guide/volumes) 中
以避免每次冷启动时下载它们。
请注意，SGLang 图像在`/root/.cache/huggingface` 下已有文件，
所以我们将卷安装在`/cache`并将`HF_HOME`指向那里。

```python
HF_CACHE_DIR = "/cache"
hf_cache_vol = modal.Volume.from_name("inkling-hf-cache", create_if_missing=True)

image = image.env(
    {
        "HF_HOME": HF_CACHE_DIR,
        "HF_XET_HIGH_PERFORMANCE": "1",  # faster downloads
    }
)

```

Inkling 的存储库需要接受许可证，因此下载需要 Hugging
人脸令牌。使用以下命令创建[秘密](https://modal.com/docs/guide/secrets)：

```
modal secret create huggingface-secret HF_TOKEN=hf_...
```

```python
hf_secret = modal.Secret.from_name("huggingface-secret")

REPO_ID = "thinkingmachines/Inkling-Small-NVFP4"


def download_model(repo_id, revision=None):
    from huggingface_hub import snapshot_download

    snapshot_download(repo_id=repo_id, revision=revision, max_workers=16)


image = image.run_function(
    download_model,
    volumes={HF_CACHE_DIR: hf_cache_vol},
    secrets=[hf_secret],
    args=(REPO_ID,),
    timeout=4 * 60 * 60,
    cpu=8,  # parallel shard downloads are CPU-bound on hashing
)

```

### 缓存编译内核

```python
COMPILE_CACHE_DIR = "/compile-cache"
compile_cache_vol = modal.Volume.from_name(
    "inkling-compile-cache", create_if_missing=True
)

image = image.env(
    {
        "TORCHINDUCTOR_CACHE_DIR": f"{COMPILE_CACHE_DIR}/inductor",
        "TRITON_CACHE_DIR": f"{COMPILE_CACHE_DIR}/triton",
        "SGLANG_CACHE_DIR": f"{COMPILE_CACHE_DIR}/sglang",
        "SGLANG_ENABLE_UNIFIED_RADIX_TREE": "1",
    }
)

```

### 配置推理引擎

```python
ENABLE_MTP = True
MEM_FRACTION_STATIC = "0.70" if ENABLE_MTP else "0.85"
MAX_TOTAL_TOKENS = 262_144

SGLANG_PORT = 8000
MINUTES = 60  # seconds
HOURS = 60 * MINUTES


def _server_command() -> list[str]:
    cmd = [
        "python3",
        "-m",
        "sglang.launch_server",
        "--host",
        "0.0.0.0",
        "--port",
        str(SGLANG_PORT),
        "--model-path",
        REPO_ID,
        "--served-model-name",
        "inkling-small",
        "--trust-remote-code",
        "--tp",
        str(GPU_COUNT),
        "--quantization",
        "modelopt_fp4",
        "--attention-backend",
        "fa4",
        "--page-size",
        "128",
        "--fp4-gemm-backend",
        "flashinfer_trtllm",
        "--moe-runner-backend",
        "flashinfer_trtllm_routed",
        "--mamba-radix-cache-strategy",
        "extra_buffer",
        "--mem-fraction-static",
        MEM_FRACTION_STATIC,
        "--swa-full-tokens-ratio",
        "0.1",
        "--mamba-full-memory-ratio",
        "0.1",
        "--enable-multimodal",
        "--reasoning-parser",
        "inkling",
        "--tool-call-parser",
        "inkling",
        "--enable-metrics",
        # Skip SGLang's startup request. If that first generation fails, SGLang exits
        # before the server reports ready.
        "--skip-server-warmup",
    ]

    if ENABLE_MTP:
        cmd += [
            "--speculative-algorithm",
            "EAGLE",
            "--speculative-num-steps",
            "8",
            "--speculative-eagle-topk",
            "1",
            "--speculative-num-draft-tokens",
            "9",
            "--enable-multi-layer-eagle",
            "--speculative-use-rejection-sampling",
            "--max-total-tokens",
            str(MAX_TOTAL_TOKENS),
            "--max-running-requests",
            str(TARGET_INPUTS),
        ]

    if GPU_COUNT in (6, 8):
        cmd.append("--enable-torch-symm-mem")

    return cmd


```

## 配置基础设施
NVFP4 的重量约为 171 GB。单个 B300 有 288 GB，剩余空间足够
模型内存、目标 KV 缓存和 MTP 草稿池。

```python
GPU_TYPE = "B300"
GPU_COUNT = 1

MIN_CONTAINERS = 0  # set to 1 in production to keep a warm replica

TARGET_INPUTS = 32  # concurrent requests per replica before scaling out

app = modal.App("example-inkling-small", image=image)

```

### 定义服务器

```python
@app.server(
    image=image,
    gpu=f"{GPU_TYPE}:{GPU_COUNT}",
    volumes={HF_CACHE_DIR: hf_cache_vol, COMPILE_CACHE_DIR: compile_cache_vol},
    secrets=[hf_secret],
    cpu=32,
    port=SGLANG_PORT,
    startup_timeout=1 * HOURS,
    scaledown_window=20 * MINUTES,
    exit_grace_period=25,
    min_containers=MIN_CONTAINERS,
    target_concurrency=TARGET_INPUTS,
    unauthenticated=True,
)
class Server:
    @modal.enter()
    def start(self):
        cmd = _server_command()
        print("starting SGLang with command:")
        print(" ".join(cmd))
        self.proc = subprocess.Popen(" ".join(cmd), shell=True, start_new_session=True)
        wait_for_server_ready(self.proc)

    @modal.exit()
    def stop(self):
        self.proc.terminate()
        self.proc.wait()


def is_server_up(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            return response.status == 200
    except (urllib.error.URLError, OSError, TimeoutError):
        return False


def wait_for_server_ready(proc: subprocess.Popen):
    url = f"http://localhost:{SGLANG_PORT}/health"
    print(f"waiting for server to be ready at {url}")

    while True:
        # Surface a crashed engine immediately instead of waiting out startup_timeout.
        if proc.poll() is not None:
            raise RuntimeError(
                f"SGLang exited with code {proc.returncode} before becoming healthy"
            )
        if is_server_up(url):
            print("server is ready!")
            return
        time.sleep(5)


def wait_for_endpoint(url: str, timeout=1 * HOURS) -> None:
    deadline = time.monotonic() + timeout
    health = f"{url.rstrip('/')}/health"
    while True:
        if is_server_up(health):
            return
        if time.monotonic() >= deadline:
            raise TimeoutError("Timed out waiting for the Server endpoint.")
        time.sleep(5)


```

## 测试服务器

服务器支持 OpenAI 聊天完成 API。
要启动临时服务器并向其发送请求：

```
modal run 06_gpu_and_ml/llm-serving/inkling_small.py
```

值得注意的是，Inkling 的聊天模板需要“推理努力”，可以通过
字符串（`none`、`minimal`、`low`、`medium`、`high`、`max`）或 0.0 到 0.99 之间的数字。

```python
@app.local_entrypoint()
def main(
    prompt: str = "In one sentence, why is sliding-window attention cheap?",
    reasoning_effort: str = "medium",
):
    url = Server.get_url()
    print(f"Server URL: {url}")
    wait_for_endpoint(url)

    payload = {
        "model": "inkling-small",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 512,
        "chat_template_kwargs": {"reasoning_effort": reasoning_effort},
    }
    req = urllib.request.Request(
        f"{url}/v1/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    print(f"sending a request to {url}")
    with urllib.request.urlopen(req, timeout=1 * HOURS) as resp:
        body = json.loads(resp.read())

    message = body["choices"][0]["message"]
    if message.get("reasoning_content"):
        print("--- reasoning ---")
        print(message["reasoning_content"])
    print("--- answer ---")
    print(message.get("content"))
    print("--- usage ---")
    print(body.get("usage"))


```

## 部署服务器

```
modal deploy 06_gpu_and_ml/llm-serving/inkling_small.py
```

## 附录

出于演示目的，可以使用 `unauthenticated=True` 公开访问端点。添加
发送前的[代理验证](https://modal.com/docs/guide/webhook-urls#authentication)
私人数据。

设置 `ENABLE_MTP = False` 禁用推测，这
我们建议一旦大批量使 GPU 饱和。