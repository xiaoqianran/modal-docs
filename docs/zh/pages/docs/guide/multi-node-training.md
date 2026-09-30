<!-- modal-docs: machine-translated zh-CN from English source -->

# 多节点训练

当您需要最大程度地控制训练循环和基础设施时，可以使用[集群函数](/docs/guide/multi-node-clusters)。

本指南介绍了如何为基于 [torchrun](https://docs.pytorch.org/docs/2.14/elastic/run.html) 或 [Ray](https://docs.ray.io/en/latest/index.html) 的框架启动一个框架，
它支持 [RDMA](/docs/guide/multi-node-clusters#rdma)。请参阅[此处](/docs/examples/miles_grpo) 了解执行此操作的示例。

## 火炬运行

要在 Modal 上使用基于 torchrun 的框架，首先创建一个具有[必要的依赖项](/docs/guide/multi-node-clusters#rdma) 的容器映像并[添加您的训练脚本](/docs/guide/images#add-local-files-with-add_local_dir-and-add_local_file)：

```python
LOCAL_CODE_DIR = "train"
REMOTE_CODE_DIR = "/root/train"
REMOTE_BENCH_SCRIPT_PATH = f"{REMOTE_CODE_DIR}/benchmark.py"

cuda_version = "12.4.0"  # should be no greater than host CUDA version
flavor = "devel"  #  includes full CUDA toolkit
operating_sys = "ubuntu22.04"
tag = f"{cuda_version}-{flavor}-{operating_sys}"

image = (
    modal.Image.from_registry(f"nvidia/cuda:{tag}", add_python="3.12")
    .apt_install("libibverbs1")
    .uv_pip_install("torch")
    .add_local_dir(
        LOCAL_CODE_DIR,
        remote_path=REMOTE_CODE_DIR,
    )
)
```

然后，创建一个配置了 RDMA 的集群函数，并使用训练脚本启动 `torchrun`。在此示例中，我们创建一个两节点集群，每个节点有 8 个 H100：

```python continuation
N_NODES = 2
N_GPUS_PER_NODE = 8

@app.function(
    gpu=f"H100:{N_GPUS_PER_NODE}",
    image=image,
    timeout=60 * 60,
)
@modal.clustered(size=N_NODES, rdma=True)
def run():
    from torch.distributed.run import parse_args, run

    cluster = modal.Cluster.from_context()
    args = [
        f"--nnodes={N_NODES}",
        f"--nproc-per-node={N_GPUS_PER_NODE}",
        f"--node-rank={cluster.container_rank()}",
        f"--master-addr={cluster.container_ips()[0]}",
        REMOTE_BENCH_SCRIPT_PATH,
    ]

    run(parse_args(args))
```

请务必为您的工作负载设置适当的 [GPU 类型](/docs/guide/gpu) 和 [超时](/docs/guide/timeouts)。
集群必须使用[每个节点的 GPU 设备的完整数量](/docs/guide/gpu#specifying-gpu-count)。

##雷

要在集群功能上设置 [Ray 集群](https://docs.ray.io/en/latest/index.html)，请从 `modal.Cluster.from_context()` 收集有关集群和 IPv4 地址的信息。
然后，在 0 级上启动一个头节点，在其他级上启动一个工作节点：

```python continuation
N_NODES = 2
N_GPUS_PER_NODE = 8

@app.function(
    gpu=f"H100:{N_GPUS_PER_NODE}",
    image=image,
    timeout=24 * 60 * 60,
)
@modal.clustered(size=N_NODES, rdma=True)
async def train():
    cluster = modal.Cluster.from_context()
    ips = cluster.container_ips(family="ipv4")
    rank = cluster.container_rank()

    my_ip = ips[rank]
    head_ip = ips[0]

    # Set any environment variables needed for Ray itself here...
    os.environ["HOST_IP"] = my_ip

    if rank == 0:
        await run_head(my_ip)
    else:
        await run_worker(my_ip, head_ip)
```

<Callout variant="info">

Ray 仅适用于 IPv4。当您请求容器的 IP 地址时，请务必设置`family="ipv4"`。

</Callout>

Rank 0 应该启动 Ray 头节点并等待其启动。一旦完成，它就可以构建一个训练命令并将其提交到集群，然后在转发日志时保持自身活动：

```python
async def run_head(my_ip):
    import ray
    from ray.job_submission import JobSubmissionClient

    subprocess.Popen(
        [
            "ray",
            "start",
            "--head",
            f"--node-ip-address={my_ip}",
            "--dashboard-host=0.0.0.0",
        ]
    )

    # Wait for the Ray head to start up
    for _ in range(30):
        try:
            ray.init(address="auto")
            break
        except Exception:
            await asyncio.sleep(1)
    else:
        raise RuntimeError("Failed to connect to Ray head")

    cmd = build_train_cmd()
    runtime_env = {
        "env_vars": {
            "no_proxy": f"127.0.0.1,{my_ip}",
            "MASTER_ADDR": my_ip,
            # Any other environment variables for your workload...
        }
    }

    client = JobSubmissionClient("http://127.0.0.1:8265")
    job_id = client.submit_job(entrypoint=cmd, runtime_env=runtime_env)

    # Forward logs to the Modal dashboard
    async with modal.forward(8265) as tunnel:
        print(f"Ray dashboard: {tunnel.url}")
        async for line in client.tail_job_logs(job_id):
            print(line, end="", flush=True)
```

其他rank只是将Ray启动为工作节点并为其提供头节点的IP。然后，它们会在作业运行时循环以保持自身活力：

```python
async def run_worker(my_ip, head_ip):
    subprocess.Popen(
        [
            "ray",
            "start",
            f"--node-ip-address={my_ip}",
            "--address",
            f"{head_ip}:6379",
        ]
    )

    while True:
        await asyncio.sleep(10)
```