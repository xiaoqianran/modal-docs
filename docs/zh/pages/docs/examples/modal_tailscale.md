<!-- modal-docs: machine-translated zh-CN from English source -->

# 将模态应用程序添加到 Tailscale

此示例演示如何将 Modal 与 Tailscale (https://tailscale.com) 集成。
它概述了配置 Modal 容器以便它们加入 Tailscale 网络的步骤。

我们使用自定义入口点自动将容器添加到 Tailscale 网络（tailnet）。
这种配置使容器能够相互交互并与
同一尾网内的其他应用程序。

```python
import modal

```

安装 Tailscale 并复制自定义入口点脚本 ([entrypoint.sh](https://github.com/modal-labs/modal-examples/blob/main/10_integrations/tailscale/entrypoint.sh))。脚本必须是
可执行的。

```python
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("curl")
    .run_commands("curl -fsSL https://tailscale.com/install.sh | sh")
    .uv_pip_install("requests==2.32.3", "PySocks==1.7.1")
    .add_local_file("./entrypoint.sh", "/root/entrypoint.sh", copy=True)
    .run_commands("chmod a+x /root/entrypoint.sh")
    .entrypoint(["/root/entrypoint.sh"])
)
app = modal.App("example-modal-tailscale", image=image)

```

软件包可能未安装在本地。这会捕获导入错误并
仅尝试在容器中导入。

```python
with image.imports():
    import socket

    import socks

```

配置 Python 以全局使用 SOCKS5 代理。

```python
if not modal.is_local():
    socks.set_default_proxy(socks.SOCKS5, "0.0.0.0", 1080)
    socket.socket = socks.socksocket


```

运行添加 Tailscale 秘密的函数。我们建议创建一个[可重复使用的临时密钥](https://tailscale.com/kb/1111/ephemeral-nodes)。

```python
@app.function(
    secrets=[
        modal.Secret.from_name("tailscale-auth", required_keys=["TAILSCALE_AUTHKEY"]),
        modal.Secret.from_dict(
            {
                "ALL_PROXY": "socks5://localhost:1080/",
                "HTTP_PROXY": "http://localhost:1080/",
                "http_proxy": "http://localhost:1080/",
            }
        ),
    ],
)
def connect_to_machine():
    import requests

    # Connect to other machines in your tailnet.
    resp = requests.get("http://my-tailscale-machine:5000")
    print(resp.content)


```

使用 `modal run modal_tailscale.py` 运行此脚本。您将看到 Tailscale 日志
当容器启动时表明您能够成功登录并且
代理（SOCKS5 和 HTTP）已成功创建。你也会
能够在 Tailscale 仪表板的“机器”选项卡中查看模态容器。
每个推出的新容器都将显示为一台新的“机器”。容器是
可使用其 Tailscale 名称或 IP 地址单独寻址。