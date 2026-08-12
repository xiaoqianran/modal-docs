<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用现有图像

本指南将引导您了解如何使用现有容器映像作为模态映像。

```python notest
sklearn_image = modal.Image.from_registry("huanjason/scikit-learn")
custom_image = modal.Image.from_dockerfile("./src/Dockerfile")
```

## 使用 `.from_registry` 从公共注册表加载图像

要从公共注册表加载图像，只需将图像名称（包括任何标签）传递到 [`Image.from_registry`](/docs/sdk/py/latest/Image#from_registry)：

```python
sklearn_image = modal.Image.from_registry("huanjason/scikit-learn")


@app.function(image=sklearn_image)
def fit_knn():
    from sklearn.neighbors import KNeighborsClassifier
    ...
```

`from_registry`方法可以从所有公共注册中心加载图像，例如
[Nvidia的`nvcr.io`](https://catalog.ngc.nvidia.com/containers),
[AWS ECR](https://aws.amazon.com/ecr/)，以及
[GitHub 的 `ghcr.io`](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)。

您可以进一步修改图像[就像任何其他模态图像一样](/docs/guide/images)：

```python continuation
data_science_image = sklearn_image.uv_pip_install("polars", "datasette")
```您可以使用外部图像，只要

* 该图像是为
  [`linux/amd64`平台](https://unix.stackexchange.com/questions/53415/why-are-64-bit-distros-often-called-amd64)
* 该图像具有[兼容的`ENTRYPOINT`](#entrypoint)

此外，要与模态函数一起使用，图像需要具有 `python` 和 `pip`
在 `$PATH` 上安装并可用。
如果现有图像没有兼容设置 `python` 或 `pip`，您
仍然可以使用它。只需提供版本号作为 `add_python` 参数即可
安装一个可重现的
[独立构建](https://github.com/indygreg/python-build-standalone)
Python 的：

```python
ubuntu_image = modal.Image.from_registry("ubuntu:22.04", add_python="3.11")
valhalla_image = modal.Image.from_registry("gisops/valhalla:latest", add_python="3.12")
```

对于旧版本的 Modal 图像生成器还有一些额外的限制。
图像生成器版本通过设置页面[此处](/settings/image-builder-version) 在工作区级别设置。
有关图像的任何其他限制的详细信息，请参阅该页面上的迁移指南。

## 从私有注册表加载图像

您还可以在 Modal 上使用私有容器注册表中定义的映像。
确切的方法取决于您使用的注册表。

### Docker 中心（私人）

要从私有 Docker Hub 存储库中提取容器映像，
[创建访问令牌](https://docs.docker.com/security/for-developers/access-tokens/)
具有“只读”权限并使用此令牌值和您的 Docker Hub
用于创建模态 [Secret](/docs/guide/secrets) 的用户名。

```
REGISTRY_USERNAME=my-dockerhub-username
REGISTRY_PASSWORD=dckr_pat_REDACTED
```

将此秘密与
[`modal.Image.from_registry`](/docs/sdk/py/latest/Image#from_registry) 方法。

### 弹性容器注册表 (ECR)

您可以通过指定完整图像 URI 从您的 AWS ECR 账户中提取图像
如下：

```python
import modal

aws_secret = modal.Secret.from_name("my-aws-secret")
image = (
    modal.Image.from_aws_ecr(
        "000000000000.dkr.ecr.us-east-1.amazonaws.com/my-private-registry:latest",
        secret=aws_secret,
    )
    .pip_install("torch", "numpy", "huggingface")
)

app = modal.App(image=image)
```

如上所示，您还需要使用一个[Modal Secret](/docs/guide/secrets)
包含环境变量`AWS_ACCESS_KEY_ID`，
`AWS_SECRET_ACCESS_KEY`和`AWS_REGION`。关联的 AWS IAM 用户账户
使用这些密钥必须能够访问您想要访问的私有注册表。
或者，您可以使用 [OIDC 令牌身份验证](/docs/guide/oidc-integration#pull-images-from-aws-elastic-container-registry-ecr)。

用户需要具有以下只读策略：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": ["ecr:GetAuthorizationToken"],
      "Effect": "Allow",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetRepositoryPolicy",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:DescribeImages",
        "ecr:BatchGetImage",
        "ecr:GetLifecyclePolicy",
        "ecr:GetLifecyclePolicyPreview",
        "ecr:ListTagsForResource",
        "ecr:DescribeImageScanFindings"
      ],
      "Resource": "<MY-REGISTRY-ARN>"
    }
  ]
}
```

您可以使用上面的 IAM 配置作为创建 IAM 用户的模板。
那么你可以
[生成访问密钥](https://aws.amazon.com/premiumsupport/knowledge-center/create-access-key/)
并使用 AWS 集成选项创建模态密钥。模态将使用您的
访问密钥以生成临时 ECR 令牌。该令牌仅用于拉取
构建新图像时的图像层。我们不存储此令牌，但是
将在拉取图像后对其进行缓存。

ECR 上的图像必须是私有的并遵循
[图像配置要求](/docs/sdk/py/latest/Image#from_aws_ecr)。

### Google Artifact 注册表和 Google 容器注册表

有关如何从 Google 图像注册表中提取图像的更多详细信息，请参阅
[`modal.Image.from_gcp_artifact_registry`](/docs/sdk/py/latest/Image#from_gcp_artifact_registry)。

### Azure 容器注册表 (ACR)

Modal 没有本机 Azure 支持，但您可以使用以下命令从私有 ACR 中提取图像
ACR 的[基于令牌的存储库权限](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-token-based-repository-permissions)
生成长期存在的 Docker 凭证。然后可以存储这些凭据（令牌和密码）
作为模态秘密并与 [`modal.Image.from_registry`](/docs/sdk/py/latest/Image#from_registry) 一起使用
与 [Docker Hub 私有注册表](#docker-hub-private) 凭据相同。

## 使用 `.from_dockerfile` 带来您自己的图像定义

您可以通过将其路径传递给现有 Dockerfile 来定义镜像
[`Image.from_dockerfile`](/docs/sdk/py/latest/Image#from_dockerfile):

```python
dockerfile_image = modal.Image.from_dockerfile("Dockerfile")


@app.function(image=dockerfile_image)
def fit():
    import sklearn
    ...
```

请注意，您仍然可以使用图像生成器方法扩展此图像！
有关详细信息，请参阅[指南](/docs/guide/images)。### Dockerfile 命令兼容性

由于 Modal 不使用 Docker 来构建容器，因此我们有自己的容器
的实施
[Dockerfile规范](https://docs.docker.com/engine/reference/builder/)。
大多数 Dockerfile 应该可以开箱即用，但有一些差异
请注意。

首先，一些次要的 Dockerfile 命令和标志尚未实现。
其中包括 `EXPOSE`、`HEALTHCHECK`、`LABEL`、`ONBUILD`、`STOPSIGNAL` 和
`VOLUME`。
如果您的用例需要其中任何一个，请联系我们。

接下来，有一些特定于命令的东西在移植时可能有用。
Dockerfile 到模态。

#### `USER`

模态容器始终以 root (uid 0) 身份运行。这
[`USER`](https://docs.docker.com/engine/reference/builder/#user)指令是
忽略，无论它出现在您的 Dockerfile 中还是从基础镜像继承
使用 [`Image.from_registry`](/docs/sdk/py/latest/Image#from_registry) 拉取。

[减少权限](https://dwheeler.com/secure-programs/Secure-Programs-HOWTO/minimize-privileges.html)
对于在 Modal 容器内运行的程序，请使用操作系统用户管理功能
像[`setuid`](https://man7.org/linux/man-pages/man2/setuid.2.html)。例如，
在Python中，您可以在[子进程创建](https://docs.python.org/3/library/subprocess.html)期间传入`user`。

#### `ENTRYPOINT`

虽然
[`ENTRYPOINT`](https://docs.docker.com/engine/reference/builder/#entrypoint)
支持命令，但入口点脚本有一个额外的限制提供：当与模态函数一起使用时，它还必须 `exec` 在某个时刻传递给它的参数。
这样模态函数运行时的 Python 入口点就可以在您自己的入口点之后运行。大多数入口点
Docker 容器中的脚本是其他脚本的包装器，因此这很可能
已经是这样了。

如果您想编写自己的入口点脚本，可以使用以下内容
模板：

```bash
#!/usr/bin/env bash

# Your custom startup commands here.

exec "$@" # Runs the command passed to the entrypoint script.
```

如果上述文件在您的容器中保存为`/usr/bin/my_entrypoint.sh`，
然后你可以将它注册为入口点
`ENTRYPOINT ["/usr/bin/my_entrypoint.sh"]` 在你的 Dockerfile 中，或者使用
[`entrypoint`](/docs/sdk/py/latest/Image#entrypoint) 作为
图像构建步骤。

```python
import modal

image = (
    modal.Image.debian_slim()
    .pip_install("foo")
    .entrypoint(["/usr/bin/my_entrypoint.sh"])
)
```

#### `ENV`

我们目前不支持默认值
[插值](https://docs.docker.com/compose/compose-file/12-interpolation/),
比如`${VAR:-default}`

#### `ADD`

`ADD` 仅限于从单个 URL 获取。
目前不支持 Tar 提取、多个 URL 和复制操作。