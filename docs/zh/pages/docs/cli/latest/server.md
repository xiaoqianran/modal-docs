<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal server`

检查模态服务器。

**用法**：

```shell
modal server [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `info`：显示有关给定模态服务器的信息。
* `logs`：获取或流式传输服务器日志。
* `requests`：显示模态服务器最近处理的请求。
* `stats`：显示模态服务器的聚合统计信息。

## `modal server info`

显示有关给定模态服务器的信息。

SERVER 可以是功能 ID (`fu-...`) 或已部署的服务器名称，格式如下
`APP_NAME/SERVER_NAME`。此命令的输出包括有关所有资源的信息此服务器请求的任何计划/自动缩放设置、任何已安装的卷或存储桶、
以及任何 HTTP 设置。

示例：

直接提供服务器 ID：

```
modal server info fu-0123456789abcdefghijkl
```

引用已部署应用程序中的服务器：

```
modal server info hello-world-app/test_server
```

**用法**：

```shell
modal server info [OPTIONS] SERVER
```

**选项**：

* `--json`：输出为 JSON。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal server logs`

获取或流式传输服务器日志。

默认情况下，此命令获取最后 100 个日志条目并退出。使用 `-f` 来
相反，来自正在运行的服务器的实时流日志。获取和跟随是互斥的。

示例：

根据服务器 ID 获取最近的日志：

```
modal server logs fu-12345
```

根据名称获取当前部署的服务器的最新日志：

```
modal server logs my-app/qwen-server
```

跟踪（流式传输）来自正在运行的服务器的日志：

```
modal server logs my-app/qwen-server -f
```

获取最后 1000 个条目：

```
modal server logs my-app/qwen-server --tail 1000
```

获取最近 2 小时的日志：

```
modal server logs my-app/qwen-server --since 2h
```

获取特定时间范围内的日志：

```
modal server logs my-app/qwen-server --since 2026-09-01T05:00:00 --until 2026-09-01T08:00:00
```

按来源过滤日志：

```
modal server logs my-app/qwen-server --source stderr
```

每行包含时间戳以及服务器和容器 ID：

```
modal server logs my-app/qwen-server --timestamps --show-server-id --show-container-id
```

**用法**：

```shell
modal server logs [OPTIONS] SERVER_REF
```

**选项**：* `-f, --follow`：流式传输日志输出直到中断
* `--since TEXT`：时间范围的开始。接受 ISO 8601 日期时间或相对时间，例如“1d”（1 天前）、“2h”、“30m”等。
* `--until TEXT`：时间范围结束；接受与 --since 相同的参数类型
* `-n, --tail INTEGER`：仅显示最后N条日志条目
* `--search TEXT`：按搜索文本过滤
* `--container TEXT`: 按容器 ID 过滤 (ta-\*)
* `-s, --source TEXT`：按源过滤：'stdout'、'stderr' 或 'system'
* `--timestamps`：在每行前面加上时间戳作为前缀
* `--show-server-id`：在每行前面加上服务器 ID 前缀
* `--show-container-id`：在每行前面加上容器 ID 前缀
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal server requests`

显示模态服务器最近处理的请求。

SERVER 可以是功能 ID 或已部署的服务器名称，格式为
`APP_NAME/SERVER_NAME`。

示例：

```
modal server requests my-app/my-server
```

```
modal server requests my-app/my-server --tail 500
```

禁用输出中的颜色：

```
modal server requests my-app/my-server --no-color
```

**用法**：

```shell
modal server requests [OPTIONS] SERVER
```

**选项**：

* `-n, --tail INTEGER RANGE`：显示最近 N 个服务器请求。  \[默认值：10； 1<=x<=1000]
* `--json`：将请求输出为 JSON。
* `--no-color`：禁用输出中的颜色。* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal server stats`

显示模态服务器的聚合统计信息。

SERVER 可以是功能 ID 或已部署的服务器名称，格式为
`APP_NAME/SERVER_NAME`。默认时间范围是最近一小时。

可用的指标及其定义可能会发生变化，并已提供
在尽最大努力的基础上。它们可能会延迟或不完整。不要依赖这个命令
用于自动缩放器管理。

示例：

显示过去一小时的统计数据：

```
modal server stats fu-abc123
```

显示相关窗口的统计数据：

```
modal server stats my-app/my-server --since 5h --until 2h
```
显示两小时前结束的一小时窗口的统计数据：

```
modal server stats my-app/my-server --until 2h
```

以 json 格式显示显式窗口的统计信息：

```
modal server stats my-app/my-server         --since 2026-08-28T14:00:00Z         --until 2026-08-28T16:00:00Z         --json
```

显示特定容器的统计信息：

```
modal server stats my-app/my-server --container-id ta-12345
```

**用法**：

```shell
modal server stats [OPTIONS] SERVER
```

**选项**：

* `--since TEXT`：时间范围的开始。如果未提供时区，则视为当地时间。接受 ISO 8601 日期时间或相对时间，例如“2h”或“30m”。
* `--until TEXT`：时间范围结束。如果未提供时区，则视为当地时间。接受与 --since 相同的参数类型。
* `--container-id CONTAINER_ID`：仅计算此容器的统计数据。
* `--no-color`：禁用输出中的颜色。
* `--json`：将统计数据输出为 JSON。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。