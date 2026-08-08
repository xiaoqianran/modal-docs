<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal secret`

管理秘密。

**用法**：

```shell
modal secret [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `create`：创建一个新的秘密。
* `delete`：删除已命名的 Secret。
* `list`：列出您公开的秘密。

## `modal secret create`

创建一个新的秘密。

**用法**：

```shell
modal secret create [OPTIONS] SECRET_NAME [KEYVALUES]...
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `--from-dotenv PATH`：要从中加载机密的 .env 文件的路径。
* `--from-json PATH`：要从中加载机密的 JSON 文件的路径。
* `--force`：如果秘密已存在，则覆盖该秘密。* `--help`：显示此消息并退出。

## `modal secret delete`

删除已命名的 Secret。

**用法**：

```shell
modal secret delete [OPTIONS] NAME
```

**选项**：

* `--allow-missing`：如果 Secret 不存在，则不会出错。
* `-y, --yes`：运行时不暂停确认。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal secret list`

列出您公开的秘密。

**用法**：

```shell
modal secret list [OPTIONS]
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--json`
* `--help`：显示此消息并退出。