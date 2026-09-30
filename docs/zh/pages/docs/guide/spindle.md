<!-- modal-docs: machine-translated zh-CN from English source -->

# Tinker 兼容的 API

[Spindle](https://github.com/modal-projects/spindle) 是一个开源的 Tinker 兼容 API，支持
[多租户LoRA训练](https://github.com/modal-projects/spindle/blob/main/docs/multi-lora.md)和
【单租户全参数训练】(https://github.com/modal-projects/spindle/blob/main/docs/full-fine-tunes.md)。

为什么要使用主轴？

[拥有](https://modal.com/blog/introducing-auto-endpoints) 你的训练堆栈非常有价值，特别是如果
您不必管理底层基础设施。

我们提供开箱即用的默认值，适用于绝大多数用例。但是当您需要将自定义分叉合并到后端/训练器层时，调整计算参数以获得最佳价格和性能，甚至控制整个训练/调度运行时间，您有能力这样做。

下面，我们详细介绍如何设置您自己的 Spindle 服务器。有关完整示例，请参阅[此处](/docs/examples/swe_gym)。

## 安装主轴

安装库：

```bash
uv add 'modal-spindle @ git+https://github.com/modal-projects/spindle.git'
```

## 设置服务器

为您的 Spindle 服务器生成 API 密钥并将其存储为 [Modal Secret](https://modal.com/docs/guide/secrets)：

```bash
export TINKER_API_KEY="$(openssl rand -hex 32)"
modal secret create spindle-api TINKER_API_KEY="$TINKER_API_KEY"
```

Spindle 服务器需要 [Modal Proxy Token](/docs/guide/webhook-proxy-auth)：

```bash
modal workspace proxy-tokens create
modal workspace proxy-tokens allow <token-id> "$MODAL_ENVIRONMENT"
```

将此令牌存储在同一环境中的 `spindle-proxy` 秘密下：

```bash
modal secret create spindle-proxy \
  MODAL_PROXY_TOKEN_ID="$MODAL_PROXY_TOKEN_ID" \
  MODAL_PROXY_TOKEN_SECRET="$MODAL_PROXY_TOKEN_SECRET"
```

要部署 Spindle 服务器，只需运行：

```bash
spindle deploy
```

您需要保存上述部署输出中的 `server` URL。
单个部署可以为跨不同基础模型、训练参数化和实验规模的多个并发独立训练作业提供服务。
GPU 是根据第一个训练/推理请求按需分配的，因此第一步可能会导致更长的冷启动和模型编译时间。

## 运行 Tinker 脚本

只需更改基本 URL 和 API 密钥，任何与 Tinker 兼容的脚本都可以在 Spindle 服务器上开箱即用地运行。

首先，设置上面的这两个变量：

```bash
export TINKER_BASE_URL='https://your-server-url.modal.run'
export TINKER_API_KEY='your-spindle-api-key'
```

作为示例，以下脚本实现了单步 RL 更新，该更新执行完整的生成/训练/采样器发布路径。

```python notest
import os

import tinker
from tinker import types

service = tinker.ServiceClient(
    base_url=os.environ["TINKER_BASE_URL"],
    api_key=os.environ["TINKER_API_KEY"],
)
training = service.create_lora_training_client(
    base_model="Qwen/Qwen3.5-9B-Base",
    rank=16,
)
tokenizer = training.get_tokenizer()
prompt_tokens = tokenizer.encode(
    "What is 2 + 2? Answer with only the number.",
    add_special_tokens=True,
)
prompt = types.ModelInput.from_ints(prompt_tokens)
params = types.SamplingParams(max_tokens=16, temperature=1.0)

sampling = training.save_weights_and_get_sampling_client()
response = (
    sampling.sample(
        prompt=prompt,
        num_samples=1,
        sampling_params=params,
    )
    .result(timeout=3600)
    .sequences[0]
)

answer_tokens = list(response.tokens)
logprobs = list(response.logprobs or [])
assert answer_tokens and len(logprobs) == len(answer_tokens)
answer = tokenizer.decode(answer_tokens).strip()
reward = 1.0 if answer == "4" else -1.0

prompt_targets = len(prompt_tokens) - 1
datum = types.Datum(
    model_input=types.ModelInput.from_ints(prompt_tokens + answer_tokens[:-1]),
    loss_fn_inputs={
        "target_tokens": prompt_tokens[1:] + answer_tokens,
        "logprobs": [0.0] * prompt_targets + logprobs,
        "advantages": [0.0] * prompt_targets + [reward] * len(answer_tokens),
    },
)

forward = training.forward_backward([datum], loss_fn="importance_sampling")
optimizer = training.optim_step(types.AdamParams(learning_rate=1e-5))

print(f"Answer: {answer!r}, reward: {reward}")
print("Training metrics:", forward.result(timeout=3600).metrics)
print("Optimizer metrics:", optimizer.result(timeout=3600).metrics)

updated_sampling = training.save_weights_and_get_sampling_client()
updated = (
    updated_sampling.sample(
        prompt=prompt,
        num_samples=1,
        sampling_params=params,
    )
    .result(timeout=3600)
    .sequences[0]
)
print("After update:", tokenizer.decode(updated.tokens))
```

## 自定义Spindle服务器

由于服务器只是一个[模态应用程序](https://modal.com/docs/guide/apps)，因此从计算分配、训练后端细节到推理设置的所有内容都是完全可定制的。

例如，此 Qwen3.5-9B 配置演示了您可能会根据训练工作量更改的一些设置。

```python notest
# config.py

from spindle.configuration import BaseConfig

class Config(BaseConfig):
    model = "Qwen/Qwen3.5-9B"
    name = "qwen35-9b-lora-16k"
    max_context_length = 16_384
    backend = "miles"


    trainer_gpu = "H100"
    trainer_gpus_per_node = 4
    trainer_cpu = 16
    trainer_memory_mib = 65_536
    trainer_max_clients_per_instance = 6

    miles_cfg = {
        "model_type": "qwen3.5-9B",
        "tensor_model_parallel_size": 4,
        "max_lora_slots": 6,
        "max_lora_rank": 32,
        "default_lora_alpha": 32,
        "target_modules": [
            "linear_qkv",
            "linear_proj",
            "linear_fc1",
            "linear_fc2",
            "output_layer",
        ],
        "max_tokens_per_gpu": 16_384,
        "cli_options": {
            "recompute_granularity": "full",
            "recompute_method": "uniform",
            "recompute_num_layers": 1,
        },
    }

    inference_gpu = "H200"
    inference_min_replicas = 2
    inference_max_replicas = 8
    sglang_cfg = {
        "tp_size": 1,
        "mem_fraction_static": 0.8,
        "max_running_requests": 32,
        "max_queued_requests": 8,
        "max_loaded_loras": 64,
        "max_loras_per_batch": 8,
    }


config = Config()
```

要部署上述配置，只需：

```bash
spindle deploy config.py
```

有关采样、检查点、全参数训练和更多高级功能的更多信息，请参阅[主轴文档](https://github.com/modal-projects/spindle)。