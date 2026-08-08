<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal queue`

管理 `modal.Queue` 对象并检查其内容。

**用法**：

```shell
modal queue [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `clear`：通过删除队列的所有数据来清除队列的内容。
* `create`：创建一个命名队列。
* `delete`：删除指定的队列及其所有数据。
* `len`：打印队列或其分区之一的长度。
* `list`：列出所有命名队列。
* `peek`：打印接下来的N个项目而不删除它们。

## `modal queue clear`

通过删除队列的所有数据来清除队列的内容。

**用法**：

```shell
modal queue clear [OPTIONS] NAME
```

**选项**：* `-p, --partition TEXT`：要使用的分区的名称，否则使用默认（匿名）分区。
* `-a, --all`：清除所有分区的内容。
* `-y, --yes`：运行时不暂停确认。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal queue create`

创建一个命名队列。

注意：当队列已经存在时，这是一个无操作。

**用法**：

```shell
modal queue create [OPTIONS] NAME
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal queue delete`

删除指定队列及其所有数据。

**用法**：

```shell
modal queue delete [OPTIONS] NAME
```

**选项**：

* `--allow-missing`: 如果队列不存在，不要报错。
* `-y, --yes`：运行时不暂停确认。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal queue len`

打印队列或其分区之一的长度。

**用法**：

```shell
modal queue len [OPTIONS] NAME
```

**选项**：

* `-p, --partition TEXT`：要使用的分区的名称，否则使用默认（匿名）分区。* `-t, --total`：计算所有分区的队列长度之和
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal queue list`

列出所有命名队列。

**用法**：

```shell
modal queue list [OPTIONS]
```

**选项**：

* `--json`
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal queue peek`

打印接下来的 N 个项目而不删除它们。

**用法**：

```shell
modal queue peek [OPTIONS] NAME [N]
```

**选项**：
* `-p, --partition TEXT`：要使用的分区的名称，否则使用默认（匿名）分区。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。