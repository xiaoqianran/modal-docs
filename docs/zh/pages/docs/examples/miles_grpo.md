<!-- modal-docs: machine-translated zh-CN from English source -->

# 提高法学硕士的数学水平

此示例训练 [Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B)
解决 [DAPO-math-17k](https://huggingface.co/datasets/zhuzilin/dapo-math-17k) 中的问题
[里程](https://github.com/radixark/miles) 和团体相关政策
优化（GRPO）。

我们使用【集群函数进行分布式训练】(https://modal.com/docs/guide/multi-node-training)
在两个节点上，每个节点有八个 H100 GPU。

![100 次更新中的训练奖励、AIME 正确性、步数计时和响应截断](https://modal-cdn.com/cdnbot/qwen3-4b-fsdp-8k-100-updates-labeled_4c365b52.png)

使用以下命令运行此示例：

```bash
modal run --detach 14_clusters/miles_grpo.py
```

默认运行 100 次训练更新；我们的跑步花了大约三个小时
两个八 GPU H200 节点，缓存图像和输入。

```python
import json
import os
import shlex
import socket
import subprocess
import time
import uuid
from pathlib import Path

import modal

app = modal.App("example-miles-grpo")
MINUTES = 60  # seconds
TRAINING_TIMEOUT = 12 * 60 * MINUTES
N_NODES = 2
GPUS_PER_NODE = 8
DATA = Path("/data")
RESULTS = Path("/results")
MILES = Path("/opt/miles")
MILES_COMMIT = "2806267d060d51b1d3b62f85a1f9b145047aeef9"  # v0.1.1

```

## 下载模型和数据集我们在训练之前下载模型和数据集，这样就不会浪费
GPU 时间。 [模态卷](https://modal.com/docs/guide/volumes) 缓存它们
用于后续运行。 FSDP 直接加载 Hugging Face 检查点。
数学验证者需要一个盒装的最终答案。 DAPO 提示请求此
格式；我们将相同的指令附加到 AIME 评估提示中。

```python
data_volume = modal.Volume.from_name("example-miles-grpo-data", create_if_missing=True)
results_volume = modal.Volume.from_name(
    "example-miles-grpo-results-v2", create_if_missing=True, version=2
)
download_image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install("huggingface-hub==0.34.4")
    .env({"HF_XET_HIGH_PERFORMANCE": "1"})
)
SOURCES = [
    ("Qwen/Qwen3-4B", "model", "1cfa9a7208912126459214e8b04321603b3df60c"),
    ("zhuzilin/dapo-math-17k", "dataset", "2e65612930298bde4c5d58fd97b3f23a483aaff9"),
    ("zhuzilin/aime-2024", "dataset", "1c625e328db94ec7ef7ff169016b097c468d60b9"),
]


@app.function(image=download_image, volumes={DATA: data_volume}, timeout=20 * MINUTES)
def download():
    from huggingface_hub import snapshot_download

    for repo_id, repo_type, revision in SOURCES:
        snapshot_download(
            repo_id=repo_id,
            repo_type=repo_type,
            revision=revision,
            local_dir=DATA / repo_id.split("/")[-1],
        )
    aime = DATA / "aime-2024"
    with (
        (aime / "aime-2024.jsonl").open() as source,
        (aime / "aime-2024-boxed.jsonl").open("w") as prepared,
    ):
        for line in source:
            sample = json.loads(line)
            sample["prompt"][-1]["content"] += (
                "\n\nPlease reason step by step, and put your final answer within \\boxed{}."
            )
            prepared.write(json.dumps(sample) + "\n")
    data_volume.commit()


```

## 定义容器镜像

[模态图像](https://modal.com/docs/guide/images) 让我们可以使用里程
发布镜像，其中包括 PyTorch、SGLang、FlashAttention 和 Ray。

```python
image = (
    modal.Image.from_registry(
        "radixark/miles:v0.1.1@sha256:6355834f16bacd35d5d40c43f142e3758376f7b2e8d678bccfe870c092bd96bf"
    )
    .entrypoint([])
    .run_commands(
        f"git clone --depth 1 --branch v0.1.1 https://github.com/radixark/miles.git {MILES}",
        f"cd {MILES} && git checkout {MILES_COMMIT} && pip install --no-deps -e .",
    )
    .env(
        {
            "PYTHONPATH": f"{MILES}:/root/Megatron-LM",
            "PYTHONUNBUFFERED": "1",
            "NCCL_NVLS_ENABLE": "0",
        }
    )
)

```

## 配置我们的训练配方

这些设置适应 Miles [Qwen3-4B 配方](https://github.com/radixark/miles/blob/v0.1.1/scripts/run_qwen3_4b.py)
启用思维的 FSDP。 SGLang 每个问题生成八个答案；
`math` 奖励会根据标签检查它们。 GRPO 使用相对
每个组内奖励用 FSDP 更新模型，然后 Miles 发送
权重返回 SGLang。
截断重要性抽样 (TIS) 可纠正训练之间的差异
和推理对数概率。

对于训练和评估，我们将生成的响应限制为 8,192 个标记；
提示标记是额外的。这限制了生成时间，但可以切断
长解决方案。下面的结果同时跟踪正确性和截断。

位于同一位置的引擎通过 IPC 交换 CUDA 张量。我们禁用
可扩展的分配器段，因为它们的 IPC 路径需要`pidfd_getfd`。

```python
def training_args(
    run_dir: Path, num_rollout: int, eval_samples: int, smoke_test: bool = False
) -> list[str]:
    batch_size = 8 if smoke_test else 32
    return shlex.split(
        f"""
        --train-backend fsdp
        --hf-checkpoint {DATA}/Qwen3-4B
        --ref-load {DATA}/Qwen3-4B
        --prompt-data {DATA}/dapo-math-17k/dapo-math-17k.jsonl
        --input-key prompt --label-key label
        --apply-chat-template --rollout-shuffle --balance-data
        --apply-chat-template-kwargs '{{"enable_thinking": true}}'
        --rm-type math
        --num-rollout {num_rollout}
        --rollout-batch-size {batch_size} --n-samples-per-prompt 8
        --rollout-max-response-len 8192 --rollout-temperature 1
        --global-batch-size {batch_size * 8}
        --eval-interval 10
        --eval-prompt-data aime {DATA}/aime-2024/aime-2024-boxed.jsonl
        --n-samples-per-eval-prompt {eval_samples}
        --eval-max-response-len 8192 --eval-top-p 1
        --advantage-estimator grpo --use-tis --tis-clip 2.0 --tis-clip-low 0.0
        --use-kl-loss --kl-loss-coef 0 --kl-loss-type low_var_kl
        --kl-coef 0 --entropy-coef 0
        --eps-clip 0.2 --eps-clip-high 0.28
        --optimizer adam --lr 1e-6 --lr-decay-style constant
        --weight-decay 0.1 --adam-beta1 0.9 --adam-beta2 0.98
        --rollout-num-gpus-per-engine 1
        --sglang-decode-log-interval 1000
        --sglang-mem-fraction-static 0.75
        --sglang-attention-backend fa3 --sglang-chunked-prefill-size 4096
        --update-weight-buffer-size 536870912
        --gradient-checkpointing --attn-implementation flash_attention_2
        --train-env-vars '{{"PYTORCH_CUDA_ALLOC_CONF":"expandable_segments:False"}}'
        --use-dynamic-batch-size --max-tokens-per-gpu 32768
        --actor-num-nodes {N_NODES} --actor-num-gpus-per-node {GPUS_PER_NODE}
        --colocate --use-fault-tolerance
        --save {run_dir}/checkpoints --save-interval 10
        --use-tensorboard --tb-project-name miles --tb-experiment-name {run_dir.name}
        """
    )


```

## 开始训练

集群函数将两个节点一起调度，并通过装饰器启用 RDMA 网络。
等级 0 启动 Ray 头，并在所有 16 个 GPU 加入后启动训练。

`ray start` 启动后台进程后返回。工人正在等待
在队列上，因此其功能保持活动状态，直到头部完成训练。
每次运行都使用自己的分区；一次性容器在退出时释放 Ray。
Volume v2 在所有训练等级之间共享检查点文件。

```python
completion_queue = modal.Queue.from_name(
    "example-miles-grpo-completion", create_if_missing=True
)


@app.function(
    image=image,
    gpu=f"H100:{GPUS_PER_NODE}",
    cpu=32,
    memory=262144,
    volumes={DATA: data_volume, RESULTS: results_volume},
    timeout=TRAINING_TIMEOUT,
    single_use_containers=True,
)
@modal.clustered(size=N_NODES, rdma=True)
def train(
    run_id: str,
    num_rollout: int,
    eval_samples: int,
    smoke_test: bool = False,
):
    import ray

    cluster = modal.Cluster.from_context()
    rank = cluster.container_rank()
    ips = cluster.container_ips(family="ipv4")
    head_ip = ips[0]
    node_ip = ips[rank]
    run_dir = RESULTS / run_id
    env = {
        **os.environ,
        "MASTER_ADDR": head_ip,
        "RAY_ADDRESS": f"{head_ip}:6379",
        "TENSORBOARD_DIR": str(run_dir / "tensorboard"),
    }
    start = [
        "ray",
        "start",
        f"--node-ip-address={node_ip}",
        f"--num-gpus={GPUS_PER_NODE}",
        "--num-cpus=32",
        "--disable-usage-stats",
    ]
    succeeded = False
    try:
        run_dir.mkdir(parents=True, exist_ok=True)
        data_volume.reload()
        if rank == 0:
            subprocess.run(start + ["--head", "--port=6379"], env=env, check=True)
        else:
            deadline = time.monotonic() + 180
            while True:
                try:
                    with socket.create_connection((head_ip, 6379), timeout=2):
                        break
                except OSError:
                    if time.monotonic() > deadline:
                        raise TimeoutError("Ray head did not start within 180 seconds")
                    time.sleep(1)
            subprocess.run(start + [f"--address={head_ip}:6379"], env=env, check=True)
            if not completion_queue.get(partition=run_id, timeout=TRAINING_TIMEOUT):
                raise RuntimeError(
                    "Miles training failed on the head node; see the App logs"
                )
            results_volume.commit()
            return

        ray.init(address=f"{head_ip}:6379")
        deadline = time.monotonic() + 180
        while sum(n["Alive"] for n in ray.nodes()) < N_NODES:
            if time.monotonic() > deadline:
                raise TimeoutError("The second Ray node did not join")
            time.sleep(1)
        resources = ray.cluster_resources()
        expected_gpus = N_NODES * GPUS_PER_NODE
        if resources.get("GPU") != expected_gpus:
            raise RuntimeError(
                f"Expected {expected_gpus} GPUs in the Ray cluster, got {resources}"
            )
        print(f"Ray cluster ready: {resources}", flush=True)
        ray.shutdown()

        subprocess.run(
            [
                "python",
                str(MILES / "train.py"),
                *training_args(run_dir, num_rollout, eval_samples, smoke_test),
            ],
            cwd=MILES,
            env=env,
            check=True,
        )
        results_volume.commit()
        succeeded = True
        return str(run_dir)
    finally:
        if rank == 0:
            completion_queue.put(succeeded, partition=run_id)


```

异步提交训练，以便它能够在独立的 CLI 断开连接后继续存在。
连接终端时等待结果也会出现错误。

```python
@app.local_entrypoint()
def main(num_rollout: int = 100, eval_samples: int = 4, smoke_test: bool = False):
    if smoke_test:
        num_rollout, eval_samples = 1, 1
    if num_rollout < 1 or eval_samples < 1:
        raise ValueError("num-rollout and eval-samples must be positive")
    run_id = f"{time.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}"
    print(f"Run ID: {run_id}")
    download.remote()
    result = train.spawn(run_id, num_rollout, eval_samples, smoke_test).get()
    print(f"Results saved to {result} in Volume {results_volume.name}")


```

## 检查结果

使用脚本打印的运行 ID 下载 TensorBoard 事件：

```bash
mkdir -p /tmp/miles-grpo/RUN_ID
modal volume get example-miles-grpo-results-v2 RUN_ID/tensorboard /tmp/miles-grpo/RUN_ID
uvx tensorboard --logdir /tmp/miles-grpo/RUN_ID
```

打开命令打印的本地 TensorBoard URL 后，您可以检查：

* `rollout/episode_raw_reward`：每个训练批次中正确答案的比例。
* `eval/aime`：已修复 AIME 问题的平均正确性。
* `rollout/truncated_ratio`：达到令牌限制的训练响应分数。
* `eval/aime-truncated_ratio`：达到令牌限制的评估响应的比例。
* `perf/rollout_time`、`perf/train_time`：生成和更新模型所花费的时间。

## 结果

默认的 100 次更新运行在 173 分钟内完成，在两个节点上有 8 个更新
每个 H200，包括启动、评估、检查点保存和清理，
缓存图像和输入。一代人平均每次更新需要 66 秒；
首次更新的 64 秒编译后，训练平均耗时 19 秒
和训练通过。大部分运行时间都花在生成解决方案上。
这些测量使用了 H200；该函数请求 H100，因此运行时
其他分配可能有所不同。

我们在训练前和每 10 次更新之前评估所有 30 个 AIME 2024 问题，
每个问题抽取四个答案。分数是平均答案正确率，
不是至少解决一次的问题的比例（pass@4）。 120 个答案
共享 30 道题，因此它们不是 120 道独立测试题。

|已完成更新 |艾梅正确答案 |回复在 8K 时中断 |
| ---| ---| ---|
| 0 | 42/120 (35.0%) | 87/120 (72.5%) |
| 10 | 10 41/120 (34.2%) | 88/120 (73.3%) |
| 20 | 49/120 (40.8%) | 86/120 (71.7%) |
| 30| 44/120 (36.7%) | 82/120 (68.3%) || 40 | 40 50/120 (41.7%) | 78/120 (65.0%) |
| 50 | 50 54/120 (45.0%) | 71/120 (59.2%) |
| 60| 49/120 (40.8%) | 78/120 (65.0%) |
| 70 | 70 54/120 (45.0%) | 75/120 (62.5%) |
| 80| 54/120 (45.0%) | 71/120 (59.2%) |
| 90 | 90 57/120 (47.5%) | 67/120 (55.8%) |
| 100 | 100 56/120 (46.7%) | 68/120 (56.7%) |

AIME 正确率从 35.0% 上升至 46.7%，更新 90 时达到峰值 47.5%。
前十批的训练奖励平均为 56.6%，之后的训练奖励为 70.9%
最后十个。每个训练批次包含不同的问题，因此个体
批次奖励波动。

响应预算对于这种思维模型很重要。 AIME截断下降
从 72.5% 降至 56.7%；前十名训练截断率平均为 48.7%
过去 10 批次增加了 25.2%。这些结果表明改进
一次运行 8K 响应预算；他们没有更长时间地确定效果
响应长度或随机种子。最终AIME过半
响应仍然达到了极限。增加两个响应极限
`training_args` 允许更长的解决方案，但代价是更多的生成时间
和训练记忆力。

## 导出检查点以进行推理

训练期间，使用 PyTorch 的分布式检查点保存检查点
格式。我们将保存的模型碎片转换为 CPU 上的 Hugging Face 权重：

```bash
modal run 14_clusters/miles_grpo.py::export --run-id RUN_ID
modal run 14_clusters/miles_grpo.py::export --run-id RUN_ID --iteration 10
```

```python
@app.function(
    image=image,
    cpu=8,
    memory=65536,
    volumes={DATA: data_volume, RESULTS: results_volume},
    timeout=20 * MINUTES,
)
def export(run_id: str, iteration: int = 0):
    if iteration < 0:
        raise ValueError(
            "iteration must be zero (latest) or a positive saved iteration"
        )
    checkpoints = RESULTS / run_id / "checkpoints"
    if iteration == 0:
        iteration = int((checkpoints / "latest_checkpointed_iteration.txt").read_text())
    checkpoint = checkpoints / f"iter_{iteration:07d}"
    output = RESULTS / run_id / "huggingface" / checkpoint.name
    subprocess.run(
        [
            "python",
            str(MILES / "tools/convert_fsdp_to_hf.py"),
            "--input-dir",
            str(checkpoint),
            "--output-dir",
            str(output),
            "--origin-hf-dir",
            str(DATA / "Qwen3-4B"),
        ],
        cwd=MILES,
        check=True,
    )
    results_volume.commit()
    print(f"Hugging Face model saved to {output}")
    return str(output)

```