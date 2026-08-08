<!-- modal-docs: machine-translated zh-CN from English source -->

# 隧道

Modal 允许您在 Modal 容器上公开实时 TCP 端口。这是由
创建一个将端口转发到公共互联网的*隧道*。

```python
import modal

app = modal.App()


@app.function()
def start_app():
    # Inside this `with` block, port 8000 on the container can be accessed by
    # the address at `tunnel.url`, which is randomly assigned.
    with modal.forward(8000) as tunnel:
        print(f"tunnel.url        = {tunnel.url}")
        print(f"tunnel.tls_socket = {tunnel.tls_socket}")
        # ... start some web server at port 8000, using any framework
```

隧道是直接连接并自动终止 TLS。几内
容器启动的毫秒数，此函数会打印一条消息，例如：

```
tunnel.url        = https://wtqcahqwhd4tu0.r5.modal.host
tunnel.tls_socket = ('wtqcahqwhd4tu0.r5.modal.host', 443)
```

您还可以在[沙盒](/docs/guide/sandbox-networking#forwarding-ports)上创建隧道
直接暴露容器的端口。

## 建造隧道

隧道是获得低延迟、直接连接到正在运行的应用程序的最快方式
容器。您可以使用它们通过**交互式运行实时浏览器应用程序
终端**、**Jupyter 笔记本**、**VS Code 服务器**等。

作为一个简单的示例，以下是公开 Jupyter 笔记本的方法：

```python
import os
import secrets
import subprocess

import modal


image = modal.Image.debian_slim().pip_install("jupyterlab")
app = modal.App(image=image)


@app.function()
def run_jupyter():
    token = secrets.token_urlsafe(13)
    with modal.forward(8888) as tunnel:
        url = tunnel.url + "/?token=" + token
        print(f"Starting Jupyter at {url}")
        subprocess.run(
            [
                "jupyter",
                "lab",
                "--no-browser",
                "--allow-root",
                "--ip=0.0.0.0",
                "--port=8888",
                "--LabApp.allow_origin='*'",
                "--LabApp.allow_remote_access=1",
            ],
            env={**os.environ, "JUPYTER_TOKEN": token, "SHELL": "/bin/bash"},
            stderr=subprocess.DEVNULL,
        )
```

当您运行该函数时，它会启动 Jupyter 并为您提供公共 URL。这是
就这么简单。

支持所有模态功能。如果你
[需要GPU](https://modal.com/docs/guide/gpu)，将`gpu=`传递给
`@app.function()` 装饰器。如果你
[需要更多CPU、RAM](https://modal.com/docs/guide/resources)，或附加
[卷](https://modal.com/docs/guide/volumes)，那些
也只是工作。

### 可编程启动

隧道 API 是完全按需的，因此您可以将它们作为
网络请求。
例如，您可以在不离开 Modal 的情况下制作类似 Jupyter Hub 的东西，
当用户访问 URL 时为他们提供自己的 Jupyter 笔记本：

```python
import modal


image = modal.Image.debian_slim().pip_install("fastapi[standard]")
app = modal.App(image=image)


@app.function(timeout=900)  # 15 minutes
def run_jupyter(q):
    ...  # as before, but return the URL on app.q


@app.function()
@modal.fastapi_endpoint(method="POST")
def jupyter_hub():
    from fastapi import HTTPException
    from fastapi.responses import RedirectResponse

    ...  # do some validation on the secret or bearer token

    if is_valid:
        with modal.Queue.ephemeral() as q:
            run_jupyter.spawn(q)
            url = q.get()
            return RedirectResponse(url, status_code=303)

    else:
        raise HTTPException(401, "Not authenticated")
```

这为每个向 Web 函数发送 POST 请求的用户提供了自己的
Jupyter 笔记本服务器，位于完全隔离的 Modal 容器上。

您可以使用 VS Code 执行相同的操作并获得即时的一些基本版本，
无服务器 IDE！

### 高级：未加密的 TCP 隧道

默认情况下，隧道仅通过安全随机 URL 暴露于 Internet，并且
连接具有自动 TLS（HTTPS 中的“S”）。然而，有时你可能
需要公开一个协议，例如直接通过 TCP 的 SSH 服务器。在
在这种情况下，我们支持*未加密的*隧道：

```python notest
with modal.forward(8000, unencrypted=True) as tunnel:
    print(f"tunnel.tcp_socket = {tunnel.tcp_socket}")
```

可能会产生如下输出：

```
tunnel.tcp_socket = ('r3.modal.host', 23447)
```

然后，您可以通过 TCP 连接，例如使用 `nc r3.modal.host 23447`。不像
加密的 TLS 套接字，这些不能被赋予不可猜测的、加密的
由于 TCP 协议的工作原理，随机 URL 会被分配一个随机端口
号代替。

## 定价

Modal 仅根据集装箱收费
[您使用的资源](https://modal.com/pricing)。没有额外的
拥有活跃隧道的费用。
例如，如果您在端口 8888 上启动 Jupyter Notebook 并通过以下方式访问它
隧道，您可以使用它一个小时进行开发（使用 0.01 个 CPU），然后
实际上用 16 个 CPU 运行一项密集型作业一分钟。你愿意的金额
该小时内的计费为 0.01 + 16 \* (1/60) = **0.28 个 CPU**，即使
您无需重新启动笔记本电脑即可访问 16 个 CPU。

## 安全

隧道在 Modal 的专用全球互联网中继网络上运行。开
启动时，您的容器将连接到最近的隧道，以便您获得
最小延迟，性能与直接连接非常相似
机。

这使得它们非常适合使用基于 Web 的终端进行实时调试会话
像[ttyd](https://github.com/tsl0922/ttyd)。

生成的 URL 是加密随机的，但它们也在
Internet，因此任何人只要获得 URL 就可以访问您的应用程序。

我们目前不会对 L4 以上的请求进行任何检测，因此如果您正在运行
对于 Web 服务器，我们不会添加特殊的代理 HTTP 标头或转换 HTTP/2。
您只是直接获取 TLS 加密的 TCP 流！