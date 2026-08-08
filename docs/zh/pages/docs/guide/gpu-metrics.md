<!-- modal-docs: machine-translated zh-CN from English source -->

# GPU 指标

Modal 公开了许多 GPU 指标，可帮助监控您正在使用的 GPU 的运行状况和利用率。

* **GPU 利用率 %** 是 GPU 执行至少一个 CUDA 内核的时间百分比。这与 [`nvidia-smi`](/gpu-glossary/host-software/nvidia-smi) 报告的利用率相同。 GPU 利用率有助于确定 GPU 工作在 CPU 工作上被阻塞的时间量，例如 PyTorch 计算图构建或输入处理。然而，它远不能表明 GPU 计算火力（FLOPS 或内存吞吐量、[CUDA 核心](/gpu-glossary/device-hardware/cuda-core)、[SMs](/gpu-glossary/device-hardware/streaming-multiprocessor)）的比例正在被使用。详情请参阅[这篇博文](https://arthurchiao.art/blog/understanding-gpu-performance)。
* **GPU 电源利用率 %** 是设备当前消耗的最大功耗的百分比。跨容器聚合时，我们还会报告**总 GPU 功耗**（以瓦为单位）。由于高性能 GPU [从根本上受到功耗限制](https://www.thonking.ai/p/strangely-matrix-multiplications)，无论是计算还是内存访问，功耗都可以用作 GPU 正在执行多少工作的代理。完全饱和的 GPU 应消耗或接近其全部功率预算（也可以通过运行 `nvidia-smi` 找到）。
* **GPU 温度** 是在 GPU 芯片上测量的温度。与作为热能来源的功耗一样，排出热量的能力是 GPU 性能的基本限制：继续消耗全部功率而不消除废热会损坏系统。在正确的 GPU 部署中容易观察到的最高温度下（即 H100 的温度为 70 摄氏度左右），增加热噪声纠错已经会降低性能。一般来说，功率利用率是性能的更好代表，但为了完整性，我们报告温度。
* **使用的 GPU 内存** 是 GPU 上分配的内存量（以字节为单位）。
一般来说，这些指标是有用的信号或与性能相关的信号，但不能用于直接调试性能问题。相反，我们（和[制造商！](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/#assess-parallelize-optimize-deploy)）建议跟踪和分析工作负载。请参阅在 Modal 上分析 PyTorch 应用程序的[此示例](/docs/examples/torch_profiling)。