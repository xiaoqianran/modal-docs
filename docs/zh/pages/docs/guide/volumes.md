<!-- modal-docs: machine-translated zh-CN from English source -->

# 卷

卷是用于 Modal 应用程序的高性能分布式文件系统。它们针对一次写入、多次读取的 I/O 工作负载进行了优化，例如创建机器学习模型权重并将其分配以进行推理。

主要优点：

* 卷默认是分布式的，因此您可以将它们与 Modal 的全局计算池一起使用，而无需管理跨区域的副本。
* 卷具有内置的缓存和分块优化功能，可最大限度地提高吞吐量。
* 卷附带功能齐全的文件系统接口，可轻松集成到您最喜欢的机器学习工具和框架中。
* 卷由多个底层云提供商支持，以保证高可用性。

本页是使用模态体积的高级指南。
有关 `modal.Volume` 对象的参考文档，请参阅
[本页](/docs/sdk/py/latest/Volume)。
有关 `modal volume` CLI 命令的参考文档，请参阅
[本页](/docs/cli/latest/volume)。

## 定价
请参阅我们的[定价页面](/pricing) 了解最新价格。我们通过每天一次快照您的总存储空间来计算使用情况。当您删除数据时，您可能仍需要支付最多四天的存储费用，以反映我们的基本处理成本。

## 卷 v2

<Callout variant="beta">

特定于 v2 卷的说明将在下面用 🌱 注释。

</Callout>

