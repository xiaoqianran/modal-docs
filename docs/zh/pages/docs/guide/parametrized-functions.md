<!-- modal-docs: machine-translated zh-CN from English source -->

# 参数化函数

单个模态函数可以通过一组参数进行参数化，以便每个独特的参数组合的行为就像一个单独的
模态函数具有自己的自动缩放和生命周期逻辑。

例如，您可能希望为调用您的函数的每个唯一用户拥有一个单独的容器池。在这种情况下，您会
通过用户 ID 参数化您的函数。

要参数化 Modal 函数，您需要使用 Modal 的 [类语法](/docs/guide/lifecycle-functions) 和
[`@app.cls`](/docs/sdk/py/latest/App#cls) 装饰器。具体来说，您需要：

1. 通过使其成为类的成员，将函数转换为方法。
2. 使用 `@app.cls(...)` 和之前的相同参数来装饰该类
   适用于 `@app.function(...)` 或您的 [Web 函数装饰器](/docs/guide/webhooks)。
3. 如果您之前在函数中使用过 `@app.function()` 装饰器，请将其替换为 `@modal.method()`。
4. 使用 `modal.parameter()` 定义数据类样式、类型注释的实例属性，并可选择设置默认值：

```python
import modal

app = modal.App()

@app.cls()
class MyClass:

    foo: str = modal.parameter()
    bar: int = modal.parameter(default=10)

    @modal.method()
    def baz(self, qux: str = "default") -> str:
        return f"This code is running in container pool ({self.foo}, {self.bar}), with input qux={qux}"
```

这些参数为您的类创建一个仅关键字构造函数，并且可以按如下方式调用这些方法：

```python
@app.local_entrypoint()
def main():
    m1 = MyClass(foo="hedgehog", bar=7)
    m1.baz.remote()

    m2 = MyClass(foo="fox")
    m2.baz.remote(qux="override")
```
对 `foo` 和 `bar` 的每个唯一值组合的函数调用将在其自己单独的容器池中运行。
如果您在不同的上下文中使用相同的参数重新构造 `MyClass`，则对 `baz` 的调用将被路由到与以前相同的一组容器。

需要注意的一些事项：

* 参数的总大小限制为 16 KiB。
* 模态类仍然可以通过省略 `= modal.parameter()` 或使用 `= modal.parameter(init=False)` 来注释常规类属性的类型，这些属性与参数化无关，以满足类型检查器的要求。* 支持类型为以下原语：`str`、`int`、`bool` 和 `bytes`。
* 遗留的 `__init__` 构造函数方法正在被删除，请参阅 [1.0 迁移了解详细信息。](/docs/guide/modal-1-0-migration#removing-support-for-custom-cls-constructors)

## 查找参数化函数

如果您想从正在运行的 Python 脚本调用参数化函数
在任何地方，您都可以使用`Cls.lookup`：

```python notest
import modal

MyClass = modal.Cls.from_name("parametrized-function-app", "MyClass")  # returns a class-like object
m = MyClass(foo="snake", bar=12)
m.baz.remote()
```

## 参数化 Web 函数

模态 [Web Functions](/docs/guide/webhooks) 也可以参数化：

```python
app = modal.App("parametrized-endpoint")

@app.cls()
class MyClass():

    foo: str = modal.parameter()
    bar: int = modal.parameter(default=10)

    @modal.fastapi_endpoint()
    def baz(self, qux: str = "default") -> str:
        ...
```

参数在 URL 中指定为查询参数值。

```bash
curl "https://parametrized-endpoint.modal.run?foo=hedgehog&bar=7&qux=override"
curl "https://parametrized-endpoint.modal.run?foo=hedgehog&qux=override"
curl "https://parametrized-endpoint.modal.run?foo=hedgehog&bar=7"
curl "https://parametrized-endpoint.modal.run?foo=hedgehog"
```

## 将参数化函数与生命周期函数结合使用
参数化函数可以与[生命周期函数](/docs/guide/lifecycle-functions) 一起使用。

例如，您可以通过以下方式参数化 [`@modal.enter`](/docs/guide/lifecycle-functions#enter) 生命周期函数来加载特定模型：

```python
@app.cls()
class Model:

    name: str = modal.parameter()
    size: int = modal.parameter(default=100)

    @modal.enter()
    def load_model(self):
        print(f"Loading model {self.name} with size {self.size}")
        self.model = load_model_util(self.name, self.size)

    @modal.method()
    def generate(self, prompt: str) -> str:
        return self.model.generate(prompt)
```

## 性能

目前，参数化函数创建的速率限制为每秒 1 个，并可突发至 1000 个。如果您需要更高的速率限制，请[联系](mailto:support@modal.com)。