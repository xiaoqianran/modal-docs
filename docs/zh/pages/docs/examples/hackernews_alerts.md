<!-- modal-docs: machine-translated zh-CN from English source -->

# 在云端运行 cron 作业来搜索黑客新闻

在此示例中，我们使用 Modal 部署一个 cron 作业，定期查询 Hacker News
与给定搜索词匹配的新帖子，并将结果发布到 Slack。

## 导入并定义应用程序

让我们从导入开始，并定义一个模态应用程序。

```python
import os
from datetime import datetime, timedelta

import modal

app = modal.App("example-hackernews-alerts")

```

现在，我们定义一个安装了 `slack-sdk` 包的镜像，我们可以在其中运行一个函数
发布一条松弛消息。

```python
slack_sdk_image = modal.Image.debian_slim().uv_pip_install("slack-sdk")

```

## 定义函数并导入秘密

我们的 Slack 机器人需要访问机器人令牌。
我们可以使用 Modal 的 [Secrets](https://modal.com/secrets) 接口来完成此任务。
要快速创建 Slack 机器人机密，请单击“创建新机密”按钮。
然后，从列表选项中选择 Slack 秘密模板，
并按照“在哪里可以找到凭据？”中的说明进行操作。控制板。
将你的秘密命名为`hn-bot-slack.`

现在，我们定义函数`post_to_slack`，它简单地使用我们的令牌实例化 Slack 客户端，
然后使用它向给定的频道名称发布消息。

```python
@app.function(
    image=slack_sdk_image,
    secrets=[modal.Secret.from_name("hn-bot-slack", required_keys=["SLACK_BOT_TOKEN"])],
)
async def post_to_slack(message: str):
    import slack_sdk

    client = slack_sdk.WebClient(token=os.environ["SLACK_BOT_TOKEN"])
    client.chat_postMessage(channel="hn-alerts", text=message)


```

## 搜索黑客新闻

我们将使用 Algolia 的 [Hacker News Search API](https://hn.algolia.com/api) 来查询帖子
匹配过去 X 天内的给定搜索词。让我们定义搜索词和查询周期。

```python
QUERY = "serverless"
WINDOW_SIZE_DAYS = 1

```

我们还定义一个安装了 `requests` 包的镜像，这样我们就可以查询 API。

```python
requests_image = modal.Image.debian_slim().uv_pip_install("requests")

```

我们现在可以定义我们的主入口点，查询 Algolia 的术语，并调用 `post_to_slack`
关于所有结果。我们指定一个[时间表](https://modal.com/docs/guide/cron)
在函数装饰器中，这意味着我们的函数将按照给定的时间间隔自动运行。

```python
@app.function(image=requests_image)
def search_hackernews():
    import requests

    url = "http://hn.algolia.com/api/v1/search"

    threshold = datetime.utcnow() - timedelta(days=WINDOW_SIZE_DAYS)

    params = {
        "query": QUERY,
        "numericFilters": f"created_at_i>{threshold.timestamp()}",
    }

    response = requests.get(url, params, timeout=10).json()
    urls = [item["url"] for item in response["hits"] if item.get("url")]

    print(f"Query returned {len(urls)} items.")

    post_to_slack.for_each(urls)


```

## 测试运行

我们现在可以测试运行我们的预定函数，如下所示：`modal run hackernews_alerts.py::app.search_hackernews`

## 定义计划并部署

我们定义一个每天都会被Modal调用的函数

```python
@app.function(schedule=modal.Period(days=1))
def run_daily():
    search_hackernews.remote()


```

为了将其部署为持久性 cron 作业，您可以运行 `modal deploy hackernews_alerts.py`，

作业部署完成后，访问【应用页面】(https://modal.com/apps)页面即可查看
它的执行历史、日志和其他统计数据。