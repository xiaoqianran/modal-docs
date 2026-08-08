<!-- modal-docs: machine-translated zh-CN from English source -->

# Modal 1.0 迁移指南

我们于 2025 年 5 月发布了 Modal Python SDK 1.0 版本。
此版本标志着对 API 稳定性的更大承诺，并意味着
我们的开发工作流程发生了一些变化。

在 1.0 版本之前，我们引入了许多弃用和更改
基于我们从早期用户那里收到的反馈。这些改变的目的是
解决痛点并减少对 Modal API 某些方面的困惑。
虽然适应它们需要对现有代码进行一些更改，但我们相信
他们将使 Modal 的使用变得更加容易。

本页重点介绍 1.0 的主要变化并提供一些建议
将您的代码迁移到新的稳定 API。之前引入的大多数弃用
v1.0 发布后将不会强制执行（实际上会导致重大更改）
直到后续的次要版本 (v1.x)，但我们建议更新您的代码，以便
您可以利用新功能并避免未来出现任何问题。

## 弃用 `Image.copy_*` 方法

*引入于：v0.72.11*

我们最近引入了新的 `Image` 方法 — `Image.add_local_dir` 和
`Image.add_local_file` — 替换现有的 `Image.copy_local_dir` 和
`Image.copy_local_file`。
新方法包含了旧方法的功能，但它们的默认值
行为不同并且性能更高。默认情况下，文件将被挂载到
在运行时容器而不是复制到新的`Image`层中。这个可以
在迭代文件内容时大大加快开发速度。

仅当后续构建时才需要构建新的`Image`层
步骤将使用添加的文件。在这种情况下，您可以将 `copy=True` 传入
`Image.add_local_file` 或 `Image.add_local_dir`。

`Image.add_local_dir`方法还有一个`ignore=`参数，您可以用于传递文件匹配模式（使用 dockerignore 规则）或谓词
排除文件的函数。

## 弃用 `Mount` 作为公共 API 的一部分

*引入：v0.72.4* | *强制实施：v1.0.0*

目前，本地文件可以通过以下方式挂载到容器文件系统：
将它们包含在 `Image` 定义中或通过传递 `modal.Mount` 对象
直接到 `App.function` 或 `App.cls` 装饰器。作为 1.0 的一部分
发布后，我们正在简化要定义的容器文件系统配置
仅由用于每个功能的 `Image` 决定。这意味着弃用
以下：

* `App.function`和`App.cls`的`mount=`参数
* 几个`modal.Image`方法的`context_mount=`参数
* `Image.copy_mount`方法
* `Mount`对象

使用 `App.function` 和 `App.cls` 的 `mount=` 参数的代码应该是
迁移以将这些文件/目录传递给该函数使用的`Image`
或 Cls，即使用 `Image.add_local_file`、`Image.add_local_dir`，或
`Image.add_local_python_source`方法：

```python notest
# Mounting local files

# Old way (deprecated)
mount = modal.Mount.from_local_dir("data").add_local_file("config.yaml")
@app.function(image=image, mount=mount)
def f():
    ...

# New way
image = image.add_local_dir("data", "/root/data").add_local_file("config.yaml", "/root/config.yaml")
@app.function(image=image)
def f():
    ...

## Mounting local Python source code

# Old way (deprecated)
mount = modal.Mount.from_local_python_packages("my-lib"))
@app.function(image=image, mount=mount)
def f()
    ...

# New way
image = image.add_local_python_source("my-lib")
@app.function(image=image)
def f(...):
    ...

## Using Image.copy_mount

# Old way (deprecated)
mount = modal.Mount.from_local_dir("data").add_local_file("config.yaml")
image.copy_mount(mount)

# New way
image.add_local_dir("data", "root/data").add_local_file("config.yaml", "/root/config.yaml")
```

使用 `Image.from_dockerfile` 的 `context_mount=` 参数的代码和
`Image.dockerfile_commands`方法可以删除该参数；我们现在
自动推断需要包含在上下文中的文件。

## 弃用 `@modal.build` 装饰器

*引入于：v0.72.17*

作为整合文件系统配置 API 的一部分，我们还
弃用 `modal.build` 装饰器。对于以前建议使用 `modal.build` 的用例
方法（例如，将模型权重或其他大型资产下载到
容器文件系统），我们现在建议使用 `modal.Volume` 代替。的
将权重存储在 `Volume` 而不是 `Image` 中的主要优点是
每次更改其他内容时不需要重新下载权重
关于`Image`的定义。

许多框架，例如 Hugging Face，会自动缓存下载的模型
重量。使用这些框架时，您只需要确保安装了
`modal.Volume` 到框架缓存的预期位置：

