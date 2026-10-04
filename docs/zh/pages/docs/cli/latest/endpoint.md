<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal endpoint`

创建和管理 LLM 推理端点。

Modal Endpoints 以最少的编码或配置部署生产就绪的 LLM 推理服务器。
端点支持预先训练的开放模型以及来自私人 Hugging Face 存储库的自定义权重
或模态音量。

请参阅https://modal.com/docs/guide/endpoints了解更多信息。

**用法**：

```shell
modal endpoint [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `create`：部署新的端点。
* `info`：显示有关 Endpoint 的详细信息，例如型号、URL 和状态。* `list`：列出在环境中配置或运行的端点。
* `logs`：获取或流式传输专用端点的日志。
* `stats`：显示专用端点的聚合服务器统计信息。
* `stop`：永久停止端点并终止任何正在运行的容器。

## `modal endpoint create`

部署新的端点。

示例：

从基本模型创建端点：

```bash
modal endpoint create --model Qwen/Qwen3.6-27B-FP8
```

创建一个具有显式名称的端点：

```bash
modal endpoint create --name qwen-chat --model Qwen/Qwen3.6-27B-FP8
```

创建具有显式路由和计算区域的端点：

```bash
modal endpoint create --model Qwen/Qwen3.6-27B-FP8 \
  --routing-region us-east --compute-region us-west
```

从私有 Hugging Face 模型创建端点：

```bash
modal endpoint create --name my-ft --model Qwen/Qwen3.6-27B-FP8 \
  --custom-hf-repo acme/qwen-ft --custom-hf-token $HF_TOKEN
```

从模态体积中的自定义权重创建端点：

```bash
modal endpoint create --name my-ft --model Qwen/Qwen3.6-27B-FP8 \
  --custom-volume-name qwen-ft --custom-volume-path /models/qwen
```

**用法**：

```shell
modal endpoint create [OPTIONS]
```

**选项**：
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--name TEXT`：端点名称。如果未提供，将从模型名称派生默认值。
* `--model TEXT`：基本模型架构的 Hugging Face 存储库 ID（例如“Qwen/Qwen3.6-27B-FP8”）。  \[必填]
* `--routing-region TEXT`：用于路由推理请求的区域。默认为美国西部。
* `--compute-region TEXT`：运行端点容器的区域。可以指定多次。这会产生区域选择价格乘数。* `--colocate-compute`：运行路由区域内的所有容器。这会产生区域选择价格乘数。
* `--unauthenticated`：允许对端点进行未经身份验证的 HTTP 请求。
* `--custom-hf-repo TEXT`：Hugging Face 存储库 ID，用于微调模型权重。
* `--custom-hf-revision TEXT`：Git 修订版 --custom-hf-repo。
* `--custom-hf-token TEXT`：私有的拥抱脸部令牌--custom-hf-repo。
* `--custom-volume-name TEXT`：包含自定义模型权重的模态体积名称。
* `--custom-volume-path TEXT`：包含模型权重的体积内的路径。
* `--help`：显示此消息并退出。

## `modal endpoint info`

显示有关端点的详细信息，例如模型、URL 和状态。

示例：

按名称获取有关端点的信息：

```bash
modal endpoint info qwen-chat
```

通过 ID 获取有关端点的信息：
```bash
modal endpoint info ep-123456
```

将信息输出为 JSON：

```bash
modal endpoint info qwen-chat --json
```

禁用颜色输出：

```bash
modal endpoint info qwen-chat --no-color
```

**用法**：

```shell
modal endpoint info [OPTIONS] ENDPOINT_IDENTIFIER
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--json`
* `--no-color`：禁用输出中的颜色。
* `--help`：显示此消息并退出。

## `modal endpoint list`

列出在环境中配置或运行的端点。

**用法**：

```shell
modal endpoint list [OPTIONS]
```

**选项**：

* `--json`
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。* `--help`：显示此消息并退出。

## `modal endpoint logs`

获取或流式传输专用端点的日志。

默认情况下，此命令获取最后 100 个日志条目并退出。使用 `-f` 来
相反，来自正在运行的端点的实时流日志。获取和跟随是互斥的。

示例：

按端点名称获取最近的日志：

```bash
modal endpoint logs qwen-chat
```

通过端点 ID 获取最近的日志：

```bash
modal endpoint logs ep-123456
```

跟踪来自正在运行的端点的日志：

```bash
modal endpoint logs qwen-chat -f
```

获取最后 1000 个条目：

```bash
modal endpoint logs qwen-chat --tail 1000
```

获取最近两个小时的日志：

```bash
modal endpoint logs qwen-chat --since 2h
```

获取特定时间范围内的日志：

```bash
modal endpoint logs qwen-chat --since 2026-09-01T05:00:00 --until 2026-09-01T08:00:00
```

过滤日志并包含时间戳：

```bash
modal endpoint logs qwen-chat --source stderr --search timeout --timestamps
```

**用法**：

```shell
modal endpoint logs [OPTIONS] ENDPOINT_IDENTIFIER
```
**选项**：

* `-f, --follow`：流式传输日志输出直到中断
* `--since TEXT`：时间范围的开始。接受 ISO 8601 日期时间或相对时间，例如“1d”、“2h”或“30m”。
* `--until TEXT`：时间范围结束；接受与 --since 相同的参数类型
* `-n, --tail INTEGER`：仅显示最后N条日志条目
* `--search TEXT`: 按搜索文本过滤
* `--container TEXT`: 按容器 ID 过滤 (ta-\*)
* `-s, --source TEXT`：按源过滤：'stdout'、'stderr' 或 'system'
* `--timestamps`：在每行前面加上时间戳作为前缀
* `--show-server-id`：在每行前面加上服务器 ID 前缀
* `--show-container-id`：在每行前面加上容器 ID 前缀* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal endpoint stats`

显示专用端点的聚合服务器统计信息。

默认时间范围是最近一小时。指标提供在
尽力而为，可能会延迟或不完整。

示例：

按端点名称显示过去一小时的统计数据：

```bash
modal endpoint stats qwen-chat
```

按端点 ID 显示统计信息：

```bash
modal endpoint stats ep-123456
```

显示相对时间范围的统计数据：

```bash
modal endpoint stats qwen-chat --since 5h --until 2h
```

显示两小时前结束的一小时的统计数据：

```bash
modal endpoint stats qwen-chat --until 2h
```

以 JSON 形式显示明确时间范围的统计信息：

```bash
modal endpoint stats qwen-chat \
    --since 2026-09-01T05:00:00Z \
    --until 2026-09-01T08:00:00Z \
    --json
```
显示特定容器的统计信息：

```bash
modal endpoint stats qwen-chat --container-id ta-12345
```

**用法**：

```shell
modal endpoint stats [OPTIONS] ENDPOINT_IDENTIFIER
```

**选项**：

* `--since TEXT`：时间范围的开始。如果未提供时区，则视为当地时间。接受 ISO 8601 日期时间或相对时间，例如“2h”或“30m”。
* `--until TEXT`：时间范围结束。如果未提供时区，则视为当地时间。
* `--container-id CONTAINER_ID`：仅计算此容器的统计数据。
* `--no-color`：禁用输出中的颜色。
* `--json`：将统计数据输出为 JSON。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal endpoint stop`

永久停止端点并终止任何正在运行的容器。

**用法**：

```shell
modal endpoint stop [OPTIONS] ENDPOINT_IDENTIFIER
```

**选项**：

* `-y, --yes`：运行时无需暂停确认。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `--help`：显示此消息并退出。