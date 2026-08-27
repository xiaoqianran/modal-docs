<!-- modal-docs: machine-translated zh-CN from English source -->

# Algolia 文档搜索爬虫

本教程向您展示如何使用 Modal 运行 [Algolia docsearch
爬虫](https://docsearch.algolia.com/docs/legacy/run-your-own/) 来索引您的
网站并使其可搜索。这不仅仅是示例代码 - 我们运行相同的代码
生产中的代码可支持此页面上的搜索（`Ctrl+K` 来尝试一下！）。

## 基本设置

让我们把进口产品排除在外。

```python
import json
import os
import subprocess

import modal

```

Modal 可以让你[使用和扩展现有的 Docker 镜像](https://modal.com/docs/guide/custom-container#use-an-existing-container-image-with-from_registry)，
只要他们有 `python` 和 `pip` 可用。我们将使用 Algolia 构建的官方爬虫镜像，带有一个小的调整：由于该图像具有 `python` 符号链接到 `python3.6` 并且 Modal 与 Python 3.6 不兼容，因此我们
安装 Python 3.11 并将其符号链接为 `python` 可执行文件。

```python
algolia_image = modal.Image.from_registry(
    "algolia/docsearch-scraper:v1.16.0",
    add_python="3.11",
    setup_dockerfile_commands=["ENTRYPOINT []"],
)

app = modal.App("example-algolia-indexer")

```

## 配置爬虫

现在，让我们用我们想要索引的网站配置爬虫，其中
我们想要抓取的 CSS 选择器。提供了爬虫配置的完整文档
[这里](https://docsearch.algolia.com/docs/legacy/config-file)。

```python
CONFIG = {
    "index_name": "modal_docs",
    "custom_settings": {
        "separatorsToIndex": "._",
        "synonyms": [["cls", "class"]],
    },
    "stop_urls": [
        "https://modal.com/gpu-glossary",
        "https://modal.com/docs/sdk/py/changelog",
    ],
    "start_urls": [
        {
            "url": "https://modal.com/docs/guide",
            "selectors_key": "default",
            "page_rank": 2,
        },
        {
            "url": "https://modal.com/docs/examples",
            "selectors_key": "examples",
            "page_rank": 1,
        },
        {
            "url": "https://modal.com/docs/sdk/py/latest",
            "selectors_key": "reference",
            "page_rank": 1,
        },
        {
            "url": "https://modal.com/docs/sdk/js/latest",
            "selectors_key": "reference",
            "page_rank": 1,
        },
        {
            "url": "https://modal.com/docs/sdk/go/latest",
            "selectors_key": "reference",
            "page_rank": 1,
        },
        {
            "url": "https://modal.com/docs/cli/latest",
            "selectors_key": "reference",
            "page_rank": 1,
        },
    ],
    "selectors": {
        "default": {
            "lvl0": {
                "selector": "header .navlink-active",
                "global": True,
            },
            "lvl1": "article h1",
            "lvl2": "article h2",
            "lvl3": "article h3",
            "text": "article p,article ol,article ul",
        },
        "examples": {
            "lvl0": {
                "selector": "header .navlink-active",
                "global": True,
            },
            "lvl1": "article h1",
            "text": "article p,article ol,article ul",
        },
        "reference": {
            "lvl0": {
                "selector": "//div[contains(@class, 'sidebar')]//a[contains(@class, 'active')]//preceding::a[contains(@class, 'header')][1]",
                "type": "xpath",
                "global": True,
                "default_value": "",
                "skip": {"when": {"value": ""}},
            },
            "lvl1": "article h1",
            "lvl2": "article h2",
            "lvl3": "article h3",
            "text": "article p,article ol,article ul",
        },
    },
}

```

## 创建 API 密钥

如果您还没有帐户，请在 [Algolia](https://www.algolia.com/) 上注册一个帐户。设置
一个项目并创建一个具有 `write` 索引访问权限和 ACL 权限的 API 密钥
`addObject`、`editSettings` 和 `deleteIndex`。现在，在模态上创建一个 Secret [Secrets](https://modal.com/secrets)
包含您刚刚创建的 `API_KEY` 和 `APPLICATION_ID` 的页面。你可以随意命名它，
但我们将其命名为 `algolia-secret`，这就是下面的代码所期望的。

## 实际功能

我们希望从 CI/CD 管道触发我们的爬虫，因此我们将其作为
[Web函数](https://modal.com/docs/guide/webhooks)，可以在部署期间由`GET`请求触发。
您还可以考虑按[计划](https://modal.com/docs/guide/cron)运行爬虫。

Algolia爬虫是为Python 3.6编写的，需要在为其创建的`pipenv`中运行，
所以我们使用子进程来调用它。

```python
@app.function(
    image=algolia_image,
    secrets=[modal.Secret.from_name("algolia-secret")],
)
def crawl():
    # Installed with a 3.6 venv; Python 3.6 is unsupported by Modal, so use a subprocess instead.
    subprocess.run(
        ["pipenv", "run", "python", "-m", "src.index"],
        env={**os.environ, "CONFIG": json.dumps(CONFIG)},
    )


```我们希望能够通过 webhook 触发此功能。

```python
@app.function(image=modal.Image.debian_slim().uv_pip_install("fastapi[standard]"))
@modal.fastapi_endpoint()
def crawl_webhook():
    crawl.remote()
    return "Finished indexing docs"


```

## 部署索引器

这就是我们需要的所有代码！要部署您的应用程序，请运行

```shell
modal deploy algolia_indexer.py
```

如果成功，这将打印新 Webhook 的 URL，您可以使用该 URL
`curl` 或浏览器。 webhook 调用的日志可以在 [apps](https://modal.com/apps) 中找到
页。

索引内容可以在https://www.algolia.com/apps/APP\_ID/explorer/browse/,找到，供您参考
应用\_ID。一旦您对结果感到满意，您就可以[使用您的设备设置 `docsearch` 包
website](https://docsearch.algolia.com/docs/docsearch-v3/)，并创建一个使用该索引的搜索组件。

## 开发的切入点

为了更容易测试这一点，我们还为您运行时提供了一个入口点
`modal run algolia_indexer.py`

```python
@app.local_entrypoint()
def run():
    crawl.remote()

```