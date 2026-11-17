<!-- modal-docs: machine-translated zh-CN from English source -->

# 在 Modal 上创建 Chatterbox TTS API

此示例演示如何在 Modal 上使用开源模型 Chatterbox Turbo 部署文本转语音 (TTS) API。

Chatterbox Turbo 是一种最先进的 TTS 模型，可以生成与专有模型相媲美的自然、富有表现力的语音。
提示可以包含副语言标签，例如 `[chuckle]`、`[sigh]` 和 `[gasp]`。 Chatterbox还支持通过传递语音克隆
目标语音的简短（约 10 秒）音频提示。

查看【Resemble AI 网站】(https://www.resemble.ai/) 或
[Chatterbox Github](https://github.com/resemble-ai/chatterbox) 存储库了解更多详细信息。

＃＃ 设置导入`modal`，唯一需要的本地依赖项。

```python
import modal

```

## 定义容器镜像

我们从 Modal 的基线 `debian_slim` 镜像开始并安装所需的软件包。

* `chatterbox-tts`：TTS模型库
* `fastapi`：用于创建API端点的Web框架
*“peft”：正确加载模型所需的

```python
image = modal.Image.debian_slim(python_version="3.12").uv_pip_install(
    "chatterbox-tts==0.1.7",
    "fastapi[standard]==0.124.4",
    "peft==0.18.0",
    "setuptools==81.0.0",
)

```

我们来下载Chatterbox的公共【语音提示】(https://modal-cdn.com/blog/audio/chatterbox-tts-voices.zip)
在容器镜像构建过程中。

```python
VOICE_PROMPT_PATH = "/chatterbox-tts/prompts/Lucy.wav"


def download_voice_prompt():
    import io
    import pathlib
    import urllib.request
    import zipfile

    with urllib.request.urlopen(
        "https://modal-cdn.com/blog/audio/chatterbox-tts-voices.zip", timeout=60
    ) as response:
        with zipfile.ZipFile(io.BytesIO(response.read())) as archive:
            prompts = [
                name
                for name in archive.namelist()
                if pathlib.PurePosixPath(name).name == "Lucy.wav"
            ]
            if len(prompts) != 1:
                raise ValueError(
                    f"Expected one Lucy.wav voice prompt, found {len(prompts)}"
                )
            path = pathlib.Path(VOICE_PROMPT_PATH)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(archive.read(prompts[0]))


image = image.run_function(download_voice_prompt)

app = modal.App("example-chatterbox-tts", image=image)

```

在图像上下文中导入所需的库以确保它们可用
当容器运行时。这包括音频处理模块和 Chatterbox TTS 模块本身。

```python
with image.imports():
    import io

    import torchaudio as ta
    from chatterbox.tts_turbo import ChatterboxTurboTTS
    from fastapi.responses import StreamingResponse

```
## TTS 模型类

TTS服务是使用Modal的类语法和GPU加速来实现的。
我们将类配置为使用带有附加参数的 A10G GPU：

* `scaledown_window=60 * 5`：在最后一次请求后让容器保持活动状态 5 分钟
* `@modal.concurrent(max_inputs=10)`：每个容器最多允许 10 个并发请求

```python
@app.cls(
    gpu="a10g",
    scaledown_window=60 * 5,
)
@modal.concurrent(max_inputs=10)
class Chatterbox:
    @modal.enter()
    def load(self):
        self.model = ChatterboxTurboTTS.from_pretrained(device="cuda")

    @modal.fastapi_endpoint(docs=True, method="POST")
    def api_endpoint(self, prompt: str):
        # Get the audio bytes from the generate method
        audio_bytes = self.generate.local(prompt)

        # Return the audio as a streaming response with appropriate MIME type.
        # This allows for browsers to playback audio directly.
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/wav",
        )

    @modal.method()
    def generate(self, prompt: str) -> bytes:
        # Generate audio waveform from the input text
        wav = self.model.generate(
            prompt,
            audio_prompt_path=VOICE_PROMPT_PATH,
        )

        # Convert the waveform to bytes
        buffer = io.BytesIO()
        ta.save(buffer, wav, self.model.sr, format="wav")
        buffer.seek(0)
        return buffer.read()


@app.local_entrypoint()
def test(
    prompt: str = "Chatterbox running on Modal [chuckle].",
    output_path: str = "/tmp/chatterbox-tts/output.wav",
):
    chatterbox = Chatterbox()
    audio_bytes = chatterbox.generate.remote(prompt=prompt)

    # Save the audio bytes to a file
    import pathlib

    output_path = pathlib.Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(audio_bytes)
    print(f"Audio saved to {output_path}")


```

现在从此文件的目录部署 Chatterbox API：

```shell
modal deploy -m 06_gpu_and_ml.text-to-audio.chatterbox_tts
```

并使用以下命令查询端点：

```shell
mkdir -p /tmp/chatterbox-tts  # create tmp directory

curl -X POST --get "<YOUR-ENDPOINT-URL>" \
  --data-urlencode "prompt=Chatterbox running on Modal [chuckle]." \
  --output /tmp/chatterbox-tts/output.wav
```

您将收到一个名为 `/tmp/chatterbox-tts/output.wav` 的 WAV 文件，其中包含生成的音频。