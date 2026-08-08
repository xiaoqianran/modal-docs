<!-- modal-docs: machine-translated zh-CN from English source -->

# 高性能LLM推理

本高级指南记录了用于实现高性能的关键技术
在 Modal 上运行 LLM 推理时。

开放权重模型和开源推理引擎
缩小了与专有模型和专有发动机的大部分差距
并随着他们吸引来自广泛社区的工作而不断改进。
现在并且将越来越经济地在内部运行许多生成式人工智能应用程序，
而不是依赖外部供应商。

然而，实现具有竞争力的性能和成本并不是立竿见影的。
它需要一些思考和调整。
LLM 推理在很多方面与 Web 服务和数据库工作负载有很大不同
工程师习惯于部署和优化。

本指南收集了我们在生产推理部署中看到的有效技术。
我们提供了代码示例，以便您可以亲自尝试高性能 LLM 推理。

我们按照对工作负载重要的关键性能标准来划分该指南：

* **[吞吐量](#achieving-high-throughput-llm-inference-tps)**,
  对于由许多并行请求组成的大型“作业”，只有当它们全部完成时才完成，
* **[延迟](#minimizing-llm-inference-latency-ttfttpotttlt)**,
  通常在人机交互的时间范围内尽快满足每个单独的请求，
* **[冷启动时间](#high-performance-llm-inference-for-bursty-workloads-cold-start-time)**,
  适用于混合延迟和吞吐量敏感组件的突发工作负载。

本高级指南和附带的代码示例旨在启动
您自己的推理部署和性能优化过程。
您可以找到[基线基准测试](/llm-almanac/advisor)
和[基准测试建议](/llm-almanac/how-to-benchmark)
在我们的[法学硕士工程师年鉴](/llm-almanac/workloads) 中。

如果您只想开始在 Modal 上运行基本的 LLM 服务器，请参阅
[这个例子](https://modal.com/docs/examples/llm_inference)。
如果您只想深入研究代码，请参阅
[此示例针对高吞吐量](https://modal.com/docs/examples/vllm_throughput)，
[此示例适用于低延迟](https://modal.com/docs/examples/sglang_low_latency),
以及[此示例为低冷启动时间](https://modal.com/docs/examples/sglang_snapshot)。

## 实现高吞吐量 LLM 推理 (TPS)

典型的“高吞吐量”LLM 推理工作负载是数据库回填：
在触发器上，需要处理大量（100 或更多）行，
例如生成情绪评分作为分析管道的一部分
或者产生将作为离线评估的一部分进行评分的一代。
没有人或系统正在等待任何特定行的结果。

性能由*吞吐量*定义，即任务完成的速率，
这意味着整个作业的端到端延迟。
对于大多数部署来说，这又直接决定成本。
它以每秒令牌数 (TPS) 来衡量。

许多（但不是全部）高吞吐量 LLM 推理应用程序具有大上下文和小输出，
这意味着它们主要是预填充/提示处理时间，而不是解码/令牌生成时间。
与增加的批处理相结合
[算术强度](https://modal.com/gpu-glossary/perf/arithmetic-intensity),
面向吞吐量的 LLM 推理作业通常是
[计算限制](https://modal.com/gpu-glossary/perf/compute-bound)。

一般来说，高吞吐量比低延迟更容易实现。
GPU 本质上是[为最大吞吐量而设计的](https://modal.com/gpu-glossary/perf/latency-hiding)。
此外，LLM 训练是一种对吞吐量敏感的工作负载，因此好的内核
通常会更早地开源。

例如，[Flash Attention 4 内核](/blog/reverse-engineer-flash-attention-4)
将 Flash Attention 内核系列扩展到 [Blackwell GPU](https://modal.com/blog/introducing-b200-h200)
在首次发布几个月后撰写本文时，
主要适用于吞吐量敏感的应用程序——但请注意这个空间！

出于相关原因，我们不建议对这些作业使用 4 位浮点 (FP4)。
FP4 仅在 [Blackwell 或更高版本的 GPU](https://modal.com/gpu-glossary/device-software/compute-capability) 中受支持。
相反，我们推荐更成熟的8位浮点（FP8），
Hopper 或更高版本的 GPU（上一代）支持。

在 Modal 上，16 位 FLOP/$ 的[费率](/定价)在各个方面大致相同
A100、H100 和 B200——较新的 GPU 运行速度更快，但成本更高。
因此每个副本每*美元*的峰值吞吐量大致相同，
即使每个副本每“秒”的吞吐量较低。

但以较低速率运行的旧 GPU 具有一些优势：

* [未充分利用 GPU](/blog/gpu-utilization-guide) 所花费的任何时间都比较便宜
* 超大规模厂商通常可以大量供应一代或两代的 GPU

面向吞吐量的作业并不一定会从将每个副本扩展到更多 GPU 中受益。
聚合吞吐量与使用更少 GPU 的更多副本相同，
但更少的 GPU 意味着减少通信开销
降低了复杂性，特别是对于每个副本单个 GPU 的部署。
重要的是，您必须能够容纳足够大的序列批次
进入[GPU RAM](https://modal.com/gpu-glossary/device-hardware/gpu-ram)
您受计算限制，否则效率会降低。

对于此用例，我们推荐使用 [vLLM](https://vllm.ai/) 推理服务器。
能够更好地安排预填充和解码工作的混合，
这会带来更高的吞吐量。

### Modal 上的高吞吐量 LLM 推理

缺乏延迟限制开启了大量
高吞吐量 LLM 推理的架构选择。

例如，可以从外部数据存储检索值
或 [模态卷](/docs/guide/volumes)
基于数据存储中的标识符或其他信息。
这对于
[Modal 上的 cronjob 部署](/docs/guide/cron)。
然后可以将结果放回到该数据存储中。

Modal 提供了用于构建
[作业队列](/docs/guide/job-queue)
可以扩展到数百万个待处理的输入
以及持续长达一周的工作。
在这种情况下，底层的 LLM 推论是由
[模态 Cls](/docs/guide/lifecycle-functions)
通过调用
[`.spawn`](/docs/guide/job-queue)。
每次调用都会得到一个字符串
[`modal.FunctionCall`标识符](/docs/sdk/py/latest/FunctionCall)
可以用来查询最多一周的结果。

在这种情况下，Modal 的主要扩展限制是这些调用可以排队的速率。
如果推理系统每秒可以完成400个以上的任务，
我们建议将多个任务批处理到单个函数输入中，直到达到峰值吞吐量
每秒任务数由每秒 400 个输入提供服务。

请参阅[此代码示例](https://modal.com/docs/examples/vllm_throughput)
对于实施这些建议的系统和
实现每个副本的最大吞吐量。

## 最小化 LLM 推理延迟 (TTFT/TPOT/TTLT)

典型的“低延迟”LLM 推理工作负载是聊天机器人：
每个请求代表一个等待的用户，用户操作的规模为几百毫秒。
生成有用的智能文本标记通常也需要几毫秒的时间，
用户希望响应中有很多代币，因此延迟预算很紧张。

性能由“延迟”定义，即给定任务等待的时间。
它以首次令牌时间 (TTFT) 和每个输出令牌时间 (TPOT) 来衡量
或在最后一个令牌时间 (TTLT) 中，
取决于应用程序支持流响应的程度。
对于流媒体应用程序（如大多数聊天机器人），TTFT 最重要。

无论应用程序支持流媒体的程度如何，强烈建议
改善用户感知的延迟。
当代 Transformer 语言模型是连续的，因此会生成它们的响应
连续地，导致响应中第一个令牌的创建与最后一个令牌的创建之间存在很长的间隙。

这些长解码或令牌生成阶段需要截然不同的性能
从硬件上来说，比长预填充更有效。
它们通常是[内存限制](https://modal.com/gpu-glossary/perf/memory-bound)
因此受益于减少每个令牌加载到内存中的技术
[流式多处理器](https://modal.com/gpu-glossary/device-hardware/streaming-multiprocessor)
或增加可用数量
[内存带宽](https://modal.com/gpu-glossary/perf/memory-bandwidth)。

有几种技术可以减少每个令牌加载的内存量：

* 更小、更积极的[量化](https://quant.exposed)模型需要更少的内存
* [推测解码](https://huggingface.co/docs/text-generation-inference/en/conceptual/speculation)
  通过草稿模型一次生成多个代币

对于内存限制的工作负载，将模型量化为硬件本身不支持的格式
有时仍然可以带来收益。
对内存带宽需求的减少减少了内存延迟，并且通常有足够的未使用空间
[算术带宽](https://modal.com/gpu-glossary/perf/arithmetic-bandwidth)
执行额外的数值转换。

推测解码技术有很多种，从简单的 n 元语法推测到
模型堆栈按顺序为彼此起草令牌。
我们一般发现[EAGLE-3方法](https://arxiv.org/abs/2503.01840)
以最少的开销提供最佳的性能改进——
计算上和操作上。
Hugging Face 上提供了通用草图模型，
但我们也看到了自定义草稿模型的重大改进
使用以下工具对样本生产数据进行培训
[SpecForge](https://lmsys.org/blog/2025-07-25-spec-forge/)。

此外，使用多个 GPU 生成单个令牌会增加总内存带宽，
以一些额外的沟通为代价。
至关重要的是，需要使用多个加速器并行加载模型权重，
或延迟不会减少。
这意味着用于减少延迟的并行性的常用形式是“张量并行性”，
它将各个 GPU 的矩阵乘法分开，
而不是*管道并行*，
它将整个模型拆分到多个 GPU 上。
70B参数以下的型号很少能在4bit浮点上运行良好
（[GPT-OSS](https://modal.com/docs/examples/gpt_oss_inference) 等例外）。
此外，截至 2026 年初撰写本文时，还没有高质量的开源软件
Blackwell 优化的内核，用于延迟敏感的 LLM 推理。
因此，我们通常建议在 H100 或 H200 上使用 FP8 量化模型。

最后推荐一下[SGLang](https://docs.sglang.io/)
这些工作负载的推理引擎。
SGLang 通常表现出较低的主机开销 -
GPU 空闲等待 CPU 的时间 --
适用于解码繁重的工作负载，尤其是较小的模型。
您可以阅读有关主机开销及其解决方案的更多信息
[这篇博文](/blog/host-overhead-inference-efficiency)。

### Modal 上的低延迟 LLM 推理

对于几百毫秒的延迟预算，
网络延迟和代理/负载平衡开销很重要——
跨越大洋与客户沟通需要几十毫秒，
由于光速的限制。

Modal 提供超低延迟、区域化的 Web 服务器部署
[模态服务器](https://modal.com/docs/guide/servers#servers)
将网络开销减少到 100 毫秒以下。

您可以找到一个演示所有部分的示例
Modal 上的低延迟 LLM 推理
[这里](https://modal.com/docs/examples/sglang_low_latency)。

## 针对突发工作负载的高性能 LLM 推理（冷启动时间）

最后一类主要工作负载位于纯吞吐量和纯延迟之间。
典型的应用程序是一个“工作流程”，其中 LLM 推理是一个工作流程步骤，
工作流程有时由人工交互运行，有时则批量异步运行。

对于这些应用程序，主要关注的是处理高
[峰均负载比](https://brooker.co.za/blog/2023/03/23/economics.html)。
例如，管道在大多数情况下每秒可能服务零个请求，
然后十一点，然后一百，然后回到零。
静态地配置足够的资源来处理一百个请求显然是浪费的，
但按需启动新资源会产生延迟。

那么，关键绩效标准是
[*冷启动时间*](/docs/guide/cold-start):
新副本启动并开始处理请求需要多长时间。
在典型的云部署中，包括实例申请、机器启动和容器设置。
我们在[此处](/blog/gpu-utilization-guide)写了有关资源分配挑战的文章。
基于直接向云端请求资源的方法需要几分钟到几十分钟的时间。
Modal 从内核开始就被设计为提供亚秒级延迟
一直到容器启动。
从这里开始，主要的性能问题是加快服务器启动速度。

* **使用小模型并积极量化**。
  模型可以从 [Modal Volume](/docs/guide/volumes) 加载
  速率为 1-2 GB/s。这意味着您会产生近一秒的冷启动延迟
  每 GB 模型权重。更奇特的压缩格式，例如整数量化
  甚至三元量化，在这里特别有用，即使它们没有改善
  推理期间的延迟。

* **跳过编译步骤**。
  CUDA 图形捕获、JIT 编译内核和 Torch 编译等优化
  对于改善延迟和吞吐量非常有用，但它们通常很难缓存
  有时，缓存命中所需的时间几乎与缓存未命中所需的时间一样长。
  这通常意味着每次启动时的编译都会带来很大的延迟损失，
  延迟很容易达到几十秒甚至几十分钟。

* **从快照恢复**。
在某些情况下，像 JIT 编译这样的启动时工作是不可避免的。
  对于这些工作负载，Modal 提供
  [内存快照](/docs/guide/memory-snapshots)：
  容器准备就绪之前的完整内存状态
  处理请求被序列化到磁盘并且未来的容器启动
  只需要将其反序列化回内存即可。
  模态包括支持
  [GPU 内存快照](/blog/gpu-mem-snapshots)
  这样 GPU 加速的 LLM 推理服务器也可以进行快照。
  内存快照功能强大
  （[我们观察到冷启动时间减少了 10 倍](/blog/gpu-mem-snapshots)），
  但它需要一些代码修改，如下所述。

上面讨论的哪些优化适用
取决于低延迟和高吞吐量之间的工作负载平衡。
但可以做一些一般性的陈述。
例如，推测解码通常是一个糟糕的选择，
因为它会损害高吞吐量状态下的性能。

与此相关的是，我们在这里没有 vLLM 和 SGLang 之间的具体推荐。
除了上面关于主机开销延迟与批量吞吐量的观点之外，
我们看到的主要区别是 vLLM 新模型的上市速度要快一些
和新功能，但 SGLang 更容易破解和扩展。

### 在 Modal 上提供突发的 LLM 推理工作负载

Modal 的快速自动扩展基础设施，
来自[自定义容器运行时和文件系统](/blog/jono-containers-talk)，
到[内存快照支持](/blog/gpu-mem-snapshots)，
特别适合
突发的 LLM 推理工作负载。

这些工作负载可以由普通的
[功能](/docs/guide/apps)
通过远程 Python 调用或作为调用
[网络功能](/docs/guide/webhooks)
通过 HTTP 调用。
Web Functions 更适合与各种集成
生产者和消费者。
降低开销与增加复杂性之间的权衡
使用[模态服务器](https://modal.com/docs/guide/servers#servers)通常不值得。

[`@modal.concurrent` 装饰器](/docs/guide/concurrent-inputs)
支持同时设置限制（`max_inputs`）
和一个目标（`target_inputs`）。
设置高于目标的限制以吸收负载增加
现有容量（通常以更长的延迟为代价）。
确保推理服务器配置为处理大小为 `max_inputs` 的批次
无需内部排队！
几乎所有GPU程序都可以快照，但大多数GPU程序
需要一些代码更改才能成为快照。
例如，vLLM 和 SGLang 推理服务器都需要
在快照之前手动将权重/KV 缓存卸载到 CPU 内存。

有关详细信息，请参阅我们在 Modal 上运行突发工作负载的完整示例代码
与 vLLM [此处](https://modal.com/docs/examples/vllm_snapshot)
以及 SGLang [此处](https://modal.com/docs/examples/sglang_snapshot)。