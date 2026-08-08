<!-- modal-docs: machine-translated zh-CN from English source -->

# 秘密

使用 Secrets 安全地向您的模态函数提供凭证和其他敏感信息。

您可以通过以下方式创建和编辑 Secrets
[仪表板](/秘密)，
命令行界面 ([`modal secret`](/docs/cli/latest/secret))，以及
通过 Python 代码编程 ([`modal.Secret`](/docs/sdk/py/latest/Secret))。

要将 Secrets 注入运行函数的容器中，请添加
`secrets=[...]` `app.function` 或 `app.cls` 装饰的参数。

## 限制

Secret 中的每个键值对均受到以下限制：

* **键名**的长度最多为 **16,384 个字符**。它们只能包含字母、数字和下划线，并且不能以数字开头。
* **值** 的长度最多可达 **32,768 个字符**。

如果您需要为容器提供更大的值，请考虑将数据写入 [Volume](/docs/guide/volumes) 并在运行时读取它。

## 从模态仪表板部署 Secret

创建模态秘密的最常见方法是使用
[模态仪表板的 Secrets 面板](/secrets)，
它还显示任何现有的秘密。

当您创建新的 Secret 时，系统会提示您使用许多模板来帮助您入门。
这些模板演示了 Postgres 和 MongoDB 中所有内容的标准凭证格式
到权重和偏差以及拥抱脸部。

## 在模态应用程序中使用 Secret

然后，您可以在定义模态应用程序时通过构造它`from_name`来使用您的秘密
然后将其内容作为环境变量访问。
例如，如果您有一个名为 `secret-keys` 的 Secret，其中包含密钥
`MY_PASSWORD`：

```python
@app.function(secrets=[modal.Secret.from_name("secret-keys")])
def some_function():
    import os

    secret_key = os.environ["MY_PASSWORD"]
    ...
```

每个 Secret 可以包含多个键和值，但您也可以注入
多个 Secret，允许您将 Secret 分成更小的可重用单元：

```python
@app.function(secrets=[
    modal.Secret.from_name("my-secret-name"),
    modal.Secret.from_name("other-secret"),
])
def other_function():
    ...
```Secrets 按顺序应用，因此后面的键值`modal.Secret`
如果发生冲突，列表中的对象将覆盖先前的键值。
例如，如果上面的两个`modal.Secret`对象都包含键`FOO`，那么
`"other-secret"` 中的值将始终存在于 `os.environ["FOO"]` 中。

## 以编程方式创建 Secret

除了在 Web 仪表板上定义 Secrets 之外，您还可以
以编程方式直接在脚本中创建一个 Secret 并将其发送到
您的函数使用`Secret.from_dict(...)`。如果您愿意，这会很有用
将 Secrets 从本地开发计算机发送到远程 Modal 应用程序。

```python
import os

if modal.is_local():
    local_secret = modal.Secret.from_dict({"FOO": os.environ["LOCAL_FOO"]})
else:
    local_secret = modal.Secret.from_dict({})


@app.function(secrets=[local_secret])
def some_function():
    import os

    print(os.environ["FOO"])
```

如果您安装了[`python-dotenv`](https://pypi.org/project/python-dotenv/)，
您还可以使用 `Secret.from_dotenv()` 从 `.env` 中的变量创建 Secret
文件

```python
@app.function(secrets=[modal.Secret.from_dotenv()])
def some_other_function():
    print(os.environ["USERNAME"])
```

## 从命令行与 Secrets 交互

您可以使用 `modal secret` 命令行界面创建、列出和删除模态机密。

查看您的秘密及其时间戳

```bash
modal secret list
```

通过将 `{KEY}={VALUE}` 对传递给 `modal secret create` 创建一个新的 Secret：

```bash
modal secret create database-secret PGHOST=uri PGPORT=5432 PGUSER=admin PGPASSWORD=hunter2
```

或使用环境变量（假设下面设置了`PGPASSWORD`环境变量
例如由您的 CI 系统）：

```bash
modal secret create database-secret PGHOST=uri PGPORT=5432 PGUSER=admin PGPASSWORD="$PGPASSWORD"
```

通过将秘密的名称传递给 `modal secret delete` 来删除秘密：

```bash
modal secret delete database-secret
```