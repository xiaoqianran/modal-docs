<!-- modal-docs: machine-translated zh-CN from English source -->

# 简介

Modal 是一个 AI 基础设施平台，可让您：

* 使用开放权重或自定义模型，以亚秒级冷启动运行低延迟[推理](/docs/examples/llm_inference)
* 横向扩展[批处理作业](/docs/guide/batch-processing) 以大规模并行运行
* [训练](/docs/examples/hp_sweep_gpt) 或 [微调](/docs/examples/diffusers_lora_finetune) 在最新 GPU 上开放权重或自定义模型
* 启动数千个隔离且安全的[沙箱](/docs/guide/sandboxes) 来执行人工智能生成的代码
* 在几秒钟内启动 GPU 支持的 [Notebooks](/docs/guide/notebooks-modal) 并与同事实时协作

您可以获得[完整的无服务器执行和定价](/pricing)，因为我们托管所有内容并按秒使用收费。

值得注意的是，Modal 中的配置为零 - 一切，包括[容器环境](/docs/guide/images) 和[GPU 规范](/docs/guide/gpu)，都是代码。呼吸一下新鲜空气，感受一下没有 YAML 的味道有多好。

这是在 Modal 上运行的 LLM 推理的完整、最小示例：

```python
from pathlib import Path

import modal

app = modal.App("example-inference")
image = modal.Image.debian_slim().uv_pip_install("transformers[torch]")


@app.function(gpu="h100", image=image)
def chat(prompt: str | None = None) -> list[dict]:
    from transformers import pipeline

    if prompt is None:
        prompt = f"/no_think Read this code.\n\n{Path(__file__).read_text()}\nIn one paragraph, what does the code do?"

    print(prompt)
    context = [{"role": "user", "content": prompt}]

    chatbot = pipeline(
        model="Qwen/Qwen3-1.7B", device_map="cuda", max_new_tokens=1024
    )
    result = chatbot(context)
    print(result[0]["generated_text"][-1]["content"])

    return result
```
就是这样！您可以将该文本复制并粘贴到您喜欢的编辑器中的 Python 文件中，然后使用 `modal run path/to/file.py` 运行它。

## 它是如何工作的？

Modal 获取您的代码，将其放入容器中，然后在云中执行。如果流量很大，Modal 会根据需要自动增加容器数量。这意味着您不需要搞乱 Kubernetes、Docker，甚至 AWS 帐户。

我们汇集了所有主要云的容量。这意味着我们可以根据最佳可用容量动态决定在何处运行代码，从而优化 GPU 的高可用性和低成本。

## 编程语言支持

Python 是构建 Modal 应用程序和实现 Modal 函数的主要语言，但您也可以使用 [JavaScript/TypeScript 或 Go](/docs/guide/sdk-javascript-go) 调用 Modal 函数、运行沙箱和管理 Modal 资源。

## 开始使用

使用 Modal 进行开发很容易，因为您无需设置任何基础设施。只是：

1. 在[modal.com](https://modal.com)创建一个帐户
2.运行`pip install modal`安装`modal`Python包
3.运行`modal setup`进行身份验证（如果这不起作用，请尝试`python -m modal setup`）
...您可以立即开始运行作业。查看我们的一些简单的入门示例：

* [你好，世界！](/docs/examples/hello_world)
* [一个简单的网络抓取工具](/docs/examples/webscraper)

当您准备好接受更奇特的东西时，请探索我们的[完整示例库](/docs/examples)，例如：

* [运行您自己的 LLM 推理](/docs/examples/llm_inference)
* [使用 Kyutai STT 实时转录语音](/docs/examples/streaming_kyutai_stt)
* [微调通量](/docs/examples/diffusers_lora_finetune)
* [使用 Modal Sandboxes 和 LangGraph 构建编码代理](/docs/examples/agent)
* [从头开始训练小语言模型](/docs/examples/hp_sweep_gpt)
* [S3 上 Parquet 文件的并行处理](/docs/examples/s3_bucket_mount)
* [在模态笔记本中使用dots.ocr解析文档](https://modal.com/notebooks/modal-labs/_/nb-8wvXoGoAcba8sRF8VkVg18)

您还可以通过我们的[代码游乐场](/playground) 交互式地学习 Modal，而无需安装任何东西。