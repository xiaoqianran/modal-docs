<!-- modal-docs: machine-translated zh-CN from English source -->

# 用代码画花

正如这篇[博文](https://surya.website/rling-qwen-to-paint-with-code) 所示，
您可以训练模型来使用以下命令创建花卉水彩草图
[p5.刷](https://p5brush.org),
并使用法官对参考图像池进行成对比较
为奖励函数。

在本教程中，我们将使用[Modal Dojo](https://modal.com/docs/guide/dojo)来训练
[Qwen3.5-4B](https://huggingface.co/Qwen/Qwen3.5-4B)并使用
[HuggingEnvs/水彩参考池](https://huggingface.co/datasets/HuggingEnvs/watercolour-reference-pool)
作为参考池。在每次推出期间，草图都会以 PNG 格式呈现
[模态沙箱](https://modal.com/docs/guide/sandboxes) 和
[Qwen3.6-27B](https://huggingface.co/Qwen/Qwen3.6-27B) 将每个与
参考图像池。

![奖励曲线](https://modal-cdn.com/cdnbot/flower-reward1maaxmni_1df0871b.webp)

<video controls autoplay muted loop style="display: block; margin: 0 auto;"><source src="https://modal-cdn.com/example-paint_flowers.mp4" type="video/mp4">
</video>

运行这个例子：

```shell
uv run --python 3.12 --script 06_gpu_and_ml/paint_flowers/paint_flowers.py
```

## 设置

该脚本需要在本地安装一些依赖项。我们包括
遵循[内联脚本元数据](https://peps.python.org/pep-0723/)，以便
[`uv`](https://docs.astral.sh/uv/)等工具可以自动安装这些
依赖关系。

```python
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "modal-dojo @ git+https://github.com/modal-projects/modal-dojo@main",
#   "pillow",
# ]
# ///
```

```python
import argparse
import asyncio
import base64
import itertools
import random

from helpers import (
    RENDER_JS,
    SYSTEM_PROMPT,
    extract_sketch,
    launch_hpsv3,
    overlay_flower_image,
    renderer_image,
    score_png,
    skip_infra_rewards,
)
from modal_dojo import (
    DatasetConfig,
    Endpoint,
    Qwen3_5_4B,
    Qwen3_5_4B_Recipe,
    Qwen3_6_27B,
    Sandbox,
    TrainConfig,
)
from modal_dojo.common.sample_extraction import IMAGE_SAMPLE_LIMIT_ENV

```

## 选择基本模型

Modal Dojo 带有预设的[模型类](https://dojo.modal.dev/guides/model) 来处理权重下载，
响应解析和幕后架构详细信息。

```python
base_model = Qwen3_5_4B()

```

## 获取数据集

使用参考池中现有的物种和调色板颜色，我们创建了一个
用于训练模型的提示的[数据集](https://dojo.modal.dev/guides/dataset#creating-a-custom-dataset)。

```python
SPECIES = ["hibiscus"]
PALETTES = [
    "peach",
    "crimson",
    "butter",
    "lilac",
    "coral",
    "indigo",
    "blush",
    "amber",
]

USER_TEMPLATE = (
    "Paint a {palette} {species} in watercolour: one bloom, seen from the "
    "front, with a stem and leaves, on coloured paper."
)


def build_prompts(combos: list[tuple[str, str]], n: int) -> list[dict[str, str]]:
    rows = []
    for species, palette in itertools.islice(itertools.cycle(combos), n):
        rows.append({"prompt": USER_TEMPLATE.format(species=species, palette=palette)})
    return rows


class FlowerPromptDataset(DatasetConfig):
    def __init__(self, prompts: list[dict[str, str]]):
        self.prompts = prompts

    def input_key(self) -> str:
        return "messages"

    def label_key(self) -> str:
        return "label"

    def rows(self):
        return [
            {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": r["prompt"]},
                ],
                "label": r["prompt"],
            }
            for r in self.prompts
        ]


N_TRAIN = 224
N_EVAL = 8

combos = list(itertools.product(SPECIES, PALETTES))
random.Random(7).shuffle(combos)
train_dataset = FlowerPromptDataset(build_prompts(combos, N_TRAIN))
eval_dataset = FlowerPromptDataset(build_prompts(combos, N_EVAL))


```
## 创建奖励函数

[奖励函数](https://dojo.modal.dev/guides/recipe#environment) 将每个草图渲染为
[Modal Sandbox](https://modal.com/docs/guide/sandboxes)并使用LLM法官进行成对比较。
我们将法官作为[端点](https://modal.com/docs/guide/endpoints)。

```python
def deploy_judge():
    print("deploying judges...")
    judge = Endpoint.launch(
        Qwen3_6_27B(),
        unauthenticated=True,
        recreate_if_existing=True,
    )
    launch_hpsv3()
    judge.wait_until_ready(timeout=30 * 60)
    return judge


def render_in_sandbox(code: str) -> tuple[bytes | None, dict]:
    try:
        with Sandbox(
            image=renderer_image(),
            workdir="/render",
            timeout=300,
            cpu=1.0,
            memory=2048,
            block_network=True,
            app_name="dojo-flower-render",
        ) as sandbox:
            sandbox.write("/render/render.js", RENDER_JS)
            sandbox.write("/render/sketch.js", code)
            result = sandbox.run(
                "node", "/render/render.js", "/render/sketch.js", timeout=180
            )
        out, err = result.stdout, result.stderr
        if "PNGB64:" in out:
            png = base64.b64decode(out.split("PNGB64:", 1)[1].strip())
            return png, {"render": "ok"}
        kind = "fail" if "SKETCH_ERROR:" in err else "unavailable"
        return None, {"render": kind, "stderr": err[-400:]}
    except Exception as e:
        return None, {
            "render": "unavailable",
            "stderr": f"{type(e).__name__}: {e}"[-400:],
        }


def make_flower_rm(judge):
    async def flower_rm(args, sample, **kwargs) -> float | None:
        code = extract_sketch(sample.response, base_model.parse_response)
        if code is None:
            reward, meta, png = 0.0, {"gate": "no valid sketch"}, None
        else:
            png, render_meta = await asyncio.to_thread(render_in_sandbox, code)
            reward, meta, png = await asyncio.to_thread(
                score_png, png, code, judge, render_meta
            )
        metadata = {**(getattr(sample, "metadata", None) or {}), **meta}
        if png is not None:
            metadata["image"] = png
        sample.metadata = metadata
        if reward is None:
            sample.remove_sample = True
        return reward

    return flower_rm


```

## 开始训练

之后就可以简单的开始训练了！有关部署检查点的更多信息
并运行评估，请参阅[本指南](https://dojo.modal.dev/guides/training)。

```python
ROLLOUT_BATCH_SIZE = 8
N_SAMPLES_PER_PROMPT = 8


def build_config(judge, num_rollout):
    return TrainConfig(
        model=base_model,
        dataset=train_dataset,
        eval_dataset=eval_dataset,
        recipe=Qwen3_5_4B_Recipe(
            custom_rm_function=make_flower_rm(judge),
            custom_reward_post_process_function=skip_infra_rewards,
            num_rollout=num_rollout,
            rollout_batch_size=ROLLOUT_BATCH_SIZE,
            global_batch_size=ROLLOUT_BATCH_SIZE,
            n_samples_per_prompt=N_SAMPLES_PER_PROMPT,
            save_interval=50,
            apply_chat_template_kwargs='{"enable_thinking": false}',
            image_overlay=lambda image: overlay_flower_image(image).env(
                {IMAGE_SAMPLE_LIMIT_ENV: str(ROLLOUT_BATCH_SIZE * N_SAMPLES_PER_PROMPT)}
            ),
        ),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--num_rollouts", type=int, default=100, help="Number of rollouts to run"
    )
    args = parser.parse_args()

    judge = deploy_judge()
    config = build_config(judge, num_rollout=args.num_rollouts)
    run = config.launch()
    print(f"run id: {run.training_run_id}")

```

## 监控运行情况

要跟踪运行进度，您可以使用以下命令部署本机[仪表板](https://dojo.modal.dev/guides/dashboard)：

```shell
modal-dojo setup
```

它为您提供奖励曲线、分数/优势分布、轨迹和步骤计时的实时视图。请注意，这是
只是一个 [Modal App](https://modal.com/docs/guide/apps)，因此它跟踪范围为您的运行
[环境](https://modal.com/docs/guide/environments#environments)。此外，它
[日志](https://dojo.modal.dev/guides/metric#dashboard-only) 库发出的所有指标。