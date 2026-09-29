<!-- modal-docs: machine-translated zh-CN from English source -->

# 集群

```python
class Cluster(modal.object.Object)
```

为集群功能或服务器安排在一起的一组容器。

在集群内使用`Cluster.from_context()`，或使用`Cluster.from_id()`
远程检查集群。容器按集群等级排序。

## 对象\_id

```python
object_id(self)
```

集群的唯一`cu-`对象ID。

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的身份同步。

很少需要显式调用此方法，因为大多数操作
需要时会懒洋洋地补充水分。主要用例是当您需要时
访问对象元数据，例如其 ID。*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 来自\_context

```python
from_context()
```

从集群的容器之一引用集群。

在初始化的集群执行之外引发 `InvalidError`。

## 来自\_id

```python
from_id(cluster_id, *, client=None)
```

通过 ID 引用集群。

**参数**

<Parameter name="cluster_id" type="str" description="ID of the cluster." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T14⟧ when omitted." />

**使用**

```python notest
cluster = modal.Cluster.from_id("cu-123")
```

## 容器\_ids

```python
container_ids(self)
```

返回按集群排名排序的容器 ID。

## 容器\_ips

```python
container_ips(self, family="ipv6")
```

返回按集群排名排序的容器 IP 地址。

默认返回 IPv6 地址；通过 IPv4 的`family="ipv4"`。
这些地址用于集群内通信。

必须从此集群中的容器调用；否则提高 `InvalidError`。

## 容器\_rank
```python
container_rank(self, container_id=None)
```

返回容器在该集群中的排名。

不带参数，在没有网络的情况下返回执行容器的排名
请求。如果它不是该集群的成员，则引发 `InvalidError`。

使用显式容器 ID，查找其在集群成员资格中的排名。
非会员提高`InvalidError`。