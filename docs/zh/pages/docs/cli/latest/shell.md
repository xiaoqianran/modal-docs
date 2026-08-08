<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal shell`

在模态容器内运行命令或交互式 shell。

示例：

在默认的基于 Debian 的映像中启动交互式 shell：

```
modal shell
```

在您的应用程序中使用 `my_function` 规范启动交互式 shell
（使用相同的图像、卷、安装等）：

```
modal shell hello_world.py::my_function
```

或者，如果您使用 [modal.Cls](https://modal.com/docs/sdk/py/latest/Cls)
你可以直接参考`@modal.method`：

```
modal shell hello_world.py::MyClass.my_method
```

启动 `python` shell：

```
modal shell hello_world.py --cmd=python
```

使用函数的规范运行命令并将输出通过管道传输到文件：

```
modal shell hello_world.py -c 'uv pip list' > env.txt
```

通过 ID 连接到正在运行的沙箱：

```
modal shell sb-abc123xyz
```

**用法**：

```shell
modal shell [OPTIONS] [REF]
```

**选项**：

* `-c, --cmd TEXT`：在模态图像内运行的命令。* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `--image TEXT`：shell 内部的容器镜像标签（如果不使用 REF）。
* `--add-python TEXT`：将Python添加到图像中（如果不使用REF）。
* `--volume TEXT`：模态名称。要安装在 shell 内 /mnt/`{name}` 的体积（如果不使用 REF）。可以多次使用。
* `--add-local TEXT`：要在 shell 内挂载的本地文件或目录 /mnt/`{basename}`（如果不使用 REF）。可以多次使用。
* `--secret TEXT`：模态名称。安装在 shell 内部的秘密（如果不使用 REF）。可以多次使用。
* `--cpu INTEGER`：分配给 shell 的 CPU 数量（如果不使用 REF）。
* `--memory INTEGER`：为 shell 分配的内存，以 MiB 为单位（如果不使用 REF）。
* `--gpu TEXT`：请求 shell 的 GPU（如果有）。例如 `any`、`a10g`、`a100:4`（如果不使用 REF）。
* `--cloud TEXT`：运行 shell 的云提供商。可能的值为 `aws`、`gcp`、`oci`、`auto`（如果不使用 REF）。
* `--region TEXT`：运行容器的区域。可以是单个区域或逗号分隔的列表以供选择（如果不使用 REF）。
* `--pty / --no-pty`：使用 PTY 运行命令。
* `-m`：将参数解释为 Python 模块路径而不是文件/脚本路径
* `--help`：显示此消息并退出。