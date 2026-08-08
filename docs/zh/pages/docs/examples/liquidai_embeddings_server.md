<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 llama.cpp 和 Modal 服务器提供 Liquid AI ColBERT 嵌入

在这个例子中，我们服务
[LiquidAI/LFM2.5-ColBERT-350M](https://huggingface.co/LiquidAI/LFM2.5-ColBERT-350M)
使用[llama.cpp](https://github.com/ggml-org/llama.cpp)
在[模态服务器](https://modal.com/docs/guide/servers)中。

LFM2.5-ColBERT-350M 是一个 353M 参数的[后期交互嵌入模型](https://arxiv.org/abs/2004.12832)。
这意味着它为每个查询标记生成一个嵌入向量。
通过将每个向量与每个文档的标记嵌入进行比较来计算相似度，以产生最终分数，
而不仅仅是比较每个文档每个查询的单个向量。

OpenAI 兼容的 `/v1/embeddings` API 不支持此功能，
所以我们在 `llama.cpp` 中使用 `/embeddings` API。

该模型旨在针对小文档进行简短查询，
就像将用户搜索查询与电子商务中的产品描述进行比较一样。

该模型可在 [LFM Open License v1.0](https://huggingface.co/LiquidAI/LFM2.5-ColBERT-350M/blob/ac509ef9346912166a5f2f63d5ee41d9c472c330/LICENSE) 下使用，
其中包括对商业用途的限制。

## 为什么使用模态服务器？

为了最小化路由开销，我们使用`@app.server`，
它在 Modal 上使用新的低延迟路由服务，专为延迟敏感的推理工作负载而设计，
就像通过嵌入进行交互式搜索一样。
有关详细信息，请参阅[模态服务器指南](https://modal.com/docs/guide/servers)。
## 选择模型文件和引擎参数

Liquid AI 在 中发布了该模型的官方 GGUF 转换
[LiquidAI/LFM2.5-ColBERT-350M-GGUF](https://huggingface.co/LiquidAI/LFM2.5-ColBERT-350M-GGUF)。

```python
import json
import subprocess
import time
import urllib.error
import urllib.request

import modal

MODEL_REPO = "LiquidAI/LFM2.5-ColBERT-350M-GGUF"
MODEL_REVISION = "bc240003aba07253e261a8aaf0d2c9683318a967"  # version-pinning
MODEL_FILE = "LFM2.5-ColBERT-350M-BF16.gguf"
MODEL_URL = f"https://huggingface.co/{MODEL_REPO}/resolve/{MODEL_REVISION}/{MODEL_FILE}"

```

`llama-server` 在 `N_SLOTS` 并行槽中处理请求
并将总令牌上下文均匀地分布在它们之间。
我们为每个槽指定模型的训练序列长度 512 个标记。

```python
MAX_INPUT_TOKENS = 512  # the model's trained sequence length
N_SLOTS = 4  # target concurrent requests per container; adjust as needed
TOKEN_EMBEDDING_DIM = 128  # the model's output embedding dimension

```

在编码之前，查询和文档都以特殊标记为前缀。

```python
DOCUMENT_PREFIX = "[D] "
QUERY_PREFIX = "[Q] "

```

## 缓存模型权重

我们将 llama.cpp 下载缓存保留在 Modal 中
[体积](https://modal.com/docs/guide/volumes)
因此 GGUF 文件从集线器下载一次并在稍后冷启动时从卷加载。

```python
CACHE_PATH = "/cache"
MODEL_PATH = f"{CACHE_PATH}/llama.cpp/{MODEL_FILE}"

volume = modal.Volume.from_name("liquidai-embeddings-cache", create_if_missing=True)

```

## 定义容器镜像

我们基于官方 llama.cpp 服务器映像构建。
它包含编译后的二进制文件，但不包含 Python，
所以 `add_python` 为 Modal 自己的运行时捆绑了一个解释器。
我们还清除图像的入口点，即服务器二进制文件本身，
这样我们就可以控制启动了。

```python
image = (
    modal.Image.from_registry(
        "ghcr.io/ggml-org/llama.cpp:server-b9917", add_python="3.12"
    )
    .entrypoint([])
    .env({"LLAMA_CACHE": f"{CACHE_PATH}/llama.cpp"})
)

```

## 定义服务器

我们将引擎包装在一个用 `@app.server()` 装饰的类中，
附加图像和体积，
定义自动缩放规则，
为容器提供代理等等。
详细信息请参阅[模态服务器指南](https://modal.com/docs/guide/servers)。

```python
MINUTES = 60  # seconds
PORT = 8000


app = modal.App("example-liquidai-embeddings-server")


@app.server(
    image=image,
    volumes={CACHE_PATH: volume},
    port=PORT,
    target_concurrency=N_SLOTS,
    min_containers=0,  # set to 1 or more to keep a warm replica for latency-sensitive use cases
    startup_timeout=10 * MINUTES,  # allow time to download and load the model
    scaledown_window=5 * MINUTES,  # retain loaded replicas across short traffic gaps
    exit_grace_period=20,  # allow in-flight embedding requests to finish before shutdown
    unauthenticated=True,
)
class LlamaServer:
    @modal.enter()
    def start(self):
        cmd = [
            "/app/llama-server",
            "--model-url",
            MODEL_URL,
            "--model",
            MODEL_PATH,
            "--embeddings",
            "--pooling",
            "none",  # return one vector per input token
            "--host",
            "0.0.0.0",
            "--port",
            str(PORT),
            "--no-ui",  # no chat interface, we're serving embeddings
            "--metrics",  # enable metrics logging
            "--parallel",
            str(N_SLOTS),
            "--ctx-size",
            str(N_SLOTS * MAX_INPUT_TOKENS),  # total context shared across slots
            # Bidirectional embedding models require all tokens in an iteration to fit
            # in one physical batch. Using the full context for batch sizes allows all
            # slots to process maximum-length inputs together.
            "--batch-size",  # max tokens per iteration during continuous batching
            str(N_SLOTS * MAX_INPUT_TOKENS),
            "--ubatch-size",  # max tokens in a physical computation batch
            str(N_SLOTS * MAX_INPUT_TOKENS),
        ]

        self.proc = subprocess.Popen(cmd, start_new_session=True)
        wait_ready(self.proc)

    @modal.exit()
    def stop(self):
        self.proc.terminate()
        try:
            self.proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            self.proc.kill()
            self.proc.wait()


```
一旦 `@modal.enter` 方法退出，Modal 就会认为新副本已准备就绪
并且内部的服务进程开始接受连接。
`llama-server` 以 [503 服务不可用状态] 回答 `/health`(https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503)
当模型加载时，我们阻止启动钩子完成这个 `wait_ready` 函数。

```python
def wait_ready(proc: subprocess.Popen, port=PORT):
    import socket

    while True:
        try:
            if (
                returncode := proc.poll()
            ) is not None:  # fail fast if the server process died
                raise RuntimeError(f"Server process exited with code {returncode}")
            socket.create_connection(("127.0.0.1", port), timeout=5).close()
            request = urllib.request.Request(f"http://127.0.0.1:{port}/health")
            request_with_retry(request, timeout=30).close()
            return
        except (ConnectionRefusedError, TimeoutError):
            continue


```

当没有副本可用于处理请求时，模态服务器也会响应 503，因此我们退出
重试 503 的辅助函数，用于服务器客户端。

```python
def request_with_retry(request: urllib.request.Request, timeout=10 * MINUTES):
    deadline = time.monotonic() + timeout
    delay = 1.0

    while (remaining := deadline - time.monotonic()) > 0:
        try:
            return urllib.request.urlopen(request, timeout=remaining)
        except urllib.error.HTTPError as exc:
            if exc.code != 503:  # 503 Service Unavailable, no containers ready
                raise exc
        time.sleep(min(delay, remaining))
        delay = min(delay * 2, 10.0)
    raise TimeoutError(f"Server not ready within {timeout} seconds")


```

## 测试服务器

运行`modal run liquidai_embeddings_server.py`会执行下面的`local_entrypoint`
针对服务器的临时实例，这对于测试和开发很有用。
客户端在等待实时副本后请求一次嵌入。

```python
@app.local_entrypoint()
def main(input: str | None = None, test_timeout: int = 5 * MINUTES):
    url = LlamaServer.get_url()
    print(f"Server URL: {url}")

    request = urllib.request.Request(f"{url}/health")
    request_with_retry(request=request, timeout=test_timeout).close()

    if input is None:
        input = "ColBERT introduces a late interaction architecture that independently encodes the query and the document using BERT"

    request_data = {"input": [DOCUMENT_PREFIX + input]}
    request = urllib.request.Request(
        f"{url}/embeddings",
        data=json.dumps(request_data).encode(),
        headers={"Content-Type": "application/json"},
    )

    started_at = time.perf_counter()
    with request_with_retry(request, timeout=test_timeout) as response:
        elapsed = time.perf_counter() - started_at
        data = json.load(response)

    assert len(data), "empty response from server"
    embedding = data[0].get("embedding")
    assert embedding, f"server failed to respond with embedding, got {data}"

    print(
        f"client-side inference latency: {elapsed:.3f}s",
        f"embedding shape: ({len(embedding)}, {len(embedding[0])})",
        sep="\n",
    )


```

## 部署服务器

部署服务器

```bash
modal deploy liquidai_embeddings_server.py
```

部署命令打印服务器的公共 URL。