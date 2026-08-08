<!-- modal-docs: machine-translated zh-CN from English source -->

# 运行和共享 Streamlit 应用程序

此示例向您展示如何使用 `modal serve` 运行 Streamlit 应用程序，然后将其部署为无服务器 Web 应用程序。

![streamlit 应用程序示例](./streamlit.png)

此示例的结构为两个文件：

1. 该模块，定义了 Modal 对象（本地将脚本命名为`serve_streamlit.py`）。

2. `app.py`，这是任何要挂载到 Modal 中的 Streamlit 脚本
   函数（[下载脚本](https://github.com/modal-labs/modal-examples/blob/main/10_integrations/streamlit/app.py)）。

```python
import shlex
import subprocess
from pathlib import Path

import modal

```

## 定义容器依赖

`app.py`脚本导入了三个第三方包，因此我们将它们包含在示例中图像定义，然后将 `app.py` 文件本身添加到图像中。

```python
streamlit_script_local_path = Path(__file__).parent / "app.py"
streamlit_script_remote_path = "/root/app.py"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .uv_pip_install("streamlit~=1.35.0", "numpy~=1.26.4", "pandas~=2.2.2")
    .add_local_file(
        streamlit_script_local_path,
        streamlit_script_remote_path,
    )
)

app = modal.App(name="example-serve-streamlit", image=image)

if not streamlit_script_local_path.exists():
    raise RuntimeError(
        "app.py not found! Place the script with your streamlit app in the same directory."
    )

```

## 生成 Streamlit 服务器

在容器内部，我们将使用以下命令在后台子进程中运行 Streamlit 服务器
`subprocess.Popen`。我们还使用 `@web_server` 装饰器公开端口 8000。

```python
@app.function()
@modal.concurrent(max_inputs=100)
@modal.web_server(8000)
def run():
    target = shlex.quote(streamlit_script_remote_path)
    cmd = f"streamlit run {target} --server.port 8000 --server.enableCORS=false --server.enableXsrfProtection=false"
    subprocess.Popen(cmd, shell=True)


```

## 迭代和部署

当您迭代尖叫应用程序时，您可以使用`modal serve`“短暂”运行它。这将
运行一个本地进程来监视您的文件并在发生任何变化时更新应用程序。

```shell
modal serve serve_streamlit.py
```

一旦您对更改感到满意，您就可以使用以下命令部署您的应用程序

```shell
modal deploy serve_streamlit.py
```

如果成功，这将打印您的应用程序的 URL，您可以从该 URL 导航到
您的浏览器🎉。