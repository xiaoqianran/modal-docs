<!-- modal-docs: machine-translated zh-CN from English source -->

# 通过提前停止超参数网格搜索从头开始训练 SLM

![分割面板图像。左：人工智能生成的莎士比亚图片。右：SLM 生成的文本](./shakespeare.jpg)

当您想要一个能够很好地完成您的任务的语言模型时，有以下三个选项：
按定制程度排序：

* [**快速工程**](https://en.wikipedia.org/wiki/Prompt_engineering):
  大型且功能强大的语言模型可以理解自然语言中的任务，因此您可以
  精心设计自然语言“提示”以引发所需的行为。

* [**微调**](https://modal.com/docs/examples/llm-finetuning):
  这些相同的语言模型通过代表任务的数据集的梯度下降进行训练，
  并且可以通过代表您的任务的数据集的梯度下降来进一步训练它们。

* **从头开始训练**：
  如果您有足够的数据来完成您的任务，您可以扔掉预训练的模型并创建自己的模型。

每一步都会增加额外的工程复杂性，但也会带来卓越的性价比帕累托前沿
为了您的任务。尺寸十分之一的微调模型通常优于更通用的模型，
从头开始训练的模型表现优于它们。
因为这些模型比支持通用语言的大型语言模型小得多
像 ChatGPT 和 Claude 这样的助理聊天机器人，它们通常被称为“小语言模型”（SLM）。

在此示例中，我们将探索在 Modal 上从头开始训练 SLM。

事实上，我们将使用不同的超参数并行训练 8 个 SLM
然后选择最好的一项进行额外培训。

我们将实时监控本次培训并为我们的培训和经过训练的模型提供服务
作为 Web 功能和简单的浏览器 UI。

在此过程中，我们将使用 Modal 平台的许多功能：
[分发卷](https://modal.com/docs/guide/volumes),
多个[Web功能](https://modal.com/docs/guide/webhooks),
和[并行容器执行](https://modal.com/docs/guide/scale#parallel-execution-of-inputs)。

这些功能共同为每个机器学习和人工智能团队提供了
与最先进的公司相同的基础设施能力
在他们的内部平台上。

## 基本设置

```python
import logging as L
import urllib.request
from dataclasses import dataclass
from pathlib import Path, PosixPath
from typing import Optional

import modal
from pydantic import BaseModel

MINUTES = 60  # seconds
HOURS = 60 * MINUTES

app_name = "example-hp-sweep-gpt"
app = modal.App(app_name)

```

我们将使用 A10G GPU 进行训练，它能够训练模型以显着提高性能
大约 15 分钟内完成，同时将成本保持在大约 1 美元以下。

```python
gpu = "A10G"

```

### 创建一个 Volume 来存储数据、权重和日志

由于我们将协调多台机器的训练，因此我们将使用
分布式[卷](https://modal.com/docs/guide/volumes)
用于存储数据、检查点模型和 TensorBoard 日志。

```python
volume = modal.Volume.from_name("example-hp-sweep-gpt-volume", create_if_missing=True)
volume_path = PosixPath("/vol/data")
model_filename = "nano_gpt_model.pt"
best_model_filename = "best_nano_gpt_model.pt"
tb_log_path = volume_path / "tb_logs"
model_save_path = volume_path / "models"

```

### 定义容器镜像中的依赖关系

用于训练的容器镜像基于 Modal 默认的 slim Debian Linux 镜像，带有 `torch`
用于定义和运行我们的神经网络，`tensorboard`用于监控训练。

```python
base_image = modal.Image.debian_slim(python_version="3.11").uv_pip_install(
    "pydantic==2.9.1"
)

torch_image = base_image.uv_pip_install(
    "torch==2.1.2",
    "tensorboard==2.17.1",
    "numpy<2",
)

```

我们还有一些本地依赖项需要导入到远程环境中。
我们将它们添加到远程容器中。

```python
torch_image = torch_image.add_local_dir(
    Path(__file__).parent / "src", remote_path="/root/src"
)

```

我们将提供一个简单的 Web 函数：

```python
web_image = base_image.uv_pip_install("fastapi[standard]==0.115.4", "starlette==0.41.2")

```

我们将部署一个 Web UI，以便使用 Gradio 与经过训练的模型进行交互。

```python
assets_path = Path(__file__).parent / "assets"
ui_image = web_image.uv_pip_install("gradio~=4.44.0").add_local_dir(
    assets_path, remote_path="/assets"
)


```我们还可以“预导入”库，这些库将由我们在给定图像中的 Modal 上运行的函数使用
使用`with image.imports`上下文管理器。

```python
with torch_image.imports():
    import glob
    import os
    from timeit import default_timer as timer

    import tensorboard
    import torch
    from src.dataset import Dataset
    from src.logs_manager import LogsManager
    from src.model import AttentionModel
    from src.tokenizer import Tokenizer

```

## 在 Modal 上运行 SLM 训练

这里我们定义训练函数，将其包装在装饰器中
指定基础设施参数，例如我们要使用的容器`image`，
哪个`volume`安装在哪里，我们正在使用哪个`gpu`，等等。

训练包括指定优化参数、加载
`dataset`，构建`model`，设置 TensorBoard 日志记录 &
检查点，然后最终执行 `training_loop` 本身。

```python
@app.function(
    image=torch_image,
    volumes={volume_path: volume},
    gpu=gpu,
    timeout=1 * HOURS,
)
def train_model(
    node_rank,
    n_nodes,
    hparams,
    experiment_name,
    run_to_first_save=False,
    n_steps=3000,
    n_steps_before_eval=None,
    n_steps_before_checkpoint=None,
):
    # optimizer, data, and model prep
    batch_size = 64
    learning_rate = 3e-4

    n_eval_steps = 100
    if n_steps_before_eval is None:
        n_steps_before_eval = int(n_steps / 8)  # eval eight times per run
    if n_steps_before_checkpoint is None:
        n_steps_before_checkpoint = int(n_steps / 4)  # save four times per run

    train_percent = 0.9

    L.basicConfig(
        level=L.INFO,
        format=f"\033[0;32m%(asctime)s %(levelname)s [%(filename)s.%(funcName)s:%(lineno)d] [Node {node_rank + 1}] %(message)s\033[0m",
        datefmt="%b %d %H:%M:%S",
    )

    # use GPU if available
    device = "cuda" if torch.cuda.is_available() else "cpu"
    L.info("Remote Device: %s // GPU: %s", device, gpu)

    input_file_path = volume_path / "shakespeare_char.txt"
    text = prepare_data(input_file_path, volume)

    # construct tokenizer & dataset
    tokenizer = Tokenizer(text)
    dataset = Dataset(
        tokenizer.encode(text),
        train_percent,
        batch_size,
        hparams.context_size,
        device,
    )

    # build the model
    model = build_model(hparams, tokenizer.vocab_size, device)
    num_parameters = sum(p.numel() for p in model.parameters())
    L.info(f"Num parameters: {num_parameters}")

    optimizer = setup_optimizer(model, learning_rate)

    # TensorBoard logging & checkpointing prep
    logs_manager = LogsManager(experiment_name, hparams, num_parameters, tb_log_path)
    L.info(f"Model name: {logs_manager.model_name}")

    model_save_dir = model_save_path / experiment_name / logs_manager.model_name
    if model_save_dir.exists():
        L.info("Loading model from checkpoint...")
        checkpoint = torch.load(str(model_save_dir / model_filename))
        is_best_model = not run_to_first_save
        if is_best_model:
            make_best_symbolic_link(model_save_dir, model_filename, experiment_name)
        model.load_state_dict(checkpoint["model"])
        start_step = checkpoint["steps"] + 1
    else:
        model_save_dir.mkdir(parents=True, exist_ok=True)
        start_step = 0
        checkpoint = init_checkpoint(model, tokenizer, optimizer, start_step, hparams)

    checkpoint_path = model_save_dir / model_filename

    out = training_loop(
        start_step,
        n_steps,
        n_steps_before_eval,
        n_steps_before_checkpoint,
        n_eval_steps,
        dataset,
        tokenizer,
        model,
        optimizer,
        logs_manager,
        checkpoint,
        checkpoint_path,
        run_to_first_save,
    )

    return node_rank, float(out["val"]), hparams


```

## 从 `local_entrypoint` 启动超参数扫描
主入口点协调超参数优化。
首先，我们指定模型的默认超参数，取自
[Andrej Karpathy 的演练](https://www.youtube.com/watch?v=kCc8FmEb1nY\&t=5976s)。
为了获得更好的性能，您可以增加`context_size`并相应地扩展GPU。

```python
@dataclass
class ModelHyperparameters:
    n_heads: int = 6
    n_embed: int = 384
    n_blocks: int = 6
    context_size: int = 256
    dropout: float = 0.2


```

接下来我们定义本地入口点：我们在本地运行以协调训练的代码。

它将跨 8 个容器并行训练 8 个模型，每个模型
使用不同的超参数，改变头的数量（`n_heads`），
`context_size`（Karpathy 称为“区块大小”），以及 dropout 率 (`dropout`)。跑进去并行我们需要使用[`starmap`方法](https://modal.com/docs/guide/scale#parallel-execution-of-inputs)。

我们训练所有模型直到第一个检查点，然后提前停止，所以我们
可以比较验证损失。

然后我们重新开始训练最佳模型并训练完成。

您可以使用以下命令开始训练：

```bash
modal run 06_gpu_and_ml/hyperparameter-sweep/hp_sweep_gpt.py
```

输出将如下所示：

```
Sep 16 21:20:39 INFO [hp_sweep_gpt.py.train_model:127] [Node 1]  Remote Device: cuda // GPU: A10G
Sep 16 21:20:40 INFO [hp_sweep_gpt.py.train_model:149] [Node 1]  Num parameters: 10693697
Sep 16 21:20:40 INFO [hp_sweep_gpt.py.train_model:156] [Node 1]  Model Name: E2024-0916-142031.618259_context_size=8_n_heads=1_dropout=0.1
Sep 16 21:20:41 INFO [hp_sweep_gpt.py.train_model:225] [Node 1]      0) //  1.03s // Train Loss: 3.58 // Val Loss: 3.60
Sep 16 21:20:41 INFO [hp_sweep_gpt.py.train_model:127] [Node 2]  Remote Device: cuda // GPU: A10G
...
```

`local_entrypoint`代码如下。请注意，它的参数也可以通过命令行传递。
使用`--help`了解详细信息。

```python
@app.local_entrypoint()
def main(
    n_steps: int = 3000,
    n_steps_before_checkpoint: Optional[int] = None,
    n_steps_before_eval: Optional[int] = None,
):
    from datetime import datetime
    from itertools import product

    experiment_name = f"E{datetime.now().strftime('%Y-%m-%d-%H%M%S.%f')}"
    default_hparams = ModelHyperparameters()

    # build list of hyperparameters to train & validate
    nheads_options = (1, default_hparams.n_heads)
    context_size_options = (8, default_hparams.context_size)
    dropout_options = (0.1, default_hparams.dropout)

    hparams_list = [
        ModelHyperparameters(n_heads=h, context_size=c, dropout=d)
        for h, c, d in product(nheads_options, context_size_options, dropout_options)
    ]

    # run training for each hyperparameter setting
    results = []
    stop_early = True  # stop early so we can compare val losses
    print(f"Testing {len(hparams_list)} hyperparameter settings")
    n_nodes = len(hparams_list)
    static_params = (
        experiment_name,
        stop_early,
        n_steps,
        n_steps_before_eval,
        n_steps_before_checkpoint,
    )
    for result in train_model.starmap(
        [(i, n_nodes, h, *static_params) for i, h in enumerate(hparams_list)],
        order_outputs=False,
    ):
        # result = (node_rank, val_loss, hparams)
        node_rank = result[0]
        results.append(result)
        print(
            f"[Node {node_rank + 1}/{n_nodes}] Finished. Early stop val loss result: {result[1:]}"
        )

    # find the model and hparams with the lowest validation loss
    best_result = min(results, key=lambda x: x[1])
    print(f"Best early stop val loss result: {best_result}")
    best_hparams = best_result[-1]

    # finish training with best hparams
    node_rank = 0
    n_nodes = 1  # only one node for final training run
    train_model.remote(
        node_rank,
        n_nodes,
        best_hparams,
        experiment_name,
        not stop_early,
        n_steps,
        n_steps_before_eval,
        n_steps_before_checkpoint,
    )


```

### 使用 TensorBoard 监控实验

为了监控我们的训练，我们将创建一个 TensorBoard WSGI Web 应用程序，它将
显示我们在所有 8 个模型上的训练进度。我们将使用最新的
写入卷的最新实验的日志。

为了确保我们拥有最新数据，我们添加了一些
[WSGI中间件](https://peps.python.org/pep-3333/)
重新加载页面时检查模态体积是否有更新。

```python
class VolumeMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        if (route := environ.get("PATH_INFO")) in ["/", "/modal-volume-reload"]:
            try:
                volume.reload()
            except Exception as e:
                print("Exception while re-loading traces: ", e)
            if route == "/modal-volume-reload":
                environ["PATH_INFO"] = "/"  # redirect
        return self.app(environ, start_response)


```

为了确保每个实验都有独特的颜色，您可以单击调色板 (🎨) 图标
在 TensorBoard > 时间序列 > 运行并使用正则表达式下：
`E(\d{4})-(\d{2})-(\d{2})-(\d{6})\.(\d{6})`

您可以通过运行来部署此 TensorBoard 服务

```
modal deploy 06_gpu_and_ml/hyperparameter-sweep/hp_sweep_gpt.py
```

并通过以 `-monitor-training.modal.run` 结尾的 URL 访问它。

训练完成后，您的 TensorBoard UI 将如下所示：

![图表上有 8 条线，y 轴为验证损失，x 轴为时间步长。所有线路在前 1000 个时间步长内都会下降，其中一条线路会进入 5000 个时间步长，最终损失为 1.52](./tensorboard.png)

您还可以在“文本”选项卡中找到模型生成的一些示例文本。

```python
@app.function(
    image=torch_image,
    volumes={volume_path: volume},
)
@modal.concurrent(max_inputs=100)
@modal.wsgi_app()
def monitor_training():
    board = tensorboard.program.TensorBoard()
    board.configure(logdir=str(tb_log_path))
    (data_provider, deprecated_multiplexer) = board._make_data_provider()
    wsgi_app = tensorboard.backend.application.TensorBoardWSGIApp(
        board.flags,
        board.plugin_loaders,
        data_provider,
        board.assets_zip_provider,
        deprecated_multiplexer,
        experimental_middlewares=[VolumeMiddleware],
    )
    return wsgi_app


```

请注意，有 8 个模型进行训练，其中训练量最低的一个
第 600 步的验证损失继续训练到 3000 个步骤。

## 在训练期间和之后在 Modal 上为 SLM 提供服务

因为我们的权重存储在分布式 Volume 中，
我们可以部署基于它们的推理函数，无需任何额外的工作——
我们甚至可以在训练模型时检查模型！ # 有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

### 使用 Modal `Cls`es 进行远程推理

我们将推理包装在名为 `ModelInference` 的模态 `Cls` 中。
`ModelInference`的用户可以通过提供以下参数来控制使用哪个型号
`experiment_name`。  每个独特的选择都会创造一个单独的
[自动伸缩部署](https://modal.com/docs/guide/parameterized-functions)。
如果用户没有指定`experiment_name`，则最新的实验
被使用。

```python
@app.cls(image=torch_image, volumes={volume_path: volume}, gpu=gpu)
class ModelInference:
    experiment_name: str = modal.parameter(default="")

    def get_latest_available_model_dirs(self, n_last):
        """Find the latest models that have a best model checkpoint saved."""
        save_model_dirs = glob.glob(f"{model_save_path}/*")
        sorted_model_dirs = sorted(save_model_dirs, key=os.path.getctime, reverse=True)

        valid_model_dirs = []
        for latest_model_dir in sorted_model_dirs:
            if Path(f"{latest_model_dir}/{best_model_filename}").exists():
                valid_model_dirs.append(Path(latest_model_dir))
            if len(valid_model_dirs) >= n_last:
                return valid_model_dirs
        return valid_model_dirs

    @modal.method()
    def get_latest_available_experiment_names(self, n_last):
        return [d.name for d in self.get_latest_available_model_dirs(n_last)]

    def load_model_impl(self):
        from .src.model import AttentionModel
        from .src.tokenizer import Tokenizer

        if self.experiment_name != "":  # user selected model
            use_model_dir = f"{model_save_path}/{self.experiment_name}"
        else:  # otherwise, pick latest
            try:
                use_model_dir = self.get_latest_available_model_dirs(1)[0]
            except IndexError:
                raise ValueError("No models available to load.")

        if self.use_model_dir == use_model_dir and self.is_fully_trained:
            return  # already loaded fully trained model.

        print(f"Loading experiment: {Path(use_model_dir).name}...")
        checkpoint = torch.load(f"{use_model_dir}/{best_model_filename}")

        self.use_model_dir = use_model_dir
        hparams = checkpoint["hparams"]
        key = (  # for backwards compatibility
            "unique_chars" if "unique_chars" in checkpoint else "chars"
        )
        unique_chars = checkpoint[key]
        steps = checkpoint["steps"]
        val_loss = checkpoint["val_loss"]
        self.is_fully_trained = checkpoint["finished_training"]

        print(
            f"Loaded model with {steps} train steps"
            f" and val loss of {val_loss:.2f}"
            f" (fully_trained={self.is_fully_trained})"
        )

        self.tokenizer = Tokenizer(unique_chars)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.model = AttentionModel(self.tokenizer.vocab_size, hparams, self.device)
        self.model.load_state_dict(checkpoint["model"])
        self.model.to(self.device)

    @modal.enter()
    def load_model(self):
        self.use_model_dir = None
        self.is_fully_trained = False
        self.load_model_impl()

    @modal.method()
    def generate(self, prompt):
        self.load_model_impl()  # load updated model if available

        n_new_tokens = 1000
        return self.model.generate_from_text(self.tokenizer, prompt, n_new_tokens)


```### 添加一个简单的 Web 函数

以上`ModelInference`类均可使用
来自具有正确 Modal 凭据的任何其他 Python 环境
并且安装了`modal`软件包——只需使用[`lookup`](https://modal.com/docs/reference/modal.Cls#lookup)。

但我们也可以将其公开为 Web Function 以便于访问
从任何地方，包括其他编程语言或命令行。

```python
class GenerationRequest(BaseModel):
    prompt: str


@app.function(image=web_image)
@modal.fastapi_endpoint(method="POST", docs=True)
def web_generate(request: GenerationRequest):
    output = ModelInference().generate.remote(request.prompt)
    return {"output": output}


```

该功能可以通过`modal deploy`部署在Modal上。
这将允许我们通过简单的 `curl` 命令生成文本，如下所示：

```bash
curl -X POST -H 'Content-Type: application/json' --data-binary '{"prompt": "\n"}' https://your-workspace-name--modal-nano-gpt-web-generate.modal.run
```

这将返回类似以下内容：

```json
{
"output":
   "BRUTUS:
    The broy trefore anny pleasory to
    wip me state of villoor so:
    Fortols listhey for brother beat the else
    Be all, ill of lo-love in igham;
    Ah, here all that queen and hould you father offer"
}
```

这并不完全是莎士比亚，但至少它表明我们的模型学到了一些东西！
您可以通过在请求 URL 的查询参数中指定 `experiment_name` 来选择要使用的模型。

### 使用 `asgi_app` 提供 Gradio UI

其次，我们创建一个 Gradio Web 应用程序，用于通过浏览器中的图形用户界面生成文本。
这样我们的团队成员和利益相关者就可以轻松地与模型交互并提供反馈，
即使我们仍在训练模型。

您应该在 `modal deploy` 的输出中看到此 UI 的 URL
或在您的[模态应用程序仪表板](https://modal.com/apps) 上查看此应用程序。

Gradio 用户界面将如下所示：

![Gradio Web 应用程序的图像。顶部显示模型选择下拉列表。左侧显示输入提示文本框。右侧显示 SLM 生成的输出。底部有用于开始生成过程的按钮](./gradio.png)

```python
@app.function(
    image=ui_image,
    max_containers=1,
    volumes={volume_path: volume},
)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def ui():
    import gradio as gr
    from fastapi import FastAPI
    from fastapi.responses import FileResponse
    from gradio.routes import mount_gradio_app

    # call out to the inference in a separate Modal environment with a GPU
    def generate(text="", experiment_name=""):
        if not text:
            text = "\n"
        generated = ModelInference(experiment_name=experiment_name).generate.remote(
            text
        )
        return text + generated

    example_prompts = [
        "DUKE OF YORK:\nWhere art thou Lucas?",
        "ROMEO:\nWhat is a man?",
        "CLARENCE:\nFair is foul and foul is fair, but who are you?",
        "Brevity is the soul of wit, so what is the soul of foolishness?",
    ]

    web_app = FastAPI()

    # custom styles: an icon, a background, and a theme
    @web_app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        return FileResponse("/assets/favicon.svg")

    @web_app.get("/assets/background.svg", include_in_schema=False)
    async def background():
        return FileResponse("/assets/background.svg")

    with open("/assets/index.css") as f:
        css = f.read()

    n_last = 20
    experiment_names = ModelInference().get_latest_available_experiment_names.remote(
        n_last
    )
    theme = gr.themes.Default(
        primary_hue="green", secondary_hue="emerald", neutral_hue="neutral"
    )

    # add a Gradio UI around inference
    with gr.Blocks(theme=theme, css=css, title="SLM") as interface:
        # title
        gr.Markdown("# GPT-style Shakespeare text generation.")

        # Model Selection
        with gr.Row():
            gr.Markdown("## Model Version")
        with gr.Row():
            experiment_dropdown = gr.Dropdown(
                experiment_names, label="Select Model Version"
            )

        # input and output
        with gr.Row():
            with gr.Column():
                gr.Markdown("## Input:")
                input_box = gr.Textbox(  # input text component
                    label="",
                    placeholder="Write some Shakespeare like text or keep it empty!",
                    lines=10,
                )
            with gr.Column():
                gr.Markdown("## Output:")
                output_box = gr.Textbox(  # output text component
                    label="",
                    lines=10,
                )

        # button to trigger inference and a link to Modal
        with gr.Row():
            generate_button = gr.Button("Generate", variant="primary", scale=2)
            generate_button.click(
                fn=generate,
                inputs=[input_box, experiment_dropdown],
                outputs=output_box,
            )  # connect inputs and outputs with inference function

            gr.Button(  # shameless plug
                " Powered by Modal",
                variant="secondary",
                link="https://modal.com",
            )

        # example prompts
        with gr.Column(variant="compact"):
            # add in a few examples to inspire users
            for ii, prompt in enumerate(example_prompts):
                btn = gr.Button(prompt, variant="secondary")
                btn.click(fn=lambda idx=ii: example_prompts[idx], outputs=input_box)

    # mount for execution on Modal
    return mount_gradio_app(
        app=web_app,
        blocks=interface,
        path="/",
    )


```

## 附录

该代码的其余部分是样板文件。

### 训练循环

仅训练循环就有相当多的代码！如果你不想自己写这些东西，
考虑像[PyTorch Lightning](https://lightning.ai/docs/pytorch/stable)这样的训练框架
或[抱脸](https://huggingface.co/transformers/main_classes/trainer.html)。

```python
def training_loop(
    start_step,
    n_steps,
    n_steps_before_eval,
    n_steps_before_checkpoint,
    n_eval_steps,
    dataset,
    tokenizer,
    model,
    optimizer,
    logs_manager,
    checkpoint,
    checkpoint_path,
    run_to_first_save,
):
    @torch.no_grad()
    def eval_model(model, dataset, tokenizer, n_eval_steps):
        """Evaluate model on train and validation data."""
        out = {}
        model.eval()  # Turn off gradients
        for split in ("train", "val"):
            losses = torch.zeros(n_eval_steps)
            for k in range(n_eval_steps):
                xb, yb = dataset.get_batch(split)
                logits, loss = model.forward(xb, yb)
                losses[k] = loss
            out[split] = losses.mean()

        # Generate some output samples
        out["sample"] = model.generate_from_text(tokenizer, "\n", 1000)

        model.train()  # Turn on gradients
        return out

    t_last = timer()
    for step in range(start_step, n_steps + 1):
        # sample a batch of data
        xb, yb = dataset.get_batch("train")

        # evaluate the loss, calculate & apply gradients
        logits, loss = model.forward(xb, yb)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        optimizer.step()

        # log training loss
        logs_manager.add_train_scalar("Cross Entropy Loss", loss.item(), step)

        # evaluate model on validation set
        if step % n_steps_before_eval == 0:
            out = eval_model(model, dataset, tokenizer, n_eval_steps)
            log_evals(out, step, t_last, logs_manager)
            t_last = timer()

        # save model with checkpoint information
        if step > 0 and step % n_steps_before_checkpoint == 0:
            checkpoint["steps"] = step
            checkpoint["val_loss"] = out["val"]

            # mark as finished if we hit n steps.
            checkpoint["finished_training"] = step >= n_steps

            L.info(
                f"Saving checkpoint to {checkpoint_path}\t {checkpoint['finished_training']})"
            )
            save_checkpoint(checkpoint, checkpoint_path)

            if run_to_first_save:
                L.info("Stopping early...")
                break
    return out


def save_checkpoint(checkpoint, checkpoint_path):
    torch.save(checkpoint, checkpoint_path)
    volume.commit()


def build_model(hparams, vocab_size, device):
    """Initialize the model and move it to the device."""
    model = AttentionModel(vocab_size, hparams, device)
    model.to(device)
    return model


def setup_optimizer(model, learning_rate):
    """Set up the optimizer for the model."""
    return torch.optim.AdamW(model.parameters(), lr=learning_rate)


```

### 杂项

其余代码包括用于训练模型的小辅助函数。

```python
def prepare_data(input_file_path: Path, volume: modal.Volume) -> str:
    """Download and read the dataset."""
    volume.reload()
    if not input_file_path.exists():
        L.info("Downloading Shakespeare dataset...")
        data_url = "https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt"
        urllib.request.urlretrieve(data_url, input_file_path)
        volume.commit()
    return input_file_path.read_text()


def make_best_symbolic_link(model_save_dir, model_filename, experiment_name):
    # create symlink to the best model so it's easy to find for web serving
    os.symlink(
        str(model_save_dir / model_filename),
        str(model_save_path / experiment_name / best_model_filename),
    )
    volume.commit()  # commit the symlink


def init_checkpoint(model, tokenizer, optimizer, start_step, hparams):
    return {
        "model": model.state_dict(),
        "unique_chars": tokenizer.unique_chars,
        "optimizer": optimizer.state_dict(),
        "val_loss": float("inf"),
        "steps": start_step,
        "hparams": hparams,
        "finished_training": False,
    }


def log_evals(result, step, t_last, logs_manager):
    runtime_s = timer() - t_last
    L.info(
        f"{step:5d}) // {runtime_s:>5.2f}s // Train Loss: {result['train']:.2f} // Val Loss: {result['val']:.2f}"
    )
    logs_manager.add_val_scalar("Cross Entropy Loss", result["val"], step)
    logs_manager.add_val_text("Sample Output", result["sample"], step)
    logs_manager.flush()
    volume.commit()  # Make sure TensorBoard container will see it.

    return result

```