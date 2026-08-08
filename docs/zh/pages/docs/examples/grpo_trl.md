<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 GRPO 和 TRL 训练模型来解决编码问题

此示例演示如何使用 TRL [GRPO 训练器](https://huggingface.co/docs/trl/main/en/grpo_trainer) 在 Modal 上运行 [GRPO](https://arxiv.org/pdf/2402.03300)
GRPO是DeepSeek推出的强化学习算法，用于训练DeepSeek R1。
TRL 是 Huggingface 的强化学习训练库。

首先我们执行导入，然后定义应用程序。

```python
from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path
from typing import Iterable, Sequence

import modal

app: modal.App = modal.App("example-grpo-trl")

```

我们定义一个安装 TRL 库的映像。
我们还为本示例的下一部分安装 vLLM。我们还使用权重和偏差进行记录。

```python
image: modal.Image = modal.Image.debian_slim().uv_pip_install(
    "trl[vllm]==0.28.0",
    "vllm==0.12.0",
    "transformers==4.57.1",
    "datasets==3.5.1",
    "wandb==0.17.6",
)

```

我们导入图像上下文中所需的必要库。

```python
with image.imports():
    from datasets import Dataset, load_dataset
    from trl import GRPOConfig, GRPOTrainer

```

我们还定义了一个[Modal Volume](https://modal.com/docs/guide/volumes#volumes)来存储模型检查点。

```python
MODELS_DIR = Path("/models")
checkpoints_volume: modal.Volume = modal.Volume.from_name(
    "example-grpo-trl-checkpoints", create_if_missing=True
)

```

## 定义奖励函数

在此示例中，我们使用 [OpenCoder-LLM/opc-sft-stage2](https://huggingface.co/datasets/OpenCoder-LLM/opc-sft-stage2) 数据集来训练模型来解决编码问题。

在强化学习中，我们为模型定义了奖励函数。由于我们正在评估由生成的代码
模型中，我们使用[Modal Sandboxes](https://modal.com/docs/guide/sandbox)来安全地评估代码。

对于模型中的每个完成和测试完成的测试用例，我们定义一个简单的奖励函数。
如果没有错误，该函数返回 1，否则返回 0。您可能想要调整此奖励函数
因为模型不太可能通过这个函数很好地学习。

```python
@app.function()
def compute_reward(completion: str, testcase: Sequence[str]) -> int:
    sb, score = None, 0
    sb: modal.Sandbox = modal.Sandbox.create(app=app)
    code_to_execute: str = get_generated_code_and_test_cases(completion, testcase)

    try:
        p = sb.exec("python", "-c", code_to_execute, timeout=30)
        p.wait()
        return_code = p.returncode
        if return_code == 0:
            score = 1
    except Exception as e:
        print(e)
    finally:
        sb.terminate()
        return score


```

我们编写一个函数，根据模型补全构造一个程序。这是根据数据的格式确定的。
完成应该遵循格式“\`\`\`python ...”。
测试用例是断言语句的列表。
更多详细信息[此处](https://huggingface.co/datasets/OpenCoder-LLM/opc-sft-stage2)。

````python
def get_generated_code_and_test_cases(completion: str, testcase: Sequence[str]) -> str:
    if "```python”完成：
        # 找到代码块的开始和结束位置
        start_idx: int =completion.find("```python") + len("```python")end_idx: int =completion.find("```", start_idx)
        if end_idx != -1:
            code: str = completion[start_idx:end_idx].strip()
        else:
            code: str = completion[start_idx:].strip()
    else:
        code: str = completion.strip()

    test_cases: str = "\n".join(testcase)
    full_code: str = f"{code}\n\n{test_cases}"
    return full_code


````

最后，我们定义传递到 GRPOTrainer 的函数，该函数接收完成列表。
自定义奖励函数必须符合[特定签名](https://huggingface.co/docs/trl/main/en/grpo_trainer#using-a-custom-reward-function)。

```python
def reward_helper_function(
    completions: Sequence[str], testcases: Sequence[Sequence[str]], **kwargs: object
) -> Iterable[int]:
    return compute_reward.starmap(zip(completions, testcases))


```

## 开始训练

预处理数据，准备 `GRPOTrainer` 期望的列。
我们使用 OpenCoder-LLM 教育指导数据集，该数据集具有通过 Python 编译器验证的（指令、代码、测试用例）三元组。
更多详细信息[此处](https://huggingface.co/datasets/OpenCoder-LLM/opc-sft-stage2)。

```python
def start_grpo_trainer(use_vllm=False, vllm_mode=None):
    dataset: Dataset = load_dataset(
        "OpenCoder-LLM/opc-sft-stage2", "educational_instruct", split="train"
    )
    dataset = dataset.rename_column(
        "instruction", "prompt"
    )  # Needed for the GRPO trainer
    dataset = dataset.rename_column("testcase", "testcases")
    dataset = dataset.select(range(128))  # To simplify testing.
    training_args: GRPOConfig = GRPOConfig(
        output_dir=str(MODELS_DIR),
        report_to="wandb",
        use_vllm=use_vllm,
        vllm_mode=vllm_mode,
        save_steps=1,
        max_steps=5,  # To simplify testing. Remove for production use cases.
    )
    trainer = GRPOTrainer(
        model="Qwen/Qwen2-0.5B-Instruct",
        reward_funcs=reward_helper_function,
        args=training_args,
        train_dataset=dataset,
    )
    trainer.train()


```

我们使用权重和偏差进行日志记录，因此我们使用 [Modal Secret](https://modal.com/docs/guide/secrets#secrets) 和 wandb 凭证。

```python
@app.function(
    image=image,
    gpu="H100",
    timeout=60 * 60 * 24,  # 24 hours
    secrets=[modal.Secret.from_name("wandb-secret")],
    volumes={"/models": checkpoints_volume},
)
def train() -> None:
    start_grpo_trainer()


```
运行：`modal run --detach grpo_trl.py::train`。

## 使用 vLLM 加速训练

vLLM 可以在服务器模式（在单独的 GPU 上运行 vLLM 服务器）或并置模式（在训练过程中）中使用。
在服务器模式下，vLLM 在单独的进程中运行（并使用单独的 GPU），并通过 HTTP 与训练器通信。
如果您有用于推理的专用 GPU，那么这是理想的选择。更多详细信息[此处](https://huggingface.co/docs/trl/main/en/grpo_trainer#-option-1-server-mode)。
在这里，我们使用 2 个 GPU。我们在其中一个上运行 GRPOTrainer，在另一个上运行 vLLM 进程。

```python
@app.function(
    image=image,
    gpu="H100:2",
    timeout=60 * 60 * 24,  # 24 hours
    secrets=[modal.Secret.from_name("wandb-secret")],
    volumes={str(MODELS_DIR): checkpoints_volume},
)
def train_vllm_server_mode() -> None:
    env_copy = os.environ.copy()
    env_copy["CUDA_VISIBLE_DEVICES"] = "0"  # Run serve vLLM process on GPU 0

    # Start vllm-serve in the background
    subprocess.Popen(
        ["trl", "vllm-serve", "--model", "Qwen/Qwen2-0.5B-Instruct"],
        env=env_copy,
    )
    os.environ["CUDA_VISIBLE_DEVICES"] = "1"  # Run training process on GPU 1
    start_grpo_trainer(use_vllm=True, vllm_mode="server")


```

您可以使用`modal run --detach grpo_trl.py::train_vllm_server_mode`执行此操作。在并置模式下，vLLM 在训练器进程内运行并与训练模型共享 GPU 内存。
这避免了启动单独的服务器，并且可以提高 GPU 利用率，但可能会导致训练 GPU 上的内存争用。
更多详细信息[此处](https://huggingface.co/docs/trl/main/en/grpo_trainer#-option-2-colocate-mode)。

```python
@app.function(
    image=image,
    gpu="H100",
    timeout=60 * 60 * 24,  # 24 hours
    secrets=[modal.Secret.from_name("wandb-secret")],
    volumes={"/models": checkpoints_volume},
)
def train_vllm_colocate_mode() -> None:
    # Rank of the current process (0 for single-process training)
    os.environ["RANK"] = "0"
    # Local rank of the process on the node (0 for single-process training)
    os.environ["LOCAL_RANK"] = "0"
    # Total number of processes (1 for single-process training)
    os.environ["WORLD_SIZE"] = "1"
    # Address of the master node (localhost for single node)
    os.environ["MASTER_ADDR"] = "localhost"
    # Port for communication between processes
    os.environ["MASTER_PORT"] = "12355"
    start_grpo_trainer(use_vllm=True, vllm_mode="colocate")


```

您可以使用`modal run --detach grpo_trl.py::train_vllm_colocate_mode`执行此操作。

## 对训练后的模型进行推理

我们使用 vLLM 对训练后的模型进行推理。

```python
VLLM_PORT: int = 8000


```

一旦模态体积中有模型检查点，您就可以加载权重并使用 vLLM 执行推理。有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。
权重路径如下：`global_step_n/actor/huggingface`，其中n是您想要的检查点（例如`global_step_5/actor/huggingface`）。
`latest_checkpointed_iteration.txt` 文件存储最新的检查点索引。

```python
def get_latest_checkpoint_file_path():
    checkpoint_dirs = [
        d.name
        for d in MODELS_DIR.iterdir()
        if d.is_dir() and re.match(r"^checkpoint-(\d+)$", d.name)
    ]
    if not checkpoint_dirs:
        raise FileNotFoundError("No checkpoint directories found in models dir")
    latest_checkpoint_index = max(
        int(re.match(r"^checkpoint-(\d+)$", d).group(1)) for d in checkpoint_dirs
    )
    return str(MODELS_DIR / f"checkpoint-{latest_checkpoint_index}")


```

我们在此处提供用于设置 OpenAI 兼容推理端点的代码。有关更多详细信息，请参阅。在 vLLM 上提供模型，请查看[此示例。](https://modal.com/docs/examples/vllm_inference#deploy-the-server)

```python
vllm_image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "vllm==0.12.0",
        "flashinfer-python==0.5.3",
        extra_index_url="https://download.pytorch.org/whl/cu128",
        extra_options="--index-strategy unsafe-best-match",
    )
    .env({"VLLM_USE_V1": "1"})
)

vllm_cache_vol = modal.Volume.from_name("vllm-cache", create_if_missing=True)


@app.function(
    image=vllm_image,
    gpu="H100",
    scaledown_window=15 * 60,  # How long should we stay up with no requests?
    timeout=10 * 60,  # How long should we wait for container start?
    volumes={"/root/.cache/vllm": vllm_cache_vol, MODELS_DIR: checkpoints_volume},
)
@modal.concurrent(
    max_inputs=32
)  # How many requests can one replica handle? tune carefully!
@modal.web_server(port=VLLM_PORT, startup_timeout=10 * 60)
def serve():
    latest_checkpoint_file_path = get_latest_checkpoint_file_path()

    cmd = [
        "vllm",
        "serve",
        "--uvicorn-log-level=info",
        latest_checkpoint_file_path,
        "--host",
        "0.0.0.0",
        "--port",
        str(VLLM_PORT),
    ]
    subprocess.Popen(" ".join(cmd), shell=True)


```

然后，您可以使用 `modal deploy grpo_trl.py` 部署服务器，它会为您提供自定义 URL。然后您可以使用以下curl命令查询它：

```bash
curl -X POST <url>/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant for solving math problems."},
      {"role": "user", "content": "James had 4 apples. Mary gave him 2 and he ate 1. How many does he have left?"}
    ],
    "temperature": 0.7
  }'
```

或通过[以下方式](https://modal.com/docs/examples/vllm_inference#interact-with-the-server)。