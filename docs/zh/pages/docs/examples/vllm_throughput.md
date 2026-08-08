<!-- modal-docs: machine-translated zh-CN from English source -->

# 以最大吞吐量运行 LLM 推理

此示例演示了运行 LLM 推理的一些技术
Modal 上尽可能高的吞吐量。

有关最大化 LLM 推理性能的其他方面的更多信息，请参阅
[我们的指南](https://modal.com/docs/guide/high-performance-llm-inference)。
有关 LLM 服务的更简单介绍，请参阅
[这个例子](https://modal.com/docs/examples/llm_inference)。

作为我们的示例应用程序，我们使用法学硕士来总结数千份申请
美国联邦政府证券交易委员会 (SEC)，
在每日数据转储中免费向公众提供
通过 SEC 的电子数据收集、分析和检索系统
([EDGAR](https://www.sec.gov/submit-filings/about-edgar))。
我们想查看[Form 4s](https://www.sec.gov/files/form4data.pdf)，
其中详细介绍了（合法）内幕交易。

使用 Qwen 3 8B 参数 LLM 来完成此任务，
其输入平均为几千个代币
并输出平均几百个代币，
我们观察到处理速度约为 30,000 个输入 tok/s
每个 H100 GPU 约 2,000 个输出 tok/s，
如下面的模态仪表板示例屏幕截图所示。
注意[100% GPU 利用率](https://modal.com/blog/gpu-utilization-guide)，
表示不存在[主机开销](https://modal.com/blog/host-overhead-inference-efficiency)，
以及高[GPU功耗](https://modal.com/docs/guide/gpu-metrics)，
进一步表明我们已经接近硬件的物理极限。
![模态仪表板指示单个 H100 GPU 上的 30k tok/s 输入和 2k tok/s 输出](https://modal-cdn.com/example-vllm-throughput-dashboard.png)

截至 2026 年初，按照莫代尔的[当前费率](https://modal.com/pricing)，
每百万代币的价格约为 4 美分。
[根据人工分析](https://artificialanalysis.ai/models/qwen3-8b-instruct),
对于相同的工作负载，API 提供商的收费大约是其五倍。

## 在 Modal 上组织批处理作业

我们首先定义一个 Modal [App](https://modal.com/docs/guide/apps)，
它将我们的批处理作业使用的模态资源收集在一起。
当我们这样做时，我们导入了一些稍后需要的库。

```python
import datetime as dt
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import modal

MINUTES = 60  # seconds

app = modal.App("example-vllm-throughput")

```许多批处理作业可以很好地作为脚本运行——代码
来自 shell，临时的，而不是部署的。
为此，我们定义了一个 `local_entrypoint` ，其代码运行
在本地，当我们将脚本传递给`modal run`时，
并触发/编排远程执行。

我们演示了两种收集批处理作业结果的技术，
通过传递 `--wait-for-results`/`--no-wait-for-results` 进行切换
通过命令行进行标记。

当我们`--wait-for-results`时，我们传递`modal.FunctionCall`ID
这构成了我们的批处理作业`FunctionCall.gather`，其中
一旦我们的工作完成就返回。在这里，我们只打印结果，
但在更实际的设置中，您可以将它们保存到磁盘。

我们可以异步检索结果，而不是等待结果
基于 `FunctionCall` ID——一个简单的字符串。
结果在 Modal 中存储一周。
在下面的`local_entrypoint`中，打印了这些ID，
但您可以将它们存储在磁盘上的文件中，将它们添加到数据库中，
或者将它们放在模态中
[队列](https://modal.com/docs/guide/queues)
或 [字典](https://modal.com/docs/guide/dicts)
以便以后检索。

```python
@app.local_entrypoint()
def main(lookback: int = 5, wait_for_results: bool = True):
    jobs = orchestrate.remote(lookback=lookback)  # trigger remote job orchestration

    if wait_for_results:
        print("Collecting results locally")
        batches = modal.FunctionCall.gather(*jobs)
        for batch in batches:
            print(*(result.summary for result in batch if result.form == "4"), sep="\n")
            print("\n")
        print("Done")
    else:
        print("Collect results asynchronously with modal.FunctionCall.from_id")
        print("FunctionCall IDs:", *[job.object_id for job in jobs], sep="\n\t")


```

工作的主要内容是在我们的 `orchestrate` 函数中完成的。
它管理整个执行管道，
从原始数据源中的`extract`ing数据开始，
然后将其`transform`转换为更清晰的格式
然后通过法学硕士`process`ing。

对于提取和转换，我们使用
[`.map`](https://modal.com/docs/guide/scale),它并行地将输入扇出到容器上。
每次调用最多处理 1,500 行，
这导致每次调用的运行时间约为五分钟
通过并行调用，我们在大约五分钟内完成所有处理。

按天从申请列表中“重新划分”我们的数据
进入固定大小的文件列表需要一点
辅助函数：

```python
def rechunk(lists, size: int = 1_500):
    from itertools import chain, islice

    it = iter(chain.from_iterable(lists))
    while chunk := list(islice(it, size)):
        yield chunk


```

对于 LLM 通话，我们使用
[`.spawn`](https://modal.com/docs/guide/job-queue),
立即触发 LLM 的异步执行
返回 `FunctionCall` 稍后可用于 `.get` 结果
（或`.gather`几个结果）。

我们将其作为 `.remote` 模态函数调用来运行
这样即使我们的本地客户端断开连接后它也可以继续运行
（只要我们使用`modal run --detach`）。
在这种情况下，我们将 `FunctionCall` ID 转储到日志中，
但您也可以将它们写入外部存储以供以后检索。

下面的`app.function`装饰器就是我们设置这个Python函数所需的全部
进入远程模态函数！

```python
@app.function(timeout=30 * MINUTES)
def orchestrate(lookback: int) -> list[modal.FunctionCall]:
    llm = Vllm()

    today = datetime.now(tz=ZoneInfo("America/New_York")).date()  # Eastern Time
    print(f"Loading SEC filing data for the last {lookback} days")
    folders = list(extract.map(today - dt.timedelta(days=ii) for ii in range(lookback)))
    folders = list(
        filter(  # drop days with no data (weekends, holidays)
            lambda f: f is not None, folders
        )
    )

    print("Transforming raw SEC filings for these dates:", *folders)
    filing_batches = list(transform.map(folders))
    n_filings = sum(map(len, filing_batches))
    submission_batches_gen = rechunk(filing_batches)

    print(f"Submitting {n_filings} SEC filings to LLM for summarization")
    jobs = list(llm.process.spawn(batch) for batch in submission_batches_gen)
    if jobs:
        print("FunctionCall IDs:", *[job.object_id for job in jobs], sep="\n\t")

    return jobs


```

在进一步讨论之前，我们应该就我们的格式达成一致。
`transform` 和 `llm.process` 函数将用于通信
个别元素。

我们将使用一个轻量级的Python`dataclass`来表示
每个 SEC `Filing`。对于我们的任务，我们将获取归档的 `text` 并生成
`summary`。因此 `text` 是强制性的，而 `summary` 开始为空 (`None`)，
由LLM填写。

我们还将保留一些应包含的元数据。
但我们不确定所有这些字段都会存在（API 数据很混乱！），
所以我们保留将它们设置为`None`的权利。

```python
@dataclass
class Filing:
    accession_number: str | None
    form: str | None
    cik: str | None
    text: str
    summary: str | None = None


```

基本的编排设置完成后，
让我们依次实现每个组件。

## 以最大吞吐量提供令牌

首先，LLM服务。

### 配置 vLLM 以获得最大吞吐量

我们选择[vLLM](https://vllm.ai)
推理机。您也可以使用 [SGLang](https://docs.sglang.io)。
根据我们的经验，新型号和其他功能
首先在 vLLM 中实现，并且 vLLM 在吞吐量方面具有较小的优势
超过 SGLang，但两者都可以很好地工作。

```python
vllm_image = (
    modal.Image.from_registry("nvidia/cuda:12.9.0-devel-ubuntu22.04", add_python="3.13")
    .entrypoint([])
    .uv_pip_install("vllm==0.13.0", "huggingface-hub==0.36.0")
    .env({"HF_XET_HIGH_PERFORMANCE": "1"})  # faster model transfers
)

```

vLLM 会自动为我们下载模型并生成一些编译工件，
所有这些都保存到磁盘。
模态函数是无服务器的，磁盘是临时的，
所以我们附上一个[模态体积](https://modal.com/docs/guide/volumes)
到 vLLM 保存这些文件的位置以确保它们持续存在。

```python
hf_cache_vol = modal.Volume.from_name("huggingface-cache", create_if_missing=True)
vllm_cache_vol = modal.Volume.from_name("vllm-cache", create_if_missing=True)

```

像数据库或 Web 服务器一样，LLM 推理引擎
通常有几个旋钮可以调节性能
在不同的工作负载上。

首先也是最重要的，您需要选择它将运行的硬件。
我们将运行 8 位浮点格式的较小模型。
Hopper 和更高版本的 GPU 原生支持这种格式。
为了最大化吞吐量，我们希望确保我们的推理是
[计算限制](https://modal.com/gpu-glossary/perf/compute-bound):
瓶颈不是从内存加载权重/KV 缓存，
它正在对这些值执行计算。
粗略地说，我们希望能够组装一批
其大小在一个数量级内
[脊点运算强度](https://modal.com/gpu-glossary/perf/roofline-model)
GPU 的浮点格式，即
[FP8 数据上的 H100 SXM 张量代码约为 600](https://modal.com/gpu-glossary/perf/arithmetic-intensity)。

单个 H100 GPU 就足够了
[GPU内存](https://modal.com/gpu-glossary/device-hardware/gpu-ram)
对于该模型的相当大批量的数据，
所以我们坚持其中之一——而且只有一个！
部署到多个 GPU 上将增加*每个副本*的吞吐量，
但不是*每 GPU* 的吞吐量，因此也不是*每美元* 的吞吐量。

```python
GPU = "h100"

```

下面的参数字典涵盖了我们找到的旋钮
在这种情况下调整很重要。具体来说，我们
根据数据设置最大序列长度，
为引擎提供更多有关如何打包批次的提示。
我们选择[FlashInfer](https://github.com/flashinfer-ai/flashinfer)
作为 vLLM 推荐的注意力内核的提供者
提高离线服务的吞吐量。最后，我们
打开异步批处理调度程序，这会带来一点小小的提升
到吞吐量。

```python
vllm_throughput_kwargs = {
    "max_model_len": 4096 * 4,  # based on data
    "attention_backend": "flashinfer",  # best for throughput
    "async_scheduling": True,  # usually faster, but not all features supported
}

```

有关这些和其他参数的详细信息，我们建议查看 [vLLM 文档](https://vllm.ai)，
其中包括针对不同工作负载和模型的大量秘诀和建议。

### 在 Modal 上部署 vLLM

对于离线、面向吞吐量的服务，
我们可以使用vLLM SDK的`LLM`接口。
该接口同步处理批量输入，
与 `AsyncLLM` 或 HTTP 服务接口不同。
一次性倾倒一大批暴露
与引擎的最大并行度
并添加最少的请求管理开销，
所以我们可以期望它最大化吞吐量。
但重要的是，这意味着我们没有得到任何结果
直到所有这些都完成——这是一个关键的工程自由度
用于面向吞吐量的离线/批处理作业！

我们使用模态 [Cls](https://modal.com/docs/guide/lifecycle-functions)
控制`LLM`引擎的启动和关闭逻辑。
具体来说，我们创建它（并通过测试请求对其进行预热）
在用 `modal.enter` 装饰的方法中
我们用 `modal.exit` 修饰的方法将其关闭。
这些方法中的代码每个副本仅运行一次，
分别在创建和销毁时。

其间，我们通过引擎运行一批`Filings`，
将模型的输出文本添加到 `summary` 字段。

```python
@app.cls(
    image=vllm_image,
    gpu=GPU,
    timeout=10 * MINUTES,
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
)
class Vllm:
    @modal.enter()
    def start(self):
        import vllm

        self.llm = vllm.LLM(model="Qwen/Qwen3-8B-FP8", **vllm_throughput_kwargs)
        self.sampling_params = self.llm.get_default_sampling_params()
        self.sampling_params.max_tokens = 1000

        self.llm.chat([{"role": "user", "content": "Is this thing on?"}])

    @modal.method()
    def process(self, filings: list[Filing]) -> list[Filing]:
        messages = [
            [
                {
                    "role": "user",
                    "content": f"/no_think Summarize this SEC filing in a single, short paragraph.\n\n{filing.text}",
                }
            ]
            for filing in filings
        ]

        start = time.time()
        responses = self.llm.chat(messages, sampling_params=self.sampling_params)
        duration_s = time.time() - start

        in_token_count = sum(len(response.prompt_token_ids) for response in responses)
        out_token_count = sum(
            len(response.outputs[0].token_ids) for response in responses
        )

        print(f"processed {in_token_count} prompt tokens in {int(duration_s)} seconds")
        print(f"generated {out_token_count} output tokens in {int(duration_s)} seconds")

        for response, filing in zip(responses, filings):
            filing.summary = response.outputs[0].text

        return filings

    @modal.exit()
    def stop(self):
        del self.llm


```

这就是 LLM 管道的部分！
本文档的其余部分是代码和解释
用于数据加载和处理步骤。
详细信息主要针对该数据集，
但有一些通用的模态提示和技巧
一路上进行批处理。

## 将 SEC 备案文件转换为批处理
我们可以避免直接与低层打交道
SEC 数据格式的详细信息
[`edgartools`库](https://pypi.org/project/edgartools/)。
我们可以避免担心与其他库的兼容性
在我们的项目中，将其放入单独的容器图像中。

```python
data_proc_image = modal.Image.debian_slim(python_version="3.13").uv_pip_install(
    # pin transitive deps to avoid surprises like this one:
    # https://www.edgartools.io/pandas-3-0-and-edgartools/
    "edgartools==5.8.3",
    "httpx==0.28.1",
    "httpxthrottlecache==0.3.0",
    "pandas<3",
    "pyrate-limiter==3.9.0",
)

```

我们不必每次想要运行作业时都访问 SEC 的 EDGAR Feed API，
我们将在模态卷中缓存每天的结果。
我们使用 Modal 的 [v2 Volumes](https://modal.com/docs/guide/volumes#volumes-v2-overview)，
对存储文件的总数没有限制。

```python
sec_edgar_feed = modal.Volume.from_name(
    "example-sec-edgar-daily", create_if_missing=True, version=2
)
data_root = Path("/data")

```

请注意，v2 卷仍处于测试阶段，因此可能会丢失数据。这对于大多数批处理作业来说是可以接受的，这些作业从外部提取数据
真相的来源。

下面的`transform`函数对包含数据的文件夹进行操作
每个文件一份归档
（采用 [NetCDF](https://en.wikipedia.org/wiki/NetCDF)/`.nc` 格式）。

使用 `edgartools` 加载数千份文件需要数十秒。
我们可以通过在 Modal 上并行运行来加快速度！
但是在单独的容器中运行每个文件会增加太多的开销。
因此，我们将文件分组为约 100 个的 `chunks` 并将它们传递给
实际完成工作的模态函数。
同样，我们使用 `map` 透明地跨容器进行横向扩展。

```python
@app.function(
    volumes={data_root: sec_edgar_feed}, timeout=10 * MINUTES, scaledown_window=5
)
def transform(folder: str | None) -> list[Filing]:
    if folder is None:
        return []

    folder_path = data_root / folder
    paths = [p for p in folder_path.iterdir() if p.is_file() and p.suffix == ".nc"]

    print(f"Processing {len(paths)} filings")

    chunks: list[list[Path]] = [paths[i : i + 100] for i in range(0, len(paths), 100)]

    batches = list(_transform_filing_batch.map(chunks))

    filings = [f for batch in batches for f in batch if f is not None]

    print(f"Found documents for {len(filings)} filings out of {len(paths)}")

    return filings


@app.function(
    volumes={data_root: sec_edgar_feed},
    scaledown_window=5,
    image=data_proc_image,
    timeout=10 * MINUTES,
)
def _transform_filing_batch(raw_filing_paths: list[Path]) -> list[Filing | None]:
    from edgar.sgml import FilingSGML

    out = []
    for raw_filing_path in raw_filing_paths:
        sgml = FilingSGML.from_source(raw_filing_path)
        text = extract_text(sgml)
        if text is None:
            out.append(None)
            continue
        out.append(
            Filing(
                accession_number=sgml.accession_number,
                form=sgml.form,
                cik=sgml.cik,
                text=text,
            )
        )
    return out


```
因为这些容器的扩展成本低廉，并且仅需要
管道期间短暂爆发，我们为容器设置`scaledown_window`
比默认的五分钟低得多的值——这里是五秒。

## 从 SEC EDGAR Feed 加载文件

我们通过从原始源加载数据来完成管道的反向浏览：
[SEC EDGAR 饲料](https://www.sec.gov/Archives/edgar/Feed/),
三十多年前的日常档案档案。

我们使用 `requests` 库从 API 中提取数据。
我们将下载大数据（可能是兆字节到几千兆字节）文件的并发性较低，因此运行异步 Web 客户端几乎没有什么好处。

```python
scraper_image = modal.Image.debian_slim(python_version="3.13").uv_pip_install(
    "requests==2.32.5"
)

```

我们的并发性受到 SEC EDGAR API 政策的限制。
该限制为 10 RPS，我们的目标是通过设置 `containers` 的 `max` 数量来保持在该限制以下
将提取次数运行到 10。

我们添加[重试](https://modal.com/docs/guide/retries)
也通过我们的 Modal 装饰器，以便我们可以容忍临时中断或速率限制。

请注意，我们还附加了上面 `transform` 函数中使用的相同体积
我们明确地[`.commit`](https://modal.com/docs/reference/modal.Volume#commit)我们的写入
以便将来运行 `transform` 的容器可以看到它们。

```python
@app.function(
    max_containers=10,
    volumes={data_root: sec_edgar_feed},
    retries=5,
    image=scraper_image,
    scaledown_window=5,
)
def extract(day: dt.date) -> str | None:
    target_folder = str(day)
    day_dir = data_root / target_folder
    daily_name = f"{day:%Y%m%d}.nc.tar.gz"
    tar_path = day_dir / daily_name

    # If the folder doesn't exist yet, try downloading the day's tarball
    if not tar_path.exists():
        print(f"Looking for data for {day} in SEC EDGAR Feed")
        ok = _download_from_sec_edgar(day, day_dir)
        if not ok:
            return None

    if not any(p.suffix == ".nc" for p in day_dir.iterdir()):
        print(f"Loading data for {day} from {tar_path}")
        _extract_tarfile(tar_path, day_dir)

    sec_edgar_feed.commit()
    print(f"Data for {day} loaded")

    return target_folder


```

## 附录
该代码的其余部分由实用程序函数和样板文件组成
主要代码如上。

### 用于转换 SEC 文件的实用程序

本节中的代码用于转换、规范化和其他处理
从 SEC 下载的原始文件。

对于LLM服务，这里最重要的部分是截断函数
文件。最大文档长度可用于设置松散边界
关于LLM引擎配置中的序列长度。

```python
def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = clean_xml(text)
    return text


def clean_xml(xml: str) -> str:
    import re

    _XMLNS_ATTR_RE = re.compile(r'\s+xmlns(:\w+)?="[^"]*"', re.I)
    _XML_DECL_RE = re.compile(r"^\s*<\?xml[^>]*\?>\s*", re.I)
    _EMPTY_TAG_RE = re.compile(r"<(\w+)([^>]*)>\s*</\1>", re.S)
    _BETWEEN_TAG_WS_RE = re.compile(r">\s+<")

    xml = xml.replace("\r\n", "\n").replace("\r", "\n").strip()

    # drop xml declaration, remove xmlns attributes
    xml = _XML_DECL_RE.sub("", xml)
    xml = _XMLNS_ATTR_RE.sub("", xml)

    # replace whitespace between tags with a single newline
    xml = _BETWEEN_TAG_WS_RE.sub("><", xml).replace("><", ">\n<")

    return xml.strip()


def truncate_head_tail(text: str, head: int = 13_000, tail: int = 2_000) -> str:
    if len(text) <= head + tail:
        return text
    return text[:head].rstrip() + "\n\n[...TRUNCATED...]\n\n" + text[-tail:].lstrip()


def extract_text(sgml) -> str | None:
    doc = sgml.xml()
    return truncate_head_tail(normalize_text(doc)) if doc else None


```

### 用于从 SEC EDGAR Feed 加载文件的实用程序

本节中的代码用于从 Feed 加载原始数据
SEC EDGAR 部分。

每日转储存储在 [tar](https://www.math.utah.edu/docs/info/tar_4.html)
档案，下面的代码提取该档案。
通过搜索 SEC EDGAR Feed 索引可以找到特定日期的档案
以获得适当的 URL。

为了完全遵守 SEC EDGAR 礼仪，
我们建议更新 `SEC_USER_AGENT` 环境变量
下面写上您的姓名和电子邮件。

```python
def _download_from_sec_edgar(day: dt.date, day_dir: Path) -> bool:
    import os

    import requests

    SEC_UA = os.environ.get("SEC_USER_AGENT", "YourName your.email@example.com")
    session = requests.Session()
    session.headers.update({"User-Agent": SEC_UA, "Accept-Encoding": "gzip, deflate"})

    base = "https://www.sec.gov/Archives/edgar/Feed"

    def quarter(d: dt.date) -> str:
        return f"QTR{(d.month - 1) // 3 + 1}"

    qtr = quarter(day)
    daily_name = f"{day:%Y%m%d}.nc.tar.gz"
    qtr_index = f"{base}/{day.year}/{qtr}/index.json"

    if not check_index(session, qtr_index, daily_name):
        print(f"no data for {day} in SEC EDGAR Feed")
        return False

    day_dir.mkdir(parents=True, exist_ok=True)

    tar_path = day_dir / daily_name
    if not tar_path.exists() or tar_path.stat().st_size == 0:
        url = f"{base}/{day.year}/{qtr}/{daily_name}"
        print(f"Downloading from {url}")
        print("This can take several minutes")
        _download_tar(session, url, tar_path)

    return True


def _extract_tarfile(from_tar_path, to_dir):
    import tarfile

    with tarfile.open(from_tar_path, "r:gz") as tf:
        for member in tf:
            if not (member.isfile() and member.name.endswith(".nc")):
                continue
            dest = to_dir / Path(member.name).name
            if dest.exists() and dest.stat().st_size > 0:
                continue
            f = tf.extractfile(member)
            if f is None:
                continue
            dest.write_bytes(f.read())


def check_index(session, index_url, name) -> bool:
    r = session.get(index_url, timeout=30)
    if r.status_code == 404:
        return False
    r.raise_for_status()
    for it in r.json().get("directory", {}).get("item", []):
        if it.get("type") == "file" and it.get("name") == name:
            return True
    return False


def _download_tar(session, url, tar_path):
    resp = session.get(url, timeout=500)
    resp.raise_for_status()
    tmp = tar_path.with_suffix(tar_path.suffix + ".part")
    tmp.write_bytes(resp.content)
    tmp.replace(tar_path)

```