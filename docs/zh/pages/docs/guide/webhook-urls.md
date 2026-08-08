<!-- modal-docs: machine-translated zh-CN from English source -->

# Web 函数 URL

本指南记录了 [Web Functions](/docs/guide/webhooks) 的 URL 行为
Modal 上：自动生成、配置、编程检索等。

## 从代码中确定 Web 函数 URL

模态函数与
[`fastapi_endpoint`](/docs/sdk/py/latest/fastapi_endpoint),
[`asgi_app`](/docs/sdk/py/latest/asgi_app),
[`wsgi_app`](/docs/sdk/py/latest/wsgi_app),
或 [`web_server`](/docs/sdk/py/latest/web_server) 装饰器
可以通过互联网获取
[`serve`d](/docs/cli/latest/serve) 或 [`deploy`ed](/docs/cli/latest/deploy)
所以他们有一个 URL。此 URL 显示在 `modal` CLI 输出中
并可在该功能的模态 [仪表板](/apps) 中使用。

要以编程方式确定函数的 URL，
检查它的[`get_web_url()`](/docs/sdk/py/latest/Function#get_web_url)
属性：

```python
@app.function(image=modal.Image.debian_slim().pip_install("fastapi[standard]"))
@modal.fastapi_endpoint(docs=True)
def show_url() -> str:
    return show_url.get_web_url()
```

对于已部署的函数，这也适用于其他 Python 代码！
你只需要做一个 [`from_name`](/docs/sdk/py/latest/Function#from_name)
基于函数的名称及其 [App](/docs/guide/apps)：

```python notest
import requests

remote_function = modal.Function.from_name("app", "show_url")
remote_function.get_web_url() == requests.get(handle.get_web_url()).json()
```

## 自动生成的 URL

默认情况下，模态函数
将从 `modal.run` 域提供服务。
完整的 URL 将由多条信息构建而成
唯一标识端点。

在较高级别上，已部署应用程序的 Web 功能 URL 具有
以下结构：`https://<source>--<label>.modal.run`。

`source`组件代表应用程序所在的工作空间和环境
部署。如果您的工作区只有一个环境，则 `source` 将
只是工作区名称。多个环境通过一个消除歧义
[“环境后缀”](/docs/guide/environments#environment-web-suffixes)，所以
完整的来源是`<workspace>-<suffix>`。然而，每个环境一个
工作区允许有空后缀，在这种情况下，源只会是`<workspace>`。

`label` 组件代表 URL 所对应的特定 App 和 Function
路线到.默认情况下，它们用连字符连接，因此标签将
是`<app>-<function>`。

这些组件被标准化为仅包含小写字母、数字和破折号。

为了将所有这些放在一起，请考虑以下示例。如果该组织的成员
`ECorp` 工作区使用 `main` 环境（其网络为 `prod`）
后缀）以使用 `flask-app` 的 Webhook 部署 `text_to_speech` 应用程序
函数中，URL 将具有以下组成部分：

* *来源*：
  * *工作区名称段*: `ECorp` → `ecorp`
* *环境网络后缀 slug*: `main` → `prod`
* *标签*：
  * *应用程序名称段*: `text_to_speech` → `text-to-speech`
  * *函数名称段*: `flask_app` → `flask-app`

完整的 URL 为 `https://ecorp-prod--text-to-speech-flask-app.modal.run`。

## 用户指定的标签

还可以自定义每个功能使用的`label`
通过将参数传递给相关的 Web Function 装饰器：

```python
import modal

image = modal.Image.debian_slim().pip_install("fastapi")
app = modal.App(name="text_to_speech", image=image)


@app.function()
@modal.fastapi_endpoint(label="speechify")
def web_endpoint_handler():
    ...
```

基于上面的示例，此代码将生成以下 URL：
`https://ecorp-prod--speechify.modal.run`。

用户指定的标签不会自动标准化，但带有
无效字符将被拒绝。

## 临时应用程序

为了支持开发工作流程，临时应用程序（即应用程序
使用 `modal serve` 创建的）将在其 URL 后附加 `-dev` 后缀
标签（无论标签是自动生成的还是用户指定的）。
这可以防止开发工作干扰已部署的版本
相同的应用程序。

如果一个临时应用程序正在提供 Web 功能，而另一个临时应用程序
创建寻找相同的标签，新函数将“窃取”正在运行的函数
函数的标签。

这确保了临时函数的最新迭代是
服务请求并且较旧的请求停止接收网络流量。

## 截断
如果生成的子域标签长度超过 63 个字符，则会
被截断。

例如，以下子域标签太长，为 67 个字符：
`ecorp--text-to-speech-really-really-realllly-long-function-name-dev`。

通过计算超长标签的 SHA-256 哈希值来进行截断，然后
取该哈希值的前 6 个字符。过长的子域标签是
截断为 56 个字符，然后用破折号连接到哈希前缀。在
上面的例子，结果 URL 是
`ecorp--text-to-speech-really-really-rea-1b964b-dev.modal.run`。

标签散列和截断的组合提供了 63 个的唯一列表
字符，符合 DNS 系统限制和唯一性要求。

## 自定义域

<Callout variant="gated-feature">
<a href="/pricing">团队和企业计划</a>提供自定义域。访问<a href="/settings/plans">工作空间设置</a>进行升级。
</Callout>

如需更多自定义，您可以将自己的域名与 Web Functions 结合使用。
如果您的[计划](/定价)支持自定义域，请访问[自定义域
选项卡](/settings/custom-domains) 在您的工作区设置中将域名添加到您的
工作区。

您可以在 Modal 中使用三种域：

* **Apex:** 根域名如`example.com`
* **子域：**单个子域条目，例如`my-app.example.com`，
  `api.example.com`等
* **通配符域：** 在`*.example.com`这样的子域中，或者在
  更深层次如`*.modal.example.com`

<Callout variant="info">
添加自定义域不会禁用自动生成的 <code>.modal.run</code> URL。自定义域和原始 URL 将继续有效。
</Callout>

系统会要求您使用您的域名更新域 DNS 记录
注册商，然后验证 Modal 中的配置。一旦记录有
正确更新和传播后，您的自定义域就可以使用了。

您可以将任何模态 Web 功能分配到工作区中的任何注册域
与 `custom_domains` 参数。

```python
import modal

app = modal.App("custom-domains-example")


@app.function()
@modal.fastapi_endpoint(custom_domains=["api.example.com"])
def hello(message: str):
    return {"message": f"hello {message}"}
```

然后，您可以运行 `modal deploy` 将您的 Web Functions 上线。

```shell
$ curl -s https://api.example.com?message=world
{"message": "hello world"}
```

请注意，Modal 会自动为您生成并更新 TLS 证书
自定义域。由于我们在首次访问您的域时执行此操作，因此可能
第一次请求时会有 1-2 秒的额外延迟。附加请求使用
缓存的证书。

您还可以注册多个域名并将它们与同一个网站关联
功能。

```python
import modal

app = modal.App("custom-domains-example-2")


@app.function()
@modal.fastapi_endpoint(custom_domains=["api.example.com", "api.example.net"])
def hello(message: str):
    return {"message": f"hello {message}"}
```

对于 **通配符** 域，Modal 将自动解析任意自定义
端点（并颁发 TLS 证书）。例如，如果添加通配符
域`*.example.com`，然后您可以在下面创建任何自定义域
`example.com`：

```python
import random
import modal

app = modal.App("custom-domains-example-2")

random_domain_name = random.choice(range(10))


@app.function()
@modal.fastapi_endpoint(custom_domains=[f"{random_domain_name}.example.com"])
def hello(message: str):
    return {"message": f"hello {message}"}
```

自定义域也可以与
[ASGI](https://modal.com/docs/sdk/py/latest/asgi_app) 或
[WSGI](https://modal.com/docs/sdk/py/latest/wsgi_app) 使用相同的应用程序
`custom_domains` 论证。