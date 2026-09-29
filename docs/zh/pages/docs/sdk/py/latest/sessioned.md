<!-- modal-docs: machine-translated zh-CN from English source -->

# 已进行会话

```python
sessioned()
```

在服务器上启用粘性会话的装饰器。

每个请求都必须携带从会话启动请求中获取的会话令牌；具有相同令牌的请求是
路由到同一个容器，直到会话空闲`idle_timeout`秒或显式终止。一个
只要容器保持实时会话，就不会缩小规模。

仅适用于`@app.server()`。

**使用**

使用 `@modal.sessioned()` 装饰器定义一个服务器：

```python
app = modal.App("my-app")

@app.server(port=8000)
@modal.sessioned()
class MyServer:
    @modal.enter()
    def start(self):
        self.proc = subprocess.Popen(["python3", "-m", "http.server", "8000"])

    @modal.exit()
    def stop(self):
        self.proc.terminate()
```

部署应用程序后，从另一个脚本启动会话：

```python notest
server = modal.Server.from_name("my-app", "MyServer")
server_url = server.get_url()
session = server.sessions.start(idle_timeout=600)
headers = {"Modal-Authorization": f"Bearer {session.token}"}

requests.get(server_url, headers=headers).raise_for_status()

server.sessions.terminate(session.token)
```