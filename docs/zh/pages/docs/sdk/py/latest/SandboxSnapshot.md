<!-- modal-docs: machine-translated zh-CN from English source -->

# 沙盒快照

```python
class SandboxSnapshot(modal.object.Object)
```

> 沙箱内存快照处于**早期预览**状态。

`SandboxSnapshot` 对象可让您与通过调用创建的存储沙箱快照进行交互
沙盒实例上的`._experimental_snapshot()`。这包括文件系统和内存状态
拍摄快照时的原始沙箱。

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作
需要时会懒洋洋地补充水分。主要用例是当您需要时
访问对象元数据，例如其 ID。

*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 来自\_id

```python
from_id(cls, sandbox_snapshot_id, client=None)
```

为现有快照 ID 构造 `SandboxSnapshot`。

**参数**

<Parameter name="sandbox_snapshot_id" type="str" description="Snapshot ID returned when the snapshot was created." />
<Parameter name="client" type="&quot;modal.client.Client | None&quot;" defaultValue="None" description="Modal client to use; defaults to ⟦T7⟧ when omitted." />

**退货**

`SandboxSnapshot` 手柄（使用时水合验证 ID）。