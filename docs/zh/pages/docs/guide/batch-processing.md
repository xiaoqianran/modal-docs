<!-- modal-docs: machine-translated zh-CN from English source -->

# 批处理

Modal 针对大规模批处理进行了优化，允许函数在零额外配置的情况下扩展到数千个并行容器。可以异步提交函数调用以进行后台执行，从而无需等待作业完成或调整资源分配。

本指南涵盖了 Modal 的批处理功能，从基本调用到与现有管道的集成。

## 使用 `.spawn_map` 进行后台执行

提交多个作业进行异步处理的最快方法是使用 `.spawn_map` 调用函数。与 [`--detach`](/docs/cli/latest/run) 标志结合使用时，您的应用程序将继续运行，直到所有作业完成。

以下是提交 100,000 个视频进行并行嵌入的示例。提交后可以断开连接，处理会在后台继续完成：

```python
# Kick off asynchronous jobs with `modal run --detach batch_processing.py`
import modal

app = modal.App("batch-processing-example")
volume = modal.Volume.from_name("video-embeddings", create_if_missing=True)

@app.function(volumes={"/data": volume})
def embed_video(video_id: int):
    # Business logic:
    # - Load the video from the volume
    # - Embed the video
    # - Save the embedding to the volume
    ...

@app.local_entrypoint()
def main():
    embed_video.spawn_map(range(100_000))
```

此模式最适合在外部存储结果的作业，例如，在 [Modal Volume](/docs/guide/volumes)、[Cloud Bucket Mount](/docs/guide/cloud-bucket-mounts) 或您自己的数据库\* 中。
*\* 对于数据库连接，请考虑使用 [Modal Proxy](/docs/guide/proxy-ips) 在数千个容器之间维护静态 IP。*

## 使用 `.map` 进行并行处理

使用 `.map` 可以让您在收集结果的同时将昂贵的计算卸载到功能强大的机器上。这对于具有突发资源需求的管道步骤特别有用。 Modal 自动处理所有基础设施配置和取消配置。

以下是将并行视频相似性查询实现为单个模态函数调用的方法：

```python
# Run jobs and collect results with `modal run gather.py`
import modal

app = modal.App("gather-results-example")

@app.function(gpu="L40S")
def compute_video_similarity(query: str, video_id: int) -> tuple[int, int]:
    # Embed video with GPU acceleration & compute similarity with query
    return video_id, score


@app.local_entrypoint()
def main():
    import itertools

    queries = itertools.repeat("Modal for batch processing")
    video_ids = range(100_000)

    for video_id, score in compute_video_similarity.map(queries, video_ids):
        # Process results (e.g., extract top 5 most similar videos)
        pass
```

此示例在 L40S GPU 的自动缩放池上运行 `compute_video_similarity`，将分数返回到本地进程以进行进一步处理。

## 与现有系统集成

在现有数据管道中使用模态函数的推荐方法是通过[部署函数调用](/docs/guide/trigger-deployed-functions)。部署后，您可以从外部系统调用模态函数：

```python
def external_function(inputs):
    compute_similarity = modal.Function.from_name(
        "gather-results-example",
        "compute_video_similarity"
    )
    for result in compute_similarity.map(inputs):
        # Process results
        pass
```

您可以从任何 Python 上下文调用模态函数，从而访问内置的可观察性、资源管理和 GPU 加速。