<!-- modal-docs: machine-translated zh-CN from English source -->

# Jupyter 笔记本

本指南页面记录了 Jupyter Notebook 和 Modal 之间的集成。

<Callout variant="info">

有关我们具有实时协作功能的托管笔记本产品，请参阅[模态笔记本](/docs/guide/notebooks)。

</Callout>

## Jupyter 内的模态

您可以在 Jupyter 等笔记本环境中使用 Modal 客户端库！只是
`import modal` 并正常使用。您可能需要使用 [`app.run`](/docs/guide/apps#ephemeral-apps) 创建一个临时应用程序来运行您的函数：

```python,notest
# Cell 1

import modal

app = modal.App()

@app.function()
def my_function(x):
    ...

# Cell 2

with modal.enable_output():
    with app.run():
        my_function.remote(42)
```

### 已知问题

* **不支持交互式 shell 和交互功能。**

  这些只能在实时终端会话中运行，因此它们不是
  笔记本电脑支持。

* **本地和远程Python版本必须匹配。**

  在 Jupyter 笔记本中定义模态函数时，该函数会自动
  已设置`serialized=True`。这意味着 Python 和任何第三方的版本
  Modal 容器中使用的 party 库必须与您本地的版本匹配，
  以便该函数可以远程反序列化而不会出现错误。

如果您遇到上面未记录的问题，请尝试重新启动笔记本内核，因为它可能是
处于损坏状态，这在笔记本开发中很常见。
如果问题仍然存在，请[在 Slack 中](https://modal.com/slack) 联系我们。

我们正在努力消除这些已知问题，以便编写模态应用程序
在笔记本中感觉就像在常规 Python 模块和脚本中进行开发一样。

## Modal 中的 Jupyter

您可以使用 `modal launch` 命令在 Modal 中运行 Jupyter。例如：

```
$ modal launch jupyter --gpu a10g
```

这将启动一个连接了 A10G GPU 的 Jupyter 实例。你将能够
通过以下方式访问该应用程序
[模态隧道 URL](https://modal.com/docs/guide/tunnels)。朱皮特
每当您在终端中停止 Modal 调用时，它将停止运行。

有关其他选项，请参阅`--help`。

## 更多示例

* [在笔记本中运行Modal的基本演示](https://github.com/modal-labs/modal-examples/blob/main/11_notebooks/basic.ipynb)
* [在模态函数中运行 Jupyter 服务器](https://github.com/modal-labs/modal-examples/blob/main/11_notebooks/jupyter_inside_modal.py)