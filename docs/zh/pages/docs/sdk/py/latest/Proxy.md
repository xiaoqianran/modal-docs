<!-- modal-docs: machine-translated zh-CN from English source -->

# 代理

```python
class Proxy(modal.object.Object)
```

代理对象为您的 Modal 容器提供静态出站 IP 地址。

例如，这可用于连接到具有网络白名单的远程地址
一个数据库。更多信息请参阅[指南](https://modal.com/docs/guide/proxy-ips)。

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作
需要时会懒洋洋地补充水分。主要用例是当您需要时
访问对象元数据，例如其 ID。

*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 来自\_name

```python
from_name(name, *, environment_name=None, client=None)
```

通过名称引用代理。

与大多数其他 Modal 对象相比，新的 Proxy 对象必须是
通过仪表板配置，不能通过代码即时创建。

**参数**

<Parameter name="name" type="str" description="Name of the Proxy in the target environment." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to resolve the name in; defaults to the active environment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for loading; defaults to ⟦T4⟧ when omitted." />

**退货**

懒惰的`Proxy`手柄。