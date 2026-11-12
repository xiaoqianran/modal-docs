<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal server`

部署并检查模态服务器。

**用法**：

```shell
modal server [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `autoscaler`：查看和配置模态服务器的自动缩放器设置。
* `deploy`：部署容器镜像作为服务器。
* `info`：显示有关给定模态服务器的信息。
* `logs`：获取或流式传输服务器日志。
* `metrics`：预览并导出模态服务器的指标。
* `requests`：显示模态服务器最近处理的请求。
* `stats`：显示模态服务器的聚合统计信息。

## `modal server autoscaler`查看和配置模态服务器的自动缩放器设置。

**用法**：

```shell
modal server autoscaler [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `settings`：显示所提供服务器的当前自动缩放设置。
* `update`：更新所提供服务器的当前自动缩放设置。

### `modal server autoscaler settings`

显示所提供服务器的当前自动缩放设置。

除了当前设置之外，此命令还显示对这些设置的任何活动覆盖
设置，以及有关谁以及何时覆盖该设置的元数据。服务器可能是
服务器 ID 或已部署的服务器名称，格式为 `APP_NAME/SERVER_NAME`。
如果设置的值是默认值且未被覆盖，则输出中将省略其值。

示例：

显示已部署服务器的自动缩放设置：

```
modal server autoscaler settings my-app/my-server
```

使用 ID 显示自动缩放设置：

```
modal server autoscaler settings fu-1234
```

**用法**：

```shell
modal server autoscaler settings [OPTIONS] FUNCTION
```

**选项**：

* `--json`：输出为 JSON。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

### `modal server autoscaler update`

更新所提供服务器的当前自动缩放设置。

SERVER 可以是服务器 ID 或已部署的服务器名称，格式为 `APP_NAME/SERVER_NAME`。可以使用`--max-containers`、`--min-containers`、`--buffer-containers`、
`--scaledown-window`、`--scaleup-window` 和 `--target-concurrency` 选项。

如果提供，Max Containers 应为正整数，Min 和 Buffer Containers 应为
非负整数，Scaledown 和 Scaleup 窗口应该是以秒为单位的正整数，
目标并发数应该是正浮点数或字符串“none”。

示例：

更新已部署服务器的最大容器数：

```
modal server autoscaler update my-app/my-server --max-containers 10
```

按 ID 更新服务器的最小容器数和目标并发数：

```
modal server autoscaler update fu-1234 --min-containers 3 --target-concurrency 2.5
```

将目标并发设置为“无”（禁用服务器的自动缩放）

```
modal server autoscaler update my-app/my-server --target-concurrency none
```
**用法**：

```shell
modal server autoscaler update [OPTIONS] SERVER
```

**选项**：

* `--max-containers TEXT`：最大并发容器数。
* `--min-containers TEXT`：保持运行的最小容器数量。
* `--buffer-containers TEXT`：超出当前需求的额外容器以保暖。
* `--scaledown-window TEXT`：空闲容器在缩小规模之前等待的最大持续时间（以秒为单位）。
* `--scaleup-window TEXT`：扩大新容器规模之前所需的持续需求秒数。
* `--target-concurrency TEXT`：每个容器的目标并发请求数。可能是分数。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。* `--help`：显示此消息并退出。

## `modal server deploy`

将容器镜像部署为服务器。

在 Modal 上运行现有的容器镜像，无需编写任何 Python。 `--image` 是
包含其注册表的容器映像引用，例如`docker.io/nginx`，或
使用`modal image build`或`Image.publish()`发布的模态图像的名称，例如
`my-image:v1`。已发布的模态图像优先于注册表图像，其中
相同的参考。图像不需要Python，也不需要Modal客户端；它只需要提供 HTTP 服务
在`--port`。
服务器由镜像自身的ENTRYPOINT和CMD启动； `--entrypoint` 和 `--cmd`
覆盖它们。
注册表映像被拉取一次，并由相同引用的后续部署重复使用。如果一个
注册表中的`latest`等标签发生变化，通过`--force-build`再次拉取，
或通过摘要引用图像。

Server命名为“Server”，部署在`--app-name`给出的App下，即
默认为图像的存储库名称，不带标签，因此部署一个新标签
图像更新相同的应用程序。例如，`ghcr.io/org/api:v2`和`ghcr.io/org/api:v3`
两者都部署到应用程序`api`。其他`modal server`命令将其称为
`APP_NAME/Server`，例如`modal server logs api/Server`。重新部署应用程序已部署首先要求确认，除非给出`--yes`。没有
交互式终端，例如在 CI 中，除非给出 `--yes`，否则重新部署将中止。

示例：

部署一个公共镜像，通过自己的 ENTRYPOINT 和 CMD 启动其服务器：

```
modal server deploy --image docker.io/nginx --port 80 --unauthenticated
```

部署带有 GPU、Secret、Volume 和环境变量的私有映像：

```
modal server deploy --image my-registry.com/api:v2 --port 8000 \
    --registry-secret my-registry-creds --gpu A100 --secret my-api-keys \
    --volume my-models:/models --env-var LOG_LEVEL=debug
```

使用注册表凭证和从本地获取的 API 密钥部署 AWS ECR 映像
环境：

```
modal server deploy --image 123456789012.dkr.ecr.us-east-1.amazonaws.com/api:v2 --port 8000 \
    --registry-secret-from-env AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,AWS_REGION \
    --secret-from-env OPENAI_API_KEY
```

使用自定义入口点和命令部署映像：

```
modal server deploy --image docker.io/python:3.12 --port 8000 \
    --entrypoint "python -m" --cmd "http.server 8000"
```

将当前目录中的 Dockerfile 构建为命名的 Modal Image，然后部署它：

```
modal image build -t my-image:v1 .
modal server deploy --image my-image:v1 --port 8000
```

**用法**：

```shell
modal server deploy [OPTIONS]
```

**选项**：
* `--image TEXT`：容器镜像，包括其注册表，例如'docker.io/nginx'，或已发布的模态图像的名称，例如'我的图像：v1'。  \[必填]
* `--port INTEGER`：服务器在容器内监听的端口。  \[必填]
* `--registry-secret TEXT`：带有用于拉取私有注册表映像的凭据的模态密钥的名称。其密钥选择身份验证类型：AWS\_ACCESS\_KEY\_ID、AWS\_SECRET\_ACCESS\_KEY 和 AWS\_REGION（可选 AWS\_SESSION\_TOKEN），或 AWS\_ROLE\_ARN 和 AWS\_REGION（对于 AWS ECR）； GCP 的 SERVICE\_ACCOUNT\_JSON；或任何其他注册表的 REGISTRY\_USERNAME 和 REGISTRY\_PASSWORD。
* `--registry-secret-from-env KEYS`：以逗号分隔的本地环境变量名称，其值用于拉取私有注册表映像，例如注册表\_用户名，注册表\_密码。接受与 --registry-secret 相同的密钥。
* `--force-build`：再次拉取注册表映像，而不是使用缓存拉取，例如其标签更新后。后来从相同的图像参考构建也使用新的拉取。
* `--entrypoint TEXT`：覆盖图像的ENTRYPOINT，这也会清除其CMD，除非给出--cmd。 --cmd 作为参数附加，例如--entrypoint 'python -m' --cmd 'http.server 8000'。
* `--cmd TEXT`：启动服务器的命令，覆盖镜像的CMD，例如'python -m http.server 8000'。使用 shell 引用规则拆分为参数，因此引用包含空格的参数，例如--cmd'sh -c“python -m http.server 8000”'。
* `--env-var KEY=VALUE`：在容器中设置环境变量，例如LOG\_LEVEL=调试。可重复。
* `--secret TEXT`：Modal Secret 的名称，其键被设置为运行容器中的环境变量。可重复。与 --registry-secret 不同，它不用于拉取镜像。
* `--secret-from-env KEYS`：以逗号分隔的本地环境变量名称，其值被设置为正在运行的容器中的环境变量，例如API\_KEY、API\_TOKEN。与 --registry-secret-from-env 不同，它们不用于拉取映像。
* `--volume NAME:PATH`：在容器中的绝对路径处挂载模态卷，如果需要则创建它。可重复。
* `--cpu CORES[,LIMIT]`：要请求的CPU核心数，可能是小数，例如2. 添加逗号和硬限制来限制使用，例如2,4。
* `--memory MIB[,LIMIT]`：要请求的 MiB 内存，例如4096. 添加逗号和硬限制以限制使用，例如4096,8192。
* `--gpu GPU[,FALLBACK...]`：GPU请求，例如“A100”或“H100:8”。当较早的 GPU 类型不可用时，传递一个以逗号分隔的列表以回退到下一个 GPU 类型，例如'H100，A100'。
* `--region TEXT`：服务器请求在到达容器之前进入 Modal 的区域。  \[默认值：美国东部]
* `--unauthenticated`：接受没有凭据的请求。默认情况下，请求必须在 Modal-Key 和 Modal-Secret 标头中携带工作区代理令牌；请参阅“模态工作区代理令牌”。
* `--h2`：通过 HTTP/2 将请求转发到容器。服务器必须在 --port 上接受明文 HTTP/2 (h2c)。
* `--sessioned`：启用粘性会话。客户端使用“Server.sessions.start()”启动会话，并在“Modal-Authorization: Bearer <token>”标头中发送其令牌；具有相同令牌的请求到达相同的容器。
* `--target-concurrency FLOAT|none`：每个容器在扩展之前要处理的并发请求。可能是分数。 “none”将服务器保留在单个容器上。
* `--max-concurrency INTEGER|none`：每个容器的最大并发请求数；高于它的请求会收到 429。“无”表示无限制。
* `--min-containers INTEGER`：保温容器的最小数量。
* `--max-containers INTEGER|none`：最大容器数量。 “无”表示仅受工作区容器限制的限制。
* `--buffer-containers INTEGER`：活动负载下的额外空闲容器。
* `--scaleup-window INTEGER`：在扩大容器规模之前持续需求的秒数。
* `--scaledown-window INTEGER`：缩小规模之前空闲容器等待的最大秒数。
* `--startup-timeout INTEGER`：最大容器启动时间（以秒为单位）。  \[默认值：30]
* `--exit-grace-period INTEGER`：在容器关闭时让正在进行的请求完成的秒数。  \[默认值：0]
* `--app-name TEXT`：要部署的应用程序。默认为图像的存储库名称，例如“api”为“ghcr.io/org/api:v2”。
* `--stream-logs`：部署时从服务器流式传输日志。
* `-y, --yes`：直接运行，无需暂停确认。* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal server info`

显示有关给定模态服务器的信息。

SERVER 可以是功能 ID (`fu-...`) 或已部署的服务器名称，格式如下
`APP_NAME/SERVER_NAME`。此命令的输出包括有关任何资源的信息
此服务器请求的任何计划/自动缩放设置、任何已安装的卷或存储桶、
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
```跟踪（流式传输）来自正在运行的服务器的日志：

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

**选项**：

* `-f, --follow`：流式传输日志输出直到中断
* `--since TEXT`：时间范围的开始。接受 ISO 8601 日期时间或相对时间，例如“1d”（1 天前）、“2h”、“30m”等。
* `--until TEXT`：时间范围结束；接受与 --since 相同的参数类型
* `-n, --tail INTEGER`：仅显示最后N条日志条目
* `--search TEXT`：按搜索文本过滤
* `--container TEXT`: 按容器 ID 过滤 (ta-\*)
* `-s, --source TEXT`：按来源过滤：'stdout'、'stderr' 或 'system'
* `--timestamps`：在每行前面加上时间戳作为前缀
* `--show-server-id`：在每行前面加上服务器 ID 前缀
* `--show-container-id`：在每行前面加上容器 ID 前缀
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal server metrics`

预览并导出模态服务器的指标。

SERVER 可以是对象 ID 或已部署的服务器名称，格式为
`APP_NAME/SERVER_NAME`。每个指标都是从`--since`到`--until`窗口内的时间序列
（默认值：最后一小时，最大值：31 天）。样本被聚合成
固定宽度的桶。

用`--bucket-size`设置宽度。每个系列仅限 500 个桶，所以窗口很长
需要更宽的水桶。时间范围向下舍入为 UTC 格式的存储桶边界。
结果可能包括 --since 之前的数据，并排除最后一个边界和 --until 之间的数据。

系列按名称分组。使用 `--group` 指定要返回的指标。

默认情况下，打印一个架构，总结日期范围、存储桶大小和时间序列
被退回。使用 `--json` 或 `--csv` 来输出原始样本。

预览可用的服务器指标：

```shell
modal server metrics my-app/my-server
```

将过去两小时的请求指标导出为 JSON：

```shell
modal server metrics my-app/my-server --group requests --since 2h --json > metrics.json
```

导出 CPU、内存、网络和 GPU 指标：

```shell
modal server metrics my-app/my-server --group cpu --group memory --group network --group gpu --json
```

将具有五分钟存储桶的容器指标保存为 CSV：

```shell
modal server metrics fu-abc123 --group containers --bucket-size 5m --csv > metrics.csv
```

**用法**：

```shell
modal server metrics [OPTIONS] SERVER
```

**选项**：

* `--since TEXT`：开始时间：ISO 8601 或相对持续时间（例如 2 小时）。天真的时代是本地的。
* `--until TEXT`：结束时间；与 --since 语法相同。默认为现在。* `--group TEXT`：公制组；重复选择多个。默认为全部。有效值为“容器”、“CPU”、“内存”、“网络”、“GPU”、“请求”。
* `--bucket-size DURATION`：铲斗宽度：1m、2m、3m、4m、5m、6m、10m、12m、15m、20m、30m、1h、2h、3h、4h、8h、12h、1d。默认情况下，选择一个值将时间范围分割为大约 100 个存储桶。
* `--json`：获取指标样本并输出 JSON。
* `--csv`：获取指标样本并输出 CSV。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal server requests`

显示模态服务器最近处理的请求。
SERVER 可以是功能 ID 或已部署的服务器名称，格式为
`APP_NAME/SERVER_NAME`。

使用 `--since` 和/或 `--until` 获取时间范围内的所有输入，
最老的排在第一位。 `--until` 默认为现在。如果省略`--since`，则为前一小时
已获取。如果省略时区，则时间将被解释为当地时间。

`--tail` 不能与任一日期选项结合使用。
默认情况下，`--tail` 返回最新的 10 个输入，最新的在前。

示例：

```
modal server requests my-app/my-server
```

```
modal server requests my-app/my-server --tail 500
```

```
modal server requests my-app/my-server --since 2h --until 1h
```

禁用输出中的颜色：

```
modal server requests my-app/my-server --no-color
```

**用法**：

```shell
modal server requests [OPTIONS] SERVER
```

**选项**：* `-n, --tail INTEGER RANGE`：显示最近 N 个服务器请求。默认为 10。不能与 --since 或 --until 组合使用。  \[1<=x<=1000]
* `--since TEXT`：在该时间或之后获取请求（例如“2h”或 ISO 8601 日期时间）。
* `--until TEXT`：获取该时间之前的请求（例如“1h”或 ISO 8601 日期时间）。
* `--json`：将请求输出为 JSON。
* `--no-color`：禁用输出中的颜色。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
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

**选项**：* `--since TEXT`：时间范围的开始。如果未提供时区，则视为当地时间。接受 ISO 8601 日期时间或相对时间，例如“2h”或“30m”。
* `--until TEXT`：时间范围结束。如果未提供时区，则视为当地时间。接受与 --since 相同的参数类型。
* `--container-id CONTAINER_ID`：仅计算此容器的统计数据。
* `--no-color`：禁用输出中的颜色。
* `--json`：将统计数据输出为 JSON。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。