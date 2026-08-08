<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal changelog`

从 Modal 变更日志中获取发行说明。

此命令将变更日志内容打印为 Markdown 文本，对于包含
有关代理开发会话的最新更新的信息。

默认情况下，显示当前版本系列中的最新更新。其他选项
允许显示自先前版本以来的更改、特定版本中的更改或更改
比当前安装的更新。

示例：

```bash
modal changelog --since 1.2.0  # Show updates added after a specific version

modal changelog --since 2026-01-01  # Show updates added after a specific date

modal changelog --newer  # Show updates released after the currently installed version

modal changelog --last 3  # Show updates included in the 3 most recent releases

modal changelog --for 1.3.1  # Show the changelog for a specific release
```

注意：使用`--since`或`--last`时，仅显示对当前安装版本的更改。

**用法**：

```shell
modal changelog [OPTIONS]
```

**选项**：

* `--last INTEGER`：显示已安装版本之前的N个最新条目。
* `--since TEXT`：显示版本 (X.Y.Z) 或日期 (YYYY-MM-DD) 后的条目，不包括在内。
* `--for TEXT`：显示版本 (X.Y.Z) 或系列 (X.Y) 的条目。
* `--newer`：显示比已安装版本更新的条目。
* `--all`：显示所有条目。
* `--json`：输出为 JSON。
* `--help`：显示此消息并退出。