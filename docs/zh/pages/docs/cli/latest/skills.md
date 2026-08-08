<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal skills`

安装并更新 Modal 的代理技能。

**用法**：

```shell
modal skills [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `install`：安装Modal技能。
* `show`：将Modal技能内容打印到终端。
* `update`：更新已安装的 Modal 技能。

## `modal skills install`

安装模态技能。

**用法**：

```shell
modal skills install [OPTIONS]
```

**选项**：

* `-y, --yes`：运行时不暂停确认。
* `--no-docs`：跳过下载Modal文档资源。
* `-g, --global`：安装在用户主目录中。
* `--claude`：安装到 .claude/ 而不是 .agents/。
* `--help`：显示此消息并退出。

## `modal skills show`

将 Modal 技能内容打印到终端。

**用法**：

```shell
modal skills show [OPTIONS]
```

**选项**：

* `--help`：显示此消息并退出。

## `modal skills update`

更新已安装的 Modal 技能。

**用法**：

```shell
modal skills update [OPTIONS]
```

**选项**：

* `-y, --yes`：运行时不暂停确认。
* `--no-docs`：跳过下载 Modal 文档资源。
* `-g, --global`：安装在用户主目录中。
* `--claude`：安装到 .claude/ 而不是 .agents/。
* `--help`：显示此消息并退出。