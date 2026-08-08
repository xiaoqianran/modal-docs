<!-- modal-docs: machine-translated zh-CN from English source -->

# 在 Modal 上存储模型权重

有效管理大型模型的权重对于优化模型至关重要
许多机器学习和人工智能应用程序的构建时间和启动延迟。

我们推荐的处理模型权重的方法是将它们存储在模态 [Volume](/docs/guide/volumes) 中，
它充当分布式文件系统，所有模态函数都可以访问的“共享磁盘”。

## 将权重存储在模态体积中

要将模型权重存储在卷中，您需要
使体积可用于保存模型权重的模态函数
或者从客户端将模型权重上传到 Volume 中。

### 将模型权重从模态函数保存到模态体积中

如果您已经在 Modal 上生成权重，则只需
将 Volume 附加到您的模态函数，使其可用于读取和写入：

```python
from pathlib import Path

volume = modal.Volume.from_name("model-weights-vol", create_if_missing=True)
MODEL_DIR = Path("/models")

@app.function(gpu="any", volumes={MODEL_DIR: volume})  # attach the Volume
def train_model(data, config):
    import run_training

    model = run_training(config, data)
    model.save(config, MODEL_DIR)
```

通过将卷包含在映射的字典中来附加卷
远程计算机上到 `modal.Volume` 对象的路径。
它们看起来就像普通的文件系统，因此可以将模型权重保存到其中
无需添加任何特殊代码。

如果模型权重是在 Modal 之外生成并可用
通过互联网，例如由开放权重模型提供商
或者您自己在专用集群上的训练工作，
您还可以从模态函数将它们下载到卷中：

```python continuation
@app.function(volumes={MODEL_DIR: volume})
def download_model(model_id):
    import model_hub

    model_hub.download(model_id, local_dir=MODEL_DIR / model_id)
```

添加 [Modal Secrets](/docs/guide/secrets) 以访问需要身份验证的权重。

请参阅[下面](#storing-weights-from-the-hugging-face-hub-on-modal)
有关从流行的 Hugging Face Hub 下载的更多信息。

### 将模型权重上传到模态体积中

不是从模态函数内部将权重拉入模态体积，
您可能希望将权重从客户端推入 Modal，
例如您的笔记本电脑或专用培训集群。

为此，您可以使用 `batch_upload` 方法
[`modal.Volume`](/docs/sdk/py/latest/Volume)s
通过 Modal Python 客户端库：

```python continuation
volume = modal.Volume.from_name("model-weights-vol", create_if_missing=True)

@app.local_entrypoint()
def main(local_path: str, remote_path: str):
    with volume.batch_upload() as upload:
        upload.put_directory(local_path, remote_path)
```

或者，您可以使用上传模型权重
[`modal volume`](/docs/cli/latest/volume) CLI 命令：

```bash
modal volume put model-weights-vol path/to/model path/on/volume
```

### 将云存储桶挂载为模态卷

如果您的模型权重已经在云存储中，
例如在 S3 存储桶中，您可以连接它们
到具有 `CloudBucketMount` 的模态函数。

有关详细信息，请参阅[指南](/docs/guide/cloud-bucket-mounts)。

## 从模态体积中读取模型权重
您可以像平常读取重量一样从卷中读取重量
从磁盘，只要将卷附加到您的函数即可。

```python continuation
@app.function(gpu="any", volumes={MODEL_DIR: volume})
def inference(prompt, model_id):
    import load_model

    model = load_model(MODEL_DIR / model_id)
    model.run(prompt)
```

## 在模态图像中存储权重

还可以将权重存储在函数的模态 [图像](/docs/guide/images) 中，
私有文件系统状态是函数在启动时看到的。
权重可以通过 shell 命令使用 [`Image.run_commands`](/docs/guide/images) 下载
或使用带有 [`Image.run_function`](/docs/guide/images) 的 Python 函数下载。

我们建议将模型权重存储在模态 [Volume](/docs/guide/volumes) 中，
如[上文](#storing-weights-in-a-modal-volume)所述。性能相似
对于这两种方法。卷更加灵活。
当图像的定义发生变化时，从更改的图层开始重建图像，
这提高了某些构建的可重复性，但会导致不必要的额外下载
在大多数情况下。

## 使用 `@modal.enter` 优化模型权重读取

在上面的代码示例中，权重每次都会从磁盘加载到内存中
`inference` 函数运行。如果推理很多的话，这还不错
比模型加载慢（例如，它在非常大的数据集上运行）
或者模型加载逻辑是否足够智能以跳过重新加载。

为了保证特定模型的权重只加载一次，您可以使用`@modal.enter`
[容器生命周期挂钩](/docs/guide/lifecycle-functions)
仅在新容器启动时加载重量。

```python continuation
MODEL_ID = "some-model-id"

@app.cls(gpu="any", volumes={MODEL_DIR: volume})
class Model:
    @modal.enter()
    def setup(self, model_id=MODEL_ID):
        import load_model

        self.model = load_model(MODEL_DIR, model_id)

    @modal.method()
    def inference(self, prompt):
        return self.model.run(prompt)
```

请注意，用 `@modal.enter` 修饰的方法不能传递动态参数。

如果您需要在每个容器启动时加载单个但可能不同的模型，您可以
[参数化](/docs/guide/parametrized-functions) 你的模态类。
下面，我们使用 `modal.parameter` 语法。

```python continuation
@app.cls(gpu="any", volumes={MODEL_DIR: volume})
class ParametrizedModel:
    model_id: str = modal.parameter()

    @modal.enter()
    def setup(self):
        import load_model

        self.model = load_model(MODEL_DIR, self.model_id)

    @modal.method()
    def inference(self, prompt):
        return self.model.run(prompt)
```

## 在 Modal 上存储来自 Hugging Face Hub 的权重

【抱脸中心】(https://huggingface.co/models)拥有超过1,000,000个模型
并提供可供下载的权重。

下面的代码片段显示了下载模型的一些额外技巧
来自 Modal 上的 Hugging Face Hub。

```python
from typing import Optional
from pathlib import Path

import modal

# create a Volume, or retrieve it if it exists
volume = modal.Volume.from_name("model-weights-vol", create_if_missing=True)
MODEL_DIR = Path("/models")

# define dependencies for downloading model
download_image = (
    modal.Image.debian_slim()
    .pip_install("huggingface_hub")
    .env({"HF_XET_HIGH_PERFORMANCE": "1"}) # enable fast data transfer
)
app = modal.App()

@app.function(
    volumes={MODEL_DIR.as_posix(): volume},  # "mount" the Volume, sharing it with your function
    image=download_image,  # only download dependencies needed here
)
def download_model(
    repo_id: str = "hf-internal-testing/tiny-random-GPTNeoXForCausalLM",
    revision: Optional[str] = None,  # include a revision to prevent surprises!
):
    from huggingface_hub import snapshot_download

    snapshot_download(repo_id=repo_id, local_dir=MODEL_DIR / repo_id, revision=revision)
    print(f"Model downloaded to {MODEL_DIR / repo_id}")
```