<!-- modal-docs: machine-translated zh-CN from English source -->

# 集群网络

i6pn（IPv6私有网络）是Modal的私有容器到容器网络解决方案。它允许用户创建 Modal 容器集群，这些集群可以以低延迟和高带宽（≥ 50Gbps）相互发送网络流量。

通常，`modal.Function`容器可以发起到互联网的出站网络连接，但其他容器不能直接寻址它们。另一方面，支持 i6pn 的容器可以直接连接到其他支持 i6pn 的容器，这是 Modal Beta `@modal.experimental.clustered` 功能的关键推动因素。

您可以在任何 `modal.Function` 上启用 i6pn：

```python
@app.function(i6pn=True)
def hello_private_network():
    import socket

    i6pn_addr = socket.getaddrinfo("i6pn.modal.local", None, socket.AF_INET6)[0][4][0]
    print(i6pn_addr) # fdaa:5137:3ebf:a70:1b9d:3a11:71f2:5f0f
```

在此代码片段中，我们看到启用 i6pn 的容器能够通过以下方式检索其自己的 IPv6 地址：
解决`i6pn.modal.local`。为了让这个函数容器发现*其他*容器的地址，
地址共享必须使用辅助数据结构来实现，例如共享的`modal.Dict`或`modal.Queue`。

## 专用网络

所有 i6pn 网络流量都是*工作区专用*。

![i6pn-图](https://modal-cdn.com/cdnbot/i6pn-1eksk4vuy_c4c4a0df.webp)

在上图中，工作空间 A 具有子网 `fdaa:1::/48`，而工作空间 B 具有子网 `fdaa:2::/48`。
您会注意到它们共享前 16 位。这是因为 `fdaa::/16` 前缀包含我们所有的私有网络 IPv6 地址，而每个工作区在创建时都会分配一个随机的 32 位标识符。这些共同构成了 48 位子网。

这样做的结果是，只有同一工作区中的容器才能看到彼此并互相发送网络数据包。 i6pn 网络默认是安全的。

## 区域边界

Modal 运营着一个[全球舰队](/docs/guide/region-selection)，并允许容器在多个云提供商和多个区域上运行。然而，i6pn 网络是区域范围的功能，这意味着只有同一区域中启用 i6pn 的容器才能执行网络通信。

Modal 支持 i6pn 的原语（例如`@modal.experimental.clustered`）会自动限制容器地理位置和云放置，以确保容器间的连接。

## 公网访问集群组网

对于需要公开访问的集群网络容器，您需要使用 [modal.Tunnel](/docs/guide/tunnels) 公开端口，因为 i6pn 地址不公开。
考虑让容器设置一个隧道并充当专用集群网络的网关。