```python notest
cache_vol = modal.Volume.from_name("hf-hub-cache")
@app.cls(
    image=image.env({"HF_HUB_CACHE": "/cache"}),
    volumes={"/cache": cache_vol},
    ...
)
class Model:
    @modal.enter()
    def load_model(self):
        self.model = ModelClass.from_pretrained(...)
```
对于不支持自动缓存的框架，可以单独编写
函数下载权重并将其直接写入 Volume，然后
在部署之前`modal run`反对此功能。

在某些情况下（例如，如果步骤运行得非常快），您可能希望逻辑
目前用`@modal.build`修饰继续修改Image
文件系统。在这种情况下，您可以将该方法提取为独立函数
并将其传递给`Image.run_function`：

```python notest
def download_weights():
    ...

image = image.run_function(download_weights)
```

## 要求显式包含本地 Python 依赖项

*引入于：0.73.11* | *强制实施：1.0.0*

1.0之前，Modal会检查运行时导入的模块
您的应用程序代码并自动包含远程中的任何“本地”模块
容器环境。此行为称为“自动挂载”。

虽然很方便，但这种方法有许多边缘情况并且令人惊讶
行为，例如忽略使用延迟导入的模块
`Image.imports`。此外，配置自动挂载也很困难
行为，例如忽略存储在本地的大型数据文件
Python 项目目录。

