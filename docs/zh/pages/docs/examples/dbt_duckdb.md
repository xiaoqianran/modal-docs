<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 DuckDB、DBT 和 Modal 构建您自己的数据仓库

此示例包含一个最小但功能强大的[数据仓库](https://en.wikipedia.org/wiki/Data_warehouse)。
它由以下部分组成：

* [DuckDB](https://duckdb.org)作为仓库的[OLAP](https://en.wikipedia.org/wiki/Online_analytical_processing)数据库引擎

* [AWS S3](https://aws.amazon.com/s3/) 作为数据存储提供商

* [DBT](https://docs.getdbt.com/docs/introduction)作为数据转换工具

认识一下由 Modal 提供支持的新型无服务器云数据仓库！

## 配置 Modal、S3 和 DBT

源代码中唯一需要更新的是 S3 存储桶名称。AWS S3 存储桶名称是全球唯一的，我们使用此源中的存储桶名称来托管此示例。

更新下面的 `BUCKET_NAME` 变量以及对原始值的任何引用
`sample_proj_duckdb_s3/models/`内。下面的 AWS IAM 策略还包括存储桶
名称并且必须更新。

```python
from pathlib import Path

import modal

BUCKET_NAME = "modal-example-dbt-duckdb-s3"
LOCAL_DBT_PROJECT = (  # local path
    Path(__file__).parent / "sample_proj_duckdb_s3"
)
PROJ_PATH = "/root/dbt"  # remote paths
PROFILES_PATH = "/root/dbt_profile"
TARGET_PATH = "/root/target"
```

大部分DBT代码和配置直接取自经典
[Jaffle Shop](https://github.com/dbt-labs/jaffle_shop) 演示并修改为支持
将 `dbt-duckdb` 与 S3 存储桶结合使用。

DBT `profiles.yml` 配置取自
[`dbt-duckdb`文档](https://github.com/jwills/dbt-duckdb#configuring-your-profile)。

我们还定义了我们的应用程序将在其中运行的环境——
容器映像，如 Docker 中的容器映像。
详情请参阅[本指南](https://modal.com/docs/guide/custom-container)。

```python
dbt_image = (  # start from a slim Linux image
    modal.Image.debian_slim(python_version="3.11")
    .uv_pip_install(  # install python packages
        "boto3~=1.34",  # aws client sdk
        "dbt-duckdb~=1.8.1",  # dbt and duckdb and a connector
        "pandas~=2.2.2",  # dataframes
        "pyarrow~=16.1.0",  # columnar data lib
        "fastapi[standard]~=0.115.4",  # web app
    )
    .env(  # configure DBT environment variables
        {
            "DBT_PROJECT_DIR": PROJ_PATH,
            "DBT_PROFILES_DIR": PROFILES_PATH,
            "DBT_TARGET_PATH": TARGET_PATH,
        }
    )
    # Here we add all local code and configuration into the Modal Image
    # so that it will be available when we run DBT on Modal.
    .add_local_dir(LOCAL_DBT_PROJECT, remote_path=PROJ_PATH)
    .add_local_file(
        LOCAL_DBT_PROJECT / "profiles.yml",
        remote_path=f"{PROFILES_PATH}/profiles.yml",
    )
)

app = modal.App(name="example-dbt-duckdb", image=dbt_image)

dbt_target = modal.Volume.from_name("dbt-target-vol", create_if_missing=True)

```
我们还需要通过 AWS 进行身份验证才能将数据存储在 S3 中。

```python
s3_secret = modal.Secret.from_name(
    "modal-examples-aws-user",
    required_keys=["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
)

```

使用 [Secrets 仪表板](https://modal.com/secrets) 中的“AWS”模板创建此 Secret。
下面我们将使用模态函数中提供的凭据来创建 S3 存储桶并
使用 `.parquet` 数据填充它，因此请务必提供用户的凭据
有权创建 S3 存储桶并从中读取和写入数据。

此示例所需的策略如下。
并不是说您*必须*将策略中列出的存储桶名称更新为您的
自己的存储桶名称。

```json
{
    "Statement": [
        {
            "Action": "s3:*",
            "Effect": "Allow",
            "Resource": [
                "arn:aws:s3:::modal-example-dbt-duckdb-s3/*",
                "arn:aws:s3:::modal-example-dbt-duckdb-s3"
            ],
            "Sid": "duckdbs3access"
        }
    ],
    "Version": "2012-10-17"
}
```

## 上传种子数据为了给DBT提供源数据摄取和转换，
我们有下面的 `create_source_data` 函数，它创建一个 AWS S3 存储桶并
使用基于 `seeds/` 目录中的 CSV 数据的 Parquet 文件填充它。

您可以通过在 Modal 上运行此脚本来启动它：

```bash
modal run dbt_duckdb.py
```

该脚本还运行完整的数据仓库设置，整个过程需要一两分钟。
我们将逐步完成下面的其余步骤。参见`app.local_entrypoint`
请参阅下文了解详细信息。

请注意，这不是使用 `seeds/` 数据的典型方式，但它对此很有用
示范。请参阅 [DBT 文档](https://docs.getdbt.com/docs/build/seeds) 了解更多信息。

```python
@app.function(
    secrets=[s3_secret],
)
def create_source_data():
    import boto3
    import pandas as pd
    from botocore.exceptions import ClientError

    s3_client = boto3.client("s3")
    s3_client.create_bucket(Bucket=BUCKET_NAME)

    for seed_csv_path in Path(PROJ_PATH, "seeds").glob("*.csv"):
        print(f"Found seed file {seed_csv_path}")
        name = seed_csv_path.stem
        parquet_filename = f"{name}.parquet"
        object_key = f"sources/{parquet_filename}"
        try:
            s3_client.head_object(Bucket=BUCKET_NAME, Key=object_key)
            print(
                f"File '{object_key}' already exists in bucket '{BUCKET_NAME}'. Skipping."
            )
        except ClientError:
            df = pd.read_csv(seed_csv_path)
            df.to_parquet(parquet_filename)
            print(f"Uploading '{object_key}' to S3 bucket '{BUCKET_NAME}'")
            s3_client.upload_file(parquet_filename, BUCKET_NAME, object_key)
            print(f"File '{object_key}' uploaded successfully.")


```

## 使用 Modal 在云端运行 DBT
Modal 可以轻松地在云端运行 Python 代码。
而且DBT是一个Python工具，因此使用Modal运行DBT很容易：
下面，我们导入 `dbt` 库的 `dbtRunner` 来传递来自我们的命令
Python 代码，在 Modal 上运行，与我们在命令行上传递命令的方式相同。

请注意，此模态函数可以访问我们的 AWS S3 Secret，
与我们的 DBT 项目和配置文件相关的本地文件，
以及充当分布式文件系统的远程模态卷。

```python
@app.function(
    secrets=[s3_secret],
    volumes={TARGET_PATH: dbt_target},
)
def run(command: str) -> None:
    from dbt.cli.main import dbtRunner

    res = dbtRunner().invoke(command.split(" "))
    if res.exception:
        print(res.exception)


```

您可以从命令行运行此模态函数

`modal run dbt_duckdb.py::run --command run`

成功运行将记录如下内容：```
03:41:04  Running with dbt=1.5.0
03:41:05  Found 5 models, 8 tests, 0 snapshots, 0 analyses, 313 macros, 0 operations, 3 seed files, 3 sources, 0 exposures, 0 metrics, 0 groups
03:41:05
03:41:06  Concurrency: 1 threads (target='modal')
03:41:06
03:41:06  1 of 5 START sql table model main.stg_customers ................................ [RUN]
03:41:06  1 of 5 OK created sql table model main.stg_customers ........................... [OK in 0.45s]
03:41:06  2 of 5 START sql table model main.stg_orders ................................... [RUN]
03:41:06  2 of 5 OK created sql table model main.stg_orders .............................. [OK in 0.34s]
03:41:06  3 of 5 START sql table model main.stg_payments ................................. [RUN]
03:41:07  3 of 5 OK created sql table model main.stg_payments ............................ [OK in 0.36s]
03:41:07  4 of 5 START sql external model main.customers ................................. [RUN]
03:41:07  4 of 5 OK created sql external model main.customers ............................ [OK in 0.72s]
03:41:07  5 of 5 START sql table model main.orders ....................................... [RUN]
03:41:08  5 of 5 OK created sql table model main.orders .................................. [OK in 0.22s]
03:41:08
03:41:08  Finished running 4 table models, 1 external model in 0 hours 0 minutes and 3.15 seconds (3.15s).
03:41:08  Completed successfully
03:41:08
03:41:08  Done. PASS=5 WARN=0 ERROR=0 SKIP=0 TOTAL=5
```

在 SQL 模板中查找 `'materialized='external'` DBT 配置
看看`dbt-duckdb`如何将转换后的数据写回AWS S3！

运行`run`命令并看到成功后，检查包含的内容
在存储桶的 `out/` 键前缀下。您将看到 DBT 已运行转换
在`sample_proj_duckdb_s3/models/`中定义并生成输出`.parquet`文件。

## 使用 FastAPI 和 Modal 提供新的数据文档

DBT还自动生成[丰富的交互式数据文档](https://docs.getdbt.com/docs/collaborate/explore-projects)。
您可以在 Modal 上提供这些文档。
只需定义一个简单的 [FastAPI](https://fastapi.tiangolo.com/) 应用程序：

```python
@app.function(volumes={TARGET_PATH: dbt_target})
@modal.concurrent(max_inputs=100)
@modal.asgi_app()  # wrap a function that returns a FastAPI app in this decorator to host on Modal
def serve_dbt_docs():
    import fastapi
    from fastapi.staticfiles import StaticFiles

    web_app = fastapi.FastAPI()
    web_app.mount(
        "/",
        StaticFiles(  # dbt docs are automatically generated and sitting in the Volume
            directory=TARGET_PATH, html=True
        ),
        name="static",
    )

    return web_app


```

并将该应用程序部署到 Modal

```bash
modal deploy dbt_duckdb.py
# ...
# Created web function serve_dbt_docs => <output-url>
```
如果导航到输出 URL，您应该会看到类似的内容
[![dbt 文档示例](./dbt_docs.png)](https://modal-labs-examples--example-dbt-duckdb-serve-dbt-docs.modal.run)

您还可以在[此处](https://modal-labs-examples--example-dbt-duckdb-serve-dbt-docs.modal.run)查看我们的文档实例。
该应用程序将以“无服务器”方式提供服务——它将自动扩展或缩小
在使用量增加或减少期间，您根本不会被收取费用
当它缩放到零时。

## 安排每日更新

以下`daily_build`函数[按计划运行](https://modal.com/docs/guide/cron)
使 DuckDB 数据仓库保持最新。它还通过文档应用程序的相同 `modal deploy` 命令进行部署。

该仓库的源数据是静态的，
所以每日执行并不会真正“更新”任何东西，只是重新构建。但这个例子可以扩展
拥有不断提供新数据的来源。
它还会每天生成 DBT 文档以保持最新。

```python
@app.function(
    schedule=modal.Period(days=1),
    secrets=[s3_secret],
    volumes={TARGET_PATH: dbt_target},
)
def daily_build() -> None:
    run.remote("build")
    run.remote("docs generate")


@app.local_entrypoint()
def main():
    create_source_data.remote()
    run.remote("run")
    daily_build.remote()

```