请阅读下面有关 [Volumes v2](#volumes-v2-overview) 的更多信息。

## 创建卷

创建卷并将其用作应用程序一部分的最简单方法是使用
[`modal volume create`](/docs/cli/latest/volume#modal-volume-create) CLI 命令。这将创建体积和输出
一些示例代码：

```bash
% modal volume create my-volume
Created volume 'my-volume' in environment 'main'.
```

> 🌱 要创建 v2 卷，请在上面的命令中传递 `--version=2`。

## 在模态上使用体积

要将现有卷附加到模态函数，请使用 [`Volume.from_name`](/docs/sdk/py/latest/Volume#from_name)：

```python
vol = modal.Volume.from_name("my-volume")


@app.function(volumes={"/data": vol})
def run():
    with open("/data/xyz.txt", "w") as f:
        f.write("hello")
    vol.commit()  # Needed to make sure all changes are persisted before exit
```

您还可以从临时模态 Shell 浏览和操作卷：

```bash
% modal shell --volume my-volume --volume another-volume
```

卷将安装在`/mnt`下。

卷旨在提供高达 2.5 GB/s 的带宽。
实际吞吐量无法得到保证，并且可能会较低，具体取决于网络状况。

## 安装选项
将卷附加到函数或沙箱时，您可以使用以下命令配置挂载选项
[`Volume.with_mount_options`](/docs/sdk/py/latest/Volume#with_mount_options)。
这些选项不存储在卷本身上 - 它们适用于每个容器挂载，
因此，对于不同的容器，可以以不同的方式安装相同的卷。

### 只读挂载

要防止容器写入卷，请将其挂载为只读模式：

```python notest
import modal

volume = modal.Volume.from_name("my-volume")

sb = modal.Sandbox.create(
    volumes={"/data": volume.with_mount_options(read_only=True)},
    app=app,
)
sb.exec("cat", "/data/config.json").wait()  # ok!
sb.exec("touch", "/data/new-file").wait()  # error!
```

###挂载子路径

您可以使用 `sub_path` 安装选项安装卷的子目录而不是整个卷。
如果子目录尚不存在，它将在容器启动时创建。

```python notest
import modal

volume = modal.Volume.from_name("my-volume")

sb = modal.Sandbox.create(
    volumes={"/user_data": volume.with_mount_options(sub_path="/users/user_123")},
    app=app,
)
# /user_data inside of the contianer is now referencing /users/user_123 in the Volume
sb.exec("ls", "/user_data").wait()
```

当您希望使用单个卷时，子路径安装特别有用
多个最终用户会话，但不希望会话访问甚至查看
卷中其他会话的文件。

**注意：** 子路径当前仅限于目录 - 您无法挂载单个文件。

## 从卷中下载文件

虽然卷中的单个文件没有文件大小限制，但前端仅支持下载最大 16MB 的文件。对于较大的文件，请使用 CLI：

```bash
% modal volume get my-volume xyz.txt xyz-local.txt
```

### 从代码中延迟创建卷
您还可以使用以下代码从代码中延迟创建卷：

```python
vol = modal.Volume.from_name("my-volume", create_if_missing=True)
```

> 🌱 要创建 v2 卷，请将 `version=2` 传递给上面代码中对 `from_name()` 的调用。

如果卷不存在，这将创建该卷。

## 使用模态之外的体积

卷也可以通过 [Python SDK](/docs/sdk/py/latest/Volume) 或我们的 [CLI](/docs/cli/latest/volume) 在 Modal 之外使用。

### 使用本地代码中的卷

您可以使用 `modal` Python 客户端库从任何地方与卷进行交互。

```python notest
vol = modal.Volume.from_name("my-volume")

with vol.batch_upload() as batch:
    batch.put_file("local-path.txt", "/remote-path.txt")
    batch.put_directory("/local/directory/", "/remote/directory")
    batch.put_file(io.BytesIO(b"some data"), "/foobar")
```

有关更多详细信息，请参阅[参考文档](/docs/sdk/py/latest/Volume)。

### 通过命令行使用卷

您还可以使用命令行界面与卷进行交互。你可以运行
`modal volume` 获取其子命令的完整列表：

```bash
% modal volume
Usage: modal volume [OPTIONS] COMMAND [ARGS]...

 Read and edit modal.Volume volumes.
 Note: users of modal.NetworkFileSystem should use the modal nfs command instead.

╭─ Options ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ --help          Show this message and exit.                                                                                                                                                            │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─ File operations ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ cp       Copy within a modal.Volume. Copy source file to destination file or multiple source files to destination directory.                                                                           │
│ get      Download files from a modal.Volume object.                                                                                                                                                    │
│ ls       List files and directories in a modal.Volume volume.                                                                                                                                          │
│ put      Upload a file or directory to a modal.Volume.                                                                                                                                                 │
│ rm       Delete a file or directory from a modal.Volume.                                                                                                                                               │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─ Management ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ create   Create a named, persistent modal.Volume.                                                                                                                                                      │
│ delete   Delete a named, persistent modal.Volume.                                                                                                                                                      │
│ list     List the details of all modal.Volume volumes in an Environment.                                                                                                                               │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

有关更多详细信息，请参阅[参考文档](/docs/cli/latest/volume)。

## 卷提交和重新加载

与普通文件系统不同，您需要显式重新加载卷才能看到
自首次安装以来所做的更改。此重新加载是通过调用
Volume 对象上的 [`.reload()`](/docs/sdk/py/latest/Volume#reload) 方法。
同样，容器内所做的任何卷更改都需要提交
这些更改在当前容器外部可见。这是处理的
定期通过[后台提交](#background-commits)并直接调用
[`.commit()`](/docs/sdk/py/latest/Volume#commit)
`modal.Volume` 对象上的方法。

在容器创建时，将安装附加卷的最新状态。如果
然后该卷随后被另一个中的提交操作修改
正在运行的容器，该卷修改将变得可用，直到
原始容器执行 [`.reload()`](/docs/sdk/py/latest/Volume#reload)。

考虑这个示例，它演示了重新加载的效果：

```python
import pathlib
import modal

app = modal.App()

volume = modal.Volume.from_name("my-volume")

p = pathlib.Path("/root/foo/bar.txt")


@app.function(volumes={"/root/foo": volume})
def f():
    p.write_text("hello")
    print(f"Created {p=}")
    volume.commit()  # Persist changes
    print(f"Committed {p=}")


@app.function(volumes={"/root/foo": volume})
def g(reload: bool = False):
    if reload:
        volume.reload()  # Fetch latest changes
    if p.exists():
        print(f"{p=} contains '{p.read_text()}'")
    else:
        print(f"{p=} does not exist!")


@app.local_entrypoint()
def main():
    g.remote()  # 1. container for `g` starts
    f.remote()  # 2. container for `f` starts, commits file
    g.remote(reload=False)  # 3. reuses container for `g`, no reload
    g.remote(reload=True)   # 4. reuses container, but reloads to see file.
```

此示例的输出如下：

```
p=PosixPath('/root/foo/bar.txt') does not exist!
Created p=PosixPath('/root/foo/bar.txt')
Committed p=PosixPath('/root/foo/bar.txt')
p=PosixPath('/root/foo/bar.txt') does not exist!
p=PosixPath('/root/foo/bar.txt') contains hello
```

此代码运行两个容器，一个用于 `f`，另一个用于 `g`。只有最后一个
函数调用读取由`f`创建并提交的文件，因为它是
配置为重新加载。

### 后台提交

模态卷运行后台提交：
当您的函数或沙箱执行时每隔几秒，
所附卷的内容将被提交
您的应用程序代码无需调用 `.commit`。
最终快照和提交也会在容器关闭时自动执行。
能够在不更改应用程序代码的情况下保留对卷的更改
在[使用框架训练或微调模型](#model-checkpointing)时特别有用。

## 模型服务

只需将单个 ML 模型烘焙到 `modal.Image` 即可提供服务
使用 [`run_function`](/docs/sdk/py/latest/Image#run_function) 构建时间。但是
如果您有数十个模型需要服务，或者需要解耦图像
从模型存储和服务构建，使用`modal.Volume`。

卷可用于保存大量 ML 模型，并在以后为任何一个模型提供服务
它们在运行时具有出色的性能。下面的代码片段显示了
解决方案的基本结构。

```python
import modal

app = modal.App()
volume = modal.Volume.from_name("model-store")
model_store_path = "/vol/models"


@app.function(volumes={model_store_path: volume}, gpu="any")
def run_training():
    model = train(...)
    save(model_store_path, model)
    volume.commit()  # Persist changes


@app.function(volumes={model_store_path: volume})
def inference(model_id: str, request):
    try:
        model = load_model(model_store_path, model_id)
    except NotFound:
        volume.reload()  # Fetch latest changes
        model = load_model(model_store_path, model_id)
    return model.run(request)
```

有关更多详细信息，请参阅我们的[在 Modal 上存储模型权重的指南](/docs/guide/model-weights)。

## 模型检查点

检查点是 ML 模型的快照，可以通过回调进行配置
ML 框架的功能。您可以使用保存的检查点重新启动训练
上次保存的检查点的作业。这对于管理特别有帮助
[抢占](/docs/guide/preemption)。

有关更多信息，请参阅我们的[长时间运行训练的示例代码](/docs/examples/long-training)。

### 抱脸`transformers`
要定期检查`modal.Volume`，只需设置`Trainer`
[`output_dir`](https://huggingface.co/docs/transformers/main/en/main_classes/trainer#transformers.TrainingArguments.output_dir)
到卷中的目录。

```python
import pathlib

volume = modal.Volume.from_name("my-volume")
VOL_MOUNT_PATH = pathlib.Path("/vol")

@app.function(
    gpu="A10G",
    timeout=2 * 60 * 60,  # run for at most two hours
    volumes={VOL_MOUNT_PATH: volume},
)
def finetune():
    from transformers import Seq2SeqTrainer
    ...

    training_args = Seq2SeqTrainingArguments(
        output_dir=str(VOL_MOUNT_PATH / "model"),
        # ... more args here
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_xsum_train,
        eval_dataset=tokenized_xsum_test,
    )
```

## 音量表现

当卷包含的文件和目录少于 50,000 个时，卷效果最佳。的
附加或修改卷的延迟与卷中的文件数量成线性比例
体积，以及过去几万个文件的线性分量
开始主导固定开销。

目前硬性限制为 500,000 个 inode（文件、目录和
符号链接）每卷。如果您达到此限制，则任何进一步的尝试
创建新文件或目录会出错
[`ENOSPC`（设备上没有剩余空间）](https://pubs.opengroup.org/onlinepubs/9799919799/)。

如果您需要处理大量文件，请考虑使用 Volumes v2！
目前它处于测试阶段。请参阅下文了解更多信息。

## 文件系统一致性

### 并发修改

支持多个容器并发修改，但并发
应避免修改相同的文件。在以下情况下最后一次写入获胜
同一文件的并发修改——最后一个写入者没有的任何数据
当提交更改时将会丢失！

您可以同时运行的提交数量是有限的。如果你跑太多
并发提交 由于争用，每次提交将花费更长的时间。如果你是
提交小的更改，避免进行超过 5 次并发提交（数量
您可以进行的并发提交数与更改的大小成正比
正在承诺）。

因此，卷通常不太适合您需要的用例
对同一文件进行并发修改（分布式文件也不是
支持锁定）。

当重新加载正在进行时，卷对于容器来说将显示为空
启动重新加载。这意味着您无法读取或写入卷中的卷
正在进行重新加载的容器（请注意，这仅适用于
发出重新装载的集装箱，其他集装箱不受影响）。

### 音量繁忙错误

仅当卷上没有打开的文件时，您才能重新加载卷。如果你有
打开卷上的文件 [`.reload()`](/docs/sdk/py/latest/Volume#reload)
操作将失败并显示“卷忙”。下面是一个简单的例子来说明如何
可能会出现“卷忙”错误：

```python
volume = modal.Volume.from_name("my-volume")


@app.function(volumes={"/vol": volume})
def reload_with_open_files():
    f = open("/vol/data.txt", "r")
    volume.reload()  # Cannot reload when files in the Volume are open.
```

### 无法找到有关卷错误的文件

访问卷中的文件时，不要忘记在卷的位置前面加上
安装在容器中。
在下面的示例中，卷已安装在`/data`，“hello”是
正在写入`/data/xyz.txt`。

```python
import modal

app = modal.App()
vol = modal.Volume.from_name("my-volume")


@app.function(volumes={"/data": vol})
def run():
    with open("/data/xyz.txt", "w") as f:
        f.write("hello")
    vol.commit()
```

如果您改为写入`/xyz.txt`，该文件将保存到模态函数的本地磁盘中。
当您转储卷的内容时，您将看不到 `xyz.txt` 文件。

## 磁盘使用报告

模态卷不是块设备，并且没有固定的容量。
此外，当前未在文件系统级别报告已用空间。
因此，通过 `statfs` 系统调用查询磁盘使用情况的工具
（例如 `shutil.disk_usage()`、`os.statvfs()`、`df`）将返回占位符
价值观。如果需要检查 Volume 的大小，请参考 Modal 中显示的大小
仪表板，或在容器内安装的卷上使用`du`。

## Volumes v2 概述

Volumes v2 的行为通常与 Volumes v1 一样，并且大多数现有 API
您习惯的 CLI 命令在版本之间的工作方式相同。
由于文件系统实现完全不同，所以会有
一些可能与版本 1 不同的重要性能特征
卷。以下概述了您应该注意的主要差异。

### Volumes v2 仍处于 Beta 阶段

<Callout variant="beta">
我们还不能保证不会丢失任何数据，因此我们目前不建议对关键任务数据使用 Volumes v2。

</Callout>

您仍然可以获得 v2 的好处
不珍贵或易于重建的数据，例如日志文件，
定期更新训练数据和模型权重、缓存等。

### 卷 v2 符合 HIPAA 要求

如果您删除该卷，根据 HIPAA 要求，数据肯定会丢失。

### Volumes v2 更具可扩展性

Volumes v2 支持更多文件、更高吞吐量和更多不规则访问
模式。提交和重新加载也更快。

此外，Volumes v2 支持文件的硬链接，其中多个路径
可以指向同一个inode。

### 在 v2 中，您可以存储任意数量的文件

Volumes v2 中的文件数量没有限制。

相比之下，在 Volumes v1 中，文件数量限制为 500,000 个，
我们建议将计数保持在 50,000 或更少。

### 在 v2 中，您可以从数百个容器同时写入

文件系统不应经历任何性能下降，因为更多
容器同时写入不同的文件。
相比之下，在第 v1 卷中，我们建议不超过 5 位作者访问
立即音量。

但请注意，对卷中特定*文件*的并发访问仍然
在许多情况下具有最后写入获胜的语义。这些语义是
对于大多数应用程序来说是不可接受的，因此任何特定文件都应该只
一次由一个容器写入。

### 在 v2 中，随机访问提高了性能

在 v1 中，写入文件内的位置有时会产生大量的
开销，例如重写整个文件。

在 v2 中，此开销被删除，并且仅写入更改。

### 在 v2 中，您可以使用 `sync` 提交

对于 Volumes v2，您可以从沙盒或模态 shell 中触发提交
通过在挂载点上运行 `sync` 命令：

```bash
sync /path/to/mountpoint
```

当您无法访问 Python SDK 时，这非常有用
[`.commit()`](/docs/sdk/py/latest/Volume#commit) 方法，例如运行时
沙箱中或交互式 `modal shell` 会话期间的 shell 命令。

在挂载点上运行 `sync` 将刷新对内核的所有挂起写入
然后将所有数据和元数据更改持久保存到卷的持久化中
存储。

例如，要在模式 shell 会话中提交更改：
```bash
% modal shell --volume my-v2-volume
root / → echo "hello" > /mnt/my-v2-volume/test.txt
root / → sync /mnt/my-v2-volume  # Persist changes before exiting
```

或者从沙箱内提交：

```python notest
sb = modal.Sandbox.create(
    volumes={"/data": modal.Volume.from_name("my-v2-volume")},
    app=my_app,
)
sb.exec("bash", "-c", "echo 'hello' > /data/test.txt").wait()

# Persist changes and check for errors
p = sb.exec("sync", "/data")
p.wait()
if p.returncode != 0:
    raise Exception(f"sync failed with exit code {p.returncode}")
```

> ⚠️ 此功能仅适用于 Volumes v2。

### Volumes v2 有一些限制

当我们权衡性能并听取用户反馈时，我们有
设置一些人为的限制。

* 文件必须小于 1 TiB。
* 单个目录中最多可以存储 262,144 个文件。
  目录深度是无限的，因此文件总数是无限的。
* 由于需求，v2 中遍历文件系统可能比 v1 慢
  文件系统树的加载。

### 升级 v1 卷

目前，没有用于将 v1 卷升级到 v2 的自动化工具。我们是
计划实施自动迁移路径，但目前 v1 卷需要
通过创建新的 v2 卷并复制文件来手动迁移
从 v1 卷结束或写入新文件。

要为新的 v2 卷重用现有 v1 卷的名称，请首先停止所有
在删除 v1 卷之前正在使用它的应用程序。如果这不是
可行的，例如由于想要避免停机，请为 v2 使用新名称
音量。

**警告：** 删除现有卷时，任何已部署的应用程序或正在运行的应用程序
即使有新卷，使用该卷的功能也将停止运行
以相同的名称创建。这是因为卷被标识为不透明
在应用程序部署或启动时解析的唯一 ID。一个新的
创建的卷与已删除的卷同名将有一个新的卷 ID
并且任何已部署或正在运行的应用程序仍将引用旧 ID，直到
这些应用程序被重新部署或重新启动。

为了创建新卷并从旧卷复制数据，您可以
如果您打算一次性复制所有数据，请使用`cp`之类的工具，或者`rsync`
如果您想在较长的时间跨度内增量复制数据：

```shell
$ modal volume create --version=2 2files2furious
$ modal shell --volume files-and-furious --volume 2files2furious
Welcome to Modal's debug shell!
We've provided a number of utilities for you, like `curl` and `ps`.
# Option 1: use `cp`
root / → cp -rp /mnt/files-and-furious/. /mnt/2files2furious/.
root / → sync /mnt/2files2furious # Ensure changes are persisted before exiting

# Option 2: use `rsync`
root / → apt install -y rsync
root / → rsync -a /mnt/files-and-furious/. /mnt/2files2furious/.
root / → sync /mnt/2files2furious # Ensure changes are persisted before exiting
```

## 更多示例

* [Character LoRA 微调](/docs/examples/diffusers_lora_finetune) 模型存储在卷上
* [蛋白质折叠](/docs/examples/chai1)，模型权重和输出文件存储在卷上
* [使用 Datasette 进行数据集可视化](/docs/examples/cron_datasette) 在卷上使用 SQLite 数据库