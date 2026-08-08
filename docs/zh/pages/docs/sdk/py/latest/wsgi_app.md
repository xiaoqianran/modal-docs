<!-- modal-docs: machine-translated zh-CN from English source -->

# wsgi\_app

```python
wsgi_app(*, label=None, custom_domains=None, requires_proxy_auth=False)
```

用于使用 Modal 函数注册 WSGI 应用程序的装饰器。

Web 服务器网关接口 (WSGI) 是同步 Python Web 应用程序的标准。
已经【被ASGI接口继承】(https://asgi.readthedocs.io/en/latest/introduction.html#wsgi-compatibility)
它与 ASGI 兼容并支持 Web 套接字等附加功能。
Modal 通过 [`asgi_app`](https://modal.com/docs/sdk/py/latest/asgi_app) 支持 ASGI。

要了解如何将此装饰器与流行的 Web 框架一起使用，请参阅
[Web 功能指南](https://modal.com/docs/guide/webhooks)。

**使用**

```python
from typing import Callable

@app.function()
@modal.wsgi_app()
def create_wsgi() -> Callable:
    ...
```