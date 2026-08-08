<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用动态批处理进行快速 Whisper 推理

在这个例子中，我们演示如何运行[动态批量推理](https://modal.com/docs/guide/dynamic-batching)
对于 OpenAI 的语音识别模型，[Whisper](https://openai.com/index/whisper/)，在 Modal 上。
将多个音频样本一起批处理或对单个音频样本的块进行批处理有助于实现 2.8 倍的提升
A10G 上的推理吞吐量！

我们将运行 [Whisper Large V3](https://huggingface.co/openai/whisper-large-v3) 模型。
要运行[任何其他 HuggingFace Whisper 模型](https://huggingface.co/models?search=openai/whisper)，
只需替换 `MODEL_NAME` 和 `MODEL_REVISION` 变量即可。

## 设置

让我们首先导入 Modal 客户端并定义我们想要服务的模型。

```python
from typing import Optional

import modal

MODEL_DIR = "/model"
MODEL_NAME = "openai/whisper-large-v3"
MODEL_REVISION = "afda370583db9c5359511ed5d989400a6199dfe1"


```

## 定义容器镜像

我们将从 Modal 的基线 `debian_slim` 镜像开始并安装相关库。

```python
image = (
    modal.Image.debian_slim(python_version="3.11")
    .uv_pip_install(
        "torch==2.5.1",
        "transformers==4.47.1",
        "huggingface-hub==0.36.0",
        "librosa==0.10.2",
        "soundfile==0.12.1",
        "accelerate==1.2.1",
        "datasets==3.2.0",
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1", "HF_HUB_CACHE": MODEL_DIR})
)

model_cache = modal.Volume.from_name("hf-hub-cache", create_if_missing=True)
app = modal.App(
    "example-batched-whisper",
    image=image,
    volumes={MODEL_DIR: model_cache},
)

```

## 缓存模型权重

我们将定义一个函数来下载模型并将其缓存在卷中。
您可以在部署应用程序之前`modal run`反对此功能。

```python
@app.function()
def download_model():
    from huggingface_hub import snapshot_download
    from transformers.utils import move_cache

    snapshot_download(
        MODEL_NAME,
        ignore_patterns=["*.pt", "*.bin"],  # Using safetensors
        revision=MODEL_REVISION,
    )
    move_cache()


```

## 模型类

推理功能最好使用 Modal 的[类语法](https://modal.com/docs/guide/lifecycle-functions) 来表示。

我们定义一个 `@modal.enter` 方法来在容器启动时加载模型，然后再获取任何输入。
权重将从 Hugging Face 缓存卷中加载，这样我们就不需要在
我们启动一个新容器。有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

我们还定义了一个 `transcribe` 方法，该方法使用 `@modal.batched` 装饰器来启用动态批处理。
这允许我们使用单独的音频样本调用该函数，并且该函数将自动对它们进行批处理
在运行推理之前一起进行。批处理对于充分利用 GPU 至关重要，因为 GPU 的设计目的是
用于以高吞吐量运行并行操作。

`max_batch_size` 参数限制组合到单个批次中的音频样本的最大数量。
我们使用了`max_batch_size` `64`，这是 24 个 A10G GPU 内存可以容纳的最大 2 的幂批量大小。
该数字将根据您使用的型号和 GPU 的不同而有所不同。

`wait_ms` 参数设置运行批量转录之前等待更多输入的最长时间。
要调整此参数，您可以将其设置为应用程序的目标延迟减去推理批处理的执行时间。
这允许任何请求的延迟保持在目标延迟范围内。

```python
@app.cls(
    gpu="a10g",  # Try using an A100 or H100 if you've got a large model or need big batches!
    max_containers=10,  # default max GPUs for Modal's free tier
)
class Model:
    @modal.enter()
    def load_model(self):
        import torch
        from transformers import (
            AutoModelForSpeechSeq2Seq,
            AutoProcessor,
            pipeline,
        )

        self.processor = AutoProcessor.from_pretrained(MODEL_NAME)
        self.model = AutoModelForSpeechSeq2Seq.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
            use_safetensors=True,
        ).to("cuda")

        self.model.generation_config.language = "<|en|>"

        # Create a pipeline for preprocessing and transcribing speech data
        self.pipeline = pipeline(
            "automatic-speech-recognition",
            model=self.model,
            tokenizer=self.processor.tokenizer,
            feature_extractor=self.processor.feature_extractor,
            torch_dtype=torch.float16,
            device="cuda",
        )

    @modal.batched(max_batch_size=64, wait_ms=1000)
    def transcribe(self, audio_samples):
        import time

        start = time.monotonic_ns()
        print(f"Transcribing {len(audio_samples)} audio samples")
        transcriptions = self.pipeline(audio_samples, batch_size=len(audio_samples))
        end = time.monotonic_ns()
        print(
            f"Transcribed {len(audio_samples)} samples in {round((end - start) / 1e9, 2)}s"
        )
        return transcriptions


```

## 转录数据集
在此示例中，我们使用 [librispeech\_asr\_dummy 数据集](https://huggingface.co/datasets/hf-internal-testing/librispeech_asr_dummy)
来自 Hugging Face 的数据集库来测试模型。

我们使用[`map.aio`](https://modal.com/docs/reference/modal.Function#map)来异步映射音频文件。
这使我们能够对每个音频样本并行调用批量转录方法。

```python
@app.function()
async def transcribe_hf_dataset(dataset_name):
    from datasets import load_dataset

    print("📂 Loading dataset", dataset_name)
    ds = load_dataset(dataset_name, "clean", split="validation")
    print("📂 Dataset loaded")
    batched_whisper = Model()
    print("📣 Sending data for transcription")
    async for transcription in batched_whisper.transcribe.map.aio(ds["audio"]):
        yield transcription


```

## 运行模型

我们定义一个[`local_entrypoint`](https://modal.com/docs/guide/apps#entrypoints-for-ephemeral-apps)
运行转录。您可以使用 `modal run batched_whisper.py` 在本地运行它。

```python
@app.local_entrypoint()
async def main(dataset_name: Optional[str] = None):
    if dataset_name is None:
        dataset_name = "hf-internal-testing/librispeech_asr_dummy"
    async for result in transcribe_hf_dataset.remote_gen.aio(dataset_name):
        print(result["text"])

```