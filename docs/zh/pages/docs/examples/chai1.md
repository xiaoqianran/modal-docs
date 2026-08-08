<!-- modal-docs: machine-translated zh-CN from English source -->

# 用 Chai-1 折叠蛋白质

在生物学中，从字面上看，功能遵循形式：
蛋白质的物理形状决定了它们的行为。
直接测量这些形状很困难
第一原理物理模拟的成本极其昂贵。

因此根据内容预测蛋白质形状——
确定 DNA 编码的一维氨基酸链如何“折叠”成 3D 物体——
已成为机器学习和神经网络在生物学中的关键应用。

在这个例子中，我们演示了如何运行开源[Chai-1](https://github.com/chaidiscovery/chai-lab/)
Modal 灵活的无服务器基础设施上的蛋白质结构预测模型。
有关 Chai-1 模型的工作原理及其用途的详细信息，
参见作者的[bioRxiv技术报告](https://www.biorxiv.org/content/10.1101/2024.10.10.615955)。

这个简单的脚本旨在作为展示如何处理繁琐位的起点
例如安装依赖项、加载权重和格式化输出，以便您可以继续有趣的事情。
要体验 Modal 的全部功能，请尝试扩展推理并在数百或数千个结构上运行！

<center>
<a href="https://molstar.org/viewer" aria-label="Open the Mol* viewer"> <video controls autoplay loop muted> <source src="https://modal-cdn.com/example-chai1-folding.mp4" type="video/mp4"> </video> </a>
</center>

## 设置

```python
import hashlib
import json
from pathlib import Path
from typing import Optional
from uuid import uuid4

import modal

here = Path(__file__).parent  # the directory of this file

MINUTES = 60  # seconds

app = modal.App(name="example-chai1")

```

## 从命令行折叠蛋白质
运行 Chai-1 的逻辑封装在下面的函数中，
您可以通过运行从命令行触发

```shell
modal run chai1
```

这将设置在 Modal 云中运行 Chai-1 推理的环境，
运行它，然后远程和本地保存结果。结果返回在
[晶体信息文件](https://en.wikipedia.org/wiki/Crystallographic_Information_File)格式，
您可以使用在线 [Molstar Viewer](https://molstar.org/) 进行渲染。

要查看更多选项，请运行带有 `--help` 标志的命令。

要了解其工作原理，请继续阅读！

```python
@app.local_entrypoint()
def main(
    force_redownload: bool = False,
    fasta_file: Optional[str] = None,
    inference_config_file: Optional[str] = None,
    output_dir: Optional[str] = None,
    run_id: Optional[str] = None,
):
    print("🧬 checking inference dependencies")
    download_inference_dependencies.remote(force=force_redownload)

    if fasta_file is None:
        fasta_file = here / "data" / "chai1_default_input.fasta"
    print(f"🧬 running Chai inference on {fasta_file}")
    fasta_content = Path(fasta_file).read_text()

    if inference_config_file is None:
        inference_config_file = here / "data" / "chai1_default_inference.json"
    print(f"🧬 loading Chai inference config from {inference_config_file}")
    inference_config = json.loads(Path(inference_config_file).read_text())

    if run_id is None:
        run_id = hashlib.sha256(uuid4().bytes).hexdigest()[:8]  # short id
    print(f"🧬 running inference with {run_id=}")

    results = chai1_inference.remote(fasta_content, inference_config, run_id)

    if output_dir is None:
        output_dir = Path("/tmp/chai1")
        output_dir.mkdir(parents=True, exist_ok=True)

    print(f"🧬 saving results to disk locally in {output_dir}")
    for ii, (scores, cif) in enumerate(results):
        (Path(output_dir) / f"{run_id}-scores.model_idx_{ii}.npz").write_bytes(scores)
        (Path(output_dir) / f"{run_id}-preds.model_idx_{ii}.cif").write_text(cif)


```

## 在 Modal 上安装 Chai-1 Python 依赖项在 Modal 上运行的代码在由 [容器镜像](https://modal.com/docs/guide/images)构建的容器内运行
包括该代码的依赖项。

因为 Modal 图像默认包含 [GPU 驱动](https://modal.com/docs/guide/cuda)，
安装需要 GPU 的高级软件包（如 `chai_lab`）非常轻松。

在这里，我们使用 `uv` 包管理器用一行代码来完成此操作以提高速度。

```python
image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "chai_lab==0.5.0",
        "huggingface-hub==0.36.0",
    )
    .uv_pip_install(
        "torch==2.7.1",
        index_url="https://download.pytorch.org/whl/cu128",
    )
)

```

## 使用 Volumes 将 Chai-1 模型权重存储在 Modal 上

并非所有“依赖项”都属于容器映像。例如，Chai-1 取决于
几个模型的权重。

而不是在运行时动态加载它们（这会给每个推理增加几分钟的 GPU 时间），
或将它们安装到映像中（这需要在其他依赖项发生更改时重新下载它们），
我们将它们加载到[模态体积](https://modal.com/docs/guide/volumes)。
模态卷是一个文件系统，在模态（或其他地方！）上运行的所有代码都可以访问。
有关在 Modal 上存储模型权重的更多信息，请参阅[本指南](https://modal.com/docs/guide/model-weights)。

```python
chai_model_volume = (
    modal.Volume.from_name(  # create distributed filesystem for model weights
        "chai1-models",
        create_if_missing=True,
    )
)
models_dir = Path("/models/chai1")

```

我们如何在此处处理下载的详细信息（例如，同时运行以提高速度）
位于[附录](#addenda) 中。

```python
image = image.env(  # update the environment variables in the image to...
    {
        "CHAI_DOWNLOADS_DIR": str(models_dir),  # point the chai code to it
        "HF_XET_HIGH_PERFORMANCE": "1",  # speed up downloads
    }
)

```

## 将 Chai-1 输出存储在模态卷上

Chai-1 通过写入磁盘来产生输出——
模型的结构分数和结构本身以及丰富的元数据。

但 Modal 是一个“无服务器”平台，并且您的 Modal 函数写入的文件系统
不执着。任何文件都可以转换为字节并从模态函数发送回
\-- 我们的意思是任何！您可以通过这种方式发送千兆字节大小的文件。
所以我们在下面这样做。

但对于较大的工作，例如折叠 PDB 中的每个蛋白质、在本地客户端上存储字节
就像笔记本电脑不会削减它。

因此，我们再次依靠模态卷，每个模态卷可以存储数千个文件。
我们将一个 Volume 附加到运行 Chai-1 的模态函数和推理代码
将结果保存到分布式存储中，无需任何麻烦或源代码更改。

```python
chai_preds_volume = modal.Volume.from_name("chai1-preds", create_if_missing=True)
preds_dir = Path("/preds")

```

## 在模态上运行 Chai-1

现在我们准备定义一个运行 Chai-1 的模态函数。

我们通过将函数包装在装饰器`@app.function`中来将其放在 Modal 上。
我们为装饰器提供一些参数来描述我们的代码运行所需的基础设施：
我们创建的卷、我们定义的图像，当然还有快速的 GPU！

请注意，Chai-1 将文件路径作为输入——
具体来说，是 [FASTA 格式](https://en.wikipedia.org/wiki/FASTA_format) 的文件路径。
我们将文件内容作为字符串传递给函数并将它们保存到磁盘，以便推理代码可以获取它们。

因为 Modal 是无服务器的，所以我们不需要担心清理这些资源：
磁盘是短暂的，GPU 仅在您使用时才会花钱。

```python
@app.function(
    timeout=15 * MINUTES,
    gpu="H100",
    volumes={models_dir: chai_model_volume, preds_dir: chai_preds_volume},
    image=image,
)
def chai1_inference(
    fasta_content: str, inference_config: dict, run_id: str
) -> list[(bytes, str)]:
    from pathlib import Path

    import torch
    from chai_lab import chai1

    N_DIFFUSION_SAMPLES = 5  # hard-coded in chai-1

    fasta_file = Path("/tmp/inputs.fasta")
    fasta_file.write_text(fasta_content.strip())

    output_dir = Path("/preds") / run_id

    chai1.run_inference(
        fasta_file=fasta_file,
        output_dir=output_dir,
        device=torch.device("cuda"),
        **inference_config,
    )

    print(
        f"🧬 done, results written to /{output_dir.relative_to('/preds')} on remote volume"
    )

    results = []
    for ii in range(N_DIFFUSION_SAMPLES):
        scores = (output_dir / f"scores.model_idx_{ii}.npz").read_bytes()
        cif = (output_dir / f"pred.model_idx_{ii}.cif").read_text()

        results.append((scores, cif))

    return results


```

## 附录

上面，我们掩盖了如何获取模型权重——
`local_entrypoint`刚刚调用了一个名为`download_inference_dependencies`的函数。

这是该函数的实现。

几个亮点：

* 这个模态函数可以访问模型权重体积，就像推理函数一样，
但它无法访问模型预测卷。

* 此模态函数具有不同的图像（默认！）并且不使用 GPU。莫代尔帮助你
  将基础设施组件的关注点和成本分开。

* 我们在这里使用 `async` 关键字，以便我们可以运行每个模型文件的下载
  作为一项单独的任务，同时进行。我们不需要担心`async`的这种使用
  传播到我们代码的其余部分——Modal 在异步运行时只启动这个函数。

```python
@app.function(volumes={models_dir: chai_model_volume})
async def download_inference_dependencies(force=False):
    import asyncio

    import aiohttp

    base_url = "https://chaiassets.com/chai1-inference-depencencies/"  # sic
    inference_dependencies = [
        "conformers_v1.apkl",
        "models_v2/trunk.pt",
        "models_v2/token_embedder.pt",
        "models_v2/feature_embedding.pt",
        "models_v2/diffusion_module.pt",
        "models_v2/confidence_head.pt",
    ]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    }

    # launch downloads concurrently
    async with aiohttp.ClientSession(headers=headers) as session:
        tasks = []
        for dep in inference_dependencies:
            local_path = models_dir / dep
            if force or not local_path.exists():
                url = base_url + dep
                print(f"🧬 downloading {dep}")
                tasks.append(download_file(session, url, local_path))

        # run all of the downloads and await their completion
        await asyncio.gather(*tasks)

    chai_model_volume.commit()  # ensures models are visible on remote filesystem before exiting, otherwise takes a few seconds, racing with inference


async def download_file(session, url: str, local_path: Path):
    async with session.get(url) as response:
        response.raise_for_status()
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as f:
            while chunk := await response.content.read(8192):
                f.write(chunk)

```