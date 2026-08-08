<!-- modal-docs: machine-translated zh-CN from English source -->

# 转发

```python
forward(port, *, unencrypted=False, h2_enabled=False, client=None)
```

使用 TLS 从正在运行的 Modal 容器内部公开公开端口。

如果设置了`unencrypted`，这也会在随机端口上公开未加密的 TCP 套接字
数量。这可用于通过 SSH 连接到容器（请参见下面的示例）。请注意，它是在公共互联网上，所以
确保您使用的是基于 TCP 的安全协议。

如果设置了`h2_enabled`，TLS 服务器将通告对 HTTP/2 的支持。

**重要提示：** 这是一个实验性 API，将来可能会发生变化。

**使用**

```python notest
import modal
from flask import Flask

app = modal.App(image=modal.Image.debian_slim().pip_install("Flask"))
flask_app = Flask(__name__)


@flask_app.route("/")
def hello_world():
    return "Hello, World!"


@app.function()
def run_app():
    # Start a web server inside the container at port 8000. `modal.forward(8000)` lets us
    # expose that port to the world at a random HTTPS URL.
    with modal.forward(8000) as tunnel:
        print("Server listening at", tunnel.url)
        flask_app.run("0.0.0.0", 8000)

    # When the context manager exits, the port is no longer exposed.
```

**原始 TCP 使用情况：**

```python
import socket
import threading

import modal


def run_echo_server(port: int):
    """Run a TCP echo server listening on the given port."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("0.0.0.0", port))
    sock.listen(1)

    while True:
        conn, addr = sock.accept()
        print("Connection from:", addr)

        # Start a new thread to handle the connection
        def handle(conn):
            with conn:
                while True:
                    data = conn.recv(1024)
                    if not data:
                        break
                    conn.sendall(data)

        threading.Thread(target=handle, args=(conn,)).start()


app = modal.App()


@app.function()
def tcp_tunnel():
    # This exposes port 8000 to public Internet traffic over TCP.
    with modal.forward(8000, unencrypted=True) as tunnel:
        # You can connect to this TCP socket from outside the container, for example, using `nc`:
        #  nc <HOST> <PORT>
        print("TCP tunnel listening at:", tunnel.tcp_socket)
        run_echo_server(8000)
```

**SSH 示例：**
这假设您在 `~/.ssh/id_rsa{.pub}` 中有一个 rsa 密钥对，这是一个简单的示例
让您可以通过 SSH 连接到 Modal 容器。

```python
import subprocess
import time

import modal

app = modal.App()
image = (
    modal.Image.debian_slim()
    .apt_install("openssh-server")
    .run_commands("mkdir /run/sshd")
    .add_local_file("~/.ssh/id_rsa.pub", "/root/.ssh/authorized_keys", copy=True)
)


@app.function(image=image, timeout=3600)
def some_function():
    subprocess.Popen(["/usr/sbin/sshd", "-D", "-e"])
    with modal.forward(port=22, unencrypted=True) as tunnel:
        hostname, port = tunnel.tcp_socket
        connection_cmd = f'ssh -p {port} root@{hostname}'
        print(f"ssh into container using: {connection_cmd}")
        time.sleep(3600)  # keep alive for 1 hour or until killed
```

如果您打算更广泛地使用它，建议将子进程和端口
在 @app.cls 的 `@enter` 生命周期方法中转发代码，以仅生成单个
每个容器的 ssh 服务器和端口（而不是函数的每个输入都有一个）。