<!-- modal-docs: machine-translated zh-CN from English source -->

# 训练快速入门

Modal 提供了多种开始训练的方法。

最简单的方法是使用 [Modal Dojo](https://dojo.modal.dev)，一个为您提供构建块的开源库，
调整默认值和可观察性，轻松进行生产级 LLM 培训。

对于 Tinker 兼容的 API，您可以部署 [Spindle](/docs/guide/spindle)
服务器。当您需要最大限度地控制堆栈时，您可以将现有的训练代码和基础设施引入
[集群函数](/docs/guide/multi-node-training)。

在这里，我们将介绍如何开始使用 Modal Dojo 进行训练。有关更成熟的示例，请参阅[此处](/docs/examples/paint_flowers)。

## 运行你的第一个例子

安装包：

```bash
uv add 'modal-dojo @ git+https://github.com/modal-projects/modal-dojo.git'
```

设置 [Modal](/docs/cli/latest/setup) 和 [仪表板](https://dojo.modal.dev/guides/dashboard)：

```bash
modal-dojo setup
```

并为您的客服人员提供[技能包](https://dojo.modal.dev/guides/agent)：

```bash
modal-dojo skills install
```

然后，就很简单：

```python notest
import re

from modal_dojo import (
    HuggingFaceDataset,
    Qwen3_5_4B,
    Qwen3_5_4B_Recipe,
    TrainConfig,
)

model = Qwen3_5_4B()


async def gsm8k_rm(args, sample, **kwargs) -> float:
    text = model.parse_response(sample.response or "").content
    boxed = re.findall(r"\\boxed\{([^}]+)\}", text)
    pred = boxed[-1] if boxed else (re.findall(r"-?[\d,]+(?:\.\d+)?", text) or [""])[-1]
    try:
        return float(float(pred.replace(",", "")) == float(sample.label))
    except ValueError:
        return 0.0


config = TrainConfig(
    model=model,
    dataset=HuggingFaceDataset(
        hf_repo="skrishna/gsm8k_only_answer",
        hf_split="train[:120]",
        input_column="text",
        output_column="label",
        input_format="text",
    ),
    recipe=Qwen3_5_4B_Recipe(
        custom_rm_function=gsm8k_rm,
    ),
)

if __name__ == "__main__":
    run = config.launch()
    print(run.training_run_id)
```

有关更多信息，请参阅[文档](https://dojo.modal.dev)。