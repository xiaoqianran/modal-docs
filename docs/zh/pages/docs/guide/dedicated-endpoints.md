<!-- modal-docs: machine-translated zh-CN from English source -->

# 专用端点

专用端点运行任何模型
[模态库](https://modal.com/library)，或自定义权重，在隔离、
自动缩放容器。当您需要控制自动缩放和
区域或专用容量。

## 创建专用端点

从 CLI 创建端点：

```bash
modal endpoint create --model Qwen/Qwen3.5-4B
```

Modal 解析模型，选择兼容的服务配方，然后启动
供应。该命令会打印端点 ID 和仪表板链接，您可以在其中查看
可以在线观看。也可以从以下位置创建专用端点
仪表板中的 [**端点**](https://modal.com/endpoints) 选项卡。

如果省略 `--name`，Modal 会从模型中派生名称。

## 查看生成的源码

专用端点是一个模态应用程序，使用与
Modal SDK，包括 [`@app.server()`](/docs/guide/servers)。打开
**源**视图来检查其生成的`serve.py`。您可以复制并调整它
当您需要完全控制服务堆栈时，将代码写入您自己的模态应用程序。

## 提供自定义权重

自定义权重使用兼容模态库模型的服务配方。通行证
该模型具有 `--model`，然后提供来自 Hugging Face 或 Modal 的权重
音量。

来自拥抱的脸：

```bash
modal endpoint create \
  --name my-fine-tune \
  --model Qwen/Qwen3.6-27B \
  --custom-hf-repo aisingapore/Qwen-SEA-LION-v4.5-27B-IT \
  --custom-hf-revision da42f2c0984d716fb2032e4176d81adfac98c630
```
将 `--custom-hf-token` 用于门禁或私有存储库。

从包含 `config.json` 文件的模态体：

```bash
modal endpoint create \
  --name my-volume-model \
  --model Qwen/Qwen3.5-4B \
  --custom-volume-name my-volume \
  --custom-volume-path /checkpoints/1234
```

## 配置容量和放置

默认情况下，专用端点在负载下按比例放大，在空闲时缩小至零。
从仪表板配置最小、最大和缓冲区容器。

路由区域控制请求进入 Modal 的位置。计算布局
控制容器运行的位置。独立设置它们：

```bash
modal endpoint create \
  --model Qwen/Qwen3.5-4B \
  --routing-region us-east \
  --compute-region us-west
```

使用 `--colocate-compute` 来在路由区域中运行计算。固定
计算到一个区域会产生
[区域选择乘数](/docs/guide/region-selection#pricing)。

## 指标

**活动**视图显示随时间变化的请求量。使用**响应**进行检查
个人请求和**容器**检查为其提供服务的容器。

对于文本生成模型，**指标**将**推理指标**—延迟、
吞吐量、正在运行和排队的请求、缓存使用情况和推测
解码——来自**服务器指标**，例如自动缩放和CPU、内存、网络、
和 GPU 利用率。

## 基准测试

对于文本生成模型，**Benchmark** 视图可以运行可重复的实时模型
或针对实时端点的代理工作负载。基准产生流量，
触发自动缩放，并产生通常的计算成本。

将结果视为时间点测量：车队规模、位置和冷量
开始都会影响他们。

## 管理专用端点

列出环境中的端点：

```bash
modal endpoint list --env prod
```

当您不再需要端点时停止它：

```bash
modal endpoint stop my-endpoint --env prod
```

停止端点是永久性的。它会拆除服务应用程序并
删除其托管模型缓存；端点无法重新启动。

## 定价

专用端点使用的 GPU、CPU、内存和其他资源的账单
他们的容器以标准模态计算速率。端点缩放为零
不产生计算费用。