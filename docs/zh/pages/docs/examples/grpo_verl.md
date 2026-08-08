<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 GRPO 和 verl 训练模型来解决数学问题

此示例演示如何使用 [verl](https://github.com/volcengine/verl) 框架在 Modal 上使用 [GRPO](https://arxiv.org/pdf/2402.03300) 进行训练。
GRPO是DeepSeek推出的强化学习算法，用于训练DeepSeek R1。
verl 是一个强化学习训练库，是 RLHF 框架 [HybridFlow](https://arxiv.org/abs/2409.19256v2) 的实现。

训练过程如下：

* 数据集中的每个示例都对应一个数学问题。
* 在每个训练步骤中，模型都会尝试解决显示其步骤的数学问题。
* 然后，我们使用下面定义的奖励函数计算模型解决方案的奖励。
* 然后，该奖励值将用于根据 GRPO 训练算法更新模型的参数。

## 设置

导入 Modal 部署所需的模块。

```python
import re
import subprocess
from pathlib import Path
from typing import Literal, Optional

import modal

```

## 定义图像和应用程序

```python
app = modal.App("example-grpo-verl")

```

我们定义一个镜像，在其中克隆 verl 存储库并安装其依赖项。我们使用基本版本图像作为起点。

```python
VERL_REPO_PATH: Path = Path("/root/verl")
image = (
    modal.Image.from_registry("verlai/verl:app-verl0.4-vllm0.8.5-mcore0.12.1")
    .apt_install("git")
    .run_commands(f"git clone https://github.com/volcengine/verl {VERL_REPO_PATH}")
    .uv_pip_install("verl[vllm]==0.4.1")
)

```

## 定义数据集

在此示例中，我们将使用强化学习来训练模型来解决数学问题。
我们使用 [GSM8K](https://huggingface.co/datasets/openai/gsm8k) 数学问题数据集和 [Modal Volume](https://modal.com/docs/guide/volumes#volumes) 来存储数据。

```python
DATA_PATH: Path = Path("/data")
data_volume: modal.Volume = modal.Volume.from_name(
    "grpo-verl-example-data", create_if_missing=True
)


```

我们编写一个模态函数来用数据填充卷。这将下载数据集并将其存储在卷中。
如果您还没有要用于此示例的数据，则需要运行此步骤。

```python
@app.function(image=image, volumes={DATA_PATH: data_volume})
def prep_dataset() -> None:
    subprocess.run(
        [
            "python",
            VERL_REPO_PATH / "examples" / "data_preprocess" / "gsm8k.py",
            "--local_dir",
            DATA_PATH,
        ],
        check=True,
    )


```

您可以使用以下命令开始数据集下载
`modal run <filename.py>::prep_dataset`

## 定义奖励函数

在强化学习中，我们为模型定义了奖励函数。
我们可以在单独的文件中定义它，或者在本例中的同一文件中定义它，然后将其作为参数传递给 verl。
我们使用 [verl repo](https://github.com/volcengine/verl/blob/v0.1/verl/utils/reward_score/gsm8k.py) 中的 GSM8K 奖励函数 `default` 奖励函数，修改为如果答案正确则返回 1.0，否则返回 0。

```python
def extract_solution(
    solution_str: str, method: Literal["strict", "flexible"] = "strict"
) -> Optional[str]:
    assert method in ["strict", "flexible"]

    if method == "strict":
        # This also tests the formatting of the model
        solution = re.search("#### (\\-?[0-9\\.\\,]+)", solution_str)
        if solution is None:
            final_answer: Optional[str] = None
        else:
            final_answer = solution.group(0)
            final_answer = (
                final_answer.split("#### ")[1].replace(",", "").replace("$", "")
            )
    elif method == "flexible":
        answer = re.findall("(\\-?[0-9\\.\\,]+)", solution_str)
        final_answer: Optional[str] = None
        if len(answer) == 0:
            # No reward if there is no answer.
            pass
        else:
            invalid_str: list[str] = ["", "."]
            # Find the last number that is not '.'
            for final_answer in reversed(answer):
                if final_answer not in invalid_str:
                    break
    return final_answer


```

奖励函数需要遵循[预定义签名。](https://verl.readthedocs.io/en/latest/preparation/reward_function.html)

```python
def compute_reward(
    data_source: str, solution_str: str, ground_truth: str, extra_info: dict
) -> float:
    answer = extract_solution(solution_str=solution_str, method="strict")
    if answer is None:
        return 0.0
    else:
        if answer == ground_truth:
            return 1.0
        else:
            return 0.0


```

然后，我们定义在训练运行期间传递给 verl 的常量。

```python
PATH_TO_REWARD_FUNCTION: Path = Path("/root/grpo_verl.py")
REWARD_FUNCTION_NAME: str = "compute_reward"

```

## 开始训练

我们为训练运行定义了更多常量。

```python
MODELS_PATH: Path = Path("/models")
MINUTES: int = 60


```

我们还定义了一个用于存储模型检查点的 Volume。

```python
checkpoints_volume: modal.Volume = modal.Volume.from_name(
    "grpo-verl-example-checkpoints", create_if_missing=True
)

```

现在，我们编写一个模态函数来启动训练运行。
如果您希望使用权重和偏差，就像我们在这段代码中所做的那样，您需要创建一个权重和偏差[秘密](https://modal.com/docs/guide/secrets#secrets)

verl 在底层使用 Ray。它为每个步骤创建 Ray Worker，其中每个 Ray Worker 都是一个 Python 进程，每个步骤都是 RL 数据流管道中的一个步骤。
verl 还保留一个独立于此的单独控制流过程，负责确定 RL 管道中要执行的步骤。
每个 Ray 工作线程都会映射到 1 个或多个 GPU。根据可用 GPU 的数量，Ray 将决定哪些工作人员去哪里，或者推迟调度工作人员
如果没有可用的 GPU。一般来说，更多的 VRAM = Ray 工作线程更少的热交换，这意味着每次迭代时等待内存复制的时间更少。
在此示例中，我们选择了一种可轻松进行自动化测试的配置，但您可能希望使用更多 GPU 或更强大的 GPU 类型。
更多详细信息[此处](https://verl.readthedocs.io/en/latest/hybrid_flow.html)。

```python
@app.function(
    image=image,
    gpu="H100:2",
    volumes={
        MODELS_PATH: checkpoints_volume,
        DATA_PATH: data_volume,
    },
    secrets=[modal.Secret.from_name("wandb-secret")],
    timeout=24 * 60 * MINUTES,
)
def train(*arglist) -> None:
    data_volume.reload()

    cmd: list[str] = [
        "python",
        "-m",
        "verl.trainer.main_ppo",
        "algorithm.adv_estimator=grpo",
        f"data.train_files={DATA_PATH / 'train.parquet'}",
        f"data.val_files={DATA_PATH / 'test.parquet'}",
        "data.train_batch_size=128",
        "data.max_prompt_length=64",
        "data.max_response_length=1024",
        "data.filter_overlong_prompts=True",
        "data.truncation=error",
        "actor_rollout_ref.model.path=Qwen/Qwen2-0.5B",
        "actor_rollout_ref.actor.optim.lr=1e-6",
        "actor_rollout_ref.model.use_remove_padding=False",
        "actor_rollout_ref.actor.ppo_mini_batch_size=128",
        "actor_rollout_ref.actor.ppo_micro_batch_size_per_gpu=16",
        "actor_rollout_ref.actor.checkpoint.save_contents='model,optimizer,extra,hf_model'",
        "actor_rollout_ref.actor.use_kl_loss=True",
        "actor_rollout_ref.actor.entropy_coeff=0",
        "actor_rollout_ref.actor.kl_loss_coef=0.001",
        "actor_rollout_ref.actor.kl_loss_type=low_var_kl",
        "actor_rollout_ref.model.enable_gradient_checkpointing=True",
        "actor_rollout_ref.actor.fsdp_config.param_offload=False",
        "actor_rollout_ref.actor.fsdp_config.optimizer_offload=False",
        "actor_rollout_ref.rollout.tensor_model_parallel_size=2",
        "actor_rollout_ref.rollout.log_prob_micro_batch_size_per_gpu=16",
        "actor_rollout_ref.rollout.name=vllm",
        "actor_rollout_ref.rollout.gpu_memory_utilization=0.4",
        "actor_rollout_ref.rollout.n=5",
        "actor_rollout_ref.ref.log_prob_micro_batch_size_per_gpu=16",
        "actor_rollout_ref.ref.fsdp_config.param_offload=True",
        "algorithm.use_kl_in_reward=False",
        "trainer.critic_warmup=0",
        "trainer.logger=['console', 'wandb']",
        "trainer.project_name=verl_grpo_example_qwen2-0.5b",
        "trainer.experiment_name=qwen2-0.5b_example",
        "trainer.n_gpus_per_node=2",
        "trainer.nnodes=1",
        "trainer.test_freq=5",
        f"trainer.default_local_dir={MODELS_PATH}",
        "trainer.resume_mode=auto",
        # Parameters chosen to ensure easy automated testing. Remove if needed.
        "trainer.save_freq=1",
        "trainer.total_training_steps=1",
        "trainer.total_epochs=1",
        # For the custom reward function.
        f"custom_reward_function.path={str(PATH_TO_REWARD_FUNCTION)}",
        f"custom_reward_function.name={REWARD_FUNCTION_NAME}",
    ]
    if arglist:
        cmd.extend(arglist)

    subprocess.run(cmd, check=True)


```

您现在可以使用 `modal run --detach grpo_verl.py::train` 运行训练，或者传入任何[来自 CLI 的附加参数](https://modal.com/docs/guide/apps#argument-parsing)，如下所示 `modal run --detach grpo.py::train -- trainer.total_epochs=20 actor_rollout_ref.ref.log_prob_micro_batch_size_per_gpu=16`。

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
    with open(MODELS_PATH / "latest_checkpointed_iteration.txt") as f:
        latest_checkpoint_index = int(f.read())
    return str(
        MODELS_PATH / f"global_step_{latest_checkpoint_index}" / "actor" / "huggingface"
    )


```

我们在此处提供用于设置 OpenAI 兼容推理端点的代码。有关更多详细信息，请参阅。在 vLLM 上提供模型，请查看[此示例。](https://modal.com/docs/examples/vllm_inference#deploy-the-server)

```python
vllm_image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "vllm==0.9.1",
        "flashinfer-python==0.2.6.post1",
        extra_index_url="https://download.pytorch.org/whl/cu128",
        extra_options="--index-strategy unsafe-best-match",
    )
    .env({"VLLM_USE_V1": "1"})
)

vllm_cache_vol = modal.Volume.from_name("vllm-cache", create_if_missing=True)


@app.function(
    image=vllm_image,
    gpu="H100:2",
    scaledown_window=15 * MINUTES,  # How long should we stay up with no requests?
    timeout=10 * MINUTES,  # How long should we wait for container start?
    volumes={"/root/.cache/vllm": vllm_cache_vol, MODELS_PATH: checkpoints_volume},
)
@modal.concurrent(
    max_inputs=32
)  # How many requests can one replica handle? Tune carefully!
@modal.web_server(port=VLLM_PORT, startup_timeout=10 * MINUTES)
def serve():
    import subprocess

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
        "--tensor-parallel-size",
        "2",
    ]
    subprocess.Popen(" ".join(cmd), shell=True)


```

然后，您可以使用 `modal deploy grpo_verl.py` 部署服务器，它会为您提供自定义 URL。然后您可以使用以下curl命令查询它：

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