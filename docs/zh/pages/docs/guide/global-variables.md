<!-- modal-docs: machine-translated zh-CN from English source -->

# 全局变量

在某些情况下，您可能希望对象或数据在**全局**中可用
范围。例如：

* 您需要在计划函数中使用数据（计划函数不
  接受参数）
* 您需要在全局范围内构造对象（例如 Secrets）才能用作
  函数注释
* 你不想让许多函数签名与一些通用参数变得混乱
  他们都使用相同的参数，并通过多层函数传递相同的参数
  来电。

对于这些情况，您可以使用 `modal.is_local` 函数，它返回 `True`
如果应用程序在本地运行（正在初始化）或 `False` 如果应用程序正在执行
在云中。

例如，要创建一个可以传递的 [`modal.Secret`](/docs/guide/secrets)
到你的函数装饰器来创建环境变量，你可以运行：

```python
import os

if modal.is_local():
    pg_password = modal.Secret.from_dict({"PGPASS": os.environ["MY_LOCAL_PASSWORD"]})
else:
    pg_password = modal.Secret.from_dict({})


@app.function(secrets=[pg_password])
def get_secret_data():
    connection = psycopg2.connect(password=os.environ["PGPASS"])
    ...
```

## 关于常规模块全局变量的警告

如果您尝试使用一些本地数据*不*构建模块范围内的全局变量
使用像`modal.is_local`这样的东西，它可能会产生意想不到的效果，因为
你的Python模块不仅会被加载到你的本地机器上，还会
关于远程工作人员。

例如，这通常不起作用：

```python notest
# blob.json doesn't exist on the remote worker, so this will cause an error there
data_blob = open("blob.json", "r").read()

@app.function()
def foo():
    print(data_blob)
```