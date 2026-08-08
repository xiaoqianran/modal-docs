<!-- modal-docs: machine-translated zh-CN from English source -->

# asgi\_app

```python
asgi_app(*, label=None, custom_domains=None, requires_proxy_auth=False)
```

用于将 ASGI 应用程序注册为 Web 函数的装饰器。

异步服务器网关接口 (ASGI) 是 Python 的标准
Web 应用程序，受所有流行的 Python Web 库支持。

要了解如何将 Modal 与流行的 Web 框架结合使用，请参阅
[Web 功能指南](https://modal.com/docs/guide/webhooks)。

**使用**

```python
from typing import Callable

@app.function()
@modal.asgi_app()
def create_asgi() -> Callable:
    ...
```