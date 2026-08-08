<!-- modal-docs: machine-translated zh-CN from English source -->

# 计划任务

```python
class Cron(modal.schedule.Schedule)
```

Cron 作业是一种计划，使用
[Unix cron 选项卡](https://crontab.guru/) 语法。

替代计划类型是 [`modal.Period`](https://modal.com/docs/sdk/py/latest/Period)。

```python
__init__(self, cron_string, timezone="UTC")
```

构造一个根据 cron 表达式字符串运行的计划。

**参数**

<Parameter name="cron_string" type="str" description="Cron expression (see crontab.guru)." />
<Parameter name="timezone" type="str" defaultValue="&quot;UTC&quot;" description="IANA timezone name; defaults to UTC." />

**使用**

```python
import modal
app = modal.App()


@app.function(schedule=modal.Cron("* * * * *"))
def f():
    print("This function will run every minute")
```

我们可以使用 cron 字符串指定不同的计划，例如：

```python
modal.Cron("5 4 * * *")  # run at 4:05am UTC every night
modal.Cron("0 9 * * 4")  # runs every Thursday at 9am UTC
```

我们还可以选择指定时区，例如：

```python
modal.Cron("0 6 * * *", timezone="America/New_York")
```

如果未指定时区，则默认为 UTC。