<!-- modal-docs: machine-translated zh-CN from English source -->

# 聚集

```python
clustered(*, size, rdma=False)
```

在共置的网络容器集群上运行函数或服务器。

在`@app.function()`、`@app.cls()`或`@app.server()`下方应用。每个集装箱
必须请求其主机上的所有 GPU（例如，`gpu="H100:8"`）；仅CPU
不支持集群。集群 Cl 只能公开一种方法。
使用服务器进行 HTTP 服务；不支持集群 Web 功能。

函数输入被广播到每个容器，并且仅排名 0 的输出
被返回。服务器请求仅路由到排名 0 并且不会广播
到其他容器。在容器内使用`modal.Cluster.from_context()`发现其排名和集群的容器 IP 地址：

```python notest
cluster = modal.Cluster.from_context()
rank = cluster.container_rank()
container_ips = cluster.container_ips()
```

`min_containers`、`max_containers`、`buffer_containers` 计算个体
容器，并且必须是 `size` 的倍数。例如，`size=4` 与
`min_containers=8` 使两个簇保持温暖。

参见【多节点集群指南】(https://modal.com/docs/guide/multi-node-clusters)
了解硬件要求和网络详细信息。

参数：
大小：整数
每个集群中的容器数量。
rdma：布尔=假
请求RDMA网络以实现节点之间的快速通信，例如
分布式训练期间的 GPU 集体。使用 False，容器
仍然可以通过专用 IP 网络进行通信，而无需
支持 RDMA 的布局。