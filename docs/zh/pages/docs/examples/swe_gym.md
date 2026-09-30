<!-- modal-docs: machine-translated zh-CN from English source -->

# 训练编码代理

此示例使用强化学习来训练编码代理
[SWE-Gym](https://github.com/SWE-Gym/SWE-Gym) 使用
[Spindle](https://modal.com/docs/guide/spindle)，Modal 的 Tinker 兼容 API。

在推出期间，代理会读取存储库问题并使用 bash 工具来
检查和编辑[模态沙箱](https://modal.com/docs/guide/sandboxes)中的文件。

这个例子的灵感来自
[ProRL-Agent-Server 的 SWE-Gym 配方](https://github.com/NVIDIA-NeMo/ProRL-Agent-Server/tree/6a1ead6bfac054fce6c1e62d1a77b330d96c58db/examples/swegym_slime_grpo)。
因此，为了简单起见，我们将在 SWE-Gym 的 31 个任务子集上使用组相对策略优化 (GRPO) 来训练我们的模型，但是当您
准备好训练一个更通用的编码代理了！

Spindle 的多租户后端支持多个 LoRA 训练作业共享
计算，我们将利用它在单个训练器节点上运行并发训练作业。

我们的 SWE-Gym 使用此配方运行的一些图：

![SWE-Gym 八个客户的平均奖励和整批时间](https://modal-cdn.com/examples/swe-gym/qwen3-5-9b-reward-time-17676ad259b6f588.png)

## 连接到训练服务器

有关如何部署 Spindle 服务器的信息，请参阅[设置指南](/docs/guide/spindle)。
获得服务器的 URL 和生成的 API 密钥后，请设置它们：

```shell
export TINKER_BASE_URL='https://your-server-url.modal.run'
export TINKER_API_KEY='your-api-key'
```

```python
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "modal==1.5.5",
#   "tinker==0.24.1",
#   "numpy==2.4.6",
#   "transformers[chat-template]==5.17.0",
#   "swegym @ git+https://github.com/SWE-Gym/SWE-Bench-Package.git@16dd480cce9b27bf111a362d280881c6def5d2a7",
# ]
# ///
```

```python
import argparse
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

```

## 选择训练配方
在我们的 GRPO 配方中，我们将在多轮 RL 的 20 轮中允许 128k 最大上下文长度，批量大小为 32 组，每组 8 个提示。
通过 DAPO 式过滤，每次尝试都获得相同奖励的组将被替换，因为它们不提供策略梯度信号。

在我们的异步 RL 配方中，推出和评分工作人员将数据样本生成到队列中，供训练器循环使用。推广工作人员提交样品
向我们的采样服务器发出请求，评分工作人员启动沙箱来执行代理代码以确定奖励，并且训练器循环调用我们的训练器
服务器的端点（`forward_backward`和`optim_step`）用这些生成的部署和奖励来更新策略权重。

可以调整 `rollout_workers` 和 `grading_workers` 参数以提供更多并行性，`completed_group_buffer` 表示队列的大小
训练循环消耗的。请注意，这些都位于*客户端*（即，在 Tinker SDK 内），与任何服务器端并发无关。

下面我们详细介绍了本次运行的完整训练配置：

```python
MODEL = "Qwen/Qwen3.5-9B"
MODEL_REVISION = "c202236235762e1c871ad0ccb60c8ee5ba337b9a"

TRAINING = {
    "context_tokens": 131_072,
    "turn_tokens": 8192,
    "max_turns": 20,
    "group_size": 8,
    "groups_per_batch": 32,
    "minibatch_groups": 8,
    "temperature": 1.0,
    "kl_coef": 1e-4,
    "seed": 4242,
    "rollout_workers": 64,
    "inflight_groups": 32,
    "grading_workers": 64,
    "grading_queue_size": 64,
    "completed_group_buffer": 8,
}

```

## 定义奖励函数
`load_tasks()` 帮助器从 SkyRL SWE-Gym 数据集中选择 31 个问题（要使用更大的子集，请更改 `helpers/dataset.py` 中的任务选择
和`helpers/task_ids.json`）。每次尝试后，我们都会在新的沙箱中应用代理的补丁并运行任务的测试。如果补丁奖励为1
解决问题，否则为 0。您可以在以下位置找到评分代码
[此帮助文件](https://github.com/modal-labs/modal-examples/blob/main/06_gpu_and_ml/swe_gym/helpers/rollouts.py)。

## 创建LoRA训练客户端

将 `"qwen35-9b-lora-128k"` 作为 `base_model` 传递以选择服务器的 128K 上下文预设。
每个作业都有自己的 32 级适配器和优化器状态，​​但共享相同的多 LoRA 训练器节点。

```python
def create_training_client(service, checkpoint=None):
    trainer = service.create_lora_training_client(
        base_model="qwen35-9b-lora-128k", rank=32, train_unembed=False
    )
    if checkpoint:
        trainer.load_state_with_optimizer(checkpoint["checkpoint"]).result(timeout=3600)
    return trainer


```

## 发布采样权重

每个小组都需要针对所有八次尝试及其工具轮换制定固定策略。
命名的采样检查点允许正在进行的尝试继续使用这些检查点
训练时的权重会更新适配器。

```python
def publish_policy(trainer, service, name):
    receipt = trainer.save_weights_for_sampler(name=name).result(timeout=3600)
    return service.create_sampling_client(model_path=receipt.path)
```

## 异步 RL 循环

因为我们的 Spindle 服务器和 Tinker SDK 都支持异步操作作为一流的原语，所以我们将展示如何使用 Tinker SDK 实现异步 RL 循环，这将允许我们交错
长时间的多轮代码执行部署以及训练器更新。高级想法是将推出生产、分级和训练分成单独的线程，所有这些都可以同时运行并通过队列相互通信。

### 推出一代

在循环的“生产者”一侧，我们将为每个问题生成推出，使用
每个任务的采样检查点相同。 `generate_rollout()` 运行完整的多轮代理循环：
对命令进行采样，在沙箱中运行它，并将输出反馈给模型。

```python
rollouts = [
    rollout_pool.submit(
        generate_rollout,
        task,
        sampler,
        tokenizer,
        environments,
        cfg,
        log,
        {**identity, "attempt": attempt},
    )
    for attempt in range(cfg["group_size"])
]
```

### 推出分级

每次尝试完成后，我们会将其发送到评分池以计算奖励。 `grade_rollout()` 适用
将其补丁放在新的沙箱中并运行测试。如果满足则获得 1 的奖励
解决问题，否则为 0。推出工作人员可以开始新的尝试
这些测试运行。

```python
graded = [
    graders.submit(grade_rollout, future.result(), task, environments, log)
    for future in as_completed(rollouts)
]
completed_groups.put(
    {
        "episodes": [future.result() for future in graded],
        "policy_version": version,
    }
)
```

### 培训师政策更新

培训师从`completed_groups`队列中拉出组。我们使用 DAPO 式过滤（仅保留具有混合奖励的组）和一步式策略滞后（将超过当前策略的出版物的组删除）。

```python
chosen = []
while len(chosen) < cfg["groups_per_batch"]:
    group = completed_groups.get()
    rewards = [episode["reward"] for episode in group["episodes"]]
    if 0 < sum(rewards) < len(rewards) and version - group["policy_version"] <= 1:
        chosen.append(group)
```

最后，我们将批次拆分为小批次并更新适配器。 `prepare_minibatch()`
计算组相对优势并参考对数概率、掩码提示/工具
令牌，并通过小批量的生成令牌计数进行标准化。然后我们发送给训练器来更新策略，这就完成了“循环”！

```python
for minibatch in batched(chosen, cfg["minibatch_groups"]):
    data = prepare_minibatch(minibatch, reference, cfg["kl_coef"])
    forward = trainer.forward_backward(
        data,
        "ppo",
        loss_fn_config={"clip_low_threshold": 0.8, "clip_high_threshold": 1.28},
    )
    optimizer = trainer.optim_step(
        types.AdamParams(learning_rate=1e-6, grad_clip_norm=1.0)
    )
    forward.result(timeout=7200)
    optimizer.result(timeout=7200)

trainer.save_state(name).result(timeout=3600)
sampler = publish_policy(trainer, service, name)
version += 1
```

新的推出组使用更新的采样器；已经在逃亡的团体保留他们的
原来的检查站。这些片段显示了核心循环。我们将上述所有部分编译成一个 `TrainingJob` 类，该类还处理检查点、超时和关闭。你可以找到实现
[这里](https://github.com/modal-labs/modal-examples/blob/main/06_gpu_and_ml/swe_gym/helpers/job.py)。

## 启动训练作业驱动程序为每个 LoRA 客户端创建一个 `TrainingJob` 并同时运行它们。
默认情况下，八个作业共享 Spindle 服务器和计算。

使用以下命令运行示例：

```shell
uv run --python 3.12 --script 06_gpu_and_ml/swe_gym/swe_gym.py
```

默认情况下，此脚本运行 8 个客户端，每个客户端 100 个批次。
使用 `--clients` 和 `--steps` 更改这些默认值。

每个完成的批次都会打印作业、步骤、平均奖励和检查点路径。
摘要默认保存在本地`/tmp/swe-gym-results/events.jsonl`。
使用 `--output` 选择不同的目录。
要了解单个尝试，您还可以检查其工具轮换、修补和测试
根据`/tmp/swe-gym-results/episodes/`进行报告。

```python
def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--clients", type=int, default=8)
    parser.add_argument("--steps", type=int, default=100)
    parser.add_argument(
        "--groups-per-batch", type=int, default=TRAINING["groups_per_batch"]
    )
    parser.add_argument("--hours", type=float, default=24)
    parser.add_argument("--output", type=Path, default=Path("/tmp/swe-gym-results"))
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--smoke-test", action="store_true")
    args = parser.parse_args(argv)
    if min(args.clients, args.steps, args.groups_per_batch, args.hours) <= 0:
        parser.error("clients, steps, groups-per-batch, and hours must be positive")
    if args.output.exists() and any(args.output.iterdir()) and not args.resume:
        parser.error(
            "Use a new output directory or --resume to preserve existing results"
        )
    cfg = {
        **TRAINING,
        "steps": args.steps,
        "groups_per_batch": args.groups_per_batch,
        "inflight_groups": min(TRAINING["inflight_groups"], args.groups_per_batch),
        "completed_group_buffer": min(
            TRAINING["completed_group_buffer"], args.groups_per_batch
        ),
    }
    log = Log(args.output)
    atomic_json(
        args.output / "config.json",
        {
            **cfg,
            "model": MODEL,
            "revision": MODEL_REVISION,
            "preset": "qwen35-9b-lora-128k",
            "clients": args.clients,
        },
    )
    tasks = load_tasks()
    environments = Environments()

    service = tinker.ServiceClient(
        base_url=os.environ["TINKER_BASE_URL"], api_key=os.environ["TINKER_API_KEY"]
    )
    tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=MODEL_REVISION)
    if args.smoke_test:
        trainer = create_training_client(service)
        sampler = publish_policy(trainer, service, f"smoke-{time.time_ns()}")
        sample = (
            sampler.sample(
                types.ModelInput.from_ints(tokenizer.encode("Hello")),
                1,
                types.SamplingParams(max_tokens=4, temperature=0.0, top_p=1.0),
            )
            .result(timeout=300)
            .sequences[0]
        )
        print(f"smoke ok: generated {len(list(sample.tokens))} tokens")
        return
    reference = service.create_sampling_client(base_model="qwen35-9b-lora-128k")
    jobs = []
    for client in range(args.clients):
        checkpoint_file = args.output / f"train-job{client}-checkpoint.json"
        checkpoint = (
            json.loads(checkpoint_file.read_text())
            if args.resume and checkpoint_file.exists()
            else None
        )
        start_step = checkpoint["step"] + 1 if checkpoint else 0
        if start_step >= args.steps:
            continue
        trainer = create_training_client(service, checkpoint)
        job = TrainingJob(
            client,
            trainer,
            service,
            tokenizer,
            environments,
            tasks,
            cfg,
            log,
            reference,
        )
        jobs.append((job, start_step))

    deadline = time.time() + args.hours * 3600

    phase = f"run-{time.time_ns()}"
    with ThreadPoolExecutor(args.clients) as pool:
        futures = [
            pool.submit(job.run, phase, deadline, start_step)
            for job, start_step in jobs
        ]
        for future in futures:
            future.result()


```

## 附录

我们包含以下代码用于测试目的。

```python
import modal

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git")
    .uv_pip_install(
        "modal==1.5.5",
        "tinker==0.24.1",
        "numpy==2.4.6",
        "transformers[chat-template]==5.17.0",
        "swegym @ git+https://github.com/SWE-Gym/SWE-Bench-Package.git@16dd480cce9b27bf111a362d280881c6def5d2a7",
    )
    .add_local_dir(Path(__file__).parent / "helpers", "/root/helpers")
)

with image.imports():
    import tinker
    from helpers.dataset import load_tasks
    from helpers.environments import Environments
    from helpers.job import TrainingJob, publish_policy
    from helpers.training import Log, atomic_json
    from tinker import types
    from transformers import AutoTokenizer


app = modal.App("example-swe-gym-training")


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("spindle-synmon")],
    cpu=4,
    memory=8192,
    timeout=25 * 60,
)
def run_training(
    clients: int, steps: int, groups_per_batch: int, smoke_test: bool = False
):
    argv = [
        "--clients",
        str(clients),
        "--steps",
        str(steps),
        "--groups-per-batch",
        str(groups_per_batch),
    ]
    if smoke_test:
        argv.append("--smoke-test")
    main(argv)


@app.local_entrypoint()
def test(
    clients: int = 1,
    steps: int = 1,
    groups_per_batch: int = 1,
    smoke_test: bool = False,
):
    run_training.remote(clients, steps, groups_per_batch, smoke_test)


if __name__ == "__main__":
    main()

```