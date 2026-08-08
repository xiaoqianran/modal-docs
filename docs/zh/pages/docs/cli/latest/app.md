<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal app`

管理已部署和正在运行的应用程序。

**用法**：

```shell
modal app [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**Commands**:

* `dashboard`：在网络浏览器中打开应用程序的仪表板页面。
* `history`：显示应用程序的部署历史记录。
* `list`：列出正在运行、部署或最近停止的应用程序。
* `logs`：获取或流式传输应用程序日志。
* `rollback`：重新部署以前版本的应用程序。
* `rollover`：重新部署应用程序以获取新容器，无需更改代码。
* `stop`：永久停止应用程序并终止其正在运行的容器。

## `modal app dashboard`

在网络浏览器中打开应用程序的仪表板页面。

示例：

按名称打开应用程序的仪表板：

```
modal app dashboard my-app
```

使用指定环境：

```
modal app dashboard my-app --env dev
```

**用法**：

```shell
modal app dashboard [OPTIONS] APP_IDENTIFIER
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal app history`

显示应用程序的部署历史记录。

示例：

根据应用程序ID获取历史记录：

```
modal app history ap-123456
```

根据应用程序名称获取应用程序的历史记录：

```
modal app history my-app
```

**Usage**:

```shell
modal app history [OPTIONS] APP_IDENTIFIER
```

**Options**:

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--json`
* `--help`：显示此消息并退出。

## `modal app list`

列出正在运行、部署或最近停止的应用程序。

**Usage**:

```shell
modal app list [OPTIONS]
```

**Options**:

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--json`
* `--help`：显示此消息并退出。

## `modal app logs`

获取或流式传输应用程序日志。

默认情况下，此命令获取最后 100 个日志条目并退出。 Use `-f` to
而是从正在运行的应用程序实时传输日志。获取和跟随是互斥的。

示例：

根据应用程序ID获取最近的日志：

```
modal app logs ap-123456
```

根据名称获取当前部署的应用程序的最新日志：

```
modal app logs my-app
```

跟踪（流式传输）正在运行的应用程序的日志：

```
modal app logs my-app -f
```

获取最后 1000 个条目：

```
modal app logs my-app --tail 1000
```

获取最近 2 小时的日志：

```
modal app logs my-app --since 2h
```

获取特定时间范围内的日志：

```
modal app logs my-app --since 2026-03-01T05:00:00 --until 2026-03-01T08:00:00
```

按来源和功能过滤日志：

```
modal app logs my-app --source stderr --function fu-abc123
```

每行包含时间戳以及函数和容器 ID：

```
modal app logs my-app --timestamps --show-function-id --show-container-id
```

**Usage**:

```shell
modal app logs [OPTIONS] APP_IDENTIFIER
```

**Options**:

* `-f, --follow`：流式传输日志输出直到应用程序停止
* `--since TEXT`：时间范围的开始。接受 ISO 8601 日期时间或相对时间，例如“1d”（1 天前）、“2h”、“30m”等。
* `--until TEXT`：时间范围结束；接受与 --since 相同的参数类型
* `-n, --tail INTEGER`：仅显示最后N条日志条目
* `--search TEXT`：按搜索文本过滤
* `--function TEXT`: 按功能 ID 过滤 (fu-\*)
* `--function-call TEXT`: 按 FunctionCall ID 过滤 (fc-\*)
* `--container TEXT`: 按容器 ID 过滤 (ta-\*)
* `-s, --source TEXT`：按源过滤：'stdout'、'stderr' 或 'system'
* `--timestamps`：在每一行前面加上时间戳作为前缀
* `--show-function-id`：在每行前面加上其功能 ID 前缀
* `--show-function-call-id`：在每一行前面加上其 FunctionCall ID 前缀
* `--show-container-id`：在每行前面加上容器 ID 前缀
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal app rollback`

重新部署应用程序的先前版本。

请注意，应用程序当前必须处于“已部署”状态。
尽管回滚将在应用程序历史记录中显示为新部署
应用程序状态将重置为上次部署时的状态。

示例：

将应用程序回滚到之前的版本：

```
modal app rollback my-app
```

将应用程序回滚到特定版本：

```
modal app rollback my-app v3
```

使用应用程序 ID 而不是名称来回滚应用程序：

```
modal app rollback ap-abcdefghABCDEFGH123456
```

**Usage**:
```shell
modal app rollback [OPTIONS] APP_IDENTIFIER [VERSION]
```

**选项**：

* `--strategy [rolling|recreate]`: Strategy for rollback
* `-e, --env TEXT`: Environment to interact with.如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`: Show this message and exit.

## `modal app rollover`

重新部署应用程序即可获取新容器，而无需更改代码。

翻转将现有容器替换为由相同容器构建的新容器
应用程序版本 - 对于刷新容器而不更改代码非常有用。
滚动显示为应用程序部署历史记录中的新条目。

示例：

Rollover an App using a rolling deployment. Running containers are now considered
过时的，将被新的优雅地取代。

```
modal app rollover my-app
```

通过终止任何正在运行的容器来滚动应用程序。队列上的输入将
启动新容器。

```
modal app rollover my-app --strategy recreate
```

**用法**：

```shell
modal app rollover [OPTIONS] APP_IDENTIFIER
```

**选项**：

* `--strategy [rolling|recreate]`: Strategy for rollover
* `-e, --env TEXT`: Environment to interact with.如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`: Show this message and exit.

## `modal app stop`

永久停止应用程序并终止其正在运行的容器。

**用法**：

```shell
modal app stop [OPTIONS] APP_IDENTIFIER
```

**选项**：

* `-y, --yes`：运行时无需暂停确认。
* `-e, --env TEXT`: Environment to interact with.如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`: Show this message and exit.