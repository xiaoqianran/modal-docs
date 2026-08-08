<!-- modal-docs: machine-translated zh-CN from English source -->

# 云桶挂载

[`modal.CloudBucketMount`](/docs/sdk/py/latest/CloudBucketMount) 是一个
可变卷，允许从云读取和写入文件
桶。它支持 AWS S3、Cloudflare R2 和 Google Cloud Storage 存储桶。

云存储桶安装构建在 AWS 之上
[`mountpoint`](https://github.com/awslabs/mountpoint-s3)技术并传承
它的局限性。有关更多详细信息，请参阅[限制和故障排除](#limitations-and-troubleshooting) 部分。

## 安装 Cloudflare R2 存储桶

`CloudBucketMount` 允许将 Cloudflare R2 存储桶挂载为文件系统
卷。因为 Cloudflare R2 是
[S3-兼容](https://developers.cloudflare.com/r2/api/s3/api/) 设置为
R2 和 S3 非常相似。参见
[modal.CloudBucketMount](/docs/sdk/py/latest/CloudBucketMount)
获取使用说明。

创建用于挂载的 R2 API 令牌时，您需要拥有
能够读取、写入和列出您将挂载的特定存储桶中的对象。
您*不需要*需要管理员权限，并且您不应该*使用“客户端IP地址
过滤”。

## 安装 Google Cloud Storage 存储桶

`CloudBucketMount` 使 Google Cloud Storage (GCS) 存储桶能够作为文件系统挂载
卷。请参阅 [modal.CloudBucketMount](/docs/sdk/py/latest/CloudBucketMount)
GCS 设置说明。

## 安装 S3 存储桶

`CloudBucketMount` 允许将 S3 存储桶挂载为文件系统卷。至
与存储桶交互，您必须配置适当的 IAM 权限
（请参阅 [IAM 权限](#iam-permissions) 部分）。

```python
import modal
import subprocess

app = modal.App()

s3_bucket_name = "s3-bucket-name"  # Bucket name not ARN.
s3_access_credentials = modal.Secret.from_dict({
    "AWS_ACCESS_KEY_ID": "...",
    "AWS_SECRET_ACCESS_KEY": "...",
    "AWS_REGION": "..."
})

@app.function(
    volumes={
        "/my-mount": modal.CloudBucketMount(s3_bucket_name, secret=s3_access_credentials)
    }
)
def f():
    subprocess.run(["ls", "/my-mount"])
```

### 指定S3存储桶区域

Amazon S3 存储桶与单个 AWS 区域关联。 [`Mountpoint`](https://github.com/awslabs/mountpoint-s3) 尝试在启动时自动检测 S3 存储桶的区域，并将所有 S3 请求定向到该区域。但是，在某些情况下，例如您的容器在某个区域的 AWS 工作线程上运行，而您的存储桶位于不同的区域，则此自动检测可能会失败。

为了避免此问题，您可以通过向 Modal Secret 添加 `AWS_REGION` 键来指定 S3 存储桶的区域，如上面的代码示例所示。

### 使用AWS临时安全凭证

`CloudBucketMount`s 还通过传递来支持 AWS 临时安全凭证
附加环境变量`AWS_SESSION_TOKEN`。临时凭证
将过期并且不会自动续订。您需要更新
相应的 Modal Secret 以防止失败。
您可以使用 [AWS CLI](https://aws.amazon.com/cli/) 获取临时凭证：

```shell
$ aws configure export-credentials --format env
export AWS_ACCESS_KEY_ID=XXX
export AWS_SECRET_ACCESS_KEY=XXX
export AWS_SESSION_TOKEN=XXX...
```

所有这些值都是必需的。

### 使用 OIDC 身份令牌

Modal 提供 [OIDC 集成](/docs/guide/oidc-integration)，并将自动生成身份令牌以向 AWS 进行身份验证。
OIDC 消除了通过模态秘密手动传递令牌的需要，并且基于短期令牌，这限制了令牌被泄露时的暴露窗口。
要使用此功能，您必须[将 AWS 配置为信任 Modal 的 OIDC 提供商](/docs/guide/oidc-integration#step-1-configure-aws-to-trust-modals-oidc-provider)
以及[创建可由模态函数代入的 IAM 角色](/docs/guide/oidc-integration#step-2-create-an-iam-role-that-can-be-assumed-by-modal-functions)。

然后，您指定模态函数应承担的访问 S3 存储桶的 IAM 角色。

```python
import modal

app = modal.App()

s3_bucket_name = "s3-bucket-name"
role_arn = "arn:aws:iam::123456789abcd:role/s3mount-role"

@app.function(
    volumes={
        "/my-mount": modal.CloudBucketMount(
            bucket_name=s3_bucket_name,
            oidc_auth_role_arn=role_arn
        )
    }
)
def f():
    subprocess.run(["ls", "/my-mount"])
```

### 在存储桶中安装路径

要仅挂载特定子目录下的文件，可以使用`key_prefix`指定路径前缀。
由于此前缀指定一个目录，因此它必须以 `/` 结尾。
当不提供前缀时，将安装整个存储桶。

```python
import modal
import subprocess

app = modal.App()

s3_bucket_name = "s3-bucket-name"
prefix = 'path/to/dir/'

s3_access_credentials = modal.Secret.from_dict({
    "AWS_ACCESS_KEY_ID": "...",
    "AWS_SECRET_ACCESS_KEY": "...",
})

@app.function(
    volumes={
        "/my-mount": modal.CloudBucketMount(
            bucket_name=s3_bucket_name,
            key_prefix=prefix,
            secret=s3_access_credentials
        )
    }
)
def f():
    subprocess.run(["ls", "/my-mount"])
```
这只会挂载存储桶 `s3-bucket-name` 中前缀为 `path/to/dir/` 的文件。

### 只读模式

要以只读模式挂载存储桶，请将 `read_only=True` 设置为参数。

```python
import modal
import subprocess

app = modal.App()

s3_bucket_name = "s3-bucket-name"  # Bucket name not ARN.
s3_access_credentials = modal.Secret.from_dict({
    "AWS_ACCESS_KEY_ID": "...",
    "AWS_SECRET_ACCESS_KEY": "...",
})

@app.function(
    volumes={
        "/my-mount": modal.CloudBucketMount(s3_bucket_name, secret=s3_access_credentials, read_only=True)
    }
)
def f():
    subprocess.run(["ls", "/my-mount"])
```

虽然 S3 安装支持写入和读取操作，但它们针对
顺序读取大文件。某些文件操作，例如重命名
文件，不受支持。有关支持的操作的完整列表，
咨询
[安装点文档](https://github.com/awslabs/mountpoint-s3/blob/main/doc/SEMANTICS.md)。

### IAM 权限

要利用 `CloudBucketMount` 从 S3 存储桶读取和写入文件，
您的 IAM 策略必须包含 `s3:PutObject` 的权限，
`s3:AbortMultipartUpload`和`s3:DeleteObject`。这些权限不是
配置`read_only=True` 的安装座需要。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ModalListBucketAccess",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": ["arn:aws:s3:::<MY-S3-BUCKET>"]
    },
    {
      "Sid": "ModalBucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:AbortMultipartUpload",
        "s3:DeleteObject"
      ],
      "Resource": ["arn:aws:s3:::<MY-S3-BUCKET>/*"]
    }
  ]
}
```

## 限制和故障排除

云存储桶安装具有某些不适用于 [卷](/docs/guide/volumes) 的限制。
这些限制主要与在云存储桶装载中打开和编辑文件的方式有关。对于
完整的限制列表，请参阅[挂载点故障排除文档](https://github.com/awslabs/mountpoint-s3/blob/a6179c72bfc237a1fdd06eb4a0863ca537f8d8a7/doc/TROUBLESHOOTING.md)
以及[安装点语义文档](https://github.com/awslabs/mountpoint-s3/blob/main/doc/SEMANTICS.md)。

用户遇到的最常见问题是：

* 文件无法以附加模式打开。
* 文件不能以任意偏移量写入，即 `seek` 和写入不支持同时使用。
* 要写入文件，您必须以`truncate`模式打开它。

这些操作通常会导致 `PermissionError: [Errno 1] Operation not permitted` 错误。

如果您需要这些功能，请尝试一下 [Volumes](/docs/guide/volumes)！如果您需要 S3 中的这些功能
并且愿意为您的存储桶支付额外费用，您也许可以使用[S3 Express](https://aws.amazon.com/s3/storage-classes/express-one-zone/)。
如果您有兴趣使用 S3 Express，请联系我们 [在 Slack 中](https://modal.com/slack)。

### 以附加模式写入文件如果您使用的库必须以追加模式打开文件，最好写入临时文件
然后将其移动到存储桶的安装路径。可以使用类似的方法以任意偏移量写入文件。

```python notest
import tempfile
import shutil

@app.function(
    volumes={"/bucket": modal.CloudBucketMount("my-bucket", secret=s3_credentials)}
)
def append_to_log():
    # Write to a temporary file that supports append mode
    with tempfile.NamedTemporaryFile(mode='a', delete=False) as temp_file:
        temp_file.write("Log entry 1\n")
        temp_file.write("Log entry 2\n")
        temp_path = temp_file.name

    # Move the completed file to the bucket mount
    shutil.move(temp_path, "/bucket/logfile.txt")
```

### 创建一个没有父目录的文件

如果您尝试在不存在的目录中创建文件，您将收到 `Operation not permitted` 错误。
要解决此问题，请先使用 `Path(dst).parent.mkdir(exist_ok=True, parents=True)` 创建父目录。

### 使用`np.savez`

`np.savez` 寻求文件中的随机偏移，这使得云存储桶安装不安全。如果你的文件很大，
您可以将其写入临时文件，然后将其移至存储桶的装载路径。不过如果很小的话
您可以使用内存缓冲区来解决此问题：

```python notest
import io
import numpy as np
import shutil

data = np.random.rand(1000, 512)

# 1. Build the archive entirely in memory
tmp = io.BytesIO()
np.savez_compressed(tmp, array=data)

# 2. Copy it once, sequentially, to the mount point
dest = "/bucket/data.npz"
with open(dest, "wb") as f:
    shutil.copyfileobj(tmp, f)
```

### Torchtune 写入检查点文件

旧版本的[Torchtune](https://github.com/pytorch/torchtune)与云桶支架不兼容。
升级到大于或等于`0.6.1`的版本，以确保检查点可以写入存储桶。

### 使用 TensorBoard `SummaryWriter`

TensorBoard `SummaryWriter` 以追加模式打开日志文件。不过这些文件非常小，
所以我们建议写入临时目录并使用[Watchdog](https://github.com/gorakhargosh/watchdog)
Python 库，用于在文件进入时将文件复制到存储桶装载路径。

在这种情况下，使用 [Volumes](/docs/guide/volumes) 可能是值得的 - 特别是，
训练日志有时不受强制检查点等相同合规性要求的约束
或模型权重存储在安全位置。我们甚至还有一个例子
[如何在卷上使用 TensorBoard](/docs/examples/torch_profiling#serving-tensorboard-on-modal-to-view-pytorch-profiles-and-traces)。