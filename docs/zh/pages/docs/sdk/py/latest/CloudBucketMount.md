<!-- modal-docs: machine-translated zh-CN from English source -->

# 云桶安装

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

Cloudflare R2 是 [S3 兼容](https://developers.cloudflare.com/r2/api/s3/api/)，所以它的设置看起来
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

**属性**

<Parameter name="bucket_name" type="str" description="Name of the cloud bucket to mount." />
<Parameter name="bucket_endpoint_url" type="str | None" defaultValue="None" description="Endpoint URL of the bucket. Required for Cloudflare R2 and Google Cloud Storage buckets, which are identified by their endpoint hostname." />
<Parameter name="key_prefix" type="str | None" defaultValue="None" description="Prefix prepended to every object path in the bucket. Must end in ⟦T4⟧." />
<Parameter name="secret" type="_Secret | None" defaultValue="None" description="Credentials used to access the bucket. A private bucket requires a secret containing ⟦T5⟧ and ⟦T6⟧; a publicly accessible bucket needs none." />
<Parameter name="oidc_auth_role_arn" type="str | None" defaultValue="None" description="Role ARN to assume when accessing the bucket with OIDC authentication instead of static credentials." />
<Parameter name="read_only" type="bool" defaultValue="False" description="Mount the bucket read-only." />
<Parameter name="requester_pays" type="bool" defaultValue="False" description="Whether the bucket is configured as Requester Pays, so that the caller is billed for requests. Requires ⟦T7⟧." />
<Parameter name="force_path_style" type="bool" defaultValue="False" description="Address objects as ⟦T8⟧ rather than using virtual-hosted-style bucket subdomains." />