<!-- modal-docs: machine-translated zh-CN from English source -->

# 期间

```python
class Period(modal.schedule.Schedule)
```

创建一个在每个给定时间间隔运行的计划。

只有 `seconds` 可以是浮点数。所有其他参数都是整数。

请注意，`days=1` 会在每天的同一时间触发该功能。
这与 `seconds=84000` 的行为不同，因为几天来
由于夏令时和闰秒的不同长度。同样，
使用`months=1`将在每个月的同一天触发该功能。

这的行为类似于
[日期实用程序](https://dateutil.readthedocs.io/en/latest/relativedelta.html)
包。

**使用**

```python
import modal
app = modal.App()

@app.function(schedule=modal.Period(days=1))
def f():
    print("This function will run every day")

modal.Period(hours=4)          # runs every 4 hours
modal.Period(minutes=15)       # runs every 15 minutes
modal.Period(seconds=math.pi)  # runs every 3.141592653589793 seconds
```

```python
__init__(self, *, years=0, months=0, weeks=0, days=0, hours=0, minutes=0,
    seconds=0)
```