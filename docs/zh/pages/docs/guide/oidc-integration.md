<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 OIDC 向外部服务进行身份验证

Modal 中的函数可能需要访问 S3 存储桶等外部资源。
传统上，您需要将长期凭证存储在 Modal Secrets 中
并在您的函数代码中引用这些 Secret。使用模态 OIDC
集成，您可以使用自动生成的身份
用于向外部服务进行身份验证的令牌。

## 它是如何工作的

[OIDC](https://auth0.com/docs/authenticate/protocols/openid-connect-protocol) 是
用于在系统之间验证用户身份的标准协议。在模态中，我们使用
OIDC 用于生成外部服务可用于验证的短期令牌
您的功能已通过身份验证。

OIDC 集成有两个组件：发现文档和生成的
代币。

[OIDC发现文档](https://swagger.io/docs/specification/v3_0/authentication/openid-connect-discovery/)
描述了我们的 OIDC 服务器是如何配置的。主要包括支持的
[权利要求](https://developer.okta.com/blog/2017/07/25/oidc-primer-part-1) 和[钥匙](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets)
我们用来签署令牌。发现文档始终托管在`/.well-known/openid-configuration`，并且
您可以在<https://oidc.modal.com/.well-known/openid-configuration>查看我们的。

生成的令牌由 Modal 使用中描述的密钥进行签名 [JWT](https://jwt.io/)
发现文档。这些令牌包含函数的完整身份
在 `sub` 声明中，他们使用自定义声明来使此信息更加详细
交通方便。请参阅我们的[发现文档](https://oidc.modal.com/.well-known/openid-configuration)
获取完整的索赔清单。

生成的令牌会通过 `MODAL_IDENTITY_TOKEN` 自动注入到函数的容器中
环境变量。以下是令牌中可能包含哪些声明的示例：

```json
{
  "sub": "modal:workspace_id:ac-12345abcd:environment_name:modal-examples:app_name:oidc-token-test:function_name:jwt_return_func:container_id:ta-12345abcd",
  "aud": "oidc.modal.com",
  "exp": 1732137751,
  "iat": 1731964951,
  "iss": "https://oidc.modal.com",
  "jti": "31f92dca-e847-4bc9-8d15-9f234567a123",
  "workspace_id": "ac-12345abcd",
  "environment_id": "en-12345abcd",
  "environment_name": "modal-examples",
  "app_id": "ap-12345abcd",
  "app_name": "oidc-token-test",
  "function_id": "fu-12345abcd",
  "function_name": "jwt_return_func",
  "container_id": "ta-12345abcd"
}
```

### 沙箱

与函数不同，[沙盒](/docs/guide/sandboxes) 不会收到身份
默认情况下的令牌。要选择加入，请在以下情况下传递 `include_oidc_identity_token=True`
创建沙箱：

```python notest
sb = modal.Sandbox.create(app=app, include_oidc_identity_token=True)
```

然后，该令牌可通过相同的方式在沙箱内使用
`MODAL_IDENTITY_TOKEN`环境变量。

### 应用名称格式

默认情况下，可以使用任意名称创建模态应用程序。然而，当使用
OIDC，App名称有更严格的字符集。具体来说，必须是64
字符或更少，并且只能包含字母数字字符、破折号、句点、
和下划线。如果违反这些限制，OIDC 代币将不会被
注入容器中。

请注意，这些约束与应用于[已部署的应用程序](/docs/guide/managing-deployments) 的约束相同。
这意味着如果应用程序是可部署的，它也将与 OIDC 兼容。

## AWS S3 的演示使用
要了解如何使用 OIDC 代币，我们将演示一个简单的函数，其中列出了
S3 存储桶中的对象。

### 第 0 步：了解您的 OIDC 声明

在配置 OIDC 策略之前，我们需要知道可以匹配哪些声明
反对。我们可以运行一个函数并检查它的声明来找出答案。

```python notest
app = modal.App("oidc-token-test")

jwt_image = modal.Image.debian_slim().pip_install("pyjwt")

@app.function(image=jwt_image)
def jwt_return_func():
    import jwt

    token = os.environ["MODAL_IDENTITY_TOKEN"]
    claims = jwt.decode(token, options={"verify_signature": False})
    print(json.dumps(claims, indent=2))

@app.local_entrypoint()
def main():
    jwt_return_func.remote()
```

在本地运行该函数以查看其声明：

```bash
$ modal run oidc-token-test.py
{
  "sub": "modal:workspace_id:ac-12345abcd:environment_name:modal-examples:app_name:oidc-token-test:function_name:jwt_return_func:container_id:ta-12345abcd",
  "aud": "oidc.modal.com",
  "exp": 1732137751,
  "iat": 1731964951,
  "iss": "https://oidc.modal.com",
  "jti": "31f92dca-e847-4bc9-8d15-9f234567a123",
  "workspace_id": "ac-12345abcd",
  "environment_id": "en-12345abcd",
  "environment_name": "modal-examples",
  "app_id": "ap-12345abcd",
  "app_name": "oidc-token-test",
  "function_id": "fu-12345abcd",
  "function_name": "jwt_return_func",
  "container_id": "ta-12345abcd"
}
```

现在我们可以匹配这些声明来配置我们的 OIDC 策略。

### 步骤 1：配置 AWS 以信任 Modal 的 OIDC 提供商

我们需要让 AWS 接受 Modal 身份令牌。为此，我们需要添加Modal 的 OIDC 提供商作为我们 AWS 账户中的可信实体。

```bash
aws iam create-open-id-connect-provider \
    --url https://oidc.modal.com \
    --client-id-list oidc.modal.com
```

这将触发 AWS 拉取我们的 [JSON Web 密钥集 (JWKS)](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets)
并用它来验证 Modal 签署的任何令牌的签名。

### 步骤 2：创建可供模态函数使用的 IAM 策略

让我们创建一个简单的 IAM 策略，允许列出 S3 存储桶中的对象。
采用以下策略并将存储桶名称替换为您自己的名称。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::fun-bucket", "arn:aws:s3:::fun-bucket/*"]
    }
  ]
}
```

### 步骤 3：创建可由 Modal Functions 代入的 IAM 角色

现在，我们可以创建一个使用此策略的 IAM 角色。访问 IAM 控制台
创建这个角色。如果您使用 CLI 添加此策略，请更新
OIDC 提供商 ARN 与 [第 1 步](#step-1-configure-aws-to-trust-modals-oidc-provider) 中创建的 ARN 相匹配。
请务必将工作区 ID 占位符替换为您自己的占位符。您可以找到您的工作区 ID
在 https://modal.com/settings/workspaces 或通过 `modal token info` CLI。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789abcd:oidc-provider/oidc.modal.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.modal.com:aud": "oidc.modal.com"
        },
        "StringLike": {
          "oidc.modal.com:sub": "modal:workspace_id:ac-12345abcd:*"
        }
      }
    }
  ]
}
```

注意我们如何使用`workspace_id`来限制角色的范围。这意味着
IAM 角色只能由工作区中的函数承担。您还可以进一步
通过指定环境、应用程序或函数名称来限制这一点。

理想情况下，我们将使用自定义声明来进行角色限制。不幸的是，AWS
不支持[匹配自定义声明](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_iam-condition-keys.html#condition-keys-wif)，
所以我们使用 `sub` 声明来代替。

### 步骤 4：在您的函数中使用 OIDC 令牌

AWS 开发工具包内置了对 OIDC 令牌的支持，因此您可以将它们用作
如下：

```python notest
import boto3

app = modal.App("oidc-token-test")

boto3_image = modal.Image.debian_slim().pip_install("boto3")

# Trade a Modal OIDC token for AWS credentials
def get_s3_client(role_arn):
    sts_client = boto3.client("sts")

    # Assume role with Web Identity
    credential_response = sts_client.assume_role_with_web_identity(
        RoleArn=role_arn, RoleSessionName="OIDCSession", WebIdentityToken=os.environ["MODAL_IDENTITY_TOKEN"]
    )

    # Extract credentials
    credentials = credential_response["Credentials"]
    return boto3.client(
        "s3",
        aws_access_key_id=credentials["AccessKeyId"],
        aws_secret_access_key=credentials["SecretAccessKey"],
        aws_session_token=credentials["SessionToken"],
    )

# List the contents of an S3 bucket
@app.function(image=boto3_image)
def list_bucket_contents(bucket_name, role_arn):
    s3_client = get_s3_client(role_arn)
    response = s3_client.list_objects_v2(Bucket=bucket_name)
    for obj in response["Contents"]:
        print(f"- {obj['Key']} (Size: {obj['Size']} bytes)")

@app.local_entrypoint()
def main():
    # Replace with the role ARN and bucket name from step 2
    list_bucket_contents.remote("fun-bucket", "arn:aws:iam::123456789abcd:role/oidc_test_role")
```

在本地运行该函数以查看存储桶的内容：

```bash
$ modal run oidc-token-test.py
- test-file.txt (Size: 10 bytes)
```

## AWS Elastic Container Registry (ECR) 的演示使用

您还可以使用 OIDC 在 AWS 上对 [Private Registries](/docs/guide/existing-images) 进行身份验证。

### 先决条件

1. 将 AWS 配置为信任 Modal 的 OIDC 提供商（[上述步骤 1](#step-1-configure-aws-to-trust-modals-oidc-provider)）
2. [创建具有只读 ECR 访问权限的 AWS 策略](/docs/guide/existing-images#elastic-container-registry-ecr)

3. 创建使用此策略的 IAM 角色（[上述步骤 3](#step-3-create-an-iam-role-that-can-be-assumed-by-modal-functions)）

### 使用示例图像进行测试

创建示例 Dockerfile：

```dockerfile
FROM python:3.11-slim
WORKDIR /app
CMD ["python3"]
```

构建镜像并将其推送到 ECR：

```bash
# Login with the AWS CLI
aws ecr get-login-password --region [ECR_REGION] | docker login --username AWS --password-stdin [ECR_REPO_ARN]

# Build the Docker Image
docker build -t modal-oidc-test-image .

# Push the image to ECR
docker tag modal-oidc-test-image:latest [ECR_REPO_ARN]:latest
docker push [ECR_REPO_ARN]:latest
```

测试从 ECR 中拉取镜像：

```python
import modal

app = modal.App("image-from-ecr-test")
sample_image = modal.Image.from_aws_ecr(
    "[ECR_IMAGE_URI]", #eg. "12345678.dkr.ecr.us-east-1.amazonaws.com/repository:latest"
    secret=modal.Secret.from_dict(
        {
            "AWS_ROLE_ARN": "[IAM_ROLE_ARN]", # eg. "arn:aws:iam::123456789abcd:role/oidc_test_role"
            "AWS_REGION": "[ECR_REGION]", # eg. "us-east-1"
        }
    ),
)

@app.function(image=sample_image)
def hello():
    print("Hello, World!")
```

## 后续步骤

OIDC 集成的用途不仅仅限于 AWS。用同样的图案，
您可以配置自动访问[Vault](https://developer.hashicorp.com/vault/docs/auth/jwt)，
[GCP](https://cloud.google.com/identity-platform/docs/web/oidc)、[Azure](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc) 等。
目前，OIDC 验证的容器映像拉取仅支持 AWS ECR。