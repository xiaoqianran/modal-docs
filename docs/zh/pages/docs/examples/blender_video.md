<!-- modal-docs: machine-translated zh-CN from English source -->

# 在许多 GPU 或 CPU 上使用 Blender 并行渲染视频

此示例展示了如何使用渲染动画 3D 场景
[Blender](https://www.blender.org/) 的 Python 界面。

您可以在 CPU 上运行它以扩展到一百个容器
或者在 GPU 上运行以获得更高的每个节点吞吐量。
即使对于这个简单的场景，GPU 的渲染速度也比 CPU 快 10 倍以上。

最终渲染看起来像这样：

<center>
<video controls autoplay loop muted>
<source src="https://modal-cdn.com/modal-blender-video.mp4" type="video/mp4">
</video>
</center>

## 定义模态应用程序

```python
from pathlib import Path

import modal

```

Modal 在云中为您运行 Python 函数。
您可以将代码组织到应用程序中，即协同工作的功能集合。

```python
app = modal.App("example-blender-video")

```

我们需要定义每个函数运行的环境——它的容器镜像。
下面的块定义了一个容器镜像，从基本的 Debian Linux 镜像开始
添加 Blender 的系统级依赖项
然后安装`bpy`包，这是Blender的Python API。

```python
rendering_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("xorg", "libxkbcommon0")  # X11 (Unix GUI) dependencies
    .uv_pip_install("bpy==4.5.0")  # Blender as a Python package
)

```

## 渲染单帧

我们定义一个渲染单个帧的函数。稍后我们将在 Modal 上扩展此功能。

Modal 中的函数是与其硬件及其依赖项一起定义的。
该函数可以在有 GPU 加速的情况下运行，也可以在没有 GPU 加速的情况下运行，我们将在代码中使用全局标志在两者之间进行切换。

```python
WITH_GPU = (
    True  # try changing this to False to run rendering massively in parallel on CPUs!
)

```

我们用 `@app.function` 修饰该函数，将其定义为模态函数。
请注意，除了定义该功能的硬件要求之外，
我们还指定了函数运行的容器镜像（我们上面定义的容器镜像）。

对于这个例子来说，场景的细节并不是太重要，但我们将加载
我们之前创建的 .blend 文件。该场景包含一个旋转
模态标志由透明的冰状材料制成，带有生成的位移图。的
动画关键帧是在 Blender 中定义的。

```python
@app.function(
    gpu="L40S" if WITH_GPU else None,
    # default limits on Modal free tier
    max_containers=10 if WITH_GPU else 100,
    image=rendering_image,
)
def render(blend_file: bytes, frame_number: int = 0) -> bytes:
    """Renders the n-th frame of a Blender file as a PNG."""
    import bpy

    input_path = "/tmp/input.blend"
    output_path = f"/tmp/output-{frame_number}.png"

    # Blender requires input as a file.
    Path(input_path).write_bytes(blend_file)

    bpy.ops.wm.open_mainfile(filepath=input_path)
    bpy.context.scene.frame_set(frame_number)
    bpy.context.scene.render.filepath = output_path
    configure_rendering(bpy.context, with_gpu=WITH_GPU)
    bpy.ops.render.render(write_still=True)

    # Blender renders image outputs to a file as well.
    return Path(output_path).read_bytes()


```

### 加速渲染

我们可以将渲染过程配置为使用 NVIDIA CUDA 的 GPU 加速。
我们选择[Cycles渲染引擎](https://www.cycles-renderer.org/)，它兼容CUDA，
然后激活GPU。

```python
def configure_rendering(ctx, with_gpu: bool):
    # configure the rendering process
    ctx.scene.render.engine = "CYCLES"
    ctx.scene.render.resolution_x = 3000
    ctx.scene.render.resolution_y = 2000
    ctx.scene.render.resolution_percentage = 50
    ctx.scene.cycles.samples = 128

    cycles = ctx.preferences.addons["cycles"]

    # Use GPU acceleration if available.
    if with_gpu:
        cycles.preferences.compute_device_type = "CUDA"
        ctx.scene.cycles.device = "GPU"

        # reload the devices to update the configuration
        cycles.preferences.get_devices()
        for device in cycles.preferences.devices:
            device.use = True

    else:
        ctx.scene.cycles.device = "CPU"

    # report rendering devices -- a nice snippet for debugging and ensuring the accelerators are being used
    for dev in cycles.preferences.devices:
        print(f"ID:{dev['id']} Name:{dev['name']} Type:{dev['type']} Use:{dev['use']}")


```

## 将帧组合成视频

渲染 3D 图像很有趣，GPU 可以让它变得更快，但渲染 3D 视频更好！
我们向应用程序添加另一个功能，在不同的、更简单的容器映像上运行
和不同的硬件，将帧组合成视频。

```python
combination_image = modal.Image.debian_slim(python_version="3.11").apt_install("ffmpeg")

```
将帧组合成视频的函数采用一系列字节序列，每个渲染帧一个字节序列，
并将它们转换为单个字节序列，即 MP4 文件。

```python
@app.function(image=combination_image)
def combine(frames_bytes: list[bytes], fps: int = 60) -> bytes:
    import subprocess
    import tempfile

    with tempfile.TemporaryDirectory() as tmpdir:
        for i, frame_bytes in enumerate(frames_bytes):
            frame_path = Path(tmpdir) / f"frame_{i:05}.png"
            frame_path.write_bytes(frame_bytes)
        out_path = Path(tmpdir) / "output.mp4"
        subprocess.run(
            f"ffmpeg -framerate {fps} -pattern_type glob -i '{tmpdir}/*.png' -c:v libx264 -pix_fmt yuv420p {out_path}",
            shell=True,
        )
        return out_path.read_bytes()


```

## 通过命令行在云中并行渲染

定义了这两个函数后，我们只需要几行代码就可以在 Modal 上大规模运行渲染。

首先，我们需要一个将我们的函数协调到 `render` 框架和 `combine` 框架的函数。
我们用 `@app.local_entrypoint` 修饰该函数，以便我们可以用 `modal run blender_video.py` 运行它。

在该函数中，我们使用 `render.map` 将 `render` 函数映射到帧范围内。

我们给`local_entrypoint`两个参数来控制渲染——渲染的帧数和跳过的帧数。
这些演示了从本地客户端控制 Modal 上的函数的基本模式。

我们将每个帧中的字节收集到本地的`list`中，然后将其与`.remote`一起发送到`combine`。

视频的字节返回到我们的本地计算机，然后我们将它们写入文件。

整个渲染过程（四秒的 1080p 60 FPS 视频）在 10 个 L40S GPU 上运行大约需要三分钟，
每帧延迟约 6 秒，在 100 个 CPU 上运行约 5 分钟，每帧延迟约 1 分钟。

```python
@app.local_entrypoint()
def main(frame_count: int = 250, frame_skip: int = 1):
    output_directory = Path("/tmp") / "render"
    output_directory.mkdir(parents=True, exist_ok=True)

    input_path = Path(__file__).parent / "IceModal.blend"
    blend_bytes = input_path.read_bytes()
    args = [(blend_bytes, frame) for frame in range(1, frame_count + 1, frame_skip)]
    images = list(render.starmap(args))
    for i, image in enumerate(images):
        frame_path = output_directory / f"frame_{i + 1}.png"
        frame_path.write_bytes(image)
        print(f"Frame saved to {frame_path}")

    video_path = output_directory / "output.mp4"
    video_bytes = combine.remote(images)
    video_path.write_bytes(video_bytes)
    print(f"Video saved to {video_path}")

```