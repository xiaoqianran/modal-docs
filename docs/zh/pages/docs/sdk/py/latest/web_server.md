<!-- modal-docs: machine-translated zh-CN from English source -->

# 网络\_服务器

```python
web_server(port, *, startup_timeout=5.0, label=None, custom_domains=None,
    requires_proxy_auth=False)
```

在容器内注册 HTTP Web 服务器的装饰器。

这类似于 `@modal.asgi_app` 和 `@modal.wsgi_app`，但它允许您暴露完整的
HTTP 服务器侦听容器端口。这对于用其他语言编写的服务器很有用
如 Rust，以及与 aiohttp 和 Tornado 等非 ASGI 框架集成。

上面的示例启动一个简单的文件服务器，显示根目录的内容。
在这里，对 URL 的请求将发送到容器上的外部端口 8000。的
`http.server` 模块包含在 Python 中，但您可以在此处运行任何内容。

在内部，Web服务器通过Modal透明地转换为Web Function，因此它具有
与其他 Web Function 相同的无服务器自动缩放行为。

有关更多信息，请参阅[Web Functions 指南](https://modal.com/docs/guide/webhooks)。

**使用**

```python
import subprocess

@app.function()
@modal.web_server(8000)
def my_file_server():
    subprocess.Popen("python -m http.server -d / 8000", shell=True)
```