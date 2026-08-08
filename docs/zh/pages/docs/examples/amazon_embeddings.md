<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 Qwen2-7B 以每秒 575k 代币的速度嵌入 3000 万条亚马逊评论

此示例演示如何为大型文本数据集创建嵌入。这是
通常需要启用语义搜索、翻译和其他语言
处理任务。 Modal 可以轻松部署大型、功能强大的嵌入模型和手柄
在许多云 GPU 上并行处理非常大的数据集的所有扩展。

我们创建一个模态函数，它将处理所有数据加载并将输入提交到
推理 Cls 将自动扩展以处理数百个大型
并行批次。

在提交批次的时间和获取批次的时间之间，它通过以下方式存储：
Modal 的 `spawn` 系统，最多可容纳一百万个输入长达一周。

```python
import json
import subprocess
from pathlib import Path

import modal

app = modal.App(name="example-amazon-embeddings")
MINUTES = 60  # seconds
HOURS = 60 * MINUTES

```

我们将 `main` 函数定义为 `local_entrypoint`。这就是我们在本地调用的
在 Modal 上开始工作。

您可以使用命令运行它

```bash
modal run --detach amazon_embeddings.py
```

默认情况下，出于演示目的，我们将 `down-scale` 调整为数据的 1/100。
要启动完整作业，请将 `--down-scale` 参数设置为 `1`。
但请注意，这会让您付出代价！

