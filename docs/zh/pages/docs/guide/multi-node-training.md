<!-- modal-docs: machine-translated zh-CN from English source -->

# 多节点集群

<Callout variant="beta" />

Modal 支持跨多个协调容器运行训练作业。每个容器都可以使其主机（也称为节点）上的可用 GPU 设备饱和，并与执行相同操作的对等容器进行通信。通过将训练作业从单个 GPU 扩展到 16 个 GPU，您可以将训练时间缩短近 16 倍。

### 集群计算能力

模态集群提供：

* 50 Gbps [IPv6 专用网络](https://modal.com/docs/guide/private-networking)，用于编排、数据集下载等。
* 3,200 Gbps RDMA 横向扩展网络 ([RoCE](https://en.wikipedia.org/wiki/RDMA_over_Converged_Ethernet))。
* 最多 64 个设备。
* 每个节点至少 1 TB RAM 和 4 TB 本地 NVMe SSD。
* 深度老化测试。
* 与所有 Modal 平台功能的互操作性（[Volumes](/docs/guide/volumes)、[Dicts](/docs/guide/dicts)、[Tunnels](/docs/guide/tunnels) 等）。

该指南将引导您了解 Modal 客户端库如何支持多节点训练并与 `torchrun` 集成。

### `@clustered`

与标准模态函数容器不同，多节点训练作业中的容器必须能够：

1. 彼此之间进行快速、直接的网络通信。
2. 同时安排在一起，要么全有，要么全无。
`@clustered` 装饰器支持这种行为。

```python
import modal.experimental

@app.function(
    gpu="H100:8",
    timeout=60 * 60 * 24,
    retries=modal.Retries(initial_delay=0.0, max_retries=10),
)
@modal.experimental.clustered(size=4)
def train_model():
    cluster_info = modal.experimental.get_cluster_info()

    container_rank = cluster_info.rank
    world_size = len(cluster_info.container_ips)
    main_addr = cluster_info.container_ips[0]
    is_main = "(main)" if container_rank == 0 else ""

    print(f"{container_rank=} {is_main} {world_size=} {main_addr=}")
    ...
```

在 `@app.function` 下应用此装饰器会修改 Function，以便对它的远程调用由多节点容器组提供服务。上述配置创建了一组四个容器，每个容器有 8 个 H100 GPU 设备，总共 32 个设备。

<Callout variant="info">

从 2026 年 5 月 31 日开始，集群函数必须使用每个节点的全部 GPU 设备数量（例如，`H100:4` 无效，但 `H100:8` 有效）。集群功能需要 GPU，不支持仅 CPU 功能。如果您有不属于上述范围的特殊情况，并且想要使用集群功能，请联系<support@modal.com>。

</Callout>

## 调度

`modal.experimental.clustered` 函数在我们云中的多个节点上运行，但执行方式与普通函数调用类似。例如，所有节点都一起调度（[组调度](https://en.wikipedia.org/wiki/Gang_scheduling)），以便您的代码在所有请求的硬件上运行或根本不运行。

传统上，这种集群和调度管理将由 SLURM、Kubernetes 或手动处理。但对于 Modal，这一切都是通过 Python 装饰器以无服务器方式提供的！

### 排名和输入广播

![图](https://modal-cdn.com/cdnbot/multinodepmgnla70_4b57a155.webp)
您可能会注意到，上面单个 `.remote` 函数调用创建了三个输入执行，但仅返回一个输出。这就是 Modal 上多节点训练作业的输入输出结构。函数调用的参数被复制到每个容器，但仅将零级容器的参数返回给调用者。

容器的等级是多节点作业中的关键概念。零级是“领导”级别，通常负责协调工作。零级也称为“主”容器。等级 0 的输出将始终是多节点训练运行的输出。

## 网络

函数容器通常无法与其他函数容器建立直接网络连接，但这是多节点训练通信的要求。因此，与群组调度一起，`@clustered`装饰器启用了 Modal 的工作区私有容器间网络，称为 [i6pn](https://www.notion.so/Multi-node-docs-1281e7f16949806f966adedfe8b2cb74?pvs=21)。

[集群网络指南](/docs/guide/private-networking) 对 i6pn 进行了更详细的介绍，但结果是集群中的每个容器都知道集群中所有其他容器的网络地址，使它们能够通过 [TCP](https://pytorch.org/docs/stable/elastic/rendezvous.html) 快速相互通信。
### RDMA（无限带宽）

集群配备了 Infiniband，为节点间通信提供高达 3,200 Gbps 的横向扩展带宽。
RDMA 横向扩展网络通过`rdma` 参数`modal.experimental.clustered` 启用。

```python notest
@modal.experimental.clustered(size=2, rdma=True)
def train():
    ...
```

要运行简单的 Infiniband RDMA 性能测试，请参阅[此示例代码](https://github.com/modal-labs/multinode-training-guide/tree/main/benchmark)。

## 集群信息

`modal.experimental.get_cluster_info()`公开了有关集群的以下信息：

* `rank: int`是当前容器在集群中的顺序，从leader`0`开始。
* `cluster_id: str` 是集群的唯一标识符。
* `container_ips: list[str]` 包含集群中每个容器的 IPv6 地址，按排名排序。
* `container_ipv4_ips: list[str]` 包含集群中每个容器的 IPv4 地址，按排名排序。

## 容错

对于集群函数，输入和容器中的故障的处理方式不同。

如果任何容器上的输入失败，该失败**不会传播**到集群中的其他容器。容器负责检测和响应其他容器上的输入故障。
只有排名 0 的输出才重要：如果输入在领导容器（排名 0）上失败，则输入将被标记为失败，即使输入在另一个容器上成功。同样，如果输入在领导容器上成功但在另一个容器上失败，则输入仍将被标记为成功。

如果集群中的容器被抢占，Modal 将终止集群中所有剩余的容器，并重试输入。

### 输入同步

***重要提示：***同步与单次训练运行无关，主要适用于推理用例。

Modal 不会跨容器同步输入执行。容器负责确保它们处理输入的速度不会比集群中的其他容器更快。

特别重要的是，领导容器（等级 0）仅在所有其他容器完成处理当前输入后才开始处理下一个输入。

## 示例

要亲自进行多节点训练，您可以跳转到 [`multinode-training-guide` 存储库](https://github.com/modal-labs/multinode-training-guide) 或 [`modal-examples` 存储库](https://github.com/modal-labs/modal-examples/tree/main/14_clusters) 和 `modal run` 等内容！

* [简单的“hello world”4 x 1 H100 火炬集群示例](https://github.com/modal-labs/modal-examples/blob/main/14_clusters/simple_torch_cluster.py)
* [Infiniband RDMA性能测试](https://github.com/modal-labs/multinode-training-guide/tree/main/benchmark)
* [使用 2 x 8 H100 在 ImageNet 数据集上训练 ResNet50 模型](https://github.com/modal-labs/multinode-training-guide/tree/main/resnet50)
* [使用 modded-nanogpt 进行 Speedrun GPT-2 训练](https://github.com/modal-labs/multinode-training-guide/tree/main/nanoGPT)

<!-- - 使用 2 x 8 H100 在 LLaMA 3.1 405B 上以 16 位精度运行多节点_inference_。 **[待办事项]** -->

### 火炬运行示例

```python
import modal
import modal.experimental

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("torch~=2.5.1", "numpy~=2.2.1")
    .add_local_dir(
        "training", remote_path="/root/training"
    )
)
app = modal.App("example-simple-torch-cluster", image=image)

n_nodes = 4

@app.function(gpu=f"H100:8", timeout=60 * 60 * 24)
@modal.experimental.clustered(size=n_nodes, rdma=True)
def launch_torchrun():
    # import the 'torchrun' interface directly.
    from torch.distributed.run import parse_args, run

    cluster_info = modal.experimental.get_cluster_info()

    run(
        parse_args(
            [
                f"--nnodes={n_nodes}",
                f"--node-rank={cluster_info.rank}",
                f"--master-addr={cluster_info.container_ips[0]}",
                "--nproc-per-node=8",
                "--master-port=1234",
                "training/train.py",
            ]
        )
    )
```