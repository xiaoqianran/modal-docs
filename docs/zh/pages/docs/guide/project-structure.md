<!-- modal-docs: machine-translated zh-CN from English source -->

# 项目结构

## 跨多个文件的应用程序

当您的项目跨越多个文件时，需要更加小心地打包
在 Modal 上运行或部署的完整结构。

主要有两个考虑因素：(1) 确保所有函数都得到
注册到应用程序，并且 (2) 确保包含任何本地依赖项
在模态容器中。

假设您有一个简单的项目，分布在三个文件中：

```
src/
├── app.py  # Defines the `modal.App` as a variable named `app`
├── llm.py  # Imports `app` and decorates some functions
└── web.py  # Imports `app` and decorates other functions
```

通过这种结构，如果您使用`modal deploy src/app.py`进行部署，Modal将不会
发现其他两个模块中定义的函数，因为它们永远不会得到
进口的。

如果您运行 `modal deploy src/llm.py`，Modal 将使用以下命令部署应用程序
只是该模块中定义的函数。

一种选择是确保项目中的一个模块可传递
导入所有其他模块并将 `modal deploy` CLI 指向它，但是
这种方法可能会导致项目结构尴尬。

### 将您的项目定义为 Python 包

更好的方法是将您的项目定义为 Python *package* 并
使用 Modal CLI 的“模块模式”调用模式。

在 Python 中，包是包含 `__init__.py` 文件（以及
通常是一些其他Python模块）。如果您有 `src/__init__.py`
导入所有成员模块，它将确保任何装饰函数
其中包含的内容已注册到应用程序：

```python notest
# Contents of __init__.py
import .app
import .llm
import .web
```

*重要：在成员模块之间使用*相对*导入（`import .app`）。*

不幸的是，仅仅设置它并执行部署命令是不够的
`modal deploy src/app.py`。相反，您需要在*模块模式*下调用 Modal：
`modal deploy -m src.app`。注意`-m`标志和模块路径的使用
（`src.app`而不是`src/app.py`）。类似于`python -m ...`，这个咒语
将目标视为一个包而不仅仅是一个脚本。### 应用程序组成

随着您的项目范围的扩大，将其组织成
多个组件应用程序，而不是将项目定义为一个大的
整体。这样，当您在开发过程中进行迭代时，您可以针对特定的目标
组件，它将构建得更快并避免与并发工作发生任何冲突
项目的其他部分。

以这种方式设置的项目仍然可以使用 `App.include` 作为一个单元进行部署。
假设我们上面的项目在 `llm.py` 和 `web.py` 中定义了单独的应用程序，然后
添加一个新的`deploy.py`文件：

```python notest
# Contents of deploy.py
import modal

from .llm import llm_app
from .web import web_app

app = modal.App("full-app").include(llm_app).include(web_app)
```

这使您可以运行 `modal deploy -m src.deploy` 将所有内容打包到一个中
步骤。
**注意：** 由于多文件应用程序仍然有一个单一的命名空间
函数，在整个系统中对模态函数进行唯一命名非常重要
即使将其拆分为多个文件也可以进行项目：否则您将面临一些风险
功能“遮蔽”其他同名功能。

## 包括本地依赖

另一个需要考虑的因素是 Modal 是否会打包所有本地的
您的应用程序所需的依赖项。

即使您的模态应用程序本身可以包含在单个文件中，任何本地
文件导入的模块（例如，`helpers.py`）也需要可用
在模态容器中。

默认情况下，Modal 会自动包含模块或包
函数在运行该函数的所有容器中定义。那么如果项目
设置为一个包，并且辅助模块是该包的一部分，您
应该已全部设置完毕。如果您没有使用软件包设置，或者如果本地
依赖项是项目包外部的，您需要明确
将它们包含在图像中，即使用 `modal.Image.add_local_python_source`。

**注意：** 此行为在 Modal 1.0 中发生了变化。此前，莫代尔将
“自动挂载”您的应用程序源导入到的任何本地依赖项
容器。这已更改为更具选择性，以避免不必要的包含
大型本地包裹。