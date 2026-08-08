<!-- modal-docs: machine-translated zh-CN from English source -->

# 环境

模态环境将模态应用程序和资源相互隔离。

环境是[工作空间](/docs/guide/workspaces)的细分，
允许您部署相同的应用程序（或一组应用程序）
在多个实例中出于不同目的而无需更改代码。

环境的典型用例包括拥有一个 `dev`
环境和一个 `prod` 环境。生产应用程序受到保护，不会被覆盖
开发新功能时，但您仍然可以使用
应用程序的“实时”且可能复杂的结构。

每个环境都有自己的一组 [Secrets](/docs/guide/secrets) 以及任何
对象查找，例如 [Dicts](/docs/guide/dicts) 或 [Volumes](/docs/guide/volumes)，
默认情况下，从环境中的应用程序执行将查找同一环境中的对象。

默认情况下，每个工作区都有一个名为“main”的环境。新
可以在 CLI 上创建环境：

```sh
modal environment create dev
```

运行`modal environment --help`以获取更多信息。

工作空间最多可以有 1500 个环境。

创建后，环境将在导航栏中显示为下拉菜单
[模态仪表板](/apps)，让您设置浏览所有模态应用程序、秘密和存储
按部署到的环境进行过滤。

大多数 CLI 命令还支持 `--env` 标志，让您指定哪个
您想要与之交互的环境，例如：

```sh
modal run --env=dev app.py
modal volume create --env=dev storage
```

要为当前 CLI 配置文件设置默认环境，您可以使用
`modal config set-environment`，例如：

```sh
modal config set-environment dev
```

或者，您可以设置 `MODAL_ENVIRONMENT` 环境变量。

## 环境网络后缀

环境有一个“web 后缀”，用于制作
[Web 函数 URL](/docs/guide/webhook-urls) 在您的工作区中是唯一的。一
环境允许没有后缀（`""`）。

## 跨环境查找

可以在环境之外的环境中显式查找对象
您的应用程序运行在：

```python
production_secret = modal.Secret.from_name(
    "my-secret",
    environment_name="main",
)
```

```python notest
modal.Function.from_name(
    "my_app",
    "some_function",
    environment_name="dev"
)
```

但是， `environment_name` 参数是可选的，省略它将使用
来自对象关联应用程序或调用上下文的环境。