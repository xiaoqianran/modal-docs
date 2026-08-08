<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 LoRA 微调宠物的 Flux

此示例对 [Flux.1-dev 模型](https://huggingface.co/black-forest-labs/FLUX.1-dev) 进行了微调
在宠物的图像上（默认情况下，是一只名为 Qwerty 的小狗）
使用[“Dreambooth”论文](https://dreambooth.github.io/)中称为文本反转的技术。
实际上，它教会了通用图像生成模型一个新的“专有名词”，
允许个性化生成艺术和照片。
我们通过低阶适应（LoRA）来补充文本反转
以提高训练期间的效率。

然后，它可以与其他人共享模型——无需花费 25 美元/天的 GPU 服务器成本——
通过在 Modal 上托管 [Gradio 应用程序](https://gradio.app/)。

它展示了一种简单、高效且具有成本效益的途径
使用 Modal 的构建块构建大型预训练模型，例如
[GPU 加速](https://modal.com/docs/guide/gpu) 用于计算密集型工作的模态函数，
[卷](https://modal.com/docs/guide/volumes) 用于存储，
和 [Web Functions](https://modal.com/docs/guide/webhooks) 用于服务。

通过一些灯光定制，您可以用它来生成您的宠物的图像！

![Gradio.app图像生成接口](./gradio-image-generate.png)

您可以在 Modal YouTube 频道上找到此示例的视频演练
[这里](https://www.youtube.com/watch?v=df-8fiByXMI)。

## 导入和设置
我们首先导入必要的库并设置环境。

```python
from dataclasses import dataclass
from pathlib import Path

import modal

```

## 搭建环境

机器学习环境很复杂，依赖关系可能很难管理。
Modal 使创建和使用环境变得容易
[容器和容器镜像](https://modal.com/docs/guide/custom-container)。

我们从基础镜像开始并指定所有依赖项。
我们将在下面列出有趣的内容。
请注意，这些依赖项不是安装在本地的
\-- 它们仅安装在我们的模态应用程序运行的远程环境中。

```python
app = modal.App(name="example-diffusers-lora-finetune")

image = modal.Image.debian_slim(python_version="3.10").uv_pip_install(
    "accelerate==0.31.0",
    "datasets~=2.13.0",
    "fastapi[standard]==0.115.4",
    "ftfy~=6.1.0",
    "gradio~=5.5.0",
    "huggingface-hub==0.36.0",
    "numpy<2",
    "peft==0.11.1",
    "pydantic==2.9.2",
    "sentencepiece>=0.1.91,!=0.1.92",
    "smart_open~=6.4.0",
    "starlette==0.41.2",
    "transformers~=4.41.2",
    "torch~=2.2.0",
    "torchvision~=0.16",
    "triton~=2.2.0",
    "wandb==0.17.6",
)

```

### 使用 `run_commands` 下载脚本并安装 git 存储库

我们将使用 `diffusers` 库中的示例脚本来训练模型。
我们从 GitHub 获取它并使用一系列命令将其安装在我们的环境中。
模态函数运行的容器环境非常灵活——
有关更多详细信息，请参阅[文档](https://modal.com/docs/guide/custom-container)。

```python
GIT_SHA = "e649678bf55aeaa4b60bd1f68b1ee726278c0304"  # specify the commit to fetch

image = (
    image.apt_install("git")
    # Perform a shallow fetch of just the target `diffusers` commit, checking out
    # the commit in the container's home directory, /root. Then install `diffusers`
    .run_commands(
        "cd /root && git init .",
        "cd /root && git remote add origin https://github.com/huggingface/diffusers",
        f"cd /root && git fetch --depth=1 origin {GIT_SHA} && git checkout {GIT_SHA}",
        "cd /root && pip install -e .",
    )
)

```

### 配置`dataclass`es

机器学习应用程序通常具有大量配置信息。
我们将所有配置收集到数据类中，以避免在整个代码中分散特殊/魔法值。

```python
@dataclass
class SharedConfig:
    """Configuration information shared across project components."""

    # The instance name is the "proper noun" we're teaching the model
    instance_name: str = "Qwerty"
    # That proper noun is usually a member of some class (person, bird),
    # and sharing that information with the model helps it generalize better.
    class_name: str = "Golden Retriever"
    # identifier for pretrained models on Hugging Face
    model_name: str = "black-forest-labs/FLUX.1-dev"


```

### 使用 `modal.Volume` 存储我们的应用程序创建的数据
到目前为止我们使用的工具可以很好地获取外部信息，
它定义了我们的应用程序运行的环境，
但是我们在应用程序执行期间创建或修改的数据又如何呢？
持久化的 [`modal.Volume`](https://modal.com/docs/guide/volumes) 可以跨模态应用程序和函数存储和共享数据。

我们将使用一个来存储我们在训练期间创建的原始权重和微调权重
然后将它们重新加载以进行推理。有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

```python
volume = modal.Volume.from_name(
    "dreambooth-finetuning-volume-flux", create_if_missing=True
)
MODEL_DIR = "/model"

```

请注意，访问 Hugging Face 上的 Flux.1-dev 模型是
[由许可协议控制](https://huggingface.co/docs/hub/en/models-gated) 其中
您必须同意[此处](https://huggingface.co/black-forest-labs/FLUX.1-dev)。
接受许可证后，[创建模态密钥](https://modal.com/secrets)
按照模板中的说明，使用名称 `huggingface-secret`。

```python
huggingface_secret = modal.Secret.from_name(
    "huggingface-secret", required_keys=["HF_TOKEN"]
)

image = image.env(
    {"HF_XET_HIGH_PERFORMANCE": "1"}  # turn on faster downloads from HF
)


@app.function(
    volumes={MODEL_DIR: volume},
    image=image,
    secrets=[huggingface_secret],
    timeout=600,  # 10 minutes
)
def download_models(config):
    import torch
    from diffusers import DiffusionPipeline
    from huggingface_hub import snapshot_download

    snapshot_download(
        config.model_name,
        local_dir=MODEL_DIR,
        ignore_patterns=["*.pt", "*.bin"],  # using safetensors
    )

    DiffusionPipeline.from_pretrained(MODEL_DIR, torch_dtype=torch.bfloat16)


```

### 加载微调数据集

低阶微调的神奇之处在于我们只需要 3-10 张图像进行微调。
因此我们可以获取一些存储在 Imgur 或 Google Drive 等消费者平台上的图像，
每当我们需要它们时——无需昂贵且难以维护的数据管道。

```python
def load_images(image_urls: list[str]) -> Path:
    import PIL.Image
    from smart_open import open

    img_path = Path("/img")

    img_path.mkdir(parents=True, exist_ok=True)
    for ii, url in enumerate(image_urls):
        with open(url, "rb") as f:
            image = PIL.Image.open(f)
            image.save(img_path / f"{ii}.png")
    print(f"{ii + 1} images loaded")

    return img_path


```

## 文本到图像模型的低秩适应 (LoRA) 微调
我们开始的基本模型经过训练可以进行某种“反向[ekphrasis](https://en.wikipedia.org/wiki/Ekphrasis)”：
它试图仅根据其描述来重新创建视觉艺术作品或图像。

我们可以使用该模型来合成全新的图像
通过结合从训练数据中学到的概念。

我们使用预训练模型，即 Black Forest Labs 的 Flux 模型。
在此示例中，我们“微调” Flux，仅对权重进行小幅调整。
此外，我们不会更改模型中的所有权重。
相反，使用一种称为[*低秩适应*](https://arxiv.org/abs/2106.09685)的技术，
我们改变了一个更小的矩阵，它与现有的权重一起工作，将模型推向我们想要的方向。

我们可以摆脱如此小而简单的训练过程，因为我们只是教模型一个新单词的含义：我们宠物的名字。

结果是一个可以生成我们宠物的新颖图像的模型：
作为太空中的宇航员，如梵高或巴斯夏等人所画的那样。

### 使用拥抱脸部🧨 扩散器和加速进行微调

模型权重、训练库、训练脚本均由[🤗 Hugging Face](https://huggingface.co)提供。

您可以使用命令`modal run dreambooth_app.py::app.train`开始训练作业。
大约需要十分钟。

训练机器学习模型需要时间并产生大量元数据——
性能和资源利用率指标，
模型质量和训练稳定性的指标，
以及模型输入和输出，例如图像和文本。
如果您正在摆弄配置参数，这一点尤其重要。

此示例可以选择使用 [权重和偏差](https://wandb.ai) 来跟踪所有这些训练信息。
只需注册一个帐户，切换下面的标志，然后将您的 API 密钥添加为 [Modal Secret](https://modal.com/secrets)。

```python
USE_WANDB = False

```

您可以在[此处](https://wandb.ai/cfrye59/dreambooth-lora-sd-xl)查看示例 W\&B 仪表板。
看看[这次运行](https://wandb.ai/cfrye59/dreambooth-lora-sd-xl/runs/ca3v1lsh?workspace=user-cfrye59),
[尽管 GPU 利用率很高](https://wandb.ai/cfrye59/dreambooth-lora-sd-xl/runs/ca3v1lsh/system)
在训练过程中遭受数值不稳定，并且只产生黑色图像——如果没有实验管理日志，很难调试！

您可以阅读有关如何选择和调整 `TrainConfig` 中的值的更多信息 [在这篇关于 Hugging Face 的博客文章中](https://huggingface.co/blog/dreambooth)。
要对您自己的宠物的图像进行训练，请将图像上传到单独的 URL，并在 `TrainConfig.instance_example_urls_file` 编辑文件内容以指向它们。

提示：如果您看到的结果与提示不太相符，请生成图像
如果不考虑提示，则模型可能会过度拟合。在这种情况下，请使用较低的重复训练
`max_train_steps` 的值。如果您使用了 W\&B，请回顾训练早期的结果以确定在哪里停止。
另一方面，如果结果看起来不像您的主题，您可能需要增加 `max_train_steps`。

```python
@dataclass
class TrainConfig(SharedConfig):
    """Configuration for the finetuning step."""

    # training prompt looks like `{PREFIX} {INSTANCE_NAME} the {CLASS_NAME} {POSTFIX}`
    prefix: str = "a photo of"
    postfix: str = ""

    # locator for plaintext file with urls for images of target instance
    instance_example_urls_file: str = str(
        Path(__file__).parent / "instance_example_urls.txt"
    )

    # Hyperparameters/constants from the huggingface training example
    resolution: int = 512
    train_batch_size: int = 3
    rank: int = 16  # lora rank
    gradient_accumulation_steps: int = 1
    learning_rate: float = 4e-4
    lr_scheduler: str = "constant"
    lr_warmup_steps: int = 0
    max_train_steps: int = 500
    checkpointing_steps: int = 1000
    seed: int = 117


@app.function(
    image=image,
    gpu="A100-80GB",  # fine-tuning is VRAM-heavy and requires a high-VRAM GPU
    volumes={MODEL_DIR: volume},  # stores fine-tuned model
    timeout=1800,  # 30 minutes
    secrets=[huggingface_secret]
    + (
        [modal.Secret.from_name("wandb-secret", required_keys=["WANDB_API_KEY"])]
        if USE_WANDB
        else []
    ),
)
def train(instance_example_urls, config):
    import subprocess

    from accelerate.utils import write_basic_config

    # load data locally
    img_path = load_images(instance_example_urls)

    # set up hugging face accelerate library for fast training
    write_basic_config(mixed_precision="bf16")

    # define the training prompt
    instance_phrase = f"{config.instance_name} the {config.class_name}"
    prompt = f"{config.prefix} {instance_phrase} {config.postfix}".strip()

    # the model training is packaged as a script, so we have to execute it as a subprocess, which adds some boilerplate
    def _exec_subprocess(cmd: list[str]):
        """Executes subprocess and prints log to terminal while subprocess is running."""
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        with process.stdout as pipe:
            for line in iter(pipe.readline, b""):
                line_str = line.decode()
                print(f"{line_str}", end="")

        if exitcode := process.wait() != 0:
            raise subprocess.CalledProcessError(exitcode, "\n".join(cmd))

    # run training -- see huggingface accelerate docs for details
    print("launching dreambooth training script")
    _exec_subprocess(
        [
            "accelerate",
            "launch",
            "examples/dreambooth/train_dreambooth_lora_flux.py",
            "--mixed_precision=bf16",  # half-precision floats most of the time for faster training
            f"--pretrained_model_name_or_path={MODEL_DIR}",
            f"--instance_data_dir={img_path}",
            f"--output_dir={MODEL_DIR}",
            f"--instance_prompt={prompt}",
            f"--resolution={config.resolution}",
            f"--train_batch_size={config.train_batch_size}",
            f"--gradient_accumulation_steps={config.gradient_accumulation_steps}",
            f"--learning_rate={config.learning_rate}",
            f"--lr_scheduler={config.lr_scheduler}",
            f"--lr_warmup_steps={config.lr_warmup_steps}",
            f"--max_train_steps={config.max_train_steps}",
            f"--checkpointing_steps={config.checkpointing_steps}",
            f"--seed={config.seed}",  # increased reproducibility by seeding the RNG
        ]
        + (
            [
                "--report_to=wandb",
                # validation output tracking is useful, but currently broken for Flux LoRA training
                # f"--validation_prompt={prompt} in space",  # simple test prompt
                # f"--validation_epochs={config.max_train_steps // 5}",
            ]
            if USE_WANDB
            else []
        ),
    )
    # The trained model information has been output to the volume mounted at `MODEL_DIR`.
    # To persist this data for use in our web app, we 'commit' the changes
    # to the volume.
    volume.commit()


```

## 运行我们的模型

为了使用我们微调的模型根据提示生成图像，我们定义了一个名为 `inference` 的模态函数。

天真地说，这似乎不适合 Modal 灵活的无服务器基础架构：
您是否不需要在每个函数调用中包含加载模型并启动模型的步骤？

为了在容器启动时初始化模型一次，
我们使用 Modal 的 [容器生命周期](https://modal.com/docs/guide/lifecycle-functions) 功能，这需要函数成为一部分
一个类的。请注意，我们保存模型的`modal.Volume`也安装在这里，
这样我们就可以使用`train`创建的微调模型。

```python
@app.cls(image=image, gpu="A100", volumes={MODEL_DIR: volume})
class Model:
    @modal.enter()
    def load_model(self):
        import torch
        from diffusers import DiffusionPipeline

        # Reload the modal.Volume to ensure the latest state is accessible.
        volume.reload()

        # set up a hugging face inference pipeline using our model
        pipe = DiffusionPipeline.from_pretrained(
            MODEL_DIR,
            torch_dtype=torch.bfloat16,
        ).to("cuda")
        pipe.load_lora_weights(MODEL_DIR)
        self.pipe = pipe

    @modal.method()
    def inference(self, text, config):
        image = self.pipe(
            text,
            num_inference_steps=config.num_inference_steps,
            guidance_scale=config.guidance_scale,
        ).images[0]

        return image


```

## 将经过训练的模型封装在 Gradio Web UI 中

[Gradio](https://gradio.app) 使公开模型的功能变得非常容易
在易于使用、响应迅速的 Web 界面中。

该模型是一个文本到图像生成器，
所以我们设置了一个包含用户输入文本框的界面
以及用于显示图像的框架。

我们还提供了一些示例文本输入来帮助
引导用户并激发他们的创造力。

我们也无法抗拒添加一些 Modal 风格！

您可以使用以下命令在 Modal 上部署应用程序
`modal deploy dreambooth_app.py`。
你将能够在几天、几周或几个月后回来，发现它仍然准备好出发，
即使您无需为服务器在不使用时运行而付费。

```python
@dataclass
class AppConfig(SharedConfig):
    """Configuration information for inference."""

    num_inference_steps: int = 50
    guidance_scale: float = 6


web_image = image.add_local_dir(
    # Add local web assets to the image
    Path(__file__).parent / "assets",
    remote_path="/assets",
)


@app.function(
    image=web_image,
    max_containers=1,
)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def fastapi_app():
    import gradio as gr
    from fastapi import FastAPI
    from fastapi.responses import FileResponse
    from gradio.routes import mount_gradio_app

    web_app = FastAPI()

    # Call out to the inference in a separate Modal environment with a GPU
    def go(text=""):
        if not text:
            text = example_prompts[0]
        return Model().inference.remote(text, config)

    # set up AppConfig
    config = AppConfig()

    instance_phrase = f"{config.instance_name} the {config.class_name}"

    example_prompts = [
        f"{instance_phrase}",
        f"a painting of {instance_phrase.title()} With A Pearl Earring, by Vermeer",
        f"oil painting of {instance_phrase} flying through space as an astronaut",
        f"a painting of {instance_phrase} in cyberpunk city. character design by cory loftis. volumetric light, detailed, rendered in octane",
        f"drawing of {instance_phrase} high quality, cartoon, path traced, by studio ghibli and don bluth",
    ]

    modal_docs_url = "https://modal.com/docs"
    modal_example_url = f"{modal_docs_url}/examples/dreambooth_app"

    description = f"""Describe what they are doing or how a particular artist or style would depict them. Be fantastical! Try the examples below for inspiration.

### Learn how to make a "Dreambooth" for your own pet [here]({modal_example_url}).
    """

    # custom styles: an icon, a background, and a theme
    @web_app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        return FileResponse("/assets/favicon.svg")

    @web_app.get("/assets/background.svg", include_in_schema=False)
    async def background():
        return FileResponse("/assets/background.svg")

    with open("/assets/index.css") as f:
        css = f.read()

    theme = gr.themes.Default(
        primary_hue="green", secondary_hue="emerald", neutral_hue="neutral"
    )

    # add a gradio UI around inference
    with gr.Blocks(
        theme=theme,
        css=css,
        title=f"Generate images of {config.instance_name} on Modal",
    ) as interface:
        gr.Markdown(
            f"# Generate images of {instance_phrase}.\n\n{description}",
        )
        with gr.Row():
            inp = gr.Textbox(  # input text component
                label="",
                placeholder=f"Describe the version of {instance_phrase} you'd like to see",
                lines=10,
            )
            out = gr.Image(  # output image component
                height=512, width=512, label="", min_width=512, elem_id="output"
            )
        with gr.Row():
            btn = gr.Button("Dream", variant="primary", scale=2)
            btn.click(
                fn=go, inputs=inp, outputs=out
            )  # connect inputs and outputs with inference function

            gr.Button(  # shameless plug
                "⚡️ Powered by Modal",
                variant="secondary",
                link="https://modal.com",
            )

        with gr.Column(variant="compact"):
            # add in a few examples to inspire users
            for ii, prompt in enumerate(example_prompts):
                btn = gr.Button(prompt, variant="secondary")
                btn.click(fn=lambda idx=ii: example_prompts[idx], outputs=inp)

    # mount for execution on Modal
    return mount_gradio_app(
        app=web_app,
        blocks=interface,
        path="/",
    )


```

## 从命令行运行微调后的模型您可以使用 `modal` 命令行界面来设置、自定义和部署此应用程序：

* `modal run diffusers_lora_finetune.py` 将训练模型。将 `instance_example_urls_file` 更改为指向您自己的宠物的图像。
* `modal serve diffusers_lora_finetune.py` 将在临时位置[服务](https://modal.com/docs/guide/webhooks#developing-with-modal-serve)Gradio 界面。非常适合迭代代码！
* `modal shell diffusers_lora_finetune.py` 是在我们的镜像中打开 bash [shell](https://modal.com/docs/guide/developing-debugging#interactive-shell) 的便捷助手。非常适合调试环境问题。

请记住，一旦您训练了自己的微调模型，您就可以永久部署它——在不使用时免费！ --
使用`modal deploy diffusers_lora_finetune.py`。

如果您只是想尝试一下该应用程序，您可以在[此处](https://modal-labs--example-diffusers-lora-finetune-fastapi-app.modal.run)找到我们的部署。

```python
@app.local_entrypoint()
def run(  # add more config params here to make training configurable
    max_train_steps: int = 250,
):
    print("🎨 loading model")
    download_models.remote(SharedConfig())
    print("🎨 setting up training")
    config = TrainConfig(max_train_steps=max_train_steps)
    instance_example_urls = (
        Path(TrainConfig.instance_example_urls_file).read_text().splitlines()
    )
    train.remote(instance_example_urls, config)
    print("🎨 training finished")

```