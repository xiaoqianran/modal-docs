<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 Unsloth 进行高效的 LLM 微调

训练大型语言模型是一个非常需要计算资源的过程。
开源法学硕士通常需要许多 GB（或者在极端情况下，
[1 TB](https://github.com/MoonshotAI/Kimi-K2#2-model-summary)!) 的
VRAM 只是为了适合内存。微调模型需要更多内存；
对简单微调的常见估计将 VRAM 要求大致定为
4.2 倍原始模型尺寸：
1x 模型权重 + 1x 梯度 + 2x 优化器状态 + 20% 激活。
像 LoRA 这样的参数高效方法可以显着改善问题，因为
该估计现在仅适用于 LoRA 模块的权重，而不是整个
模型的。通过对提到的每个组件进行量化可以获得进一步的收益
如上所述，但这样做需要量化感知训练，这可能很难
与 LoRA 等方法结合。

Unsloth 提供了使用 LoRA 和量化进行 LLM 微调的优化方法，
典型的性能提升是训练速度提高 2 倍，内存使用量减少 70%。
此示例演示了使用 Unsloth 来微调 Qwen3-14B 的版本
Modal 上的 FineTome-100k 数据集仅使用单个 GPU！

## 模态基础设施设置

```python
import pathlib
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import modal

```
我们创建一个 Modal [App](https://modal.com/docs/guide/apps) 来组织我们的功能
以及容器映像和卷等共享基础设施。

```python
app = modal.App("example-unsloth-finetune")

```

### 容器镜像配置

我们使用 Unsloth 和所有必要的依赖项构建自定义容器映像。
该镜像包含经过优化的最新版本 Unsloth（截至撰写时）
了解最新的模型架构。一旦定义了图像，我们就可以指定
导入后我们需要编写其余的训练代码。重要的是，我们导入
`unsloth` 在其余部分之前，以便将 Unsloth 的补丁应用于诸如
`transformers`、`peft`、`trl`。

```python
train_image = (
    modal.Image.debian_slim(python_version="3.11")
    .uv_pip_install(
        "accelerate==1.9.0",
        "datasets==3.6.0",
        "hf-transfer==0.1.9",
        "huggingface_hub==0.34.2",
        "peft==0.16.0",
        "transformers==4.54.0",
        "trl==0.19.1",
        "unsloth[cu128-torch270]==2025.7.8",
        "unsloth_zoo==2025.7.10",
        "wandb==0.21.0",
    )
    .env({"HF_HOME": "/model_cache"})
)

with train_image.imports():
    # unsloth must be first!
    import unsloth  # noqa: F401,I001
    import datasets
    import torch
    import wandb
    from transformers import TrainingArguments
    from trl import SFTTrainer
    from unsloth import FastLanguageModel
    from unsloth.chat_templates import standardize_sharegpt

```

### 卷配置

模态 [Volumes](https://modal.com/docs/guide/volumes) 提供持久存储
函数调用之间。我们对不同类型的数据使用单独的卷
启用高效的缓存和共享：

* [预训练模型权重](https://modal.com/docs/guide/model-weights) 的缓存 - 在所有实验中重复使用
* 已处理数据集的缓存 - 使用相同数据集时重用
* 训练检查点和最终模型的存储

```python
model_cache_volume = modal.Volume.from_name(
    "unsloth-model-cache", create_if_missing=True
)
dataset_cache_volume = modal.Volume.from_name(
    "unsloth-dataset-cache", create_if_missing=True
)
checkpoint_volume = modal.Volume.from_name(
    "unsloth-checkpoints", create_if_missing=True
)

```

### 选择 GPU

我们使用L40S是因为它的[VRAM](https://modal.com/gpu-glossary/device-hardware/gpu-ram)的健康平衡，
[CUDA 核心](https://modal.com/gpu-glossary/device-hardware/cuda-core) 和时钟速度。
超时为我们的训练时间提供了上限；如果我们的训练运行得更快，
我们不会用完整整 6 个小时。我们还指定了 3 次重试，这将很有用
以防我们的训练函数被[抢占](https://modal.com/docs/guide/preemption)。

```python
GPU_TYPE = "L40S"
TIMEOUT_HOURS = 6
MAX_RETRIES = 3

```

## 数据处理

我们将在 FineTome-100k 数据集上微调我们的模型，即
[The Tome](https://huggingface.co/datasets/arcee-ai/The-Tome) 的子集
由 [fineweb-edu-classifier](https://huggingface.co/HuggingFaceFW/fineweb-edu-classifier) 策划
下面我们定义了一些用于处理该数据集的助手。

```python
CONVERSATION_COLUMN = "conversations"  # ShareGPT format column name
TEXT_COLUMN = "text"  # Output column for formatted text
TRAIN_SPLIT_RATIO = 0.9  # 90% train, 10% eval split
PREPROCESSING_WORKERS = 2  # Number of workers for dataset processing


def format_chat_template(examples, tokenizer):
    texts = []
    for conversation in examples[CONVERSATION_COLUMN]:
        formatted_text = tokenizer.apply_chat_template(
            conversation, tokenize=False, add_generation_prompt=False
        )
        texts.append(formatted_text)
    return {TEXT_COLUMN: texts}


def load_or_cache_dataset(config: "TrainingConfig", paths: dict, tokenizer):
    dataset_cache_path = paths["dataset_cache"]

    if dataset_cache_path.exists():
        print(f"Loading cached dataset from {dataset_cache_path}")
        train_dataset = datasets.load_from_disk(dataset_cache_path / "train")
        eval_dataset = datasets.load_from_disk(dataset_cache_path / "eval")
    else:
        print(f"Downloading and processing dataset: {config.dataset_name}")

        # Load and standardize the dataset format
        dataset = datasets.load_dataset(config.dataset_name, split="train")
        dataset = standardize_sharegpt(dataset)

        # Split into training and evaluation sets with fixed seed for reproducibility
        dataset = dataset.train_test_split(
            test_size=1.0 - TRAIN_SPLIT_RATIO, seed=config.seed
        )
        train_dataset = dataset["train"]
        eval_dataset = dataset["test"]

        # Apply chat template formatting to convert conversations to text
        print("Formatting datasets with chat template...")
        train_dataset = train_dataset.map(
            lambda examples: format_chat_template(examples, tokenizer),
            batched=True,
            num_proc=PREPROCESSING_WORKERS,
            remove_columns=train_dataset.column_names,
        )

        eval_dataset = eval_dataset.map(
            lambda examples: format_chat_template(examples, tokenizer),
            batched=True,
            num_proc=PREPROCESSING_WORKERS,
            remove_columns=eval_dataset.column_names,
        )

        # Cache the processed datasets for future runs
        print(f"Caching processed datasets to {dataset_cache_path}")
        dataset_cache_path.mkdir(parents=True, exist_ok=True)
        train_dataset.save_to_disk(dataset_cache_path / "train")
        eval_dataset.save_to_disk(dataset_cache_path / "eval")

        # Commit the dataset cache to the volume
        dataset_cache_volume.commit()

    return train_dataset, eval_dataset


```

## 加载预训练模型

如果没有预先准备好的模型，我们就无法进行微调！由于这些模型是
相当大，我们不想为每次训练运行从头开始下载它们。
我们通过在下载时缓存一个 Volume 中的权重，然后加载来解决这个问题
从后续运行的卷中。

```python
def load_or_cache_model(config: "TrainingConfig", paths: dict):
    print(f"Downloading and caching model: {config.model_name}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=config.model_name,
        max_seq_length=config.max_seq_length,
        dtype=None,
        load_in_4bit=config.load_in_4bit,
        load_in_8bit=config.load_in_8bit,
    )

    return model, tokenizer


```

## 训练配置

首先，我们将定义 LoRA 模块应针对哪些层。
一般来说，建议 LoRA 微调模型中的每个线性层，
所以我们针对每个注意力层的每个投影矩阵。

```python
LORA_TARGET_MODULES = [
    "q_proj",
    "k_proj",
    "v_proj",
    "o_proj",
    "gate_proj",
    "up_proj",
    "down_proj",
]


```

我们想要公开不同的超参数和优化
Unsloth 支持，因此我们将它们包装到 `TrainingConfig` 类中。之后，
我们将使用命令行中的参数填充此配置。

```python
@dataclass
class TrainingConfig:
    # Model and dataset selection
    model_name: str
    dataset_name: str
    max_seq_length: int
    load_in_4bit: bool
    load_in_8bit: bool

    # LoRA configuration for efficient finetuning
    lora_r: int
    lora_alpha: int
    lora_dropout: float
    lora_bias: str
    use_rslora: bool

    # Training hyperparameters
    optim: str
    batch_size: int
    gradient_accumulation_steps: int
    packing: bool
    use_gradient_checkpointing: str
    learning_rate: float
    lr_scheduler_type: str
    warmup_ratio: float
    weight_decay: float
    max_steps: int
    save_steps: int
    eval_steps: int
    logging_steps: int

    # Experiment management
    seed: int
    experiment_name: Optional[str] = None
    enable_wandb: bool = True

    # For testing purposes
    skip_eval: bool = False

    def __post_init__(self):
        # Generate a unique experiment name if not provided
        if self.experiment_name is None:
            timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            model_short = self.model_name.split("/")[-1]
            self.experiment_name = f"{model_short}-r{self.lora_r}-{timestamp}"


```

## 主要训练功能

该函数协调整个训练过程，从模型加载到
到最终模型保存。它是用Modal功能配置来装饰的
指定计算资源、所需的卷和执行
超时和重试等详细信息。

```python
@app.function(
    image=train_image,
    gpu=GPU_TYPE,
    volumes={
        "/model_cache": model_cache_volume,
        "/dataset_cache": dataset_cache_volume,
        "/checkpoints": checkpoint_volume,
    },
    secrets=[modal.Secret.from_name("wandb-secret")],
    timeout=TIMEOUT_HOURS * 60 * 60,
    retries=modal.Retries(initial_delay=0.0, max_retries=MAX_RETRIES),
    single_use_containers=True,  # Ensure we get a fresh container on retry
)
def finetune(config: TrainingConfig):
    # Get structured paths for organized file storage
    paths = get_structured_paths(config)

    # Initialize Weights & Biases for experiment tracking if enabled
    if config.enable_wandb:
        wandb.init(
            project="unsloth-finetune",
            name=config.experiment_name,
            config=config.__dict__,
        )

    # Load or cache model and datasets with progress indicators
    print("Setting up model and data...")
    model, tokenizer = load_or_cache_model(config, paths)
    train_dataset, eval_dataset = load_or_cache_dataset(config, paths, tokenizer)

    # Configure the model for LoRA training
    model = setup_model_for_training(model, config)

    # Prepare checkpoint directory and check for existing checkpoints
    checkpoint_path = paths["checkpoints"]
    checkpoint_path.mkdir(parents=True, exist_ok=True)
    resume_from_checkpoint = check_for_existing_checkpoint(paths)

    # Create training configuration
    training_args = create_training_arguments(config, str(checkpoint_path))

    # Initialize the supervised finetuning trainer
    print("Initializing SFTTrainer...")
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        dataset_text_field=TEXT_COLUMN,
        max_seq_length=config.max_seq_length,
        dataset_num_proc=PREPROCESSING_WORKERS,
        packing=config.packing,  # Sequence packing for efficiency
        args=training_args,
    )

    # Display training information for transparency
    print(f"Training dataset size: {len(train_dataset):,}")
    print(f"Evaluation dataset size: {len(eval_dataset):,}")
    print(f"Total parameters: {sum(p.numel() for p in model.parameters()):,}")
    print(
        f"Trainable parameters: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}"
    )
    print(f"Experiment: {config.experiment_name}")

    # Start training or resume from checkpoint
    if resume_from_checkpoint:
        print(f"Resuming training from {resume_from_checkpoint}")
        trainer.train(resume_from_checkpoint=resume_from_checkpoint)
    else:
        print("Starting training from scratch...")
        trainer.train()

    # Save the final trained model and tokenizer
    print("Saving final model...")
    final_model_path = checkpoint_path / "final_model"
    model.save_pretrained(final_model_path)
    tokenizer.save_pretrained(final_model_path)

    # Clean up experiment tracking
    if config.enable_wandb:
        wandb.finish()

    print(f"Training completed! Model saved to: {final_model_path}")
    return config.experiment_name


```

最后，我们从一个调用我们的训练函数
[`App.local_entrypoint`](https://modal.com/docs/reference/modal.App#local_entrypoint)。
此函数的参数会自动转换为 CLI 标志
当我们[`modal run`](https://modal.com/docs/reference/cli/run#modal-run)时可以指定
我们的代码。这允许我们直接调整超参数之类的事情
从命令行无需修改我们的源代码。

要尝试此示例，请查看示例存储库，安装 Modal 客户端，然后运行

```bash
modal run 06_gpu_and_ml/unsloth_finetune.py
```

您还可以通过使用命令行调整超参数来自定义训练过程
标志，例如

```bash
modal run 06_gpu_and_ml/unsloth_finetune.py --max-steps 10000
```

```python
@app.local_entrypoint()
def main(
    # Model and dataset configuration
    model_name: str = "unsloth/Qwen3-32B",
    dataset_name: str = "mlabonne/FineTome-100k",
    max_seq_length: int = 32768,
    load_in_4bit: bool = True,  # unsloth: use 4bit quant for frozen model weights
    load_in_8bit: bool = False,  # unsloth: use 8bit quant for frozen model weights
    # LoRA hyperparameters for finetuning efficiency
    lora_r: int = 16,
    lora_alpha: int = 16,
    lora_dropout: float = 0.0,
    lora_bias: str = "none",  # unsloth: optimized lora kernel
    use_rslora: bool = False,
    # Training hyperparameters for optimization
    optim: str = "adamw_8bit",  # unsloth: 8bit optimizer
    batch_size: int = 16,
    gradient_accumulation_steps: int = 1,
    packing: bool = False,
    use_gradient_checkpointing: str = "unsloth",  # unsloth: optimized gradient offloading
    learning_rate: float = 2e-4,
    lr_scheduler_type: str = "cosine",
    warmup_ratio: float = 0.06,
    weight_decay: float = 0.01,
    max_steps: int = 5,  # increase!
    save_steps: int = 2,  # increase!
    eval_steps: int = 2,  # increase!
    logging_steps: int = 1,  # increase!
    # Optional experiment configuration
    seed: int = 105,
    experiment_name: Optional[str] = None,
    disable_wandb: bool = True,
    skip_eval: bool = False,
):
    # Create configuration object from command line arguments
    config = TrainingConfig(
        model_name=model_name,
        dataset_name=dataset_name,
        max_seq_length=max_seq_length,
        load_in_4bit=load_in_4bit,
        load_in_8bit=load_in_8bit,
        lora_r=lora_r,
        lora_alpha=lora_alpha,
        lora_bias=lora_bias,
        lora_dropout=lora_dropout,
        use_rslora=use_rslora,
        optim=optim,
        batch_size=batch_size,
        gradient_accumulation_steps=gradient_accumulation_steps,
        packing=packing,
        use_gradient_checkpointing=use_gradient_checkpointing,
        learning_rate=learning_rate,
        max_steps=max_steps,
        lr_scheduler_type=lr_scheduler_type,
        warmup_ratio=warmup_ratio,
        weight_decay=weight_decay,
        save_steps=save_steps,
        eval_steps=eval_steps,
        logging_steps=logging_steps,
        seed=seed,
        experiment_name=experiment_name,
        enable_wandb=not disable_wandb,
        skip_eval=skip_eval,
    )

    # Display experiment configuration for user verification
    print(f"Starting finetuning experiment: {config.experiment_name}")
    print(f"Model: {config.model_name}")
    print(f"Dataset: {config.dataset_name}")
    print(f"LoRA configuration: rank={config.lora_r}, alpha={config.lora_alpha}")
    print(
        f"Effective batch size: {config.batch_size * config.gradient_accumulation_steps}"
    )
    print(f"Training steps: {config.max_steps}")

    # Launch the training job on Modal infrastructure
    experiment_name = finetune.remote(config)
    print(f"Training completed successfully: {experiment_name}")


```

## 实用函数

这些函数处理模型加载、数据集处理的核心逻辑，
和训练设置。它们被设计为可针对新用例进行破解。

```python
def get_structured_paths(config: TrainingConfig):
    """
    Create structured paths within the mounted volumes for organized storage.

    This function maps the configuration to specific directory paths that allow
    multiple models, datasets, and experiments to coexist without conflicts.
    """
    # Replace forward slashes in names to create valid directory names
    dataset_cache_path = (
        pathlib.Path("/dataset_cache")
        / "datasets"
        / config.dataset_name.replace("/", "--")
    )
    checkpoint_path = (
        pathlib.Path("/checkpoints") / "experiments" / config.experiment_name
    )

    return {
        "dataset_cache": dataset_cache_path,
        "checkpoints": checkpoint_path,
    }


def setup_model_for_training(model, config: TrainingConfig):
    """
    Configure the model with LoRA adapters for efficient finetuning.

    LoRA (Low-Rank Adaptation) allows us to finetune large models efficiently
    by only training a small number of additional parameters. This significantly
    reduces memory usage and training time.
    """
    print("Configuring LoRA for training...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=config.lora_r,  # LoRA rank - higher values = more parameters
        target_modules=LORA_TARGET_MODULES,  # Which layers to apply LoRA to
        lora_alpha=config.lora_alpha,  # LoRA scaling parameter
        lora_dropout=config.lora_dropout,  # Dropout for LoRA layers
        bias=config.lora_bias,  # Bias configuration
        use_gradient_checkpointing=config.use_gradient_checkpointing,  # Memory optimization
        random_state=config.seed,  # Fixed seed for reproducibility
        use_rslora=config.use_rslora,  # Rank-stabilized LoRA
        loftq_config=None,  # LoFTQ quantization config
    )
    return model


def create_training_arguments(config: TrainingConfig, output_dir: str):
    """
    Create training arguments for the SFTTrainer.

    These arguments control the training process, including optimization settings,
    evaluation frequency, and checkpointing behavior.
    """
    print("SKIP_EVAL", config.skip_eval)
    return TrainingArguments(
        # Core training configuration
        per_device_train_batch_size=config.batch_size,
        gradient_accumulation_steps=config.gradient_accumulation_steps,
        learning_rate=config.learning_rate,
        max_steps=config.max_steps,
        warmup_ratio=config.warmup_ratio,
        # Evaluation and checkpointing
        eval_steps=config.eval_steps,
        save_steps=config.save_steps,
        eval_strategy="no" if config.skip_eval else "steps",
        save_strategy="steps",
        do_eval=not config.skip_eval,
        # Optimization settings based on hardware capabilities
        fp16=not torch.cuda.is_bf16_supported(),  # Use fp16 if bf16 not available
        bf16=torch.cuda.is_bf16_supported(),  # Prefer bf16 when available
        optim=config.optim,
        weight_decay=config.weight_decay,
        lr_scheduler_type=config.lr_scheduler_type,
        # Logging and output configuration
        logging_steps=config.logging_steps,
        output_dir=output_dir,
        report_to="wandb" if config.enable_wandb else None,
        seed=config.seed,
    )


def check_for_existing_checkpoint(paths: dict):
    """
    Check if there's an existing checkpoint to resume training from.

    This enables resumable training, which is crucial for long-running experiments
    that might be interrupted by infrastructure issues or resource limits.
    """
    checkpoint_dir = paths["checkpoints"]
    if not checkpoint_dir.exists():
        return None

    # Look for the most recent checkpoint directory
    checkpoints = list(checkpoint_dir.glob("checkpoint-*"))
    if checkpoints:
        latest_checkpoint = max(checkpoints, key=lambda p: int(p.name.split("-")[1]))
        print(f"Found existing checkpoint: {latest_checkpoint}")
        return str(latest_checkpoint)

    return None

```