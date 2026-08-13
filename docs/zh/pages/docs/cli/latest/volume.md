<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal volume`

阅读和编辑`modal.Volume`卷。

注意：`modal.NetworkFileSystem`的用户应使用`modal nfs`命令。

**用法**：

```shell
modal volume [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `cp`：在模态中复制。体积。
* `create`：创建一个命名的、持久的modal.Volume。
* `dashboard`：在网络浏览器中打开卷的仪表板页面。
* `delete`：删除指定的Volume及其所有数据。
* `get`：从 modal.Volume 对象下载文件。
* `list`：列出环境中所有 modal.Volume 体积的详细信息。
* `ls`：以modal.Volume卷的形式列出文件和目录。* `put`：上传文件或目录到modal.Volume。
* `rename`：重命名模态.Volume。
* `rm`：从modal.Volume中删除文件或目录。

## `modal volume cp`

在 modal.Volume 内复制。

将源文件复制到目标文件或将多个源文件复制到目标目录。

**用法**：

```shell
modal volume cp [OPTIONS] VOLUME_NAME PATHS...
```

**选项**：

* `-r, --recursive`：递归复制目录
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal volume create`

创建一个命名的、持久的 modal.Volume。

**用法**：

```shell
modal volume create [OPTIONS] NAME
```

**选项**：
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `--version INTEGER`：VolumeFS 版本。 （实验性）
* `--help`：显示此消息并退出。

## `modal volume dashboard`

在 Web 浏览器中打开卷的仪表板页面。

**用法**：

```shell
modal volume dashboard [OPTIONS] VOLUME_NAME
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal volume delete`

删除指定卷及其所有数据。

**用法**：

```shell
modal volume delete [OPTIONS] NAME
```

**选项**：* `--allow-missing`：如果卷不存在，则不会出错。
* `-y, --yes`：运行时不暂停确认。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal volume get`

从 modal.Volume 对象下载文件。

如果为 REMOTE\_PATH 传递了一个文件夹，则将下载该文件夹的内容
递归地，包括所有子目录。

示例：

```
modal volume get <volume_name> logs/april-12-1.txt
modal volume get <volume_name> / volume_data_dump
```

使用“-”作为 LOCAL\_DESTINATION 将文件内容写入标准输出。

**用法**：

```shell
modal volume get [OPTIONS] VOLUME_NAME REMOTE_PATH [LOCAL_DESTINATION]
```

**选项**：

* `--force`
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal volume list`

列出环境中所有 modal.Volume 体积的详细信息。

**用法**：

```shell
modal volume list [OPTIONS]
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--json`
* `--help`：显示此消息并退出。

## `modal volume ls`

列出 modal.Volume 卷中的文件和目录。**用法**：

```shell
modal volume ls [OPTIONS] VOLUME_NAME [PATH]
```

**选项**：

* `--json`
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal volume put`

将文件或目录上传到 modal.Volume。

将根据需要创建远程父目录。

REMOTE\_PATH 以正斜杠 (/) 结尾，假定它是一个目录
文件将以当前名称上传到该目录下。

**用法**：

```shell
modal volume put [OPTIONS] VOLUME_NAME LOCAL_PATH [REMOTE_PATH]
```

**选项**：

* `-f, --force`：覆盖现有文件。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal volume rename`

重命名 modal.Volume。

**用法**：

```shell
modal volume rename [OPTIONS] OLD_NAME NEW_NAME
```

**选项**：

* `-y, --yes`：运行时不暂停确认。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal volume rm`

从 modal.Volume 中删除文件或目录。

**用法**：

```shell
modal volume rm [OPTIONS] VOLUME_NAME REMOTE_PATH
```

**选项**：

* `-r, --recursive`: 递归删除目录
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `--help`：显示此消息并退出。