<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用Datasette发布交互式数据集

![数据集用户界面](https://modal-cdn.com/cdnbot/imdb_datasetteqzaj3q9d_a83d82fd.webp)

构建并部署一个交互式电影数据库，该数据库每天自动更新最新的 IMDb 数据。
此示例演示如何在 Modal 上为包含数百万电影和电视节目记录的 Datasette 应用程序提供服务。

亲自尝试一下[这里](https://modal-labs-examples--example-cron-datasette-ui.modal.run)。

在此过程中，我们将学习如何使用以下 Modal 功能：

* [Volumes](https://modal.com/docs/guide/volumes)：持久卷让我们可以随着时间的推移存储和增长已发布的数据集。

* [计划函数](https://modal.com/docs/guide/cron)：底层数据集每天都会刷新，所以我们安排一个函数每天运行。

* [Web Functions](https://modal.com/docs/guide/webhooks)：公开 Datasette 应用程序以进行 Web 浏览器交互和 API 请求。

## 基本设置

让我们开始编写代码。
对于 Modal 容器镜像，我们需要一些 Python 包。

```python
import asyncio
import gzip
import pathlib
import shutil
import tempfile
from datetime import datetime
from urllib.request import urlretrieve

import modal

app = modal.App("example-cron-datasette")
cron_image = modal.Image.debian_slim(python_version="3.12").uv_pip_install(
    "datasette==0.65.1", "sqlite-utils==3.38", "tqdm~=4.67.1", "setuptools<80"
)

```

## 持久数据集存储

为了将数据库创建和维护与服务分开，我们需要底层
持久存储的数据库文件。为了实现这一点，我们使用
[体积](https://modal.com/docs/guide/volumes)。

```python
volume = modal.Volume.from_name(
    "example-cron-datasette-cache-vol", create_if_missing=True
)
DB_FILENAME = "imdb.db"
VOLUME_DIR = "/cache-vol"
DATA_DIR = pathlib.Path(VOLUME_DIR, "imdb-data")
DB_PATH = pathlib.Path(VOLUME_DIR, DB_FILENAME)

```

## 获取数据集

[IMDb 数据集](https://datasets.imdbws.com/) 公开可用且每日更新。
我们将下载 title.basics.tsv.gz 文件，其中包含所有标题（电影、电视节目等）的基本信息。
由于我们提供每天更新的交互式数据库，因此我们会将文件下载到临时目录中，然后将它们移动到卷中以防止停机。

```python
BASE_URL = "https://datasets.imdbws.com/"
IMDB_FILES = [
    "title.basics.tsv.gz",
]


@app.function(
    image=cron_image,
    volumes={VOLUME_DIR: volume},
    retries=2,
    timeout=1800,
)
def download_dataset(force_refresh=False):
    """Download IMDb dataset files."""
    if DATA_DIR.exists() and not force_refresh:
        print(
            f"Dataset already present and force_refresh={force_refresh}. Skipping download."
        )
        return

    TEMP_DATA_DIR = pathlib.Path(VOLUME_DIR, "imdb-data-temp")
    if TEMP_DATA_DIR.exists():
        shutil.rmtree(TEMP_DATA_DIR)

    TEMP_DATA_DIR.mkdir(parents=True, exist_ok=True)

    print("Downloading IMDb dataset...")

    try:
        for filename in IMDB_FILES:
            print(f"Downloading {filename}...")
            url = BASE_URL + filename
            output_path = TEMP_DATA_DIR / filename

            urlretrieve(url, output_path)
            print(f"Successfully downloaded {filename}")

        if DATA_DIR.exists():
            # move the current data to a backup location
            OLD_DATA_DIR = pathlib.Path(VOLUME_DIR, "imdb-data-old")
            if OLD_DATA_DIR.exists():
                shutil.rmtree(OLD_DATA_DIR)
            shutil.move(DATA_DIR, OLD_DATA_DIR)

            # move the new data into place
            shutil.move(TEMP_DATA_DIR, DATA_DIR)

            # clean up the old data
            shutil.rmtree(OLD_DATA_DIR)
        else:
            shutil.move(TEMP_DATA_DIR, DATA_DIR)

        volume.commit()
        print("Finished downloading dataset.")

    except Exception as e:
        print(f"Error during download: {e}")
        if TEMP_DATA_DIR.exists():
            shutil.rmtree(TEMP_DATA_DIR)
        raise


```

## 数据处理

这个数据集不是沼泽，但仍然需要进行一些数据清理。
以下函数读取 .tsv 文件、清理数据并生成批量记录。

```python
def parse_tsv_file(filepath, batch_size=50000, filter_year=None):
    """Parse a gzipped TSV file and yield batches of records."""
    import csv

    with gzip.open(filepath, "rt", encoding="utf-8") as gz_file:
        reader = csv.DictReader(gz_file, delimiter="\t")
        batch = []
        total_processed = 0

        for row in reader:
            # map missing values to None
            row = {k: (None if v == "\\N" else v) for k, v in row.items()}

            # remove nsfw data
            if row.get("isAdult") == "1":
                continue

            if filter_year:
                start_year = int(row.get("startYear", 0) or 0)
                if start_year < filter_year:
                    continue

            batch.append(row)
            total_processed += 1

            if len(batch) >= batch_size:
                yield batch
                batch = []

        # Yield any remaining records
        if batch:
            yield batch

        print(f"Finished processing {total_processed:,} titles.")


```

## 插入 SQLite

随着 TSV 处理的完成，我们准备创建一个 SQLite 数据库并向其中输入数据。

重要的是，`prep_db`函数安装`download_dataset`使用的相同卷，并且批量插入行，并在每批后记录进度，
因为完整的 IMDb 数据集有数百万行，并且需要一些时间才能完全插入。

更复杂的实现只会加载新数据，而不是执行完全刷新，
但我们在这个例子中保持简单！
我们还将为 Titles 表创建索引以加快查询速度。

```python
@app.function(
    image=cron_image,
    volumes={VOLUME_DIR: volume},
    timeout=900,
)
def prep_db(filter_year=None):
    """Process IMDb data files and create SQLite database."""
    import sqlite_utils
    import tqdm

    volume.reload()

    # Create database in a temporary directory first
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir_path = pathlib.Path(tmpdir)
        tmp_db_path = tmpdir_path / DB_FILENAME

        db = sqlite_utils.Database(tmp_db_path)

        # Process title.basics.tsv.gz
        titles_file = DATA_DIR / "title.basics.tsv.gz"

        if titles_file.exists():
            titles_table = db["titles"]
            batch_count = 0
            total_processed = 0

            with tqdm.tqdm(desc="Processing titles", unit="batch", leave=True) as pbar:
                for i, batch in enumerate(
                    parse_tsv_file(
                        titles_file, batch_size=50000, filter_year=filter_year
                    )
                ):
                    titles_table.insert_all(batch, batch_size=50000, truncate=(i == 0))
                    batch_count += len(batch)
                    total_processed += len(batch)
                    pbar.update(1)
                    pbar.set_postfix({"titles": f"{total_processed:,}"})

            print(f"Total titles in database: {batch_count:,}")

            # Create indexes for titles so we can query the database faster
            print("Creating indexes...")
            titles_table.create_index(["tconst"], if_not_exists=True, unique=True)
            titles_table.create_index(["primaryTitle"], if_not_exists=True)
            titles_table.create_index(["titleType"], if_not_exists=True)
            titles_table.create_index(["startYear"], if_not_exists=True)
            titles_table.create_index(["genres"], if_not_exists=True)
            print("Created indexes for titles table")

        db.close()

        # Copy the database to the volume
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(tmp_db_path, DB_PATH)

    print("Syncing DB with volume.")
    volume.commit()
    print("Volume changes committed.")


```

## 保持新鲜感

IMDb 每天更新他们的数据，所以我们设置
一个[预定](https://modal.com/docs/guide/cron)自动刷新数据库的功能
每 24 小时一次。

```python
@app.function(schedule=modal.Period(hours=24), timeout=4000)
def refresh_db():
    """Scheduled function to refresh the database daily."""
    print(f"Running scheduled refresh at {datetime.now()}")
    download_dataset.remote(force_refresh=True)
    prep_db.remote()


```

## 网页功能

将 SQLite 数据库连接到模态函数非常简单。
Modal `@asgi_app` 装饰器包装了几行代码：一行 `import` 和几行代码
实例化 `Datasette` 实例并返回其应用程序服务器。

首先，让我们为数据库定义一个元数据对象。
这将用于配置 Datasette 以显示带有一些预定义查询的自定义 UI。

```python
columns = {
    "tconst": "Unique identifier",
    "titleType": "Type (movie, tvSeries, short, etc.)",
    "primaryTitle": "Main title",
    "originalTitle": "Original language title",
    "startYear": "Release year",
    "endYear": "End year (for TV series)",
    "runtimeMinutes": "Runtime in minutes",
    "genres": "Comma-separated genres",
}

queries = {
    "movies_2024": {
        "sql": """
                        SELECT
                            primaryTitle as title,
                            genres,
                            runtimeMinutes as runtime
                        FROM titles
                        WHERE titleType = 'movie'
                        AND startYear = 2024
                        ORDER BY primaryTitle
                        LIMIT 100
                    """,
        "title": "Movies Released in 2024",
    },
    "longest_movies": {
        "sql": """
                        SELECT
                            primaryTitle as title,
                            startYear as year,
                            runtimeMinutes as runtime,
                            genres
                        FROM titles
                        WHERE titleType = 'movie'
                        AND runtimeMinutes IS NOT NULL
                        AND runtimeMinutes > 180
                        ORDER BY runtimeMinutes DESC
                        LIMIT 50
                    """,
        "title": "Longest Movies (3+ hours)",
    },
    "genre_breakdown": {
        "sql": """
                        SELECT
                            genres,
                            COUNT(*) as count
                        FROM titles
                        WHERE titleType = 'movie'
                        AND genres IS NOT NULL
                        GROUP BY genres
                        ORDER BY count DESC
                        LIMIT 25
                    """,
        "title": "Popular Genres",
    },
}


metadata = {
    "title": "IMDb Database Explorer",
    "description": "Explore IMDb movie and TV show data",
    "databases": {
        "imdb": {
            "tables": {
                "titles": {
                    "description": "Basic information about all titles (movies, TV shows, etc.)",
                    "columns": columns,
                }
            },
            "queries": {
                "movies_2024": queries["movies_2024"],
                "longest_movies": queries["longest_movies"],
                "genre_breakdown": queries["genre_breakdown"],
            },
        }
    },
}

```

现在我们可以定义将为 Datasette 应用程序提供服务的 Web 函数

```python
@app.function(
    image=cron_image,
    volumes={VOLUME_DIR: volume},
)
@modal.concurrent(max_inputs=16)
@modal.asgi_app()
def ui():
    """Web Function backing the Datasette UI."""
    from datasette.app import Datasette

    ds = Datasette(
        files=[DB_PATH],
        settings={
            "sql_time_limit_ms": 60000,
            "max_returned_rows": 10000,
            "allow_download": True,
            "facet_time_limit_ms": 5000,
            "allow_facet": True,
        },
        metadata=metadata,
    )
    asyncio.run(ds.invoke_startup())
    return ds.app()


```## 发布到网络

使用 `modal run cron_datasette.py` 运行此脚本，它将在 5 分钟内创建数据库！

如果您想强制刷新数据集，可以使用：

`modal run cron_datasette.py --force-refresh`

如果您想过滤特定年份之后的数据，可以使用：

`modal run cron_datasette.py --filter-year year`

然后，您可以使用 `modal serve cron_datasette.py` 创建一个短暂的网址
直到您终止脚本为止。

发布交互式 Datasette 应用程序时，您需要创建一个持久 URL。
只需运行 `modal deploy cron_datasette.py`，您的应用程序将在几秒钟内部署！

```python
@app.local_entrypoint()
def run(force_refresh: bool = False, filter_year: int = None):
    if force_refresh:
        print("Force refreshing the dataset...")

    if filter_year:
        print(f"Filtering data to be after {filter_year}")

    print("Downloading IMDb dataset...")
    download_dataset.remote(force_refresh=force_refresh)
    print("Processing data and creating SQLite DB...")
    prep_db.remote(filter_year=filter_year)
    print("\nDatabase ready! You can now run:")
    print("  modal serve cron_datasette.py  # For development")
    print("  modal deploy cron_datasette.py  # For production deployment")


```

您可以在[已部署的Web功能](https://modal-labs-examples--example-cron-datasette-ui.modal.run)中探索数据。