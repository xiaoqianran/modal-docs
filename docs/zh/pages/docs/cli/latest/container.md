<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal container`

管理并连接到正在运行的容器。

**用法**：

```shell
modal container [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `exec`：在容器中执行命令。
* `list`：列出当前正在运行的所有容器。
* `logs`：获取或流式传输特定容器的日志。
* `stop`：终止正在运行的容器。

## `modal container exec`

在容器中执行命令。

**用法**：

```shell
modal container exec [OPTIONS] CONTAINER_ID COMMAND...
```

**选项**：

* `--pty / --no-pty`：使用 PTY 运行命令。
* `--help`：显示此消息并退出。

## `modal container list`

列出当前正在运行的所有容器。

**用法**：

```shell
modal container list [OPTIONS]
```

**选项**：* `--app-id TEXT`：列出为特定应用程序运行的容器。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--json`
* `--help`：显示此消息并退出。

## `modal container logs`

获取或流式传输特定容器的日志。

默认情况下，此命令获取最后 100 个日志条目并退出。使用 `-f` 来
相反，来自正在运行的容器的实时流日志。获取和跟随是互斥的。

示例：

获取容器的最新日志：

```
modal container logs ta-123456
```

跟踪（流式传输）来自正在运行的容器的日志：

```
modal container logs ta-123456 -f
```

获取最近 2 小时的日志：

```
modal container logs ta-123456 --since 2h
```
获取特定时间范围内的日志：

```
modal container logs ta-123456 --since 2026-03-01T05:00:00 --until 2026-03-01T08:00:00
```

获取最后 1000 个条目：

```
modal container logs ta-123456 --tail 1000
```

获取所有容器日志：

```
modal container logs ta-123456 --all
```

**用法**：

```shell
modal container logs [OPTIONS] CONTAINER_ID
```

**选项**：

* `-f, --follow`：流式传输日志输出直到容器停止
* `--all`：显示容器的所有日志
* `--since TEXT`：时间范围的开始。接受 ISO 8601 日期时间或相对时间，例如“1d”（1 天前）、“2h”、“30m”等。
* `--until TEXT`：时间范围结束；接受与 --since 相同的参数类型
* `-n, --tail INTEGER`：仅显示最后N条日志条目
* `--search TEXT`：按搜索文本过滤
* `-s, --source TEXT`：按源过滤：'stdout'、'stderr' 或 'system'* `--timestamps`：在每行前面加上时间戳作为前缀
* `--help`：显示此消息并退出。

## `modal container stop`

终止正在运行的容器。

默认情况下，这将向容器发送 Modal 将处理的 SIGINT 信号。
对于函数，当前在容器上运行的任何输入都将被取消
并重新安排在其他集装箱上。

使用`--graceful`，容器将被允许完成当前的输入
运行，完成后退出。仅容器支持优雅停止
运行模态函数。

**用法**：

```shell
modal container stop [OPTIONS] CONTAINER_ID
```

**选项**：
* `--graceful`：让容器在退出前完成当前的输入，而不是取消它们。
* `-y, --yes`：运行时不暂停确认。
* `--help`：显示此消息并退出。