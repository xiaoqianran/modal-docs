<!-- modal-docs: machine-translated zh-CN from English source -->

# 一个简单的网络爬虫

在本指南中，我们将通过编写一个简单的网络抓取工具向您介绍 Modal。
我们将逐步解释模态应用程序的基础。

## 设置您的第一个 Modal 应用程序

模态应用程序被编排为 Python 脚本，但理论上可以运行
任何可以在容器中运行的东西。要开始使用，请确保安装
最新的`modal`Python包并设置API令牌（前两个步骤
[此处](https://modal.com/docs/guide))。

## 本地抓取链接

首先，我们创建一个空的 Python 文件`webscraper.py`。该文件将包含我们的应用程序代码。让我们编写一些基本的 Python 代码来获取 a 的内容
网页并打印在文档中找到的链接（`href`属性）：

```python
import re
import sys
import urllib.request


def get_links(url):
    response = urllib.request.urlopen(url)
    html = response.read().decode("utf8")
    links = []
    for match in re.finditer('href="(.*?)"', html):
        links.append(match.group(1))
    return links


if __name__ == "__main__":
    links = get_links(sys.argv[1])
    print(links)
```

现在显然这只是纯标准库Python代码，你可以运行它
在你的机器上：

```bash
$ python webscraper.py http://example.com
['https://www.iana.org/domains/example']
```

## 在模态上运行

要使 `get_links` 函数在 Modal 而不是本地机器上运行，所有
你需要做的是

* 导入`modal`
* 创建一个 [`modal.App`](/docs/reference/modal.App) 实例
* 在函数中添加 `@app.function()` 注释
* 将`if __name__ == "__main__":`块替换为装饰有的函数
  [`@app.local_entrypoint()`](/docs/reference/modal.App#local_entrypoint)
* 使用 `get_links.remote` 调用 `get_links`

```python
import re
import urllib.request
import modal

app = modal.App(name="example-webscraper")


@app.function()
def get_links(url):
    response = urllib.request.urlopen(url)
    html = response.read().decode("utf8")
    links = []
    for match in re.finditer('href="(.*?)"', html):
        links.append(match.group(1))
    return links


@app.local_entrypoint()
def main(url):
    links = get_links.remote(url)
    print(links)
```
您现在可以使用 Modal CLI 运行此命令，使用 `modal run` 而不是 `python`。
这次，当脚本运行时，您将看到额外的进度指示器
运行，类似：

```bash
$ modal run webscraper.py --url http://example.com
✓ Initialized.
✓ Created objects.
['https://www.iana.org/domains/example']
✓ App completed.
```

## 添加依赖

在上面的代码中，我们使用了Python标准库`urllib`库。
这对于静态网页非常有效，但现在很多页面都使用 javascript
动态加载内容，该内容不会出现在加载的 html 文件中。
让我们使用 [Playwright](https://playwright.dev/python/docs/intro) 包来
相反，启动一个可以解释任何 JavaScript 的无头 Chromium 浏览器
这可能在页面上。

我们可以传递[自定义容器图像](/docs/guide/images)（使用定义
[`modal.Image`](/docs/reference/modal.Image)) 到 `@app.function()`
装饰师。我们将使用 `modal.Image.debian_slim` 预捆绑的图像添加
用于安装 Playwright 及其依赖项的 shell 命令：

```python
import modal

app = modal.App("example-webscraper")
playwright_image = modal.Image.debian_slim(python_version="3.10").run_commands(
    "apt-get update",
    "apt-get install -y software-properties-common",
    "apt-add-repository non-free",
    "apt-add-repository contrib",
    "pip install playwright==1.42.0",
    "playwright install-deps chromium",
    "playwright install chromium",
)

```

请注意，我们不必在开发中安装 Playwright 或 Chromium
机器，因为这一切都将在 Modal 中运行。我们现在可以修改我们的`get_links`
功能以利用新工具。

```python
@app.function(image=playwright_image)
async def get_links(cur_url: str) -> list[str]:
    from playwright.async_api import (
        TimeoutError as PlaywrightTimeoutError,
        async_playwright,
    )

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            await page.goto(cur_url, timeout=10_000)  # ten seconds
        except PlaywrightTimeoutError:
            print(f"Timeout loading {cur_url}, skipping")
            await browser.close()
            return []

        links = await page.eval_on_selector_all(
            "a[href]", "elements => elements.map(element => element.href)"
        )
        await browser.close()

    print("Links", links)
    return list(set(links))


```

由于 Playwright 有一个很好的异步接口，我们将重新声明我们的 `get_links`
作为异步函数（Modal 同时适用于同步和异步函数）。
进行此更改后第一次运行该函数时，您会注意到
输出首先显示构建您指定的图像的进度，
之后你的函数像以前一样运行。然后缓存该图像，以便
后续运行该函数时，只要图像存在，就不会重建
定义是一样的。

## 横向扩展

到目前为止，我们的脚本仅获取单个页面的链接。如果我们想要怎么办
并行抓取大量链接？

我们可以使用 Modal 轻松做到这一点，因为有一些魔力：我们包装的函数
有了`@app.function()`装饰器就不再是一个普通的函数，而是一个
模态[函数](https://modal.com/docs/reference/modal.Function)对象。这个
意味着它带有内置的 `map` 属性，可以让我们运行这个函数
并行处理所有输入，根据需要扩展至任意数量的工作人员。

让我们更改代码以并行抓取我们提供给它的所有 url：

```python
@app.local_entrypoint()
def main():
    urls = ["http://modal.com", "http://github.com"]
    for links in get_links.map(urls):
        for link in links:
            print(link)
```

## 部署并按计划运行

假设我们想每天记录抓取的链接。我们将打印循环移至
它自己的 Modal 函数并用 `modal.Period(days=1)` 时间表对其进行注释 -
表明我们想每天运行一次。由于预定的功能不会
从我们的命令行运行，我们还添加了一个硬编码的链接列表来抓取
现在。在更现实的设置中，我们可以从数据库或其他数据库中读取此内容
可访问的数据源。

```python
@app.function(schedule=modal.Period(days=1))
def daily_scrape():
    urls = ["http://modal.com", "http://github.com"]
    for links in get_links.map(urls):
        for link in links:
            print(link)
```

要永久部署应用程序，请运行命令

```
modal deploy webscraper.py
```

运行此命令会部署此功能，然后立即关闭。我们可以
查看部署及其所有运行，包括打印的链接
模态[应用程序页面](https://modal.com/apps)。重新运行脚本将重新部署
包含您所做的任何更改的代码 - 覆盖现有部署
相同的名称（在本例中为“example-webscraper”）。

## 添加 Secrets 并与其他系统集成

假设我们不查看部署的运行日志中的链接，
想将它们发布到 `#scraped-links` Slack 频道。为此，我们可以
利用 [Slack API](https://api.slack.com/) 和 `slack-sdk`
[PyPI 包](https://pypi.org/project/slack-sdk/)。

Slack SDK WebClient 需要 API 令牌才能访问我们的 Slack
工作区，因为将凭据硬编码到应用程序中是不好的做法
代码中我们使用 Modal 的 **Secrets**。秘密是数据片段
作为环境变量注入运行函数的容器中。
创建 Secrets 最简单的方法是访问
[modal.com 的秘密部分](https://modal.com/secrets)。你们都可以创建一个
具有任何环境变量的自由格式秘密，或使用预设
共同服务。我们将使用 Slack 预设并填写必要的内容后
我们会看到一段代码，可以用来发布信息
Slack 使用我们的凭据，如下所示：

```python
import os

slack_sdk_image = modal.Image.debian_slim(python_version="3.10").uv_pip_install(
    "slack-sdk"
)


@app.function(
    image=slack_sdk_image,
    secrets=[
        modal.Secret.from_name(
            "scraper-slack-secret", required_keys=["SLACK_BOT_TOKEN"]
        )
    ],
    retries=3,
)
def bot_token_msg(channel, message):
    import slack_sdk

    client = slack_sdk.WebClient(token=os.environ["SLACK_BOT_TOKEN"])
    print(f"Posting {message} to #{channel}")
    client.chat_postMessage(channel=channel, text=message)


```

注意 `@app.function` 装饰器中的 `retries`。
该参数在函数调用失败时添加自动重试由于临时问题，例如速率限制。阅读更多[这里](https://modal.com/docs/guide/retries)

复制该代码，然后修改 `daily_scrape` 函数以调用
`bot_token_msg`。为了更好地衡量，我们还添加了每个 URL `limit`。

```python
@app.function(schedule=modal.Period(days=1))
def daily_scrape(limit: int = 50):
    urls = ["http://modal.com", "http://github.com"]

    for links in get_links.map(urls):
        for link in links[:limit]:
            bot_token_msg.remote("scraped-links", link)


@app.local_entrypoint()
def main():
    urls = ["http://modal.com", "http://github.com"]
    for links in get_links.map(urls):
        for link in links:
            print(link)


```

请注意，我们可以自由地跨完全不同的函数调用
容器镜像，就像它们是同一程序中的常规 Python 函数一样！

我们保持 `local_entrypoint` 不变，这样我们仍然可以 `modal run`
该脚本用于测试抓取行为而不发布到 Slack。

```bash
modal run webscraper.py  # runs get_links.map via the local_entrypoint
```

如果我们想测试 `daily_scrape` 或 `bot_token_msg` 函数本身，我们也可以这样做！
我们只需将函数的名称添加到 `modal run` 命令的末尾：

```bash
modal run webscraper.py::daily_scrape --limit 1  # quick test
```
现在重新部署脚本以使用更新后的代码覆盖旧部署，并且
您将在 Slack 频道中获得每日已抓取链接的提要 🎉

```bash
modal deploy webscraper.py
```

## 总结

我们展示了如何使用 Modal 开发分布式 Python 数据
使用自定义容器的应用程序。通过简单的构造，我们能够
添加并行执行。通过更改一行代码，我们就能够
从实验开发代码到已部署的应用程序。我们希望
此概述让您大致了解使用 Modal 可以构建什么。