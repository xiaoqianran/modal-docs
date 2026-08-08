<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 S3 中的 Parquet 文件上的 DuckDB 分析纽约黄色出租车数据

此示例展示了如何使用 Modal 执行经典的数据科学任务：将表结构数据加载到云存储中，
分析它，并绘制结果。

特别是，我们将把纽约公共出租车行程数据作为 Parquet 文件加载到 S3 中，
然后使用 DuckDB 对其运行 SQL 查询。

我们将使用 [`CloudBucketMount`](https://modal.com/docs/reference/modal.CloudBucketMount) 在 Modal 应用程序中安装 S3 存储桶。
我们将写入该存储桶，然后从该存储桶中读取，在每种情况下都使用
Modal 的[并行执行功能](https://modal.com/docs/guide/scale) 可同时处理多个文件。

## 基本设置

您需要拥有 S3 存储桶和 AWS 凭证才能运行此示例。参考文档
对于您的凭据所需的确切 [IAM 权限](https://modal.com/docs/guide/cloud-bucket-mounts#iam-permissions)。

创建存储桶并配置 IAM 设置后，
您现在需要创建一个[`Secret`](https://modal.com/docs/guide/secrets)来分享
与您的 Modal 应用程序相关的 AWS 凭证。

```python
from datetime import datetime
from pathlib import Path, PosixPath

import modal

image = modal.Image.debian_slim(python_version="3.12").uv_pip_install(
    "requests==2.31.0", "duckdb==0.10.0", "matplotlib==3.8.3"
)
app = modal.App("example-s3-bucket-mount", image=image)

secret = modal.Secret.from_name(
    "s3-bucket-secret",
    required_keys=["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
)

MOUNT_PATH = PosixPath("/bucket")
YELLOW_TAXI_DATA_PATH = MOUNT_PATH / "yellow_taxi"

```

上面安装的依赖项在本地不可用。以下块指示模态
仅将它们导入容器内。

```python
with image.imports():
    import duckdb
    import requests


```

## 下载纽约市的出租车数据
纽约市公开提供出租车乘车数据。该市的【出租车和豪华轿车委员会（TLC）】（https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page）
以 Parquet 格式发布文件。文件按年和月组织。

我们将下载所有可用文件并将它们存储在 S3 存储桶中。我们这样做是通过
附加带有 S3 存储桶名称及其各自凭据的 `modal.CloudBucketMount`。
存储桶中的文件将在 `MOUNT_PATH` 可用。

正如我们将在下面看到的，通过在 Modal 上并行运行该操作可以大大加快速度。

```python
@app.function(
    volumes={
        MOUNT_PATH: modal.CloudBucketMount("modal-s3mount-test-bucket", secret=secret),
    },
)
def download_data(year: int, month: int) -> str:
    filename = f"yellow_tripdata_{year}-{month:02d}.parquet"
    url = f"https://d37ci6vzurychx.cloudfront.net/trip-data/{filename}"
    s3_path = MOUNT_PATH / filename
    # Skip downloading if file exists.
    if not s3_path.exists():
        if not YELLOW_TAXI_DATA_PATH.exists():
            YELLOW_TAXI_DATA_PATH.mkdir(parents=True, exist_ok=True)
            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                print(f"downloading => {s3_path}")
                # It looks like we writing locally, but this is actually writing to S3!
                with open(s3_path, "wb") as file:
                    for chunk in r.iter_content(chunk_size=8192):
                        file.write(chunk)

    return s3_path.as_posix()


```

## 使用DuckDB分析数据

[DuckDB](https://duckdb.org/) 是一个分析数据库，对 Parquet 文件具有丰富的支持。
它也非常快。下面，我们定义一个模态函数来聚合黄色出租车行程
一个月内（每个文件包含特定月份的所有游乐设施）。

```python
@app.function(
    volumes={
        MOUNT_PATH: modal.CloudBucketMount(
            "modal-s3mount-test-bucket",
            secret=modal.Secret.from_name("s3-bucket-secret"),
        )
    },
)
def aggregate_data(path: str) -> list[tuple[datetime, int]]:
    print(f"processing => {path}")

    # Parse file.
    year_month_part = path.split("yellow_tripdata_")[1]
    year, month = year_month_part.split("-")
    month = month.replace(".parquet", "")

    # Make DuckDB query using in-memory storage.
    con = duckdb.connect(database=":memory:")
    q = """
    with sub as (
        select tpep_pickup_datetime::date d, count(1) c
        from read_parquet(?)
        group by 1
    )
    select d, c from sub
    where date_part('year', d) = ?  -- filter out garbage
    and date_part('month', d) = ?   -- same
    """
    con.execute(q, (path, year, month))
    return list(con.fetchall())


```

## 绘制每天的出租车行程

最后，我们想要绘制我们的结果。
创建的绘图显示了纽约市每天乘坐黄色出租车的次数。
该函数在 Modal 上远程运行，因此我们不需要在本地安装绘图库。

```python
@app.function()
def plot(dataset) -> bytes:
    import io

    import matplotlib.pyplot as plt

    # Sorting data by date
    dataset.sort(key=lambda x: x[0])

    # Unpacking dates and values
    dates, values = zip(*dataset)

    # Plotting
    plt.figure(figsize=(10, 6))
    plt.plot(dates, values)
    plt.title("Number of NYC yellow taxi trips by weekday, 2018-2023")
    plt.ylabel("Number of daily trips")
    plt.grid(True)
    plt.tight_layout()

    # Saving plot as raw bytes to send back
    buf = io.BytesIO()

    plt.savefig(buf, format="png")

    buf.seek(0)

    return buf.getvalue()


```

## 运行一切

`@app.local_entrypoint()` 定义了当我们在本地运行 Modal 程序时会发生什么。
我们通过调用 `modal run s3_bucket_mount.py` 从 CLI 调用它。
我们首先调用`download_data()`和`starmap`（命名是因为它有点像`map(*args)`）
在输入元组`(year, month)`上。这将并行下载，
将所有黄色出租车数据文件放入我们本地安装的 S3 存储桶中，并返回一个列表
Parquet 文件路径。然后，我们在该列表上调用 `aggregate_data()` 和 `map`。这些文件是
还从我们的 S3 存储桶中读取。因此，一个函数将文件写入 S3，另一个函数将文件写入 S3
从S3中读取文件；两者并行运行多个文件。

最后我们调用`plot`生成下图：

![2018-2023 年工作日纽约市黄色出租车出行次数](./nyc_yellow_taxi_trips_s3_mount.png)

该程序应在 30 秒内运行。

```python
@app.local_entrypoint()
def main():
    # List of tuples[year, month].
    inputs = [(year, month) for year in range(2018, 2023) for month in range(1, 13)]

    # List of file paths in S3.
    parquet_files: list[str] = []
    for path in download_data.starmap(inputs):
        print(f"done => {path}")
        parquet_files.append(path)

    # List of datetimes and number of yellow taxi trips.
    dataset = []
    for r in aggregate_data.map(parquet_files):
        dataset += r

    dir = Path("/tmp") / "s3_bucket_mount"
    if not dir.exists():
        dir.mkdir(exist_ok=True, parents=True)

    figure = plot.remote(dataset)
    path = dir / "nyc_yellow_taxi_trips_s3_mount.png"
    with open(path, "wb") as file:
        print(f"Saving figure to {path}")
        file.write(figure)

```