<!-- modal-docs: machine-translated zh-CN from English source -->

# 图片

本指南将引导您了解如何定义模态图像，即模态代码运行的环境。

在 Modal 中定义图像的典型流程是
[方法链](https://jugad2.blogspot.com/2016/02/examples-of-method-chaining-in-python.html)
从基本图像开始，如下所示：

```python
image = (
    modal.Image.debian_slim(python_version="3.13")
    .apt_install("git")
    .uv_pip_install("torch<3")
    .env({"HALT_AND_CATCH_FIRE": "0"})
    .run_commands("git clone https://github.com/modal-labs/agi && echo 'ready to go!'")
)
```

如果您有自己的容器映像定义，例如 Dockerfile 或注册表链接，您也可以使用它们！
请参阅[本指南](/docs/guide/existing-images)。

本页是使用模态图像的高级指南。
有关 `modal.Image` 对象的参考文档，请参阅
[本页](/docs/sdk/py/latest/Image)。

## 什么是图像？

Modal 上的代码在*容器*中运行。容器就像轻量级的
虚拟机——容器引擎的使用
[操作系统技巧](https://earthly.dev/blog/chroot/)隔离程序
彼此分离（“包含”它们），使它们像它们一样工作
使用自己的文件系统在自己的硬件上运行。这使得执行
环境更具可重复性，例如通过防止意外
同一台机器上的环境交叉污染。为了增加安全性，
Modal 使用沙盒运行容器
[gVisor 容器运行时](https://cloud.google.com/blog/products/identity-security/open-sourcing-gvisor-a-sandboxed-container-runtime)。

容器从其文件系统状态的存储“快照”启动
称为*图像*。为容器生成镜像称为“构建”
图像。

默认情况下，模态函数和沙箱运行在
[Debian Linux](https://en.wikipedia.org/wiki/Debian) 具有基本功能的容器
Python 安装与本地 Python 相同的次要版本 `v3.x`
口译员。

为了使您的应用程序和功能有用，您可能需要一些第三方系统包
或 Python 库。 Modal 提供了许多选项来自定义容器镜像：
不同级别的抽象和粒度，从高级的便利性
通过核心容器镜像构建的包装器使用像`pip_install`这样的方法
`RUN` 和 `ENV` 等功能。我们将在本指南中介绍每一个内容，
以及使用每个工具时有效构建图像的提示和技巧。

## 添加Python包

最简单最常见的图片修改就是添加第三方
Python 包，如 [`pandas`](https://pandas.pydata.org/)。

您可以通过传递所有您想要的包来将 Python 包添加到环境中。
需要 [`Image.uv_pip_install`](/docs/sdk/py/latest/Image#uv_pip_install) 方法，
它安装带有 [`uv`](https://docs.astral.sh/uv/) 的软件包：

```python
import modal

datascience_image = (
    modal.Image.debian_slim()
    .uv_pip_install("pandas==2.2.0", "numpy")
)


@app.function(image=datascience_image)
def my_function():
    import pandas as pd
    import numpy as np

    df = pd.DataFrame()
    ...
```

您可以包括
[Python依赖版本说明符](https://peps.python.org/pep-0508/),
就像参数中的`"torch<3"`。但我们建议固定依赖项
紧密，如`"torch==2.8.0"`，以提高再现性和稳健性
您的构建。

如果您遇到任何问题
[`Image.uv_pip_install`](/docs/sdk/py/latest/Image#uv_pip_install)，然后
你可以回退到 [`Image.pip_install`](/docs/sdk/py/latest/Image#pip_install)
使用标准[`pip`](https://pip.pypa.io/en/stable/user_guide/)：

```python
datascience_image = (
    modal.Image.debian_slim(python_version="3.13")
    .pip_install("pandas==2.2.0", "numpy")
)
```

请注意，因为您可以为每个定义不同的环境
如果您选择功能，则无需担心虚拟
环境管理。容器可以更好地分离关注点！

如果您想远程运行特定版本的 Python 而不仅仅是
与您在本地运行的相匹配，提供 `python_version` 作为
构建基本图像时的字符串，就像我们上面所做的那样。

## 添加带有`add_local_dir`和`add_local_file`的本地文件

有时您的容器需要互联网上无法提供的依赖项，
例如笔记本电脑上的配置文件或代码。

要从本地系统转发文件，请使用
`image.add_local_dir` 和 `image.add_local_file` 图像方法。

```python
image = modal.Image.debian_slim().add_local_dir("/user/erikbern/.aws", remote_path="/root/.aws")
```

默认情况下，这些文件会在容器启动时添加到容器中，而不是引入
一个新的图像层。这意味着更改后的重新部署确实很快，但是
也意味着您之后无法运行其他构建步骤。您可以指定一个 `copy=True` 参数
到 `add_local_` 方法来强制将文件包含在构建的图像中。

### 使用`add_local_python_source`添加本地Python代码

您可以添加可本地导入到容器的 Python 代码
通过提供模块名称
[`Image.add_local_python_source`](/docs/sdk/py/latest/Image#add_local_python_source)。

```python
image_with_module = modal.Image.debian_slim().add_local_python_source("local_module")

@app.function(image=image_with_module)
def f():
    import local_module

    local_module.do_stuff()
```

与`add_local_dir`的区别在于`add_local_python_source`以模块名称作为参数
而不是文件系统路径，并通过 Python 的导入查找本地包或模块的位置
机制。然后将这些文件添加到目录中，使它们可以导入到以下容器中：
与本地的方式相同。

这适用于属于您的项目并由您的代码导入的纯 Python 辅助模块。
第三方软件包应通过安装
[`Image.uv_pip_install`](/docs/sdk/py/latest/Image#uv_pip_install) 或类似的。

### 如果我本地和远程有不同的 Python 包怎么办？

您可能想在 Modal 代码中使用您没有的包
您的本地计算机。在上面的例子中，我们构建了一个容器，使用
`pandas`。但是如果我们本地没有`pandas`，那么在构建的计算机上
模态应用程序，我们不能将 `import pandas` 放在脚本的顶部，因为它会
导致`ImportError`。

最简单的解决方案是将 `import pandas` 放入函数体中
相反，正如您在上面所看到的。这意味着`pandas`仅在以下情况下导入：
在安装了 `pandas` 的远程 Modal 容器内运行。

请注意从具有不同功能的模态函数返回的内容安装的软件包比您本地安装的软件包好！模态函数返回 Python
对象，例如 `pandas.DataFrame`s，并且如果您的本地计算机没有
安装了`pandas`，它将无法处理`pandas`对象（错误
您看到的消息会提到
[序列化](https://hazelcast.com/glossary/serialization/)/[反序列化](https://hazelcast.com/glossary/deserialization/))。

如果你有很多 Functions 和很多 Python 包，你可能想要
将导入保留在全局范围内，以便每个函数都可以使用相同的
进口。在这种情况下，您可以使用
[`Image.imports`](/docs/sdk/py/latest/Image#imports) 上下文管理器：

```python
pandas_image = modal.Image.debian_slim().pip_install("pandas", "numpy")


with pandas_image.imports():
    import pandas as pd
    import numpy as np


@app.function(image=pandas_image)
def my_function():
    df = pd.DataFrame()
    ...
```

因为这些导入发生在新容器处理其第一个输入之前，
您可以将此上下文管理器与[内存快照](/docs/guide/memory-snapshots)结合起来
提高[冷启动性能](/docs/guide/cold-start#share-initialization-work-across-cold-starts-with-memory-snapshots)
对于经常扩展的功能。

## 使用`.apt_install`安装系统包

您可以使用[`apt`包管理器](https://www.debian.org/doc/manuals/apt-guide/index.en.html)安装Linux包
使用[`Image.apt_install`](/docs/sdk/py/latest/Image#apt_install)：

```python
image = modal.Image.debian_slim().apt_install("git", "curl")
```

## 使用`.env`设置环境变量

您可以更改代码看到的环境变量
（例如，[`os.environ`](https://docs.python.org/3/library/os.html#os.environ)）通过将字典传递给 [`Image.env`](/docs/sdk/py/latest/Image#env)：

```python
image = modal.Image.debian_slim().env({"PORT": "6443"})
```

环境变量名称和值必须是字符串。

## 使用 `.run_commands` 运行 shell 命令

您可以提供构建时应执行的 shell 命令
图像到[`Image.run_commands`](/docs/sdk/py/latest/Image#run_commands)：

```python
image_with_repo = (
    modal.Image.debian_slim().apt_install("git").run_commands(
        "git clone https://github.com/modal-labs/gpu-glossary"
    )
)
```

## 在构建期间使用 `.run_function` 运行 Python 函数

您可以使用以下命令将 Python 代码作为构建步骤运行
[`Image.run_function`](/docs/sdk/py/latest/Image#run_function) 方法。

例如，您可以使用它将模型参数从 Hugging Face 下载到
您的图片：

```python
import os

def download_models() -> None:
    import diffusers

    model_name = "segmind/small-sd"
    pipe = diffusers.StableDiffusionPipeline.from_pretrained(
        model_name, use_auth_token=os.environ["HF_TOKEN"]
    )

hf_cache = modal.Volume.from_name("hf-cache")

image = (
    modal.Image.debian_slim()
        .pip_install("diffusers[torch]", "transformers", "ftfy", "accelerate")
        .run_function(
            download_models,
            secrets=[modal.Secret.from_name("huggingface-secret")],
            volumes={"/root/.cache/huggingface": hf_cache},
        )
)
```

有关在 Modal 上存储模型权重的详细信息，请参阅
[本指南](/docs/guide/model-weights)。

本质上，这相当于运行一个模态函数并对
生成的文件系统作为新映像。 [`@app.function`](/docs/sdk/py/latest/App#function) 接受的任何 kwargs
（[`Volume`s](/docs/guide/volumes)、[`Secret`s](/docs/guide/secrets)，规范
可以在此处提供诸如 [GPU](/docs/guide/gpu)) 之类的资源。

每当您更改图像的其他功能时，例如基本图像或
Python 包的版本，图像将在下一个版本中自动重建使用时间。当更改内容时，这有点复杂
功能。请参阅
[参考文档](/docs/sdk/py/latest/Image#run_function) 了解详细信息。

## 在设置过程中连接 GPU

如果图像设置中的某个步骤应在实例上运行
GPU（例如，以便包可以查询 GPU 以设置编译标志），传递
定义该步骤时所需的 GPU 类型：

```python
image = (
    modal.Image.debian_slim()
    .pip_install("bitsandbytes", gpu="H100")
)
```

## 使用`mamba`代替`pip`和`micromamba_install`

`pip` 安装 Python 包，但某些 Python 工作负载需要
还协调了系统软件包的安装。 `mamba` 包管理器
可以两者都安装。 Modal 提供了一个预构建的
[微曼巴](https://mamba.readthedocs.io/en/latest/user_guide/micromamba.html)
基础镜像可以让您轻松使用 `micromamba`：

```python
app = modal.App("bayes-pgm")

numpyro_pymc_image = (
    modal.Image.micromamba()
    .micromamba_install("pymc==5.10.4", "numpyro==0.13.2", channels=["conda-forge"])
)


@app.function(image=numpyro_pymc_image)
def sample():
    import pymc as pm
    import numpyro as np

    print(f"Running on PyMC v{pm.__version__} with JAX/numpyro v{np.__version__} backend")
    ...
```

## 图像缓存和重建

Modal 使用 Image 的定义来确定是否需要
重建。如果自上次运行以来定义没有更改或
部署您的应用程序时，将从缓存中提取以前的版本。

图像按层缓存（即，每个 `Image` 方法调用），并且打破
单层上的缓存将导致所有后续的级联重建
层。您可以通过定义经常更改的内容来缩短迭代周期
最后一层，以便可以使用所有其他层的缓存版本。

在某些情况下，您可能想要强制重建镜像，即使
定义没有改变。您可以通过添加 `force_build=True` 来做到这一点
任何图像构建方法的参数。

```python
image = (
    modal.Image.debian_slim()
    .apt_install("git")
    .pip_install("slack-sdk", force_build=True)
    .run_commands("echo hi")
)
```

与图层定义更改的其他情况一样，`pip_install` 和
`run_commands` 层将重建，但 `apt_install` 不会。记得
重建镜像后删除`force_build=True`，否则它会
每次运行代码时都会重建。

或者，您可以设置 `MODAL_FORCE_BUILD` 环境变量（例如
`MODAL_FORCE_BUILD=1 modal run ...`) 重建附加到您的应用程序的所有图像。
但请注意，当您重建基础层时，*所有*的缓存都将失效
依赖于它的映像，它们将在您下次运行或部署时重建
任何使用该基础的应用程序。如果您正在调试图像问题，更好的方法是
选项可能使用`MODAL_IGNORE_CACHE=1`。这将从中重建图像
top 不会破坏图像缓存或影响后续构建。

## 图像生成器更新

因为基础镜像的改变会导致级联重建，所以 Modal 是
对于更新我们提供的基本定义持保守态度。但很多
事物被融入这些定义中，例如图像的特定版本
操作系统、包含的 Python 和 Modal 客户端依赖项。

我们提供了一个单独的机制来保持基础镜像最新，而无需
导致不可预测的重建：“Image Builder Version”。这是一个工作区
将用于工作区中构建的每个图像的级别配置。
我们每隔几个月发布一个新的 Image Builder 版本，但允许您更新
方便时您的工作区配置。更新后，您的下一个
部署将需要更长的时间，因为您的映像将重建。您还可以
遇到问题，特别是如果您的图像定义未固定版本
它安装的第三方库（因为您的新映像将获得
这些库的最新版本，其中可能包含重大更改）。

您可以通过转到您的工作区设置图像生成器版本
[工作区设置](/settings/image-builder-version)。此页面还记录了
每个版本的重要更新。