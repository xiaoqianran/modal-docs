<!-- modal-docs: machine-translated zh-CN from English source -->

# GPU 健康状况

Modal 持续监控主机 GPU 运行状况，因严重问题而耗尽工作人员的精力
并针对客户分类发出警告。

[metrics](/docs/guide/gpu-metrics) 和容器日志流的事件记录促进了 GPU 运行状况的应用程序级可观察性。

## `[gpu-health]` 记录

带有 NVIDIA GPU 的容器连接到我们的 `gpu-health` 监控系统
并接收源自应用程序软件行为、系统软件行为或硬件故障的事件日志。

这些日志的格式如下：`[gpu-health] [LEVEL] GPU-[UUID]: EVENT_TYPE: MSG`

* `gpu-health`：名称表明来源是Modal的可观测系统。
* `LEVEL`：表示日志消息的严重级别。
* `GPU_UUID`：与事件关联的 GPU 设备的唯一标识符（如果有）。
* `EVENT_TYPE`：事件源的类型。模态监视器多种类型的错误，
  包括 Xid、SXid 和不可纠正的 ECC。请参阅下文了解更多详情。
* `MSG`：消息组件可以是从事件源获取的原始消息，也可以是 Modal 提供的问题描述。

＃＃ 等级
严重性级别可能是 `CRITICAL` 或 `WARN`。 Modal 通过排空底层 Worker 并迁移客户容器来自动响应 `CRITICAL` 级别事件。
`WARN` 级别日志可能是良性的，也可能表明存在应用程序或库错误。我们的系统不会针对警告采取自动操作。

## 处理应用程序级别的健康问题

如上所述，Modal 会自动响应关键 GPU 事件，但警告级别事件仍然可以
与应用程序异常相关联。应用程序应该捕获由 GPU 相关故障引起的异常
并拨打`modal.experimental.stop_fetching_inputs()`：

```python
import modal.experimental
...

@app.function(gpu="H100")
def demo():
    try:
        ... # code which may hit GPU fault (e.g. illegal memory access)
    except RuntimeError:
        modal.experimental.stop_fetching_inputs()
        return
```

## Xid 和 SXid

Xid 消息是来自 NVIDIA 驱动程序的错误报告。 SXid 或“Switch Xid”是 GPU 到 GPU 通信中使用的 NVSwitch 组件的报告，因此仅与多 GPU 容器相关。

一个典型的严重 Xid 错误是“从总线上摔下来”报告，代码 79。 `gpu-health` 事件日志如下所示：

```
[gpu-health] [CRITICAL] GPU-1234: XID: NVRM: Xid (PCI:0000:c6:00): 79, pid=1101234, name=nvc:[driver], GPU has fallen off the bus.
```

Xid 代码有 100 多个，它们的频率、严重性和特异性差异很大。
[NVIDIA官方文档](https://docs.nvidia.com/deploy/xid-errors/index.html)提供的信息有限，所以
我们在下面维护自己的表格信息。

<GpuHealthXidTable/>