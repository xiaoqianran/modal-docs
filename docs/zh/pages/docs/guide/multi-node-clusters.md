<!-- modal-docs: machine-translated zh-CN from English source -->

# 多节点集群

Modal Clusters 支持跨多个协调容器运行的 petaFLOP/s 作业，例如服务或训练万亿参数模型。每个容器都可以使其节点上的可用 GPU 设备饱和，并与对等容器进行太比特/秒网络通信。

模态集群提供：

* 用于编排的[安全专用网络](https://modal.com/docs/guide/private-networking)。
* 6,400 Gbps (B300) 或 3,200 Gbps（其他 GPU）RDMA 横向扩展网络（[RoCE](https://en.wikipedia.org/wiki/RDMA_over_Converged_Ethernet)、[InfiniBand](https://en.wikipedia.org/wiki/InfiniBand) 或 [EFA](https://aws.amazon.com/hpc/efa/)）。
* 每个集群最多 32 个节点和 256 个 GPU。对于更大的集群，请[联系我们](mailto:support@modal.com)。
* 深度老化测试和[持续的GPU和网络健康监控](https://modal.com/blog/gpu-health)。
* 与所有 Modal 平台功能的互操作性（[Volumes](/docs/guide/volumes)、[Dicts](/docs/guide/dicts)、[Tunnels](/docs/guide/tunnels) 等）。

当您调用集群[Function](https://modal.com/docs/guide/functions)或[Server](https://modal.com/docs/guide/servers)时，Modal会同时启动多个容器，然后在每个容器中运行您的代码。因此，您的代码应该在容器之间建立通信并相互协调以交付最终结果。
该指南将引导您了解如何充分利用模态集群。要了解如何在集群中使用常见的训练框架，请参阅[多节点训练指南](https://modal.com/docs/guide/multi-node-training)。

## 使用 `@clustered` 装饰器

要创建集群函数或服务器，请使用 `@clustered` 装饰器：

```python
@app.function(
    gpu="H100:8",
    timeout=60 * 60 * 24,
    retries=modal.Retries(initial_delay=0.0, max_retries=10),
)
@modal.clustered(size=4)
def train_model():
    cluster = modal.Cluster.from_context()

    container_rank = cluster.container_rank()
    container_ips = cluster.container_ips()
    world_size = len(container_ips)
    main_addr = container_ips[0]
    is_main = "(main)" if container_rank == 0 else ""

    print(f"{container_rank=} {is_main} {world_size=} {main_addr=}")
```

上述配置创建了一组 4 个容器，每个容器有 8 个 H100 GPU 设备，总共 32 个设备。

多节点集群中的容器在物理上并置并[组调度](https://en.wikipedia.org/wiki/Gang_scheduling)在一起，以便您的代码仅在获取所有请求的硬件后运行。传统上，这种集群和调度管理将由 SLURM、Kubernetes 或其他东西来处理。但对于 Modal，这一切都是通过 Python 装饰器以无服务器方式提供的！

<Callout variant="info">

集群函数必须使用[每个节点的全部 GPU 数量](https://modal.com/docs/guide/gpu#specifying-gpu-count)。例如，`H100:4`无效，但`H100:8`有效。不支持仅 CPU 的集群功能。

</Callout>

`@modal.clustered` 装饰器还支持使用 `@app.cls()` 的[定义为类的函数](https://modal.com/docs/guide/lifecycle-functions)，前提是该类仅公开一个方法。

不支持网络功能。对于 HTTP 工作负载，请使用 [服务器](https://modal.com/docs/guide/servers)。

## 自动缩放
Modal 的 [自动缩放器](https://modal.com/docs/guide/scale) 一次处理整个集群的放大和缩小。与典型的函数一样，您可以[配置此行为](https://modal.com/docs/guide/scale#configuring-autoscaling-behavior) 来控制在给定时间可以运行的集群数量。

`min_containers`、`max_containers` 和 `buffer_containers` 计算 **单个节点**，并且必须是集群大小的倍数。例如，如果您声明一个四节点集群，`min_containers=8`将告诉自动缩放器保持至少两个集群运行，总共八个容器。

## 排名和输入广播

多节点集群中的每个容器都分配有一个等级。等级零是“领导”等级或头节点，通常协调工作。

要获取当前容器的排名：

```python notest
cluster = modal.Cluster.from_context()
container_rank = cluster.container_rank()
if container_rank == 0:
    print("Running as the leader")
else:
    print(f"Running as rank {container_rank}")
```

当您调用 Clustered [Function](https://modal.com/docs/guide/functions) 时，每个容器都会收到 Function 调用参数的副本。例如，如果您调用四节点函数，您的代码将在四个容器中并行运行四次。

对于集群[服务器](https://modal.com/docs/guide/servers)，网络流量仅路由到排名零，然后负责将请求分发到其他容器。
仅排名零的输出返回给调用者；即，其他等级的输出被丢弃。要在返回最终结果之前共享工作，请使用[容器间网络](#networking) 或[RDMA](#rdma)。

## 网络

除了组调度之外，`@clustered` 装饰器还支持 Modal 的工作区专用容器间网络 [i6pn](/docs/guide/private-networking)，以便集群中的容器可以通过 TCP 或 UDP 相互通信。然后，您可以在 Modal 的网络堆栈之上使用 [Torch Distributed Elastic](https://docs.pytorch.org/docs/2.14/elastic/rendezvous.html) 等协议。无论是否启用 [RDMA](#rdma)，专用网络都可用。

[`Cluster.container_ips()`](/docs/sdk/py/latest/Cluster#container_ips) 返回每个容器一个 IP 地址，按级别排序，用于集群内通信。

```python notest
cluster = modal.Cluster.from_context()
container_ips = cluster.container_ips()
print(f"The main container's IP is {container_ips[0]}")
```

默认情况下，`container_ips()` 返回 IPv6 地址。对于需要 IPv4 的工作负载（例如基于 Ray 的框架），传入 `family` 参数：

```python notest
cluster = modal.Cluster.from_context()
container_ips = cluster.container_ips(family="ipv4")
print(f"The main container's IP is {container_ips[0]}")
```

有关容器间网络的更多信息，请参阅[集群网络指南](https://modal.com/docs/guide/private-networking)。

## RDMA
为了获得更高的节点间带宽，您可以启用 RDMA。确切的带宽取决于 GPU 类型：B300 集群具有 6,400 Gbps 网络，而其他 GPU 类型具有 3,200 Gbps。

H100、H200、B200、B300 和 GB200 GPU 支持 RDMA。

要使用 RDMA，请确保您的容器映像包含必要的依赖项，通常是 `libcudart.so`、`libibverbs.so.1` 和 `libmlx5.so.1` 的副本。最简单的方法是[使用 CUDA 基础映像](/docs/guide/cuda#for-more-complex-setups-use-an-officially-supported-cuda-image)，然后使用 `.apt_install` InfiniBand 库：

```python
cuda_version = "12.9.1"
flavor = "devel"
operating_sys = "ubuntu22.04"
tag = f"{cuda_version}-{flavor}-{operating_sys}"

image = (
    modal.Image.from_registry(f"nvidia/cuda:{tag}", add_python="3.12")
    .apt_install("libibverbs1")
)
```然后，将`rdma=True`传入`clustered`装饰器：

```python notest
@modal.clustered(size=2, rdma=True)
def train():
    ...
```

如果您使用 [NCCL](https://developer.nvidia.com/nccl) 或基于它的框架，Modal 会自动在容器中设置必要的环境变量。

否则，Modal 会公开两个 RDMA 接口之一，具体取决于底层硬件：InfiniBand Verbs 或 [EFA](https://aws.amazon.com/hpc/efa/)。如果您的工作负载与 EFA 不兼容，您可以使用 `efa_disabled` 实验选项强制容器在 InfiniBand Verbs 主机上运行：

```python notest
@app.function(
    ...,
    experimental_options={
        "efa_disabled": True,
    },
)
@modal.clustered(size=2, rdma=True)
def train():
    ...
```

<Callout variant="warning">

设置 `efa_disabled` 选项可能会影响调度时间和容量的可用性。

</Callout>

要运行简单的 RDMA 性能测试，请参阅[此示例代码](https://github.com/modal-labs/multinode-training-guide/tree/main/benchmark)。
## 容错

故障会传播到其他容器。如果任何单个容器上的输入失败，Modal 将终止所有剩余容器并将整个调用标记为失败，即使输入在另一个容器上成功也是如此。您可以设置[重试策略](https://modal.com/docs/guide/retries)，让 Modal 为您重试输入。

[抢占](/docs/guide/preemption) 适用于整个集群。如果发生抢占，Modal 将终止集群中的所有容器，并使用相同的输入重试。

### 输入同步

<Callout variant='info'>

同步与单次训练运行无关，主要适用于推理用例。

</Callout>

Modal 不会跨容器同步输入执行。容器负责确保它们处理输入的速度不会比集群中的其他容器更快。

特别重要的是，领导者容器（等级 0）在开始下一个输入之前等待所有其他容器完成当前输入的处理。