展望未来，有必要显式包含本地依赖项
您的模态应用程序的。最简单的方法是使用
[`Image.add_local_python_source`](/docs/sdk/py/latest/Image#add_local_python_source):

```python notest
import modal
import helpers

image = modal.Image.debian_slim().add_local_python_source("helpers")
```

在默认行为发生变化之前的时期，模态客户端
当不包含自动安装的模块时将发出弃用警告
在图像中。更新图像定义将删除这些警告。

请注意，Modal 将继续自动包含源模块或
定义应用程序本身的包。我们正在推出新的应用程序或功能级别
参数`include_source`，在这种情况下可以设置为`False`
不需要（即，因为您的图像定义已经包含应用程序
来源）。

## 重命名自动缩放器参数

*引入于：v0.73.76*

我们正在重命名几个配置自动缩放行为的参数：

* `keep_warm` 现在是 `min_containers`
* `concurrency_limit` 现在是 `max_containers`
* `container_idle_timeout` 现在是 `scaledown_window`

重命名的目的是为了解决一些长期存在的困惑
这些参数的含义。迁移路径很简单
查找和替换操作。

此外，我们正在推广第四个参数，`buffer_containers`，
来自实验状态（之前的`_experimental_buffer_containers`）。
与 `min_containers` 一样，`buffer_containers` 可以帮助缓解冷启动
功能处于活动状态时，因过度配置容器而受到处罚。

## 将 `modal.web_endpoint` 重命名为 `modal.fastapi_endpoint`

*引入于：v0.73.89*

我们将 `modal.web_endpoint` 装饰器重命名为 `modal.fastapi_endpoint`
这样对FastAPI的隐式依赖就更加清晰了。这可以是一个
代码中的简单名称替换，因为语义在其他方面是相同的。

我们可能会重新推出一款无需外部的轻量级`modal.web_endpoint`
未来的依赖。

## 将 `allow_concurrent_inputs` 替换为 `@modal.concurrent`

*引入于：v0.73.148*

`allow_concurrent_inputs`参数被替换为新的装饰器，`@modal.concurrent`。装饰器可以应用于 Function 或 Cls。
作为此计划的一部分，我们正在将输入并发功能移出“测试版”状态
改变。

新的装饰器公开了两个不同的参数：`max_inputs`（限制
函数将同时接受的输入数量）和
`target_inputs`（Modal 自动缩放器的目标并发级别）。
最简单的迁移路径是将 `allow_concurrent_inputs=N` 替换为
`@modal.concurrent(max_inputs=N)`：

```python notest
# Old way, with a function (deprecated)
@app.function(allow_concurrent_inputs=1000)
def f(...):
    ...

# New way, with a function
@app.function()
@modal.concurrent(max_inputs=1000)
def f(...):
    ...

# Old way, with a class (deprecated)
@app.cls(allow_concurrent_inputs=1000)
class MyCls:
    ...

# New way, with a class
@app.cls()
@modal.concurrent(max_inputs=1000)
class MyCls:
    ...
```

设置 `target_inputs` 和 `max_inputs` 可能会通过以下方式提高性能：
减少容器池扩展期间的延迟。请参阅
[输入并发指南](/docs/guide/concurrent-inputs) 了解更多信息。
## 弃用 Modal 对象上的 `.lookup` 方法

*引入于：v0.72.56*

大多数 Modal 对象可以通过两种不同的方法实例化：
`.from_name` 和 `.lookup`。这些方法之间的冗余是持久的
混乱的根源。

`.from_name` 方法是惰性的：它完全在本地运行并实例化
只是对象的一个外壳。本地对象不会与其关联
模态服务器上的身份，直到您与它交互。相比之下，
`.lookup` 方法是 eager：它触发对 Modal 服务器的远程调用，并且它
返回一个完全水合的物体。因为模态对象现在可以在第一次出现时按需水合
使用后，很少需要急于补水。因此，我们不赞成
`.lookup` 因此只有一种明显的方法来实例化对象。

在大多数情况下，迁移是 `.lookup` 的简单查找和替换 →
`.from_name`。

一种例外是当您的代码需要访问对象元数据（例如其 ID）时，
或 Web 函数 URL。在这种情况下，您可以明确地强制水合
通过调用其 `.hydrate()` 方法来访问对象。可能还有其他微妙的后果，
例如，如果不存在对象，则在不同位置引发错误
给定的名字。
## 删除对自定义 Cls 构造函数的支持

*引入于：v0.74.0*

用 `App.cls` 修饰的类不再允许拥有自定义构造函数
（`__init__`方法）。相反，应该使用以下方式公开类参数化
数据类样式 [`modal.parameter`](/docs/sdk/py/latest/parameter) 注释：

```python notest
# Old way (deprecated)
@app.cls()
class MyCls:
    def __init__(self, name: str = "Bert"):
        self.name = name

# New way
@app.cls()
class MyCls:
    name: str = modal.parameter(default="Bert")
```

Modal 将为使用 `modal.parameter` 的类提供一个合成构造函数。
合成构造函数的参数必须使用关键字传递，因此您可以
还需要更新您的调用代码：

```python notest
obj = MyCls(name="Bert")  # name= is now required
```

我们做出这一改变是为了解决一些关于何时
构造函数执行远程调用以及允许运行哪些操作
他们。如果您的自定义构造函数执行除存储之外的任何设置逻辑
参数值，您应该将其移动到用
`@modal.enter()`。

此外，我们将支持作为类参数的类型减少为
少量原语（`str`、`int`、`bool` 和 `bytes`）。

将类参数化限制为原始类型也将允许我们提供
比 Web 仪表板中的参数化类实例具有更好的可观察性，
CLI 和其他无法表示任意 Python 的上下文
对象。
如果您需要跨更复杂的类型参数化类，您可以实现
您自己的序列化逻辑，例如使用字符串作为有线格式：

```python notest
@app.cls()
class MyCls:
    param_str: str = modal.parameter()

    @modal.enter()
    def deserialize_parameters(self):
        self.param_obj = SomeComplexType.from_str(self.param_str)
```

我们建议采用可解释的构造函数参数（即，更喜欢
有意义的字符串而不是腌制的字节），以便您能够获得最大的收益
受益于参数化类可观察性的未来改进。

## 简化 Cls 查找模式

*引入于：v0.73.26*

Modal 之前支持多种不同的模式来查找 `modal.Cls`
并远程调用其方法之一：

```python notest
# Documented pattern
MyCls = modal.Cls.from_name("my-app", "MyCls")
obj = MyCls()
obj.some_method.remote(...)

# Alternate pattern: skipping the object instantiation
MyCls = modal.Cls.from_name("my-app", "MyCls")
MyCls.some_method.remote(...)

# Alternate pattern: looking up the method as a Function
f = modal.Function.lookup("my-app", "MyCls.some_method")
f.remote(...)
```

虽然每种模式都可以成功触发远程函数调用，但有
他们之间的行为有许多微妙的差异。

展望未来，我们将只支持第一种模式。远程调用
部署的 Cls 上的方法将要求您 (a) 使用以下命令查找对象
`modal.Cls` 和 (b) 在调用对象的方法之前实例化该对象。

## 弃用 `modal.gpu` 对象

*引入于：v0.73.31*

`modal.gpu` 对象已被弃用；未来，所有 GPU 资源
配置应该使用字符串来完成。

这应该是一个简单的代码替换，例如`gpu=modal.gpu.H100()`可以
替换为`gpu="H100"`。当使用GPU类的`count=`参数时，
只需将其附加到带有冒号的名称中（例如 `gpu="H100:8"`）。如果是
`modal.gpu.A100(size="80GB")`变种，对应的gpu名称为
`"A100-80GB"`。

请注意，字符串参数不区分大小写，因此 `"H100"` 和 `"h100"` 是
两人都接受了。

这一变化的主要原因是它将使我们能够引入新的
未来的 GPU 模型无需用户升级 SDK。

## 需要显式调用模块模式

*引入于：0.73.58*

Modal CLI 允许您引用应用程序的源代码
文件路径（例如`src/my_app.py`）或模块名称（例如`src.my_app`）。

与在 Python 中一样，该选择对于相对导入的方式有一些影响
解决了。为了使这一点更加突出，Modal 将镜像 Python 进行转发
并要求您通过传递 `-m` 来显式调用模块模式
命令行（例如，`modal deploy -m src.my_app`）。