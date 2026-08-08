<!-- modal-docs: machine-translated zh-CN from English source -->

# 安排远程 cron 作业

一个常见的要求是每天或每周在给定时间执行某些任务
自动。 Modal 通过函数调度来促进这一点。

## 基本调度

假设我们有一个带有函数的 Python 模块 `heavy.py`，
`perform_heavy_computation()`。

```python
# heavy.py
def perform_heavy_computation():
    ...

if __name__ == "__main__":
    perform_heavy_computation()
```

为了安排此功能每天运行一次，我们创建一个模态应用程序并附加
我们的函数带有 `@app.function` 装饰器和时间表参数：

```python
# heavy.py
import modal

app = modal.App()

@app.function(schedule=modal.Period(days=1))
def perform_heavy_computation():
    ...
```

要激活计划，请通过 CLI 部署您的应用程序：

```shell
modal deploy --name daily_heavy heavy.py
```

或者以编程方式：

```python
if __name__ == "__main__":
   app.deploy()
```

现在该函数将在初始部署时每天运行，
无需您进行任何进一步的互动。

当您对函数进行更改时，只需重新运行部署命令即可
覆盖旧的部署。

请注意，当您重新部署函数时，`modal.Period` 会重置，并且
计划将在最近一次部署后 X 小时运行。

如果您想定期运行您的函数而不受部署的干扰，
`modal.Cron`（见下文）是更好的选择。

## 监控您的预定运行

要查看计划函数过去的执行日志，请转至
Modal 网站上的 [Apps](https://modal.com/apps) 部分。
目前无法暂停计划。相反，应该删除时间表并
应用程序已重新部署。可以在应用程序的仪表板上手动启动时间表
页面，使用“立即运行”按钮。

## 时间表类型

有两种基本计划值 -
[`modal.Period`](/docs/sdk/py/latest/Period) 和
[`modal.Cron`](/docs/sdk/py/latest/Cron)。

[`modal.Period`](/docs/sdk/py/latest/Period) 允许您指定一个时间间隔
函数调用之间，例如`Period(days=1)` 或 `Period(hours=5)`：

```python
# runs once every 5 hours
@app.function(schedule=modal.Period(hours=5))
def perform_heavy_computation():
    ...
```

[`modal.Cron`](/docs/sdk/py/latest/Cron) 为您提供更好的控制
[cron](https://en.wikipedia.org/wiki/Cron)语法：

```python
# runs at 8 am (UTC) every Monday
@app.function(schedule=modal.Cron("0 8 * * 1"))
def perform_heavy_computation():
    ...

# runs daily at 6 am (New York time)
@app.function(schedule=modal.Cron("0 6 * * *", timezone="America/New_York"))
def send_morning_report():
    ...
```

有关更多详细信息，请参阅 API 参考
[期间](/docs/sdk/py/latest/Period)、[Cron](/docs/sdk/py/latest/Cron) 和
[函数](/docs/sdk/py/latest/Function)