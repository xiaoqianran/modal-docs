<!-- modal-docs: machine-translated zh-CN from English source -->

# 从 Postgres 写入 Google Sheets

在本教程中，我们将展示如何使用 Modal 在 Google 表格的电子表格中安排每日报告
它将来自 PostgreSQL 数据库的数据与来自外部 API 的数据结合起来。

特别是，我们将从数据库中提取每个用户的城市，查找该城市当前的天气，
然后构建有多少用户正在经历每种天气类型的计数/直方图。

## 输入凭据

我们首先设置一些访问数据库和输出所需的凭据
电子表格。为了以安全的方式做到这一点，我们在网络上登录我们的 Modal 帐户并转到
[秘密](https://modal.com/secrets) 部分。

### 数据库

首先，我们将输入我们的数据库凭据。最简单的方法是单击“**新建”
Secret** 并选择 **Postgres 兼容** Secret 预设并填写所需内容
信息。然后我们按**下一步**并将我们的秘密命名为`postgres-secret`，然后单击**创建**。

### Google 表格/GCP

现在，我们将添加另一个 Secret，用于通过 Google Cloud Platform 访问 Google Sheets。单击**新建
秘密**并选择 Google 表格预设。
为了访问 Google Sheets API，我们需要在 Google Cloud 中创建一个*服务帐户*
平台。如果您已有服务帐户 json 文件，则可以跳过此步骤。

1. 注册 Google Cloud Platform 或登录（如果尚未登录）
   （<https://cloud.google.com/>）。

2. 前往<https://console.cloud.google.com/>。

3. 在左侧导航窗格中，转到**IAM 和管理** > **服务帐户**。

4. 单击 **+ 创建服务帐户** 按钮。

5. 为服务帐户指定一个合适的名称，例如“sheet-access-bot”。单击**完成**。你不
   此时必须授予它任何特定的访问权限。

6. 在出现的列表视图中单击您的新服务帐户，然后导航至 **Keys**
   部分。

7. 单击“**添加密钥**”并选择“**创建新密钥**”。使用 **JSON** 密钥类型并通过以下方式确认
   单击**创建**。

8. 此时应将 json 密钥文件下载到您的计算机。复制其中的内容
   文件并将其用作新密钥中 `SERVICE_ACCOUNT_JSON` 字段的值。

我们将这个另一个 Secret 命名为 `"gsheets-secret"`。

现在，您可以从使用注释的模态函数访问 Secrets 的值
对应的`modal.Secret`，例如：

```python
import os

import modal

app = modal.App("example-db-to-sheet")


@app.function(secrets=[modal.Secret.from_name("postgres-secret")])
def show_host():
    # automatically filled from the specified secret
    print("Host is " + os.environ["PGHOST"])


```
因为这些 Secret 是 Python 对象，所以您可以在代码中构造和操作它们。
下面我们将通过定义一个变量来保存访问 Postgres 的秘密来做到这一点

您还可以指定

```python
pg_secret = modal.Secret.from_name(
    "postgres-secret",
    required_keys=["PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD"],
)


```

为了连接到数据库，我们将使用 `psycopg2` Python 包。为了使其可用
对于您的 Modal 函数，您需要为其提供一个 `image` 参数，告诉 Modal 如何
构建包含该包的容器映像。我们将以 `Image.debian_slim` 为基础内置到 Modal 中的图像，并确保安装所需的二进制包以及
`psycopg2` 包本身：

```python
pg_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("libpq-dev")
    .uv_pip_install("psycopg2~=2.9.9")
)

```

由于 **Postgres 兼容** 密钥的默认密钥名与环境相对应
`psycopg2`寻找的变量，我们现在可以轻松连接到数据库，即使没有
代码中的显式凭据。我们将创建一个简单的函数来查询每个城市
`users` 表中的用户。

```python
@app.function(image=pg_image, secrets=[pg_secret])
def get_db_rows(verbose=True):
    import psycopg2

    conn = psycopg2.connect()  # no explicit credentials needed
    cur = conn.cursor()
    cur.execute("SELECT city FROM users")
    results = [row[0] for row in cur.fetchall()]
    if verbose:
        print(results)
    return results


```

请注意，我们在函数内部而不是全局范围内导入`psycopg2`。这使我们能够
即使在未安装 `psycopg2` 的环境中也可以运行此模态函数。我们可以测试运行
该函数使用 `modal run` shell 命令：`modal run db_to_sheet.py::app.get_db_rows`。
要运行此函数，请确保数据库中有一个名为 `users` 的表，其中包含名为 `city` 的列。
您可以使用以下 SQL 命令用一些示例数据填充表：

```sql
CREATE TABLE users (city TEXT);
INSERT INTO users VALUES ('Stockholm,,Sweden');
INSERT INTO users VALUES ('New York,NY,USA');
INSERT INTO users VALUES ('Tokyo,,Japan');
```

## 应用 Python 逻辑

对于源数据中的每一行，我们将使用以下命令运行当前天气的在线查找
<http://openweathermap.org> API。为此，我们将 API 密钥添加到
另一个模态秘密。我们将使用一个名为“天气秘密”的自定义秘密和密钥
`OPENWEATHER_API_KEY` 包含 OpenWeatherMap 的 API 密钥。

```python
requests_image = modal.Image.debian_slim(python_version="3.11").uv_pip_install(
    "requests~=2.31.0"
)


@app.function(
    image=requests_image,
    secrets=[
        modal.Secret.from_name("weather-secret", required_keys=["OPENWEATHER_API_KEY"])
    ],
)
def city_weather(city):
    import requests

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": os.environ["OPENWEATHER_API_KEY"]}
    response = requests.get(url, params=params)
    weather_label = response.json()["weather"][0]["main"]
    return weather_label


```

我们将利用 Modal 的内置 `function.map` 方法来创建我们的报告。 `function.map`
通过在序列中的每个元素上执行函数，可以非常轻松地并行化工作
数据。对于这个例子，我们将只对每种天气类型进行简单的行计数——
回答“有多少用户正在经历每种类型的天气？”这一问题。

```python
from collections import Counter


@app.function()
def create_report(cities):
    # run city_weather for each city in parallel
    user_weather = city_weather.map(cities)
    count_users_by_weather = Counter(user_weather).items()
    return count_users_by_weather


```

让我们尝试运行这个！为了使触发该功能变得简单
预定义的输入数据，我们创建一个“本地入口点”，可以
从命令行运行

```bash
modal run db_to_sheet.py
```

```python
@app.local_entrypoint()
def main():
    cities = [
        "Stockholm,,Sweden",
        "New York,NY,USA",
        "Tokyo,,Japan",
    ]
    print(create_report.remote(cities))


```

使用 `modal run db_to_sheet.py` 运行本地入口点应该打印如下内容：
`dict_items([('Clouds', 3)])`。
请注意，由于该文件只有一个应用程序，并且该应用程序只有一个本地入口点
我们只需要指定文件来运行它 - 函数/入口点是推断出来的。

在这种情况下，逻辑非常简单，但在现实世界中，您可以应用
机器学习模型或任何其他可以构建到容器中以转换数据的工具。

## 将输出发送到 Google 表格

我们将设置一个新的 Google 表格来发送我们的报告。使用 Google 中的“共享”对话框
Sheets，将文档共享到服务帐户的电子邮件地址（json 文件中`client_email` 字段的值）
并使服务帐户成为文档的编辑者。

您可能还需要在 Google Cloud Platform 控制台中为您的项目启用 Google Sheets API。
如果是这样，当您运行该函数时，URL 将打印在 403 Forbidden 错误消息中。
以https://console.developers.google.com/apis/api/sheets.googleapis.com/overview.开头

最后，我们需要将代码指向正确的 Google Sheet。我们需要文档的*密钥*。
您可以在 Google Sheet 的 URL 中找到密钥。它出现在 URL 中的 `/d/` 之后，例如：
`https://docs.google.com/spreadsheets/d/1wOktal......IJR77jD8Do`。

我们将使用 `pygsheets` python 包进行身份验证
Google Sheets，然后使用我们刚刚创建的报告中的信息更新电子表格：

```python
pygsheets_image = modal.Image.debian_slim(python_version="3.11").uv_pip_install(
    "pygsheets~=2.0.6"
)


@app.function(
    image=pygsheets_image,
    secrets=[
        modal.Secret.from_name("gsheets-secret", required_keys=["SERVICE_ACCOUNT_JSON"])
    ],
)
def update_sheet_report(rows):
    import pygsheets

    gc = pygsheets.authorize(service_account_env_var="SERVICE_ACCOUNT_JSON")
    document_key = "1JxhGsht4wltyPFFOd2hP0eIv6lxZ5pVxJN_ZwNT-l3c"
    sh = gc.open_by_key(document_key)
    worksheet = sh.sheet1
    worksheet.clear("A2")

    worksheet.update_values("A2", [list(row) for row in rows])


```

至此，我们已经拥有运行完整程序所需的一切。我们可以把它们放在一起
另一个模态函数，并添加 [`schedule`](https://modal.com/docs/guide/cron) 参数，以便它每天自动运行：

```python
@app.function(schedule=modal.Period(days=1))
def db_to_sheet():
    rows = get_db_rows.remote()
    report = create_report.remote(rows)
    update_sheet_report.remote(report)
    print("Updated sheet with new weather distribution")
    for weather, count in report:
        print(f"{weather}: {count}")


```

现在可以使用 `modal deploy db_to_sheet.py` 部署整个应用程序。 [应用程序页面](https://modal.com/apps)
显示 cron 作业的执行历史记录，并让您导航到每个调用的日志。
要在开发过程中从本地代码触发手动运行，您还可以使用 cli 触发此功能：
`modal run db_to_sheet.py::db_to_sheet`

请注意，上面所有 `@app.function()` 带注释的函数都在按每个指定的隔离容器中远程运行。
函数，但它们的调用就像我们使用常规 Python 函数一样无缝。这是一个简单的
展示如何混合和匹配使用不同环境的模态函数并让它们反馈
互相调用，甚至互相调用，就好像它们都是同一个本地程序中的函数一样。