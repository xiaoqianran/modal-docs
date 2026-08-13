<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal image`

管理图像。

**用法**：

```shell
modal image [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `logs`：获取镜像的构建日志。
* `names`：管理模态图像名称。

## `modal image logs`

获取图像的构建日志。

**用法**：

```shell
modal image logs [OPTIONS] IMAGE_ID
```

**选项**：

* `--layers INTEGER`：从最后 N 个构建层获取日志。默认为 1。
* `--all`：从所有可用的构建层获取日志。
* `--help`：显示此消息并退出。

## `modal image names`

管理模态图像名称。

**用法**：

```shell
modal image names [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `list`：列出命名图像。

### `modal image names list`

列出名为图像的列表。

**用法**：

```shell
modal image names list [OPTIONS]
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--prefix TEXT`：仅包含以此前缀开头的命名图像标签。
* `--json`
* `--help`：显示此消息并退出。