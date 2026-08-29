<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal config`

管理当前配置文件的客户端配置。

完整解释请参阅https://modal.com/docs/sdk/py/latest/config
这些选项的含义以及如何设置它们。

**用法**：

```shell
modal config [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `set-environment`：设置活动配置文件的默认模态环境
* `show`：显示当前配置值（调试命令）。

## `modal config set-environment`

设置活动配置文件的默认模态环境

当没有 --env 标志传递给 `modal run`、`modal deploy` 等时，将使用配置文件的默认环境。

如果没有设置默认环境，并且工作区中存在多个环境，则会引发错误
当运行需要环境的命令时。

**用法**：

```shell
modal config set-environment [OPTIONS] ENVIRONMENT_NAME
```

**选项**：

* `--help`：显示此消息并退出。

## `modal config show`

显示当前配置值（调试命令）。

**用法**：

```shell
modal config show [OPTIONS]
```

**选项**：

* `--redact / --no-redact`：编辑秘密凭证值。
* `--help`：显示此消息并退出。