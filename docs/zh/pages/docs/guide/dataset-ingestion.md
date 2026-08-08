<!-- modal-docs: machine-translated zh-CN from English source -->

# 大型数据集摄取

本指南提供了下载、转换和存储大型数据集的最佳实践
莫代尔。如果数据集包含数十万个文件和/或超过
大小为 100 GiB。

这些指南确保大型数据集能够被充分、可靠地摄取。

## 配置您的函数以应对大量磁盘使用

应使用 `modal.Function` 下载和转换大型数据集并存储
进入[卷](/docs/guide/volumes)。

这个`modal.Function`应该指定一个大的`timeout`，因为大型数据集处理可能需要几个小时，
在下载和处理数据集的情况下，它应该请求更大的临时磁盘
是数百 GiB。

```python
volume = modal.Volume.from_name("datasets", create_if_missing=True)


@app.function(
    volumes={"/mnt/datasets": volume},
    ephemeral_disk=1000 * 1000,  # 1 TiB
    timeout=60 * 60 * 12,  # 12 hours

)
def download_and_transform() -> None:
    ...
    volume.commit()
```

### 对于小文件数据集更喜欢分片或存档输出

卷可以存储大型数据集，但由数百万个小文件组成的数据集则无法存储
当它们第一次被分组为更大的工件时，通常仍然更容易摄取和消耗，例如
tar 分片、WebDataset 存档、Parquet 文件或其他批处理格式。

有关更多详细信息，请参阅下面的[转换](#transforming)部分。

## 实验
下载和转换大型数据集可能很繁琐。在迭代可靠的摄取程序时
您可能需要一个交互式环境，以便您可以检查下载的文件、验证凭据、
在自动化完整的摄取工作之前进行基准转换。 [模态笔记本](/docs/guide/notebooks)
为此工作得很好。附加与您的摄取功能使用的相同的卷，保持短暂的刮擦
`/tmp`中的数据，并在`/mnt/...`下保留中间工件。

## 下载中

原始数据集数据应首先下载到`/tmp/`的容器中，而不是放置
直接进入已安装的卷。这有几个目的。

1. 下载工具在写入时通常会创建临时文件、部分文件或重命名目标，而本地 SSD 可以更有效地处理这些问题。
2. 原始数据集数据在使用前可能需要进行转换，这种情况下永久存储是浪费的。

此代码片段显示了基本的下载和复制过程：

```python notest
import pathlib
import shutil
import subprocess

tmp_path = pathlib.Path("/tmp/imagenet/")
vol_path = pathlib.Path("/mnt/datasets/imagenet/")
filename = "imagenet-object-localization-challenge.zip"
# 1. Download into /tmp/
subprocess.run(
    f"kaggle competitions download -c imagenet-object-localization-challenge --path {tmp_path}",
    shell=True,
    check=True
)
vol_path.mkdir(parents=True, exist_ok=True)
# 2. Copy (without transform) into mounted volume.
shutil.copy2(tmp_path / filename, vol_path / filename)
volume.commit()
```

## 转变

当摄取大型数据集时，有时需要在存储之前对其进行转换，以便它可以在
运行时加载的最佳格式。一种常见的必要转换是 gzip 解压缩。非常大
为了存储和网络传输效率，数据集经常被 gzip 压缩，但 gzip 解压缩（80 MiB/s）
比从固态硬盘 (SSD) 读取数据慢数百倍
并且应该在存储之前完成一次，以避免每次读取数据集时都解压缩。

应在将原始数据集存储在`/tmp/`中后执行转换。执行转换几乎总是会增加容器磁盘使用率，这就是 [`ephemeral_disk` 参数](/docs/sdk/py/latest/App#function) 参数变得重要的地方。例如，一个
100 GiB 原始压缩数据集可能会解压为 500 GiB，占用 600 GiB 容器磁盘空间。

通常还应该针对 `/tmp/` 执行转换。这是因为

1. 转换可能是 IO 密集型的，并且 IO 延迟比本地 SSD 更低。
2. 转换会创建临时数据，永久存储会造成浪费。

转换完成后，将最终的数据集布局写入附加的卷并提交
后续的函数和笔记本可以重新加载并使用相同的数据。

## 示例
本指南中提供的最佳实践在 [`modal-examples` 存储库](https://github.com/modal-labs/modal-examples/tree/main/12_datasets) 中进行了演示。

这些示例包括以下流行的大型数据集：

* [ImageNet](https://www.image-net.org/)，开启深度学习革命的图像标注数据集
* [COCO](https://cocodataset.org/#download)，密集标签图像COntext数据集中的常见对象
* [LAION-400M](https://laion.ai/blog/laion-400-open-dataset/)，稳定扩散训练数据集
* 数据来源于【大“神奇”数据库】(https://bfd.mmseqs.com/)，
  [蛋白质数据库](https://www.wwpdb.org/)、[UniProt数据库](https://www.uniprot.org/)
  用于训练[RoseTTAFold](https://github.com/RosettaCommons/RoseTTAFold)蛋白质结构模型