入口点启动作业并返回每个批次的 `f`unction `c`all ID。
作业完成后，我们可以使用这些 ID 来检索嵌入。
Modal 将在完成后将结果保留最多 7 天。看看我们的
[作业处理指南](https://modal.com/docs/guide/job-queue)
了解更多详情。

```python
@app.local_entrypoint()
def main(
    dataset_name: str = "McAuley-Lab/Amazon-Reviews-2023",
    dataset_subset: str = "raw_review_Books",
    down_scale: float = 0.001,
):
    out_path = Path("/tmp") / "embeddings-example-fc-ids.json"
    function_ids = launch_job.remote(
        dataset_name=dataset_name, dataset_subset=dataset_subset, down_scale=down_scale
    )
    out_path.write_text(json.dumps(function_ids, indent=2) + "\n")
    print(f"output handles saved to {out_path}")


```

## 加载数据并开始推理作业

接下来，我们定义将执行数据加载并将其提供给我们的嵌入模型的函数。
我们定义一个容器[Image](https://modal.com/docs/guide/images)
与数据加载依赖关系。

在其中，我们下载我们需要的数据并将其缓存到容器的本地磁盘，
工作完成后它将消失。我们将保存评论数据
与嵌入一起，所以我们不需要保留数据集。

嵌入这样的大型数据集可能需要一些时间，但我们不需要等待
周围完成。我们使用 `spawn` 来调用我们的嵌入函数
并返回一个带有 ID 的句柄，我们稍后可以用它来获取结果。
这可能会成为通过网络发送数据进行处理的瓶颈，因此
我们通过使用 `ThreadPoolExecutor` 使用多线程提交批次来加快速度。

一旦所有批次都已发送用于推理，我们就可以返回函数 ID
到本地客户端保存。

```python
@app.function(
    image=modal.Image.debian_slim().uv_pip_install("datasets==3.5.1"), timeout=2 * HOURS
)
def launch_job(dataset_name: str, dataset_subset: str, down_scale: float):
    import time
    from concurrent.futures import ThreadPoolExecutor, as_completed

    from datasets import load_dataset
    from tqdm import tqdm

    print("Loading dataset...")
    dataset = load_dataset(
        dataset_name,
        dataset_subset,
        split="full",
        trust_remote_code=True,
    )

    data_subset = dataset.select(range(int(len(dataset) * down_scale)))

    tei = TextEmbeddingsInference()
    batches = generate_batches_of_chunks(data_subset)

    start = time.perf_counter()
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(tei.embed.spawn, batch) for batch in tqdm(batches)]
        function_ids = []
        for future in tqdm(as_completed(futures), total=len(futures)):
            function_ids.append(future.result().object_id)

    print(f"Finished submitting job: {time.perf_counter() - start:.2f}s")

    return function_ids


```
## 在许多强大的 GPU 上大规模扩展和扩展嵌入推理

我们将启动许多容器来运行推理，并且我们不希望每个容器
其一，必须从 Hugging Face 下载嵌入模型。我们可以下载并保存到
模态[体积](https://modal.com/docs/guide/volumes)
在使用`run_function`的图像构建步骤中。

我们将使用
[GTE-Qwen2-7B-指令](https://huggingface.co/Alibaba-NLP/gte-Qwen2-7B-instruct)
阿里巴巴的模型，在
[海量文本嵌入基准](https://huggingface.co/spaces/mteb/leaderboard)。

```python
MODEL_ID = "Alibaba-NLP/gte-Qwen2-7B-instruct"
MODEL_DIR = "/model"
MODEL_CACHE_VOLUME = modal.Volume.from_name(
    "embeddings-example-model-cache", create_if_missing=True
)


def download_model():
    from huggingface_hub import snapshot_download

    snapshot_download(MODEL_ID, cache_dir=MODEL_DIR)


```

为了进行推理，我们将使用 Hugging Face 的
[文本嵌入推理](https://github.com/huggingface/text-embeddings-inference)
嵌入模型部署的框架。

运行大量独立的机器就是“横向扩展”。但我们也可以“扩大规模”
通过在大型高性能机器上运行。

我们将使用 L40S GPU 在成本和性能之间取得良好的平衡。抱脸有
我们可以将预构建的 Docker 镜像用作模态镜像的基础。
我们将使用专为 L40S 打造的产品
[SM89/Ada Lovelace架构](https://modal.com/gpu-glossary/device-hardware/streaming-multiprocessor-architecture)
并在顶部安装其余的依赖项。

```python
tei_image = "ghcr.io/huggingface/text-embeddings-inference:89-1.7"

inference_image = (
    modal.Image.from_registry(tei_image, add_python="3.12")
    .dockerfile_commands("ENTRYPOINT []")
    .uv_pip_install(
        "httpx==0.28.1",
        "huggingface-hub==0.36.0",
        "numpy==2.2.5",
        "tqdm==4.67.1",
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1", "HF_HOME": MODEL_DIR})
    .run_function(download_model, volumes={MODEL_DIR: MODEL_CACHE_VOLUME})
)


```

接下来我们定义推理类。 Modal 会自动缩放数量
容器准备好根据我们在`@app.cls`中设置的参数处理输入
和`@modal.concurrent`装饰器。这里我们将容器总数限制为
100，最大并发输入数为 10，即并发批次数上限为 1000。
在 Modal 的 Starter（免费）和 Team 计划中，并发 GPU 的最大数量较低，
减少并发批次的总数，从而降低吞吐量。

Modal 企业计划的客户定期会在此基础上再增加一个数量级。
如果您有兴趣在数千个 GPU 上运行，
[联系](https://form.fillout.com/t/onUBuQZ5vCus)。

这里我们还指定了 GPU 类型并附加了我们保存的模态体积
嵌入模型。

当容器创建时，此类将生成本地文本嵌入推理服务器
启动，并通过通过 HTTP 接收文本数据来处理每个批次，返回一个列表
具有批量文本数据和嵌入的元组。

```python
@app.cls(
    image=inference_image,
    gpu="L40S",
    volumes={MODEL_DIR: MODEL_CACHE_VOLUME},
    max_containers=100,
    scaledown_window=5 * MINUTES,  # idle for 5 min without inputs before scaling down
    retries=3,  # handle transient failures and storms in the cloud
    timeout=2 * HOURS,  # run for at most 2 hours
)
@modal.concurrent(max_inputs=10)
class TextEmbeddingsInference:
    @modal.enter()
    def open_connection(self):
        from httpx import AsyncClient

        print("Starting text embedding inference server...")
        self.process = spawn_server()
        self.client = AsyncClient(base_url="http://127.0.0.1:8000", timeout=30)

    @modal.exit()
    def terminate_connection(self):
        self.process.terminate()

    @modal.method()
    async def embed(self, batch):
        texts = [chunk[-1] for chunk in batch]
        res = await self.client.post("/embed", json={"inputs": texts})
        return [chunk + (embedding,) for chunk, embedding in zip(batch, res.json())]


```

## 辅助函数

书评数据集包含约 30M 评论，总字符数约 12B，
表明平均评论长度约为 500 个字符。有些更长。
嵌入模型对它们可以在单个模型中处理的令牌数量有限制
输入。我们需要将每个评论分成低于此限制的块。
分割文本数据的正确方法是使用分词器来确保任何
单个请求低于模型令牌限制，并且重叠块以提供
语义上下文并保存信息。为了这个例子，我们将
只是按设定的字符长度（`CHUNK_SIZE`）进行分割。

虽然嵌入模型对单个输入标记的数量有限制
嵌入，我们可以在单个批次中处理的块数量受到以下限制
GPU 的 VRAM。我们相应地设置`BATCH_SIZE`。

```python
BATCH_SIZE = 256
CHUNK_SIZE = 512


def generate_batches_of_chunks(
    dataset, chunk_size: int = CHUNK_SIZE, batch_size: int = BATCH_SIZE
):
    """Creates batches of chunks by naively slicing strings according to CHUNK_SIZE."""
    batch = []
    for entry_index, data in enumerate(dataset):
        product_id = data["asin"]
        user_id = data["user_id"]
        timestamp = data["timestamp"]
        title = data["title"]
        text = data["text"]
        for chunk_index, chunk_start in enumerate(range(0, len(text), chunk_size)):
            batch.append(
                (
                    entry_index,
                    chunk_index,
                    product_id,
                    user_id,
                    timestamp,
                    title,
                    text[chunk_start : chunk_start + chunk_size],
                )
            )
            if len(batch) == batch_size:
                yield batch
                batch = []
    if batch:
        yield batch


def spawn_server(
    model_id: str = MODEL_ID,
    port: int = 8000,
    max_client_batch_size: int = BATCH_SIZE,
    max_batch_tokens: int = BATCH_SIZE * CHUNK_SIZE,
    huggingface_hub_cache: str = MODEL_DIR,
):
    """Starts a text embedding inference server in a subprocess."""
    import socket

    LAUNCH_FLAGS = [
        "--model-id",
        model_id,
        "--port",
        str(port),
        "--max-client-batch-size",
        str(max_client_batch_size),
        "--max-batch-tokens",
        str(max_batch_tokens),
        "--huggingface-hub-cache",
        huggingface_hub_cache,
    ]

    process = subprocess.Popen(["text-embeddings-router"] + LAUNCH_FLAGS)
    # Poll until webserver at 127.0.0.1:8000 accepts connections before running inputs.
    while True:
        try:
            socket.create_connection(("127.0.0.1", port), timeout=1).close()
            print("Inference server ready!")
            return process
        except (socket.timeout, ConnectionRefusedError):
            retcode = process.poll()  # Check if the process has terminated.
            if retcode is not None:
                raise RuntimeError(f"Launcher exited unexpectedly with code {retcode}")

```