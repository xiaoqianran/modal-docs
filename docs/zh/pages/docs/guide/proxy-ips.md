<!-- modal-docs: machine-translated zh-CN from English source -->

# 代理

<Callout variant="beta" />

您可以安全地连接专用网络中的资源
使用模态代理。代理是之间的安全隧道
具有静态 IP 的应用程序和退出节点。您可以将这些静态 IP 列入白名单
在您的网络防火墙中，确保只有来自这些的流量
允许 IP 地址进入您的网络。

代理是唯一的，不在工作区之间共享。所有流量
您的应用程序和代理服务器之间的数据使用加密
[WireGuard](https://www.wireguard.com/)。

模态代理构建在 [vprox](https://github.com/modal-labs/vprox) 之上，
用于创建高可用代理服务器的 Modal 开源项目
使用 WireGuard。

## 创建代理

<Callout variant="gated-feature">

代理可在<a href="/pricing">团队和企业计划</a>上使用。访问<a href="/settings/plans">工作空间设置</a>进行升级。

</Callout>

您可以在工作区的[设置](/settings)页面中创建代理。
团队计划用户可以创建 1 个代理，企业用户可以创建 3 个代理。每个代理
最多可以有五个静态 IP 地址。

如果您需要更大的限制，请联系<support@modal.com>。

您可以在创建代理时选择代理应驻留在哪个区域。
这使您可以控制流量将经过世界上的哪个地方。
将其放置在更靠近您要连接的资源的位置可以减少整体延迟。

## 使用代理

代理上线后，将其添加到带有参数的模态函数中
`proxy=Proxy.from_name("<your-proxy>")`。例如：

```python
import modal
import subprocess

app = modal.App(image=modal.Image.debian_slim().apt_install("curl"))

@app.function(proxy=modal.Proxy.from_name("<your-proxy>"))
def my_ip():
    subprocess.run(["curl", "-s", "ifconfig.me"])

@app.local_entrypoint()
def main():
    my_ip.remote()
```

来自您的函数的所有网络流量现在都将使用代理作为隧道。

上面的程序将始终打印相同的独立 IP 地址
它在 Modal 基础设施中运行的位置。如果同一个程序
如果没有代理运行，它会打印不同的IP
地址取决于它运行的位置。

## 代理性能

通过代理的所有流量均由 WireGuard 加密。这增加了
函数网络的延迟。如果您遇到网络问题
对于与性能相关的代理，首先将更多的 IP 地址添加到您的
代理（请参阅[向代理添加更多 IP 地址](#adding-more-ip-addresses-to-a-proxy)）。

将代理放置在地理位置上更靠近目标也可以提高整体性能。
创建代理时选择代理区域，请参见[创建代理](#creating-a-proxy)。

## 添加更多 IP 地址到代理

代理最多支持五个静态 IP 地址。添加IP地址可以改善
吞吐量呈线性。
您可以在[设置](/settings) > 代理中将 IP 地址添加到您的工作区。
选择所需的代理并添加新的 IP。

如果代理有多个 IP，Modal 会在运行您的函数时随机选择一个。

## 代理和沙箱

代理也可以与[沙箱](/docs/guide/sandboxes) 一起使用。例如：

```python notest
import modal

app = modal.App.lookup("sandbox-proxy", create_if_missing=True)
sb = modal.Sandbox.create(
    app=app,
    image=modal.Image.debian_slim().apt_install("curl"),
    proxy=modal.Proxy.from_name("<your-proxy>"))

process = sb.exec("curl", "-s", "https://ifconfig.me")
stdout = process.stdout.read()
print(stdout)

sb.terminate()
```

与我们的 Function 实现类似，这个 Sandbox 程序将
始终打印相同的 IP 地址。