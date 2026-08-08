<!-- modal-docs: machine-translated zh-CN from English source -->

# 模态笔记本

笔记本允许您在浏览器中的 Modal 云中编写和执行 Python 代码。它是一个托管的 Jupyter 笔记本，具有：

* 无服务器定价和空闲自动关闭
* 访问 Modal GPU 和计算
* 实时协作编辑
* Python Intellisense/LSP 支持和 AI 自动完成
* 支持丰富的交互式输出，例如图像、小部件和绘图

<center>
<video controls autoplay muted playsinline>
<source src="https://modal-cdn.com/Modal-Notebooks-Beta.mp4" type="video/mp4">
</video>
</center>

## 开始使用

在浏览器中打开 [modal.com/notebooks](/notebooks) 并创建一个新笔记本。您还可以从计算机上传 `.ipynb` 文件。

创建笔记本后，您就可以开始运行单元。尝试一个简单的语句，例如

```python
print("Hello, Modal!")
```

或者，导入库并创建绘图：

```python notest
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(-20, 20, 500)
plt.plot(np.cos(x / 3.7 + 0.3), x * np.sin(x))
```

默认笔记本映像预装了许多 Python 软件包，因此您可以立即开始使用。流行的包括 PyTorch、NumPy、Pandas、JAX、Transformers 和 Matplotlib。您可以在[此处](https://github.com/modal-labs/modal-client/blob/v1.1.3/modal/experimental/__init__.py#L234-L342)找到完整的图像定义。如果您需要另一个包，只需安装它：

```shell
%uv pip install [my-package]
```

所有输出类型都是开箱即用的，包括丰富的 HTML、图像、[Jupyter Widgets](https://ipywidgets.readthedocs.io/en/latest/) 和交互式绘图。

## 内核资源
就像模态函数一样，笔记本在无服务器容器中运行。这意味着您只需为您使用的 CPU 内核和内存付费。

如果您需要更多资源，可以在侧栏中更改内核设置。这使您可以设置笔记本电脑的 CPU 核心数、内存和 GPU 类型。您还可以设置空闲关闭超时时间，默认为 10 分钟。

使用 Modal 中可用的任何 GPU 类型，包括最多 8 个 Nvidia A100 或 H100。您可以在几秒钟内切换内核配置！

![笔记本侧边栏中的计算配置文件选项卡](https://modal-cdn.com/cdnbot/compute-profilev9rvmmvw_365a1197.webp)

请注意，CPU 和内存请求配置了分配的“最小”资源量，但您通常可以突破请求。例如，如果您将笔记本电脑设置为具有 0.5 个 CPU 核心，则您将连续为此付费，但您最多可以使用计算机上的任何可用核心（例如 32 个 CPU），并且仅根据您使用它们的时间付费。

### 笔记本电脑定价
模态笔记本的定价很简单，是根据内核运行时的计算使用情况来定价的。价格请参阅[定价页面](https://modal.com/pricing)。目前，CPU 和内存成本根据沙箱定价。它们出现在您的[使用情况仪表板](/settings/usage) 的“笔记本”下。

不活动的笔记本不会产生任何费用。您只需按笔记本有效运行的时间付费。

## 自定义镜像、卷、秘密和云存储

模态笔记本支持自定义图像、卷和机密，就像模态函数一样。您可以使用它们来安装其他软件包、安装持久存储或访问机密。

* 要使用自定义映像，您需要有一个使用该映像的[部署的模态函数](/docs/guide/managing-deployments)。然后，在侧边栏中搜索该功能。
* 要使用 Secret，只需使用我们的向导创建一个 [Modal Secret](/secrets) 并将其附加到笔记本，这样它就可以作为环境变量自动注入。
* 要使用卷，请创建一个[模态卷](/docs/guide/volumes) 并将其附加到笔记本。这使您可以安装可在多个笔记本或功能之间共享的高性能、持久存储。默认情况下，它们将显示为 `/mnt` 目录中的文件夹。

### 创建自定义图像

如果您还没有合适的已部署模态应用程序，则可以使用模态 CLI 设置环境以在一分钟内部署自定义映像。首先，运行 `pip install modal`，并在文件中定义图像，如下所示：

```python
import modal


# Image definition here:
image = (
    modal.Image.from_registry("python:3.13-slim")
    .pip_install("requests", "numpy")
    .apt_install("curl", "wget")
    .run_commands(
        "echo 'foo' > /root/hello.txt",
        # ... other commands
    )
)

app = modal.App("notebook-images")

@app.function(image=image)  # You need a Function object to reference the image.
def notebook_image():
    pass
```

然后，确保您有 Modal CLI (`pip install modal`) 并运行以下命令来构建和部署映像：

```bash
modal deploy notebook_images.py
```

有关 Modal 中自定义图像的更多信息，请参阅我们的[定义图像指南](/docs/guide/images)。

（高级）请注意，如果您使用 [`add_local_file()` 或 `add_local_dir()` 函数](/docs/guide/images#add-local-files-with-add_local_dir-and-add_local_file)，则需要传递 `copy=True` 才能使它们在模态笔记本中工作。这是因为他们跳过创建自定义映像，而是在启动时将文件安装到函数中，这在笔记本中不起作用。

### 创建一个秘密
可以从 [modal.com/secrets](/secrets) 的仪表板创建机密。我们有常见凭证类型的模板，它们会保存为加密对象，直到容器启动。

附加的机密可作为笔记本中的环境变量使用。

### 创建卷

[卷](/docs/guide/volumes) 可以通过文件系统选项卡上的文件面板创建。此面板还可用于附加应用程序或功能中的现有卷，包括通过 Modal CLI 创建的卷。

所有卷都附加在笔记本中的 `/mnt` 文件夹中，并且保存在那里的文件将在内核启动和 Modal 上的其他位置上保留。

### 安装云存储桶

Modal Notebooks 现在支持将云存储桶（最初是 S3 桶）直接安装到笔记本文件系统。这使您可以在笔记本上轻松访问存储在云存储中的大型数据集。

要安装 S3 存储桶：

1. 创建包含您的 AWS 凭证（AWS 访问密钥 ID 和秘密访问密钥）的 [Modal Secret](/secrets)
2. 在笔记本侧边栏的“文件”面板中，使用“云存储桶”部分附加您的存储桶
3. 指定：
   * S3存储桶名称
   * 挂载路径（例如，`/mnt/s3/my-data`）
* 存储在该环境中的 AWS 凭证密钥
   * 可选：仅挂载对象子集的键前缀（例如，`datasets/`）
   * 可选：将挂载设置为只读

连接后，您的 S3 存储桶将安装在指定路径，并且可以像笔记本中的任何其他目录一样进行访问。

有关通过 Modal 使用云存储桶挂载的更多信息，请参阅 [CloudBucket 挂载指南](/docs/guide/cloud-bucket-mounts)。

## 访问和共享

需要同事或整个互联网来查看您的工作吗？只需单击笔记本编辑器右上角的“**共享**”即可。

您和团队成员可以在工作区中编辑笔记本。要使笔记本仅供协作者查看，笔记本的创建者可以更改“共享”菜单中的访问设置。工作区管理员也可以更改此设置。

您还可以通过公共、不公开的链接打开共享。如果您切换此选项，它将允许*任何知道链接的人*打开笔记本，即使他们没有登录。根据您的偏好选择**可以查看**（默认）或**可以查看并运行**。查看者不需要模态帐户，因此这非常适合与工作区之外的利益相关者进行协作。
无论笔记本如何共享，任何有访问权限的人都可以分叉并运行自己的版本。

## 交互式文件查看器

笔记本左侧的面板显示了**容器文件系统的实时视图**：

|特色 |详情 || ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **浏览和预览** |单击文件夹可检查您的代码已创建或下载的任何文件。                                                                                        |
| **上传和下载** |从桌面拖放文件，或单击 **⬆** / **⬇** 图标来添加新的数据集、笔记本或模型，或将结果保存回您的计算机。              |
| **一键刷新** |您的代码所做的更改（例如，写入 CSV）会立即显示；如果您想强制更新，请点击刷新图标。                                              |
| **上下文感知路径** |查看器始终*准确*地反映您的代码所看到的内容（例如 `/root`、`/mnt/…`），因此您可以仔细检查您刚刚编写的文件是否确实到达了您期望的位置。 |

**重要提示：**底层容器是**短暂的**。当内核关闭时（在空闲超时后或当您点击 **停止内核** 时），存储在附加的 [Volume](/docs/guide/volumes) 之外的任何内容都会消失。为您想要跨会话保留的数据安装一个卷。

查看器本身仅在内核运行时才处于活动状态 - 如果笔记本停止，您将看到“空”状态，直到再次启动它。

## 编辑器功能

Modal Notebooks 捆绑了与现代 IDE 相同的生产力工具。

使用 Pyright，您可以获得每个已安装库的自动完成、签名帮助和悬停文档。
我们还使用 Anthropic 的 **Claude Sonnet 4.6** 模型实现了人工智能驱动的代码补全。这使您能够轻松处理从小片段到多行函数的所有内容。只需按 `Tab` 接受建议或按 `Esc` 驳回建议。

熟悉的 Jupyter 快捷键（`A`、`B`、`X`、`Y`、`M` 等）都可以在笔记本中使用，因此您可以快速添加新单元格、删除现有单元格或更改单元格类型。

最后，我们还提供实时协作编辑功能，因此您可以在同一个笔记本中与您的团队一起工作。您可以实时查看其他用户的光标和编辑，并且可以看到其他人何时与您一起运行单元格。这使得将程序配对或审查代码变得很容易。

## 小部件

Modal Notebooks 支持 [Jupyter Widgets](https://ipywidgets.readthedocs.io/en/latest/)，可用于创建浏览器中的交互式组件。目前，笔记本支持基本 `ipywidgets` 包中的所有小部件，但以下部件除外：

* 媒体小部件（`Audio`、`Video`），请尝试使用 `IPython.display` 输出。
* `Play`
* 控制器（`ControllerAxis`、`ControllerButton`、`Controller`）

模态笔记本不支持自定义小部件包。

## 细胞魔法
Modal Notebooks 内置了对 `%modal` 单元魔法的支持。这使您可以直接从笔记本运行任何[部署的模态函数或 Cls](/docs/guide/trigger-deployed-functions) 中的代码。

例如，如果您之前为以下应用程序运行过 `modal deploy`：

```python notest
import modal

app = modal.App("my-app")


@app.function()
def my_function(s: str):
    return len(s)
```

然后您可以从笔记本访问此功能：

```python notest
%modal from my-app import my_function

my_function.remote("hello, world!")  # returns 13
```

运行 `%modal` 查看所有选项。这也适用于 Cls，您可以从不同的环境导入或使用 `as` 关键字为其别名。

## 路线图

<Callout variant="beta" />

考虑到一些更大的功能：

* **模态云集成**
  * 使用 [Tunnels](/docs/guide/tunnels) 公开端口
  * 内存快照可从过去的笔记本会话中恢复
  * 从`modal` CLI 创建笔记本
  * 自定义镜像注册表
* **笔记本编辑器**
  * 交互式大纲，按标题折叠部分
  * 反应性单元执行
  * 编辑历史记录
  * 集成调试器（pdb 和`%debug`）
* **文档和共享**
  * 恢复最近删除的笔记本
  * 用于对笔记本进行分组的文件夹和标签
  * 与 Git 存储库同步

如果您有任何反馈，请通过 [Slack](/slack) 告诉我们。