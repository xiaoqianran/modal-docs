<!-- modal-docs: machine-translated zh-CN from English source -->

# 微调 Whisper 以改善特定领域词汇的转录

此示例演示如何微调 ASR 模型
([whisper-tiny.en](https://huggingface.co/openai/whisper-tiny.en))
并使用 Modal 部署它进行推理。

语音识别模型开箱即用，适用于一般语音转录，
但可能会遇到训练数据中没有很好体现的示例 -
例如专有名词、技术术语和行业特定术语。微调
特定领域词汇的示例可以改善这些术语的转录。

例如，这是来自基线模型的示例转录，没有
微调：

|                  |转录|
|------------------|----------------------------------------------------------------------------------------|
| **基本事实** | “将氘放入一种元素中，就会产生一种新元素” |
| **预测** | “你将定理放入一个元素中，你就创建了一个新元素” |

在小数据集（约 7k 个样本）上经过 1.5 小时的训练后，该模型
已经改进：

|                  |转录|
|------------------|------------------------------------------------------------------------|
| **基本事实** | “将氘放入一种元素中，就会产生一种新元素” |
| **预测** | “将氘放入一种元素中，就会产生一种新元素” |

我们将使用“科学与技术”的“小”子集
[GigaSpeech](https://huggingface.co/datasets/speechcolab/gigaspeech)
数据集，这些数据足以让模型在短短一段时间内就科学术语得到改进
几个纪元。

注意：GigaSpeech 是
[门控型号](https://huggingface.co/docs/hub/en/models-gated),
所以您需要接受上面的条款
[数据集卡](https://huggingface.co/datasets/speechcolab/gigaspeech)
并创建一个
【抱脸秘密】(https://modal.com/secrets/)下载它。

## 设置

我们首先导入标准库依赖项`fastapi`和`modal`。

我们还需要一个 [`App`](https://modal.com/docs/guide/apps) 对象，我们将用它来
定义我们的训练应用程序如何在 Modal 的云基础设施上运行。

```python
import functools
import io
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Annotated, Any, Union

import fastapi
import modal

MINUTES = 60
HOURS = 60 * MINUTES

app = modal.App(name="example-whisper-fine-tune")

```

### 设置容器镜像

我们通过建立一个基础来定义我们的函数运行的环境
[集装箱`Image`](https://modal.com/docs/guide/images)
使用 `Image.uv_pip_install` 来处理我们的依赖关系。我们还设置了环境变量
这里使用`Image.env`，就像Hugging Face缓存目录一样。

```python
CACHE_DIR = "/cache"
image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "accelerate==1.8.1",
        "datasets==3.6.0",
        "evaluate==0.4.5",
        "fastapi[standard]==0.116.1",
        "huggingface-hub==0.36.0",
        "jiwer==4.0.0",
        "librosa==0.11.0",
        "torch==2.7.1",
        "torchaudio==2.7.1",
        "transformers==4.53.2",
        "whisper_normalizer==0.1.12",
    )
    .env(
        {
            "HF_XET_HIGH_PERFORMANCE": "1",  # Faster downloads from Hugging Face
            "HF_HOME": CACHE_DIR,
        }
    )
)

```

接下来，我们将导入将在 Modal 上运行的代码所需的依赖项。
`image.imports()` 上下文管理器确保这些导入在我们的
功能在云端运行，无需在本地安装依赖项。

```python
with image.imports():
    import datasets
    import evaluate
    import librosa
    import torch
    import transformers
    from whisper_normalizer.english import EnglishTextNormalizer

```

### 在 Modal 上存储数据

我们使用
[模态音量](https://modal.com/docs/guide/volumes)
对于数据，我们希望在函数调用之间保留。在这种情况下，我们将创建一个缓存
用于存储拥抱脸部下载以加快后续加载速度的卷以及输出
训练后保存模型和指标的卷。

```python
cache_volume = modal.Volume.from_name("hf-hub-cache", create_if_missing=True)
output_volume = modal.Volume.from_name(
    "fine-tune-asr-example-volume",
    create_if_missing=True,
)
OUTPUT_DIR = "/outputs"
volumes = {CACHE_DIR: cache_volume, OUTPUT_DIR: output_volume}

```

## 培训

我们使用 `dataclass` 将一些训练参数收集到一个地方。在这里我们
设置 `model_output_name` 这是我们的模型所在卷上的目录
已保存，以及我们在部署模型进行推理时从何处加载它。

```python
@dataclass
class Config:
    """Training configuration."""

    model_output_name: str = "whisper-fine-tune"  # Name used for saving and loading

    # Model config
    model_name: str = "openai/whisper-tiny.en"

    # Dataset config
    dataset_name: str = "speechcolab/gigaspeech"
    dataset_subset: str = "s"  # "xs" for testing, "m", "l", "xl" for more data
    dataset_split: str = "train"  # The test and val splits don't have category labels
    dataset_category: int = 15  # "Science and Technology"
    max_duration_in_seconds: float = 20.0
    min_duration_in_seconds: float = 0.0

    # Training config
    num_train_epochs: int = 5
    warmup_steps: int = 400
    max_steps: int = -1
    batch_size: int = 64
    learning_rate: float = 1e-5
    eval_strategy: str = "epoch"


```

### 定义我们的训练函数

训练函数执行以下操作：

1. 加载预训练模型以及特征提取器和分词器
2.加载数据集->选择我们的训练类别->提取特征进行训练
3. 运行基线评估
4. 🚂 训练！
5. 将微调后的模型保存到Volume中
6. 运行最终评估

我们在训练之前和之后进行评估来建立基线，看看有多少
模型得到改进。衡量语音识别性能的最常用方法
模型是“单词错误率”（WER）：

`WER = (substitutions + deletions + insertions) / total words`。

`@app.function` 装饰器是我们附加基础设施并定义我们的
函数在 Modal 上运行。这里我们告诉函数使用我们的`Image`，指定GPU，
附加我们之前创建的卷，添加访问令牌并设置超时。

```python
@app.function(
    image=image,
    gpu="H100",
    volumes=volumes,
    secrets=[modal.Secret.from_name("huggingface-secret", required_keys=["HF_TOKEN"])],
    timeout=3 * HOURS,
)
def train(
    config: Config,
):
    """Loads data and trains the model."""

    # Setting args for the Hugging Face trainer
    training_args = transformers.Seq2SeqTrainingArguments(
        output_dir=Path(OUTPUT_DIR) / config.model_output_name,
        num_train_epochs=config.num_train_epochs,
        per_device_train_batch_size=config.batch_size,
        per_device_eval_batch_size=config.batch_size,
        learning_rate=config.learning_rate,
        warmup_steps=config.warmup_steps,
        max_steps=config.max_steps,
        eval_strategy=config.eval_strategy,
        fp16=True,
        group_by_length=True,
        length_column_name="input_length",
        predict_with_generate=True,
        generation_max_length=40,
        generation_num_beams=1,
    )

    print(f"Loading model: {config.model_name}")
    feature_extractor = transformers.WhisperFeatureExtractor.from_pretrained(
        pretrained_model_name_or_path=config.model_name,
    )
    tokenizer = transformers.WhisperTokenizer.from_pretrained(
        pretrained_model_name_or_path=config.model_name,
    )
    model = transformers.WhisperForConditionalGeneration.from_pretrained(
        pretrained_model_name_or_path=config.model_name,
    )

    print(f"Loading dataset: {config.dataset_name} {config.dataset_subset}")
    dataset = (
        datasets.load_dataset(
            config.dataset_name,
            config.dataset_subset,
            split=config.dataset_split,
            num_proc=os.cpu_count(),
            trust_remote_code=True,
        )
        if config.dataset_name is not None
        else get_test_dataset(config)
    )

    print("Preparing data")
    max_input_length = config.max_duration_in_seconds * feature_extractor.sampling_rate
    min_input_length = config.min_duration_in_seconds * feature_extractor.sampling_rate

    # Remove samples that are not from our target category (Science and Technology)
    # Remove audio clips that are too short or too long
    dataset = dataset.filter(
        functools.partial(
            filter_dataset,
            dataset_category=config.dataset_category,
            max_input_length=max_input_length,
            min_input_length=min_input_length,
        ),
        input_columns=["category", "audio"],
        num_proc=os.cpu_count(),
    )

    # Extract audio features and tokenize labels
    dataset = dataset.map(
        functools.partial(
            prepare_dataset,
            feature_extractor=feature_extractor,
            tokenizer=tokenizer,
            model_input_name=feature_extractor.model_input_names[0],
        ),
        batched=True,
        remove_columns=dataset.column_names,
        num_proc=os.cpu_count(),
        desc="Feature extract + tokenize",
    )

    # Split the filtered dataset into train/validation sets
    dataset = dataset.train_test_split(test_size=0.1, shuffle=True, seed=42)

    # Create a processor that combines the feature extractor and tokenizer
    processor = transformers.WhisperProcessor(
        feature_extractor=feature_extractor,
        tokenizer=tokenizer,
    )

    # Custom data collator handles batching of variable-length audio sequences
    data_collator = DataCollatorSpeechSeq2SeqWithPadding(
        processor=processor,
        decoder_start_token_id=model.config.decoder_start_token_id,
    )

    # Set up the Hugging Face trainer with all of our components
    normalizer = EnglishTextNormalizer()
    metric = evaluate.load("wer")

    trainer = transformers.Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset["train"],
        eval_dataset=dataset["test"],
        processing_class=feature_extractor,
        data_collator=data_collator,
        compute_metrics=functools.partial(
            compute_metrics,
            tokenizer=tokenizer,
            normalizer=normalizer,
            metric=metric,
        ),
    )

    print("Running evals before training to establish a baseline")
    metrics = trainer.evaluate(
        metric_key_prefix="baseline",
        max_length=training_args.generation_max_length,
        num_beams=training_args.generation_num_beams,
    )
    trainer.log_metrics("baseline", metrics)
    trainer.save_metrics("baseline", metrics)

    print(f"Starting training! Weights will be saved to '{training_args.output_dir}'")
    train_result = trainer.train()

    # Save the model weights, tokenizer, and feature extractor
    trainer.save_model()
    tokenizer.save_pretrained(training_args.output_dir)
    feature_extractor.save_pretrained(training_args.output_dir)

    # Log training metrics
    metrics = train_result.metrics
    metrics["train_samples"] = len(dataset["train"])
    trainer.log_metrics("train", metrics)
    trainer.save_metrics("train", metrics)
    trainer.save_state()

    # Final evaluation to see how much we improved
    print("Running final evals")
    metrics = trainer.evaluate(
        metric_key_prefix="test",
        max_length=training_args.generation_max_length,
        num_beams=training_args.generation_num_beams,
    )
    metrics["eval_samples"] = len(dataset["test"])

    trainer.log_metrics("test", metrics)
    trainer.save_metrics("test", metrics)
    output_volume.commit()  # Ensure everything is saved to the Volume

    print(f"\nTraining complete! Model saved to '{training_args.output_dir}'")


```

## 从命令行调用 Modal 函数

调用我们的训练函数的最简单方法是创建一个 `local_entrypoint` --
我们的`main`函数在本地运行并提供命令行界面来触发Modal 云基础设施的培训。

```python
@app.local_entrypoint()
def main(test: bool = False):
    """Run Whisper fine-tuning on Modal."""
    if test:  # for quick e2e test
        config = Config(
            dataset_name=None,
            num_train_epochs=1.0,
            warmup_steps=0,
            max_steps=1,
        )
    else:
        config = Config()

    train.remote(config)


```

这将允许我们运行这个例子：

```bash
modal run fine_tune_asr.py
```

传递给该函数的参数会自动转换为 CLI 参数。对于
例如，添加`--test`将运行端到端测试的单步训练。

```bash
modal run fine_tune_asr.py --test
```

培训大约需要 1.5 小时，并将在整个过程中记录 WER 和其他指标
跑。

以下是模型在微调后正确预测的一些术语示例：

| **基本型号** | **微调** |
|----------------|-----------------|
|并pm套餐| npm 包 |
|教他们|氚|
| chromebox | chromevox |
|目的|海豚 |
|差异汤 |汤 |
|你会吗|小部件 |

## 部署我们经过微调的模型进行推理

一旦微调完成，Modal 就可以非常轻松地部署我们的新模型。
我们可以使用 Modal 定义推理函数和端点
[Cls](https://modal.com/docs/reference/modal.Cls)。
这将使我们能够利用
[生命周期挂钩](https://modal.com/docs/guide/lifecycle-functions)
使用 `@modal.enter` 装饰器在容器启动时仅加载模型一次。
我们可以使用
[modal.fastapi\_endpoint](https://modal.com/docs/reference/modal.fastapi_endpoint)
将我们的推理函数公开为 Web 函数。

```python
@app.cls(
    image=image,
    gpu="H100",
    timeout=10 * MINUTES,
    # scaledown_window=10 * MINUTES,
    volumes=volumes,
)
class Inference:
    model_name: str = modal.parameter(default=Config().model_output_name)

    @modal.enter()
    def load_model(self):
        """Load the model and processor on container startup."""

        model = f"{OUTPUT_DIR}/{self.model_name}"
        print(f"Loading model from {model}")
        self.processor = transformers.WhisperProcessor.from_pretrained(model)
        self.model = transformers.WhisperForConditionalGeneration.from_pretrained(model)
        self.model.config.forced_decoder_ids = None

    @modal.method()
    def transcribe(
        self,
        audio_bytes: bytes,
    ) -> str:
        # Resample audio to match the model's sample rate
        model_sample_rate = self.processor.feature_extractor.sampling_rate
        audio_data, sample_rate = librosa.load(io.BytesIO(audio_bytes), sr=None)

        audio_dataset = datasets.Dataset.from_dict(
            {"audio": [{"array": audio_data, "sampling_rate": sample_rate}]}
        ).cast_column("audio", datasets.Audio(sampling_rate=model_sample_rate))

        # Audio -> features (log-mel spectrogram)
        row = next(iter(audio_dataset))
        input_features = self.processor(
            row["audio"]["array"],
            sampling_rate=row["audio"]["sampling_rate"],
            return_tensors="pt",
        ).input_features

        # generate tokens -> decode to text
        predicted_ids = self.model.generate(input_features)
        transcription = self.processor.batch_decode(
            predicted_ids, skip_special_tokens=True
        )[0]

        return transcription

    @modal.fastapi_endpoint(method="POST", docs=True)
    def web(
        self,
        audio_file: Annotated[bytes, fastapi.File()],
    ) -> dict[str, str]:
        """Defines an endpoint for calling inference."""

        transcription = self.transcribe.local(  # run in the same container
            audio_bytes=audio_file,
        )
        return {"transcription": transcription}


```

部署它：

```bash
modal deploy fine_tune_asr.py
```

注意：您可以通过将 `model_name` 作为参数传递来指定要加载的模型
调用端点时的查询参数。默认为 `model_output_name`，即
我们在上面的`Config`中设置，是我们的模型所在目录的名称
被救了。

以下是如何使用此端点转录音频文件的示例：

```bash
curl -X 'POST' \
'https://your-workspace-name--example-whisper-fine-tune-inference-web.modal.run/?model_name=whisper-fine-tune' \
-H 'accept: application/json' \
-H 'Content-Type: multipart/form-data' \
-F 'audio_file=@your-audio-file.wav;type=audio/wav'
```

## 支持代码

```python
def get_test_dataset(config, length=5):
    return datasets.Dataset.from_dict(
        {
            "text": ["Modal"] * length,
            "audio": [{"array": [1.0] * 16000, "sampling_rate": 16000}] * length,
            "category": [config.dataset_category] * length,
        }
    )


def filter_dataset(
    category, audio, dataset_category, max_input_length, min_input_length
):
    return (
        category == dataset_category
        and len(audio["array"]) > min_input_length
        and len(audio["array"]) < max_input_length
    )


def prepare_dataset(batch, feature_extractor, tokenizer, model_input_name):
    """Batched: convert audio to features and text to token IDs."""
    audio_arrays = [s["array"] for s in batch["audio"]]
    inputs = feature_extractor(
        audio_arrays,
        sampling_rate=feature_extractor.sampling_rate,
    )
    batch[model_input_name] = inputs.get(model_input_name)
    batch["input_length"] = [len(s["array"]) for s in batch["audio"]]

    normalized = [
        t.replace(" <COMMA>", ",")
        .replace(" <PERIOD>", ".")
        .replace(" <QUESTIONMARK>", "?")
        .replace(" <EXCLAMATIONPOINT>", "!")
        .lower()
        .strip()
        for t in batch["text"]
    ]
    batch["labels"] = tokenizer(normalized).input_ids

    return batch


def compute_metrics(pred, tokenizer, normalizer, metric):
    """Compute Word Error Rate between predictions and ground truth."""
    pred_ids = pred.predictions

    # Replace padding tokens with proper pad token ID
    pred.label_ids[pred.label_ids == -100] = tokenizer.pad_token_id

    # Decode predictions and labels back to text
    pred_str = tokenizer.batch_decode(pred_ids, skip_special_tokens=True)
    norm_pred_str = [normalizer(s).strip() for s in pred_str]

    label_str = tokenizer.batch_decode(pred.label_ids, skip_special_tokens=True)
    norm_label_str = [normalizer(s).strip() for s in label_str]

    # Calculate Word Error Rate
    wer = metric.compute(predictions=norm_pred_str, references=norm_label_str)
    return {"wer": wer}


@dataclass
class DataCollatorSpeechSeq2SeqWithPadding:
    """
    Data collator that pads audio features and text labels for batch training.

    Args:
        processor: WhisperProcessor combining feature extractor and tokenizer
        decoder_start_token_id: The BOS token ID for the decoder
    """

    processor: Any
    decoder_start_token_id: int

    def __call__(
        self, features: list[dict[str, Union[list[int], "torch.Tensor"]]]
    ) -> dict[str, "torch.Tensor"]:
        # Separate audio features and text labels since they need different padding
        model_input_name = self.processor.model_input_names[0]
        input_features = [
            {model_input_name: feature[model_input_name]} for feature in features
        ]
        label_features = [{"input_ids": feature["labels"]} for feature in features]

        batch = self.processor.feature_extractor.pad(
            input_features,
            return_tensors="pt",
            return_attention_mask=True,
            padding=True,
        )

        labels_batch = self.processor.tokenizer.pad(label_features, return_tensors="pt")

        # Replace padding tokens with -100 so they're ignored in loss calculation
        labels = labels_batch["input_ids"].masked_fill(
            labels_batch.attention_mask.ne(1), -100
        )

        # Remove start token if tokenizer added it - model will add it during training
        if (labels[:, 0] == self.decoder_start_token_id).all().cpu().item():
            labels = labels[:, 1:]

        batch["labels"] = labels

        return batch

```