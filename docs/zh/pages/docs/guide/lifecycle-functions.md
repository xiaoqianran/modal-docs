<!-- modal-docs: machine-translated zh-CN from English source -->

# 容器生命周期钩子

由于 Modal 会为多个输入重用同一个容器，有时您
可能希望在容器启动或退出时运行某些代码一次。

为了实现这一点，您需要使用 Modal 的类语法和
[`@app.cls`](/docs/sdk/py/latest/App#cls) 装饰器。具体来说，您将
需要：

1. 通过使其成为类的成员，将函数转换为方法。
2. 使用 `@app.cls(...)` 和之前相同的参数来装饰该类
   有`@app.function(...)`。
3.代替原始方法上的`@app.function`装饰器，使用
   `@modal.method` 或适当的装饰器
   [Web 函数](#lifecycle-hooks-for-web-functions)。
4. 根据您的需要将正确的方法“hooks”添加到您的类中：
   * `@modal.enter` 用于一次性初始化（远程）
   * `@modal.exit` 用于一次性清理（远程）

## `@modal.enter`

当新容器启动时，将调用容器条目处理程序。这是
对于进行一次性初始化很有用，例如加载模型权重或
导入仅存在于该映像中的包。

要使用，使您的函数成为类的成员，并应用 `@modal.enter()`
一个或多个类方法的装饰器：

```python
import modal

app = modal.App()

@app.cls(cpu=8)
class Model:
    @modal.enter()
    def run_this_on_container_startup(self):
        import pickle
        self.model = pickle.load(open("model.pickle"))

    @modal.method()
    def predict(self, x):
        return self.model.predict(x)


@app.local_entrypoint()
def main():
    Model().predict.remote(x=123)
```
使用[异步模态](/docs/guide/async)应用程序时，您可以使用
改为异步方法：

```python
import modal

app = modal.App()

@app.cls(memory=1024)
class Processor:
    @modal.enter()
    async def my_enter_method(self):
        self.cache = await load_cache()

    @modal.method()
    async def run(self, x):
        return await do_some_async_stuff(x, self.cache)


@app.local_entrypoint()
async def main():
    await Processor().run.remote(x=123)
```

注意： `@modal.enter()` 装饰器取代了早期的 `__enter__` 语法，
已被弃用。

## `@modal.exit`

当容器即将退出时，将调用容器退出处理程序。它是
对于进行一次性清理很有用，例如关闭数据库连接或
保存中间结果。要使用，请使您的函数成为类的成员，并且
应用 `@modal.exit()` 装饰器：

```python
import modal

app = modal.App()

@app.cls()
class ETLPipeline:
    @modal.enter()
    def open_connection(self):
        import psycopg2
        self.connection = psycopg2.connect(os.environ["DATABASE_URI"])

    @modal.method()
    def run(self):
        # Run some queries
        pass

    @modal.exit()
    def close_connection(self):
        self.connection.close()


@app.local_entrypoint()
def main():
    ETLPipeline().run.remote()
```

当容器被[抢占](/docs/guide/preemption) 时，也会调用退出处理程序。
退出处理程序有 30 秒的宽限期来完成，并且它将
如果完成时间超过该时间，则被杀死。

## Web 函数的生命周期挂钩

模态 [Web Functions](/docs/guide/webhooks) 可以转换为类语法
以及。不用`@modal.method`，只需使用任意一个 Web 函数即可
装饰器（`@modal.fastapi_endpoint`、`@modal.asgi_app` 或 `@modal.wsgi_app`）
你之前用过。

```python
from fastapi import Request

import modal

image = modal.Image.debian_slim().pip_install("fastapi")
app = modal.App("web-function-cls", image=image)

@app.cls()
class Model:
    @modal.enter()
    def run_this_on_container_startup(self):
        self.model = pickle.load(open("model.pickle"))

    @modal.fastapi_endpoint()
    def predict(self, request: Request):
        ...
```