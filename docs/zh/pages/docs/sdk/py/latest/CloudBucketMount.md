<!-- modal-docs: machine-translated zh-CN from English source -->

# 云桶安装

```python
class CloudBucketMount(object)
```

将云存储桶安装到您的容器。目前支持 AWS S3 存储桶。

S3 存储桶使用 [AWS S3 Mountpoint](https://github.com/awslabs/mountpoint-s3) 挂载。
S3 挂载针对顺序读取大文件进行了优化。不支持所有文件操作；咨询
[AWS S3 挂载点文档](https://github.com/awslabs/mountpoint-s3/blob/main/doc/SEMANTICS.md)
了解更多信息。

**使用**

S3：

```python
import subprocess

app = modal.App()
secret = modal.Secret.from_name(
    "aws-secret",
    required_keys=["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]
    # Note: providing AWS_REGION can help when automatic detection of the bucket region fails.
)

@app.function(
    volumes={
        "/my-mount": modal.CloudBucketMount(
            bucket_name="s3-bucket-name",
            secret=secret,
            read_only=True
        )
    }
)
def f():
    subprocess.run(["ls", "/my-mount"], check=True)
```

R2：

Cloudflare R2 [S3 兼容](https://developers.cloudflare.com/r2/api/s3/api/)，因此其设置看起来
与S3非常相似。但此外还必须传递 `bucket_endpoint_url` 参数。

```python
import subprocess

app = modal.App()
secret = modal.Secret.from_name(
    "r2-secret",
    required_keys=["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]
)

@app.function(
    volumes={
        "/my-mount": modal.CloudBucketMount(
            bucket_name="my-r2-bucket",
            bucket_endpoint_url="https://<ACCOUNT ID>.r2.cloudflarestorage.com",
            secret=secret,
            read_only=True
        )
    }
)
def f():
    subprocess.run(["ls", "/my-mount"], check=True)
```

地面站：

Google 云存储 (GCS) [S3 兼容](https://cloud.google.com/storage/docs/interoperability)。
GCS 存储桶还需要一个包含 Google 特定密钥名称（见下文）的秘密，其中填充了
一个 [HMAC 密钥](https://cloud.google.com/storage/docs/authentication/managing-hmackeys#create)。

```python
import subprocess

app = modal.App()
gcp_hmac_secret = modal.Secret.from_name(
    "gcp-secret",
    required_keys=["GOOGLE_ACCESS_KEY_ID", "GOOGLE_ACCESS_KEY_SECRET"]
)

@app.function(
    volumes={
        "/my-mount": modal.CloudBucketMount(
            bucket_name="my-gcs-bucket",
            bucket_endpoint_url="https://storage.googleapis.com",
            secret=gcp_hmac_secret,
        )
    }
)
def f():
    subprocess.run(["ls", "/my-mount"], check=True)
```

```python
__init__(self, bucket_name, bucket_endpoint_url=None, key_prefix=None,
    secret=None, oidc_auth_role_arn=None, read_only=False, requester_pays=False,
    force_path_style=False)
```