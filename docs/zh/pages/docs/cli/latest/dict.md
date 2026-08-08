<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal dict`

管理 `modal.Dict` 对象并检查其内容。

**用法**：

```shell
modal dict [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `clear`：通过删除指定 Dict 的所有数据来清除其内容。
* `create`：创建一个命名的Dict对象。
* `delete`：删除一个命名的Dict及其所有数据。
* `get`：打印特定键的值。
* `items`：打印Dict的内容。
* `list`：列出所有命名的字典。

## `modal dict clear`

通过删除指定 Dict 的所有数据来清除其内容。

**用法**：

```shell
modal dict clear [OPTIONS] NAME
```

**选项**：

* `-y, --yes`：运行时不暂停确认。* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal dict create`

创建一个命名的 Dict 对象。

注意：当 Dict 已经存在时，这是一个无操作。

**用法**：

```shell
modal dict create [OPTIONS] NAME
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal dict delete`

删除指定的 Dict 及其所有数据。

**用法**：

```shell
modal dict delete [OPTIONS] NAME
```

**选项**：

* `--allow-missing`：如果 Dict 不存在，则不会出错。
* `-y, --yes`：运行时不暂停确认。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal dict get`

打印特定键的值。

注意：使用 CLI 时，键始终被解释为字符串类型。

**用法**：

```shell
modal dict get [OPTIONS] NAME KEY
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal dict items`打印字典的内容。

注意：默认情况下，此命令会截断内容。使用 `N` 参数来控制
显示的数据量或检索整个字典的 `--all` 选项，这可能会很慢。

**用法**：

```shell
modal dict items [OPTIONS] NAME [N]
```

**选项**：

* `-a, --all`：忽略N并打印Dict中的所有条目（可能会很慢）
* `-r, --repr`：使用`repr()`显示项目以查看更多详细信息
* `--json`
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal dict list`

列出所有命名的字典。

**用法**：

```shell
modal dict list [OPTIONS]
```

**选项**：

* `--json`
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。