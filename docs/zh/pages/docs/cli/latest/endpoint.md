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
* `list`：列出在环境中配置或运行的端点。
* `stop`：永久停止端点并终止任何正在运行的容器。

## `modal endpoint create`部署新的端点。

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
* `--compute-region TEXT`：运行端点容器的区域。可以指定多次。这会产生区域选择价格乘数。
* `--colocate-compute`：运行路由区域内的所有容器。这会产生区域选择价格乘数。
* `--unauthenticated`：允许对端点进行未经身份验证的 HTTP 请求。
* `--custom-hf-repo TEXT`：Hugging Face 存储库 ID，用于微调模型权重。
* `--custom-hf-revision TEXT`：--custom-hf-repo 的 Git 修订版。* `--custom-hf-token TEXT`：私有的拥抱脸部令牌--custom-hf-repo。
* `--custom-volume-name TEXT`：包含自定义模型权重的模态体积名称。
* `--custom-volume-path TEXT`：包含模型权重的体积内的路径。
* `--help`：显示此消息并退出。

## `modal endpoint list`

列出在环境中配置或运行的端点。

**用法**：

```shell
modal endpoint list [OPTIONS]
```

**选项**：

* `--json`
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal endpoint stop`

永久停止端点并终止任何正在运行的容器。

**用法**：

```shell
modal endpoint stop [OPTIONS] ENDPOINT_IDENTIFIER
```

**选项**：
* `-y, --yes`：运行时不暂停确认。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。