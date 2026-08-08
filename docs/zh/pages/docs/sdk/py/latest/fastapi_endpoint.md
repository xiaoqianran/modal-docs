<!-- modal-docs: machine-translated zh-CN from English source -->

# fastapi\_endpoint

```python
fastapi_endpoint(*, method="GET", label=None, custom_domains=None, docs=False,
    requires_proxy_auth=False)
```

创建可通过 HTTP 在公共 URL 上寻址的 Web 函数。

Modal 将在内部使用 [FastAPI](https://fastapi.tiangolo.com/) 来公开一个
简单、单一的请求处理程序。如果您正在定义自己的`FastAPI`应用程序
（例如，如果您想定义多个路线），请使用 `@modal.asgi_app` 代替。

使用此装饰器创建的 Web Function 将自动具有
[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) 已启用
并且可以利用 FastAPI 的许多功能。

有关将 Modal 与流行的 Web 框架结合使用的更多信息，请参阅我们的
[Web 功能指南](https://modal.com/docs/guide/webhooks)。

*在 v0.73.82 中添加*：此函数替换了已弃用的 `@web_endpoint` 装饰器。