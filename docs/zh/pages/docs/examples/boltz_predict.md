<!-- modal-docs: machine-translated zh-CN from English source -->

# 用 Boltz-2 折叠蛋白质

<figure style="width: 70%; margin: 0 auto; display: block;">
<img src="https://modal-cdn.com/cdnbot/boltz_examplecd5u3m0j_9fa47e43.webp" alt="Boltz-2" />
<figcaption style="text-align: center"><em>Boltz-2蛋白质结构预测示例
<a style="text-decoration: underline;" href="https://github.com/jwohlwend/boltz/blob/main/examples/affinity.yaml" target="_blank">蛋白质配体复合物</a></em></figcaption>
</figure>

Boltz-2 是一个开源分子结构预测模型。
与之前的 Boltz-1、[Chai-1](https://modal.com/docs/examples/chai1) 和 AlphaFold-3 等模型相比，它不仅可以预测蛋白质结构，还可以预测蛋白质和[配体](https://en.wikipedia.org/wiki/Ligand_\(biochemistry\)之间的[结合亲和力](https://en.wikipedia.org/wiki/Ligand_\(biochemistry\)#受体/配体_结合亲和力)。
它是由【MIT Jameel Clinic】（https://jclinic.mit.edu/boltz-2/）创建的。
详情请参阅[他们的技术报告](https://jeremywohlwend.com/assets/boltz2.pdf)。在这里，我们演示如何在 Modal 上运行 Boltz-2。

## 设置

```python
from pathlib import Path
from typing import Optional

import modal

here = Path(__file__).parent  # the directory of this file

MINUTES = 60  # seconds

app = modal.App(name="example-boltz-predict")

```

## 从命令行折叠蛋白质

运行 Boltz-2 的逻辑封装在下面的函数中，
您可以通过运行从命令行触发

```shell
modal run boltz_predict.py
```

这将设置在 Modal 云中运行 Boltz-2 推理的环境，
运行它，然后将结果保存在本地作为 [tarball](https://computing.help.inf.ed.ac.uk/FAQ/whats-tarball-or-how-do-i-unpack-or-create-tgz-or-targz-file)。
该 tarball 存档除其他外还包含预测的结构
[晶体信息文件](https://en.wikipedia.org/wiki/Crystallographic_Information_File),
您可以使用在线 [Molstar Viewer](https://molstar.org/viewer) 进行渲染。

您可以传递[`boltz predict`命令行工具](https://github.com/jwohlwend/boltz/blob/main/docs/prediction.md)的任何选项
作为一个字符串，就像

```shell
modal run boltz_predict.py --args "--sampling_steps 10"
```

要查看更多选项，请运行带有 `--help` 标志的命令。

要了解其工作原理，请继续阅读！

```python
@app.local_entrypoint()
def main(
    force_download: bool = False, input_yaml_path: Optional[str] = None, args: str = ""
):
    print("🧬 loading model remotely")
    download_model.remote(force_download)

    if input_yaml_path is None:
        input_yaml_path = here / "data" / "boltz_affinity.yaml"
    else:
        input_yaml_path = Path(input_yaml_path)
    input_yaml = input_yaml_path.read_text()

    print(f"🧬 running boltz with input from {input_yaml_path}")
    output = boltz_inference.remote(input_yaml)

    output_path = Path("/tmp") / "boltz" / "boltz_result.tar.gz"
    output_path.parent.mkdir(exist_ok=True, parents=True)
    print(f"🧬 writing output to {output_path}")
    output_path.write_bytes(output)


```

## 在 Modal 上安装 Boltz-2 Python 依赖项

在 Modal 上运行的代码在由 [容器镜像](https://modal.com/docs/guide/images)构建的容器内运行
包括该代码的依赖项。

因为 Modal 图像默认包含 [GPU 驱动](https://modal.com/docs/guide/cuda)，
安装需要 GPU 的高级软件包（如 `boltz`）非常轻松。

在这里，我们用几行代码来完成此操作，并使用 `uv` 包管理器来提高速度。

```python
image = modal.Image.debian_slim(python_version="3.12").uv_pip_install("boltz==2.1.1")

```

## 使用 Volumes 将 Boltz-2 模型权重存储在 Modal 上并非所有“依赖项”都属于容器映像。例如，Boltz-2 取决于
模型的权重和[化学成分字典](https://www.wwpdb.org/data/ccd) (CCD) 文件。

而不是在运行时动态加载它们（这会为每次推理增加几分钟的 GPU 时间），
或将它们安装到映像中（这需要在其他依赖项发生更改时重新下载它们），
我们将它们加载到[模态体积](https://modal.com/docs/guide/volumes)。
模态卷是一个文件系统，在模态（或其他地方！）上运行的所有代码都可以访问。
有关在 Modal 上存储模型权重的更多信息，请参阅[本指南](https://modal.com/docs/guide/model-weights)。
有关在这种情况下如何下载权重的详细信息，请参阅[附录](#addenda)。

```python
boltz_model_volume = modal.Volume.from_name("boltz-models", create_if_missing=True)
models_dir = Path("/models/boltz")

```

## 在 Modal 上运行 Boltz-2

为了在 Modal 上运行推理，我们将函数包装在装饰器中，`@app.function`。
我们为装饰器提供一些参数来描述我们的代码运行所需的基础设施：
我们创建的体积、我们定义的图像，当然还有快速的 GPU！

请注意，我们使用的 `boltz` 命令行工具采用的路径为
[特殊格式的YAML文件](https://github.com/jwohlwend/boltz/blob/main/docs/prediction.md#yaml-format)
包括分子的定义来预测其结构和可选的路径
[多序列比对](https://en.wikipedia.org/wiki/Multiple_sequence_alignment) (MSA) 文件
对于任何蛋白质分子。我们传递 [--use\_msa\_server](https://github.com/jwohlwend/boltz/blob/main/docs/prediction.md) 标志以使用 mmseqs2 服务器自动生成 MSA。

```python
@app.function(
    image=image,
    volumes={models_dir: boltz_model_volume},
    timeout=10 * MINUTES,
    gpu="H100",
)
def boltz_inference(boltz_input_yaml: str, args="") -> bytes:
    import shlex
    import subprocess

    input_path = Path("input.yaml")
    input_path.write_text(boltz_input_yaml)

    args = shlex.split(args)

    print(f"🧬 predicting structure using boltz model from {models_dir}")
    subprocess.run(
        ["boltz", "predict", input_path, "--use_msa_server", "--cache", str(models_dir)]
        + args,
        check=True,
    )

    print("🧬 packaging up outputs")
    output_bytes = package_outputs(f"boltz_results_{input_path.with_suffix('').name}")

    return output_bytes


```

## 附录

上面，我们掩盖了如何获取模型权重——
`local_entrypoint`刚刚调用了一个名为`download_model`的函数。

这是该函数的实现。有关详细信息，请参阅我们的
[在 Modal 上存储模型权重的指南](https://modal.com/docs/guide/model-weights)。

```python
download_image = (
    modal.Image.debian_slim()
    .uv_pip_install("huggingface-hub==0.36.0")
    .env({"HF_XET_HIGH_PERFORMANCE": "1"})
)


@app.function(
    volumes={models_dir: boltz_model_volume},
    timeout=20 * MINUTES,
    image=download_image,
)
def download_model(
    force_download: bool = False,
    revision: str = "6fdef46d763fee7fbb83ca5501ccceff43b85607",
):
    from huggingface_hub import snapshot_download

    snapshot_download(
        repo_id="boltz-community/boltz-2",
        revision=revision,
        local_dir=models_dir,
        force_download=force_download,
    )
    boltz_model_volume.commit()

    print(f"🧬 model downloaded to {models_dir}")


```

我们将输出打包成一个 tarball，其中包含预测的结构
[晶体信息文件](https://en.wikipedia.org/wiki/Crystallographic_Information_File)
以及 JSON 文件形式的绑定亲和力。
您可以使用在线[Molstar Viewer](https://molstar.org/viewer)渲染结构。

```python
def package_outputs(output_dir: str) -> bytes:
    import io
    import tarfile

    tar_buffer = io.BytesIO()

    with tarfile.open(fileobj=tar_buffer, mode="w:gz") as tar:
        tar.add(output_dir, arcname=output_dir)

    return tar_buffer.getvalue()

```