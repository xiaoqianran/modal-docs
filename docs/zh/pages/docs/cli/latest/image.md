<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal image`

管理图像。

**用法**：

```shell
modal image [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `build`：从 Dockerfile 构建镜像并将其发布为 NAME。
* `logs`：获取镜像的构建日志。
* `names`：管理模态图像名称。
* `pull`：将镜像从容器注册表拉取到 Modal 中。

## `modal image build`

从 Dockerfile 构建镜像并将其发布为 NAME。

CONTEXT\_DIR 是用于解析相对 COPY 路径的构建上下文。使用 `.` 表示当前目录。

NAME 默认为 `latest` 标签。 `--env` 设置构建运行的环境以及位置查找`--registry-secret`。图像将发布到该环境中，除非 NAME 有
环境前缀，例如`my-env/my-image`。

示例：

```
modal image build -t my-image .
modal image build --name my-image:v2 -f docker/Dockerfile .
modal image build -t my-env/my-image .
modal image build -t my-image --registry-secret my-registry-creds .
modal image build -t my-image --registry-secret-from-env REGISTRY_USERNAME,REGISTRY_PASSWORD .
```

**用法**：

```shell
modal image build [OPTIONS] CONTEXT_DIR
```

**选项**：

* `-t, --name [ENV/]NAME[:TAG]`：发布图像的名称，例如`my-image`、`my-image:v2` 或 `my-env/my-image`。  \[必填]
* `-f, --file FILE`：Dockerfile 的路径。默认为`CONTEXT_DIR/Dockerfile`。
* `--registry-secret SECRET_NAME`：包含用于从私有注册表中提取基础映像的凭证的 Secret 名称。
* `--registry-secret-from-env VAR[,VAR...]`：以逗号分隔的本地环境变量名称，保存注册表凭据。不能与 --registry-secret 结合使用。
* `--force-build`：重建图像的每一层，忽略缓存的构建。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。

## `modal image logs`

获取图像的构建日志。

**用法**：

```shell
modal image logs [OPTIONS] IMAGE_ID
```

**选项**：

* `--layers INTEGER`：从最后 N 个构建层获取日志。默认为 1。
* `--all`：从所有可用的构建层获取日志。
* `--help`：显示此消息并退出。

## `modal image names`

管理模态图像名称。

**用法**：

```shell
modal image names [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：* `delete`：删除已命名的Image。
* `list`：列出命名图像。

### `modal image names delete`

删除已命名的图像。

这不会删除底层图像，只是删除
与名称及其出版历史的关联。

传递显式标记作为 NAME:TAG。

示例：

```
modal image names delete sglang-image:v1
```

**用法**：

```shell
modal image names delete [OPTIONS] NAME:TAG
```

**选项**：

* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `-y, --yes`：运行时不暂停确认。
* `--help`：显示此消息并退出。

### `modal image names list`

列出名为图像的列表。

**用法**：

```shell
modal image names list [OPTIONS]
```

**选项**：
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--prefix TEXT`：仅包含以此前缀开头的命名图像标签。
* `--json`
* `--help`：显示此消息并退出。

## `modal image pull`

将镜像从容器注册表拉入 Modal。

`image_ref` 是传递给 `modal.Image.from_registry` 的注册表映像名称（和可选标签）。
它必须以注册表主机开头，例如`docker.io/node:20` 用于 Docker Hub 镜像。
如果提供了`--name`，模态图像也将以该名称发布。使用`ENV/NAME`发布到另一个环境； `--env`仍然选择环境
用于拉动和查找`--registry-secret`。

示例：

```bash
modal image pull docker.io/node:20
modal image pull nvcr.io/nvidia/pytorch:25.01-py3 --name pytorch:25
modal image pull docker.io/node:20 --name prod/node:20
```

在注册表中发生更改后，通过 `--force-build` 再次拉取标签，例如`latest`。

私有注册表需要来自 `modal.Secret` 的凭据，无论是已经存在的凭据
(`--registry-secret`) 或由本地环境变量组装而成的 (`--registry-secret-from-env`)。
身份验证的类型来自凭证中的密钥：

* AWS：`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY` 和 `AWS_REGION`（可选 `AWS_SESSION_TOKEN`），
  或 `AWS_ROLE_ARN` 和 `AWS_REGION` 担任 OIDC 的角色
* GCP: `SERVICE_ACCOUNT_JSON`，保存服务帐户密钥的 JSON
* 用户名和密码：`REGISTRY_USERNAME`和`REGISTRY_PASSWORD`

```bash
# Authenticate with a named Secret
modal image pull ghcr.io/my-org/my-image --registry-secret my-registry-secret

# Authenticate with credentials in environment variables
modal image pull $AWS_ECR_URL/my-image \
    --registry-secret-from-env AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,AWS_REGION
```

**用法**：

```shell
modal image pull [OPTIONS] IMAGE_REF
```
**选项**：

* `--name [ENV/]NAME[:TAG]`：以该名称发布拉取的镜像。 ENV/ 前缀将其发布到该环境。
* `--registry-secret TEXT`：模态名称。保存注册表凭据的秘密。
* `--registry-secret-from-env VAR[,VAR...]`：以逗号分隔的本地环境变量名称，保存注册表凭据。不能与 --registry-secret 结合使用。
* `--force-build`：再次从注册表中拉取镜像，替换缓存的镜像。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--help`：显示此消息并退出。