<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal function`

检查模态函数。

**用法**：

```shell
modal function [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `autoscaler`：查看和配置模态函数的自动缩放器设置。
* `calls`：显示模态函数的最新输入。
* `info`：显示有关给定模态函数的信息。
* `logs`：获取或流式传输功能日志。
* `metrics`：预览和导出模态函数的指标。
* `stats`：显示模态函数的聚合统计数据。
* `variants`：列出模态函数的变体。

## `modal function autoscaler`查看和配置模态函数的自动缩放器设置。

**用法**：

```shell
modal function autoscaler [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `settings`：显示所提供功能的当前自动缩放设置。
* `update`：更新所提供功能的当前自动缩放设置。

### `modal function autoscaler settings`

显示所提供功能的当前自动缩放设置。

除了当前设置之外，此命令还显示对这些设置的任何活动覆盖
设置，以及有关谁以及何时覆盖该设置的元数据。函数可能是
函数 ID 或已部署的函数名称，格式为 `APP_NAME/FUNCTION_NAME`。
如果设置的值是默认值且未被覆盖，则输出中将省略其值。

示例：

显示已部署函数的自动缩放设置：

```
modal function autoscaler settings my-app/my-function
```

使用函数 ID 显示自动缩放设置：

```
modal function autoscaler settings fu-1234
```

**用法**：

```shell
modal function autoscaler settings [OPTIONS] FUNCTION
```

**选项**：

* `--json`：输出为 JSON。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

### `modal function autoscaler update`

更新所提供功能的当前自动缩放设置。FUNCTION 可以是函数 ID 或已部署的函数名称，格式为 `APP_NAME/FUNCTION_NAME`。

可以使用`--max-containers`、`--min-containers`、`--buffer-containers`、
和 `--scaledown-window` 选项。

如果提供，Max Containers 应为正整数，Min/Buffer Containers 应为
非负整数，并且 Scaledown 窗口应该是以秒为单位的正整数。

示例：

更新已部署函数的最大容器数：

```
modal function autoscaler update my-app/my-function --max-containers 10
```

按 ID 更新函数的最小容器和缓冲区容器：

```
modal function autoscaler update fu-1234 --min-containers 3 --buffer-containers 2
```

**用法**：

```shell
modal function autoscaler update [OPTIONS] FUNCTION
```

**选项**：

* `--max-containers TEXT`：最大并发容器数。
* `--min-containers TEXT`：保持运行的最小容器数量。
* `--buffer-containers TEXT`：超出当前需求的额外容器以保暖。
* `--scaledown-window TEXT`：空闲容器在缩小规模之前等待的最大持续时间（以秒为单位）。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal function calls`

显示模态函数的最新输入。

FUNCTION 可以是函数 ID 或已部署的函数名称，格式为
`APP_NAME/FUNCTION_NAME`。每个唯一的输入对应一个条目
在输出中。

使用 `--since` 和/或 `--until` 获取时间范围内的所有输入，最老的排在第一位。 `--until` 默认为现在。如果省略`--since`，则为前一小时
已获取。如果省略时区，则时间将被解释为当地时间。

`--tail` 不能与任一日期选项组合。
默认情况下，`--tail` 返回最新的 10 个输入，最新的在前。

示例：

```
modal function calls my-app/my-function
```

```
modal function calls my-app/my-function --since 2h --until 1h
```

显示 Cls 所有变体的最近调用：

```
modal function calls 'my-app/MyClass.*' --all-variants --tail 500
```

禁用输出中的颜色：

```
modal function calls my-app/my-function --no-color
```

**用法**：

```shell
modal function calls [OPTIONS] FUNCTION
```

**选项**：

* `-n, --tail INTEGER RANGE`：最多显示最后 N 个功能输入。默认为 10。不能与 --since 或 --until 组合使用。  \[1<=x<=1000]
* `--since TEXT`：获取在此时间或之后排队的输入（例如“2h”或 ISO 8601 日期时间）。
* `--until TEXT`：获取在此时间之前排队的输入（例如“1h”或 ISO 8601 日期时间）。
* `--all-variants`：包括来自基本函数及其所有变体的输入。
* `--show-function-call-id`：在表输出中包含函数调用 ID。
* `--json`：以 JSON 格式输出调用。
* `--no-color`：禁用输出中的颜色。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal function info`

显示有关给定模态函数的信息。FUNCTION 可以是函数 ID (`fu-...`) 或已部署的函数名称，格式如下
`APP_NAME/FUNCTION_NAME`。此命令的输出包括有关任何资源的信息
此功能请求的任何计划/自动缩放设置、任何已安装的卷或存储桶、
以及任何 HTTP 设置。

示例：

直接提供函数 ID：

```
modal function info fu-0123456789abcdefghijkl
```

引用已部署应用程序中的函数：

```
modal function info hello-world-app/test_web_function
```

**用法**：

```shell
modal function info [OPTIONS] FUNCTION
```

**选项**：

* `--json`：输出为 JSON。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal function logs`

获取或流式传输功能日志。
默认情况下，此命令获取最后 100 个日志条目并退出。使用 `-f` 来
相反，来自正在运行的函数的实时流日志。获取和跟随是互斥的。

默认情况下，日志仅限于指定的 ID。转`--all-variants`至
包括基础及其所有变体，即使指定变体 ID 时也是如此。

示例：

根据函数ID获取最近的日志：

```
modal function logs fu-12345
```

根据名称获取当前部署的函数的最新日志：

```
modal function logs my-app/image-gen
```

跟踪（流式传输）正在运行的函数的日志：

```
modal function logs my-app/image-gen -f
```

获取最后 1000 个条目：

```
modal function logs my-app/image-gen --tail 1000
```

获取最近 2 小时的日志：

```
modal function logs my-app/image-gen --since 2h
```获取特定时间范围内的日志：

```
modal function logs my-app/image-gen --since 2026-09-01T05:00:00 --until 2026-09-01T08:00:00
```

按来源过滤日志：

```
modal function logs my-app/image-gen --source stderr
```

每行包含时间戳以及函数和容器 ID：

```
modal function logs my-app/image-gen --timestamps --show-function-id --show-container-id
```

**用法**：

```shell
modal function logs [OPTIONS] FUNCTION_REF
```

**选项**：

* `-f, --follow`：流式传输日志输出直到中断
* `--since TEXT`：时间范围的开始。接受 ISO 8601 日期时间或相对时间，例如“1d”（1 天前）、“2h”、“30m”等。
* `--until TEXT`：时间范围结束；接受与 --since 相同的参数类型
* `-n, --tail INTEGER`：仅显示最后N条日志条目
* `--search TEXT`：按搜索文本过滤
* `--function-call TEXT`: 按 FunctionCall ID 过滤 (fc-\*)
* `--container TEXT`: 按容器 ID 过滤 (ta-\*)
* `-s, --source TEXT`：按来源过滤：'stdout'、'stderr' 或 'system'
* `--timestamps`：在每行前面加上时间戳
* `--show-function-id`：在每行前面加上其功能 ID 前缀
* `--show-function-call-id`：在每一行前面加上其 FunctionCall ID 前缀
* `--show-container-id`：在每行前面加上容器 ID 前缀
* `--all-variants`：包括来自基地及其所有变体的原木。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal function metrics`

预览并导出模态函数的指标。

函数可以是对象 ID 或已部署的函数名称，格式为
`APP_NAME/FUNCTION_NAME`。

每个指标都是从`--since`到`--until`窗口内的时间序列
（默认值：最后一小时，最大值：31 天）。样本被聚合成
固定宽度的桶。

用`--bucket-size`设置宽度。每个系列仅限 500 个桶，所以窗口很长
需要更宽的水桶。时间范围向下舍入为 UTC 格式的存储桶边界。
结果可能包括 --since 之前的数据，并排除最后一个边界和 --until 之间的数据。

系列按名称分组。使用 `--group` 指定要返回的指标。
默认情况下，打印一个架构，总结日期范围、存储桶大小和时间序列
被退回。使用 `--json` 或 `--csv` 来输出原始样本。

预览可用的功能指标：

```shell
modal function metrics my-app/my-function
```

将过去两小时的通话指标导出为 JSON：

```shell
modal function metrics my-app/my-function --group calls --since 2h --json > metrics.json
```

导出 CPU、内存、网络和 GPU 指标：

```shell
modal function metrics my-app/my-function --group cpu --group memory --group network --group gpu --json
```

将具有五分钟存储桶的容器指标保存为 CSV：

```shell
modal function metrics fu-abc123 --group containers --bucket-size 5m --csv > metrics.csv
```

导出所有参数化变体的所有指标组：

```shell
modal function metrics my-app/MyClass.* --all-variants --json > metrics.json
```

**用法**：

```shell
modal function metrics [OPTIONS] FUNCTION
```

**选项**：* `--since TEXT`：开始时间：ISO 8601 或相对持续时间（例如 2 小时）。天真的时代是本地的。
* `--until TEXT`: 结束时间；与 --since 语法相同。默认为现在。
* `--group TEXT`：公制组；重复选择多个。默认为全部。有效值为“容器”、“CPU”、“内存”、“网络”、“GPU”、“调用”。
* `--bucket-size DURATION`：铲斗宽度：1m、2m、3m、4m、5m、6m、10m、12m、15m、20m、30m、1h、2h、3h、4h、8h、12h、1d。默认情况下，选择一个值将时间范围分割为大约 100 个存储桶。
* `--json`：获取指标样本并输出 JSON。
* `--csv`：获取指标样本并输出 CSV。
* `--all-variants`：聚合根函数及其变体。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal function stats`

显示模态函数的聚合统计数据。

FUNCTION 可以是函数 ID 或已部署的函数名称，格式为
`APP_NAME/FUNCTION_NAME`。默认情况下，统计信息描述指定的函数 ID。
通过 `--all-variants` 聚合其所有直接变体。

如果省略 --since 和 --until，则返回最后一小时的统计信息。

可用的指标及其定义可能会发生变化，并已提供
在尽最大努力的基础上。它们可能会延迟或不完整。不要依赖这个命令
用于自动缩放器管理。

示例：

使用函数 ID 显示过去一小时的统计数据：

```
modal function stats fu-abc123
```

按名称显示已部署函数的统计信息：

```
modal function stats my-app/my-function
```

显示已部署的 `modal.Cls` 所有参数化实例的统计信息：

```
modal function stats 'my-app/MyClass.*' --all-variants
```

显示特定相对窗口的统计数据：

```
modal function stats my-app/my-function --since 5h --until 2h
```

以 JSON 形式显示明确时间范围的统计信息：

```
modal function stats my-app/my-function         --since 2026-08-28T14:00:00Z         --until 2026-08-28T16:00:00Z         --json
```

显示特定容器的统计信息：

```
modal function stats my-app/my-function --container ta-12345
```

**用法**：

```shell
modal function stats [OPTIONS] FUNCTION
```

**选项**：
* `--since TEXT`：时间范围的开始。如果未提供时区，则视为当地时间。接受 ISO 8601 日期时间或相对时间，例如“2h”或“30m”。
* `--until TEXT`：时间范围结束。如果未提供时区，则视为当地时间。接受与 --since 相同的参数类型。
* `--all-variants`：聚合基本函数及其变体。
* `--container CONTAINER`：仅计算此容器的统计数据。优先于 --all-variants。
* `--no-color`：禁用输出中的颜色。
* `--json`：将统计数据输出为 JSON。* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal function variants`

列出模态函数的变体。

变体是 `modal.Cls` 的参数化实例以及使用以下命令创建的函数
`.with_options()`。 FUNCTION 可以是函数 ID 或已部署的函数名称，格式为
`APP_NAME/FUNCTION_NAME`。

默认情况下，最繁忙的变体首先列出。如果您要求的变体超出了所能提供的范围
排名，或者对于所有这些，它们都被列为最新的第一个。

示例：

列出已部署函数最繁忙的变体：

```
modal function variants my-app/my-function
```

列出已部署的`modal.Cls`的参数化实例：

```
modal function variants 'my-app/MyClass.*'
```
仅显示十个最繁忙的变体：

```
modal function variants my-app/my-function --limit 10
```

以 JSON 形式列出函数 ID 的每个变体：

```
modal function variants fu-abc123 --limit 0 --json
```

**用法**：

```shell
modal function variants [OPTIONS] FUNCTION
```

**选项**：

* `-n, --limit INTEGER`：最多显示 N 个变体，首先运行最多容器的变体。使用 0 列出每个变体，最新的在前。  \[默认值：200]
* `--json`：输出为 JSON。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。