<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 ACE-Step 1.5 制作音乐

在这个例子中，我们向您展示如何运行[ACE Studio](https://acestudio.ai/)的
[ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5)音乐生成模型
在莫代尔上。

ACE-Step 1.5 引入了多模型架构：
用于音频生成的 DiT（扩散变压器）处理程序
以及用于提示增强的 LM（语言模型）处理程序。
LM 自动增强提示、检测语言、
并生成 BPM 和密钥等元数据。

我们将设置无服务器音乐生成服务
和网络用户界面。

## 设置依赖关系

```python
from pathlib import Path
from typing import Optional
from uuid import uuid4

import modal

```

我们首先定义我们这一代人所处的环境。
这需要一些解释，因为与大多数尖端的机器学习环境一样，它有点繁琐。

该环境是由
[集装箱图片](https://modal.com/docs/guide/images),
我们通过调用方法来添加依赖项来逐步构建它，
如`apt_install`添加系统包和`uv_pip_install`添加
Python 包。

ACE-Step 1.5 在其内部使用本地路径依赖 (`nano-vllm`)
包配置，因此我们首先克隆存储库并从
本地目录。这让 `uv` 一起解决所有依赖关系，
包括支持 CUDA 的 PyTorch 构建和本地 `nano-vllm` 包。

```python
image = (
    modal.Image.from_registry(
        "nvidia/cuda:13.0.0-cudnn-devel-ubuntu22.04", add_python="3.12"
    )
    .apt_install("git", "ffmpeg")
    .run_commands(
        "git clone --branch v0.1.6 --depth 1 https://github.com/ace-step/ACE-Step-1.5.git /opt/ace-step",
    )
    .uv_pip_install(
        "/opt/ace-step", "hf_transfer==0.1.9", "torchcodec==0.10.0", "torch~=2.10.0"
    )
    .entrypoint([])
)

```
除了源代码之外，我们还需要模型权重。

ACE-Step 1.5 与 Hugging Face 生态系统集成，因此可以设置模型
很简单。模型处理程序使用 Hugging Face
下载权重（如果尚不存在）。

我们使用单个 `checkpoints/` 目录来下载所有模型
（DiT 和 LM 模型）并用 Modal 持久化它
[体积](https://modal.com/docs/guide/volumes)。
有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

```python
checkpoints_dir = "/opt/ace-step/checkpoints"
model_cache = modal.Volume.from_name("ACE-Step-v15-model-cache", create_if_missing=True)

```

我们设置 `ACESTEP_PROJECT_ROOT` 环境变量，以便
模型处理程序知道在哪里可以找到检查点目录。

```python
image = image.env(
    {"ACESTEP_PROJECT_ROOT": "/opt/ace-step", "HF_HUB_ENABLE_HF_TRANSFER": "1"}
)

```在我们这样做的同时，我们还可以定义 UI 的环境。
我们将坚持使用 Python，因此使用 FastAPI 和 Gradio。

```python
web_image = modal.Image.debian_slim(python_version="3.12").uv_pip_install(
    "fastapi[standard]==0.115.4",
    "gradio==6.11.0",
    "huggingface-hub==1.9.1",
    "pydantic==2.10.1",
)

```

这是一个与我们运行模型的环境完全不同的环境。
告别 Python 依赖冲突地狱！

## 在 Modal 上运行音乐生成

现在，我们编写音乐生成逻辑。

* 我们制作一个[App](https://modal.com/docs/guide/apps)来组织我们的部署。
* 我们在开始时加载模型，而不是在推理期间，使用`modal.enter`，
  这要求我们使用模态 [`Cls`](https://modal.com/docs/guide/lifecycle-functions)。
* 在`app.cls`装饰器中，我们指定我们构建的图像并附加卷。
我们还选择了一个 GPU 来运行——这里是 NVIDIA L40S。

```python
app = modal.App("example-generate-music")


@app.cls(gpu="l40s", image=image, volumes={checkpoints_dir: model_cache})
class MusicGenerator:
    @modal.enter()
    def init(self):
        from acestep.handler import AceStepHandler
        from acestep.llm_inference import LLMHandler
        from acestep.model_downloader import ensure_lm_model, ensure_main_model

        # Download models if not already cached in the Volume.
        lm_model_name = "acestep-5Hz-lm-4B"
        ensure_main_model(checkpoints_dir=checkpoints_dir)
        ensure_lm_model(model_name=lm_model_name, checkpoints_dir=checkpoints_dir)

        # Initialize the audio generation model.
        self.dit_handler = AceStepHandler()
        init_status, enable_generate = self.dit_handler.initialize_service(
            project_root="/opt/ace-step",
            config_path="acestep-v15-turbo",
            device="cuda",
        )
        if not enable_generate:
            raise RuntimeError(f"DiT model initialization failed: {init_status}")

        # Initialize the language model for prompt enhancement.
        self.llm_handler = LLMHandler()
        lm_status, lm_success = self.llm_handler.initialize(
            checkpoint_dir=checkpoints_dir,
            lm_model_path=lm_model_name,
            backend="vllm",
            device="cuda",
        )
        if not lm_success:
            raise RuntimeError(f"LM initialization failed: {lm_status}")

    @modal.method()
    def run(
        self,
        prompt: str,
        lyrics: str,
        duration: float = 60.0,
        format: str = "mp3",  # or wav
        manual_seeds: Optional[int] = 1,
    ) -> bytes:
        from acestep.inference import GenerationConfig, GenerationParams, generate_music

        params = GenerationParams(
            caption=prompt,
            lyrics=lyrics,
            duration=duration,
            thinking=True,
        )
        config = GenerationConfig(
            audio_format=format,
            batch_size=1,
            seeds=[manual_seeds] if manual_seeds is not None else None,
            use_random_seed=manual_seeds is None,
        )
        result = generate_music(
            self.dit_handler,
            self.llm_handler,
            params,
            config,
            save_dir="/dev/shm",
        )
        if not result.success:
            raise RuntimeError(f"Music generation failed: {result.error}")
        return Path(result.audios[0]["path"]).read_bytes()


```

然后，我们可以通过运行下面`local_entrypoint`中的代码从任何地方生成音乐。

```python
@app.local_entrypoint()
def main(
    prompt: Optional[str] = None,
    lyrics: Optional[str] = None,
    duration: Optional[float] = None,
    format: str = "mp3",  # or wav
    manual_seeds: Optional[int] = 1,
):
    if lyrics is None:
        lyrics = "[Instrumental]"
    if prompt is None:
        prompt = "Korean pop music, bright energetic electronic music, catchy melody, female vocals"
        lyrics = """[intro][intro]
            [chorus]
            We're goin' up, up, up, it's our moment
            You know together we're glowing
            Gonna be, gonna be golden
            Oh, up, up, up with our voices
            영원히 깨질 수 없는
            Gonna be, gonna be golden"""
    if duration is None:
        duration = 30.0  # seconds
    print(
        f"🎼 generating {duration} seconds of music from prompt '{prompt[:32] + ('...' if len(prompt) > 32 else '')}'"
        f" and lyrics '{lyrics[:32] + ('...' if len(lyrics) > 32 else '')}'"
    )

    music_generator = MusicGenerator()  # outside of this file, use modal.Cls.from_name
    clip = music_generator.run.remote(
        prompt, lyrics, duration=duration, format=format, manual_seeds=manual_seeds
    )

    dir = Path("/tmp/generate-music")
    dir.mkdir(exist_ok=True, parents=True)

    output_path = dir / f"{slugify(prompt)[:64]}.{format}"
    print(f"🎼 Saving to {output_path}")
    output_path.write_bytes(clip)


def slugify(string):
    return (
        string.lower()
        .replace(" ", "-")
        .replace("/", "-")
        .replace("\\", "-")
        .replace(":", "-")
    )


```

您可以使用如下命令来执行它：

```shell
modal run generate_music.py
```

通过 `--help` 查看选项以及如何使用它们。

## 为音乐生成器托管 Web UI

借助 Gradio 库，我们可以用 Python 创建一个简单的 Web UI
调用我们的音乐发生器，
然后将其托管在 Modal 上供任何人试用。

要部署音乐生成器和 UI，请运行

```shell
modal deploy generate_music.py
```

```python
@app.function(
    image=web_image,
    # Gradio requires sticky sessions
    # so we limit the number of concurrent containers to 1
    # and allow it to scale to 100 concurrent inputs
    max_containers=1,
)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def ui():
    import gradio as gr
    from fastapi import FastAPI
    from gradio.routes import mount_gradio_app

    api = FastAPI()

    # Since this Gradio app is running from its own container,
    # we make a `.remote` call to the music generator
    music_generator = MusicGenerator()
    generate = music_generator.run.remote

    temp_dir = Path("/dev/shm")

    async def generate_music(
        prompt: str, lyrics: str, duration: float = 30.0, format: str = "mp3"
    ):
        audio_bytes = await generate.aio(
            prompt, lyrics, duration=duration, format=format
        )

        audio_path = temp_dir / f"{uuid4()}.{format}"
        audio_path.write_bytes(audio_bytes)

        return audio_path

    with gr.Blocks(theme="soft") as demo:
        gr.Markdown("# Generate Music")
        with gr.Row():
            with gr.Column():
                prompt = gr.Textbox(label="Prompt")
                lyrics = gr.Textbox(label="Lyrics")
                duration = gr.Number(
                    label="Duration (seconds)", value=10.0, minimum=1.0, maximum=300.0
                )
                format = gr.Radio(["wav", "mp3"], label="Format", value="mp3")
                btn = gr.Button("Generate")
            with gr.Column():
                clip_output = gr.Audio(label="Generated Music", autoplay=True)

        btn.click(
            generate_music,
            inputs=[prompt, lyrics, duration, format],
            outputs=[clip_output],
        )

    return mount_gradio_app(app=api, blocks=demo, path="/")

```