<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal run`

运行模态函数或本地入口点。

`FUNC_REF` 的格式应为`{file or module}::{function name}`。
或者，您可以通过应用程序引用该功能：

`{file or module}::{app variable name}.{function name}`

示例：

要在 my\_app.py 中运行 hello\_world 函数（或本地入口点）：

```
modal run my_app.py::hello_world
```

如果您的模块只有一个应用程序并且您的应用程序有一个
单个本地入口点（或单个函数），您可以省略应用程序并
功能部分：

```
modal run my_app.py
```

除了指向文件之外，您还可以使用 Python 模块路径，该路径
默认情况下将确保您的远程功能将使用相同的模块
名称与当地的名称相同。

```
modal run -m my_project.my_app
```

**用法**：

```shell
modal run [OPTIONS] FUNC_REF
```**选项**：

* `-n, --name TEXT`：本次运行的应用程序的名称。
* `-w, --write-result TEXT`：将返回值（必须是str或bytes）写入本地路径。
* `-q, --quiet`：不显示模态进度指示器。
* `-d, --detach`：如果本地进程终止或断开连接，请勿停止应用程序。
* `-i, --interactive`：以交互模式运行应用程序。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `-m`：将参数解释为 Python 模块路径而不是文件/脚本路径
* `--timestamps`：显示每个日志行的时间戳。
* `--help`：显示此消息并退出。