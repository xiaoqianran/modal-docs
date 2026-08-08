<!-- modal-docs: machine-translated zh-CN from English source -->

# 在 Modal 上运行长时间、可恢复的训练作业

单个模态函数调用有 [24 小时的最大超时](https://modal.com/docs/guide/timeouts)。
您仍然可以在 Modal 上运行长时间的训练作业，方法是将其设置为可中断和可恢复
（又名 [*可重入*](https://en.wikipedia.org/wiki/Reentrancy_%28computing%29)）。

这通常通过检查点来完成：定期将模型状态保存到磁盘。
无论您的训练作业持续时间如何，我们都建议实施检查点逻辑。
这可以防止在中断或[抢占](https://modal.com/docs/guide/preemption)的情况下丢失进度。

在此示例中，我们将逐步介绍如何实现此模式
[PyTorch 闪电](https://lightning.ai/docs/pytorch/2.4.0/)。

但基本模式很简单，可以应用于任何训练框架：

1.定期将检查点保存到Modal [Volume](https://modal.com/docs/guide/volumes)
2. 当您的训练功能开始时，检查最新检查点的音量
3. 在训练功能中添加[重试](https://modal.com/docs/guide/retries)

## 从训练循环中的检查点恢复

下面的`train`函数展示了一些非常简单的训练逻辑
使用 PyTorch Lightning 的内置检查点功能。

闪电使用特殊的文件名，`last.ckpt`，
指示哪个检查点是最新的。
我们检查该文件，如果存在则从中恢复训练。

```python
from pathlib import Path
from typing import Optional

import modal


def train(experiment):
    experiment_dir = CHECKPOINTS_PATH / experiment
    last_checkpoint = experiment_dir / "last.ckpt"

    if last_checkpoint.exists():
        print(f"⚡️ resuming training from the latest checkpoint: {last_checkpoint}")
        train_model(
            DATA_PATH,
            experiment_dir,
            resume_from_checkpoint=last_checkpoint,
        )
        print("⚡️ training finished successfully")
    else:
        print("⚡️ starting training from scratch")
        train_model(DATA_PATH, experiment_dir)


```

该实现在本地环境中运行良好。
在 Modal 上无服务器且持久地运行它——可以访问自动扩展的云 GPU 基础设施
\-- 不需要对代码进行任何调整。
我们只需要确保数据和检查点保存在 Modal *Volumes* 中。

## 模态卷是分布式文件系统

Modal [Volumes](https://modal.com/docs/guide/volumes) 是分布式文件系统 --
您可以像本地磁盘一样从中读取和写入文件，
但所有模态函数都可以访问它们。
它们的性能针对 [一次写入，多次读取](https://en.wikipedia.org/wiki/Write_once_read_many) 工作负载进行了调整
具有少量大文件。

您可以将它们附加到任何需要访问的模态函数。

但首先，您需要创建它们：

```python
volume = modal.Volume.from_name("example-long-training", create_if_missing=True)

```

## 将训练移植到 Modal

要将 Modal Volume 附加到我们的训练函数中，我们需要将其移植到 Modal 上运行。

这意味着我们需要定义训练函数的依赖关系
（作为[容器图像](https://modal.com/docs/guide/custom-container)）
并将其附加到应用程序（[`modal.App`](https://modal.com/docs/guide/apps)）。

在 GPU 上运行的模态函数 [已安装 CUDA 驱动程序](https://modal.com/docs/guide/cuda)，
所以依赖关系规范很简单。
我们只是`uv_pip_install` PyTorch 和 PyTorch Lightning。

```python
image = modal.Image.debian_slim(python_version="3.12").uv_pip_install(
    "lightning~=2.4.0", "torch~=2.4.0", "torchvision==0.19.0"
)

app = modal.App("example-long-training", image=image)

```

接下来，我们使用 `app.function` 将训练功能附加到该应用程序。

此时，我们定义了培训的所有无服务器基础设施特定细节。
对于可恢复训练，有三个关键部分：附加卷、添加重试和设置超时。

我们希望将卷附加到我们的函数，以便将数据和检查点保存到其中。
在此示例代码中，我们通过全局变量设置这些路径，但在另一个设置中，
这些可以通过环境变量或其他配置机制来设置。

```python
volume_path = Path("/experiments")
DATA_PATH = volume_path / "data"
CHECKPOINTS_PATH = volume_path / "checkpoints"

volumes = {volume_path: volume}

```

然后，我们定义在中断的情况下如何重新开始训练。
我们可以使用`modal.Retries`为我们的函数添加自动重试。
我们将延迟时间设置为`0.0`秒，因为在抢占或超时时我们希望立即重新启动。
我们将`max_retries`设置为当前最大值，即`10`。

```python
retries = modal.Retries(initial_delay=0.0, max_retries=10)

```

Modal 上的超时设置以秒为单位，最短为 10 秒，最长为 24 小时。
当运行持续长达一周的训练作业时，我们将超时设置为 24 小时，
这将使我们的训练工作最多有 10 天的时间才能完成，然后我们需要手动重新启动。
对于本例，我们将其设置为 30 秒。运行示例时，您应该观察到一些中断。

```python
timeout = 30  # seconds

```

现在，我们通过包装 `train` 并装饰它来将所有这些放在一起
使用 `app.function` 添加所有基础设施。我们添加 `single_use_containers` 标志以确保我们的重试
总是会在新鲜的容器中开始。

```python
@app.function(
    volumes=volumes,
    gpu="a10g",
    timeout=timeout,
    retries=retries,
    single_use_containers=True,
)
def train_interruptible(*args, **kwargs):
    train(*args, **kwargs)


```

## 开始可中断训练

我们定义一个[`local_entrypoint`](https://modal.com/docs/guide/apps#entrypoints-for-ephemeral-apps)
从本地 Python 环境开始训练工作。

```python
@app.local_entrypoint()
def main(experiment: Optional[str] = None):
    if experiment is None:
        from uuid import uuid4

        experiment = uuid4().hex[:8]
    print(f"⚡️ starting interruptible training experiment {experiment}")
    train_interruptible.spawn(experiment).get()


```

使用`.spawn(...).get()`很重要，因为`.remote`创建了函数调用
24 小时后过期。

你可以运行这个

```bash
modal run --detach 06_gpu_and_ml/long-training.py
```

您应该看到训练作业开始然后被中断，
在终端中以红色字体生成一个大的堆栈跟踪。
该作业将在几秒钟内重新启动。

`--detach` 标志确保即使您关闭终端或关闭计算机，训练也会继续。
尝试分离，然后查看[Modal 仪表板](https://modal.com/apps) 中的日志。

## PyTorch Lightning 实现的详细信息

这个基本模式适用于任何培训框架或自定义培训作业——
或者任何可以将状态保存到磁盘的可重入工作。
但为了使示例完整，我们在下面包含了 PyTorch Lightning 实现的所有细节。

PyTorch Lightning 提供[内置检查点](https://pytorch-lightning.readthedocs.io/en/1.2.10/common/weights_loading.html)。
您可以使用 的 `ckpt_path` 参数指定要恢复的检查点文件路径
[`trainer.fit`](https://lightning.ai/docs/pytorch/stable/api/lightning.pytorch.trainer.trainer.Trainer.html)
此外，您可以使用 `every_n_epochs` 参数指定检查点间隔
[`ModelCheckpoint`](https://lightning.ai/docs/pytorch/stable/api/lightning.pytorch.callbacks.ModelCheckpoint.html)。

```python
def get_checkpoint(checkpoint_dir):
    from lightning.pytorch.callbacks import ModelCheckpoint

    return ModelCheckpoint(
        dirpath=checkpoint_dir,
        save_last=True,
        every_n_epochs=10,
        filename="{epoch:02d}",
    )


def train_model(data_dir, checkpoint_dir, resume_from_checkpoint=None):
    import lightning as L

    autoencoder = get_autoencoder()
    train_loader = get_train_loader(data_dir=data_dir)
    checkpoint_callback = get_checkpoint(checkpoint_dir)

    trainer = L.Trainer(
        limit_train_batches=100, max_epochs=100, callbacks=[checkpoint_callback]
    )
    if resume_from_checkpoint is not None:
        trainer.fit(
            model=autoencoder,
            train_dataloaders=train_loader,
            ckpt_path=resume_from_checkpoint,
        )
    else:
        trainer.fit(autoencoder, train_loader)


def get_autoencoder(checkpoint_path=None):
    import lightning as L
    from torch import nn, optim

    class LitAutoEncoder(L.LightningModule):
        def __init__(self):
            super().__init__()
            self.encoder = nn.Sequential(
                nn.Linear(28 * 28, 64), nn.ReLU(), nn.Linear(64, 3)
            )
            self.decoder = nn.Sequential(
                nn.Linear(3, 64), nn.ReLU(), nn.Linear(64, 28 * 28)
            )

        def training_step(self, batch, batch_idx):
            x, _ = batch
            x = x.view(x.size(0), -1)
            z = self.encoder(x)
            x_hat = self.decoder(z)
            loss = nn.functional.mse_loss(x_hat, x)
            self.log("train_loss", loss)
            return loss

        def configure_optimizers(self):
            optimizer = optim.Adam(self.parameters(), lr=1e-3)
            return optimizer

    return LitAutoEncoder()


def get_train_loader(data_dir):
    from torch import utils
    from torchvision.datasets import MNIST
    from torchvision.transforms import ToTensor

    print("⚡ setting up data")
    dataset = MNIST(data_dir, download=True, transform=ToTensor())
    train_loader = utils.data.DataLoader(dataset, num_workers=4)
    return train_loader

```