<!-- modal-docs: machine-translated zh-CN from English source -->

# 运行一个作业队列，使用 Datalab Marker 将文档转换为结构化数据

本教程向您展示如何使用 Modal 作为无限可扩展的作业队列
可以通过网络应用程序为异步任务提供服务。

我们的作业队列将处理一个任务：将图像/PDF 转换为结构化数据。
我们将使用 [Datalab](https://www.datalab.to) 中的 [Marker](https://github.com/datalab-to/marker)，
它可以将文档或 PDF 的图像转换为 Markdown、JSON 和 HTML。 Marker是开放权重模型；
要了解有关商业用途的更多信息，请参阅[此处](https://github.com/datalab-to/marker?tab=readme-ov-file#commercial-usage)。为了本教程的目的，我们还在 Modal 上构建了一个 [React + FastAPI Web 应用程序](https://modal.com/docs/examples/doc_ocr_webapp)
与它一起工作，但请注意，您不需要在 Modal 上运行 Web 应用程序
使用此模式。您可以从任何 Python 向 Modal 提交异步任务
应用程序（例如，在 Kubernetes 上运行的常规 Django 应用程序）。

亲自尝试一下[这里](https://modal-labs-examples--example-doc-ocr-webapp-wrapper.modal.run/)。

## 定义一个应用程序

我们首先导入`modal`并定义一个[`App`](https://modal.com/docs/reference/modal.App)。
稍后，我们将使用为作业队列应用程序提供的名称从我们的 Web 应用程序中找到它并向其提交任务。

```python
from typing import Optional

import modal
from typing_extensions import Literal

app = modal.App("example-doc-ocr-jobs")

```

我们还通过指定一个来定义我们需要的依赖关系
[图片](https://modal.com/docs/guide/images)。

```python
inference_image = modal.Image.debian_slim(python_version="3.12").uv_pip_install(
    "marker-pdf[full]==1.9.3", "torch==2.8.0"
)

```

## 将预训练模型缓存在模态卷上
我们可以从Datalab中获取我们想要运行的预训练模型
通过使用标记库。

```python
def load_models():
    import marker.models

    print("loading models")

    return marker.models.create_model_dict()


```

`create_model_dict`函数从Datalab下载模型权重
云存储（S3 存储桶）（如果文件系统中尚不存在）。
然而，在 Modal 的无服务器环境中，文件系统是短暂的，
因此，单独使用此代码意味着需要下载模型
多次（每次我们的函数的新实例启动时）。

因此，我们创建一个模态 [Volume](https://modal.com/docs/guide/volumes)
来存储模型。每个模态卷都是任何模态函数都可以访问的持久文件系统。
您可以在[我们的指南](https://modal.com/docs/guide/model-weights)中阅读有关在 Modal 上存储模型权重的更多信息。

```python
marker_cache_path = "/root/.cache/datalab/"
marker_cache_volume = modal.Volume.from_name(
    "marker-models-modal-demo", create_if_missing=True
)
marker_cache = {marker_cache_path: marker_cache_volume}

```

## 在模态上运行 Datalab 标记

现在让我们建立实际的推理。

使用[`@app.function`](https://modal.com/docs/reference/modal.App#function)
装饰器中，我们设置了一个 Modal [Function](https://modal.com/docs/reference/modal.Function)。
我们向该装饰器提供参数来定制硬件、缩放和其他功能
函数的。

这里，我们说这个Function应该使用NVIDIA L40S [GPUs](https://modal.com/docs/guide/gpu)，
自动[重试](https://modal.com/docs/guide/retries#function-retries)失败最多3次，
并可以访问我们的[共享模型缓存](https://modal.com/docs/guide/volumes)。

在函数内部，我们写出推理逻辑，
其中主要涉及配置`marker`库提供的组件。

```python
@app.function(gpu="l40s", retries=3, volumes=marker_cache, image=inference_image)
def parse_document(
    document: bytes,
    page_range: str | None = None,
    force_ocr: bool = False,
    paginate_output: bool = False,
    output_format: Literal["markdown", "html", "chunks", "json"] = "markdown",
    use_llm: bool = False,
) -> str | dict:
    """
    Args:
        document: Document data (PDF, JPG, PNG) as bytes.
        page_range: Specify which pages to process. Accepts comma-separated page numbers and ranges.
        force_ocr: Force OCR processing on the entire document, even for pages that might contain extractable text.
                    This will also format inline math properly.
        paginate_output: Paginates the output, using \n\n{PAGE_NUMBER} followed by - * 48, then \n\n
        output_format: Output format. Can be markdown, JSON, HTML, or chunks.
        use_llm: use an llm to improve the marker results.
    """
    from tempfile import NamedTemporaryFile

    import marker.config.parser
    import marker.converters.pdf
    import marker.output

    models = load_models()

    # Set up document "converter"
    config = {
        "page_range": page_range,
        "force_ocr": force_ocr,
        "paginate_output": paginate_output,
        "output_format": output_format,
        "use_llm": use_llm,
    }

    config_parser = marker.config.parser.ConfigParser(config)
    config_dict = config_parser.generate_config_dict()
    config_dict["pdftext_workers"] = 1

    converter = marker.converters.pdf.PdfConverter(
        config=config_dict,
        artifact_dict=models,
        processor_list=config_parser.get_processors(),
        renderer=config_parser.get_renderer(),
        llm_service=config_parser.get_llm_service() if use_llm else None,
    )

    # Run the converter on our document
    with NamedTemporaryFile(delete=False, mode="wb+") as temp_path:
        temp_path.write(document)
        rendered_output = converter(temp_path.name)

    # Format the output and return it
    if output_format == "json":
        result = rendered_output.model_dump_json()
    else:
        text, _, images = marker.output.text_from_rendered(rendered_output)

        result = text

    return result


```

## 测试和调试远程代码

为了确保这段代码有效，我们需要一种方法来尝试和调试它。

我们可以在Modal上运行它，无需设置单独的本地测试，
添加 [`local_entrypoint`](https://modal.com/docs/reference/modal.App#local_entrypoint)
调用函数`.remote`ly。

```python
@app.local_entrypoint()
def main(document_filename: Optional[str] = None):
    import urllib.request
    from pathlib import Path

    if document_filename is None:
        document_filename = Path(__file__).parent / "receipt.png"
    else:
        document_filename = Path(document_filename)

    if document_filename.exists():
        image = document_filename.read_bytes()
        print(f"running OCR on {document_filename}")
    else:
        document_url = "https://modal-cdn.com/cdnbot/Brandys-walmart-receipt-8g68_a_hk_f9c25fce.webp"
        print(f"running OCR on sample from URL {document_url}")
        request = urllib.request.Request(document_url)
        with urllib.request.urlopen(request) as response:
            image = response.read()
    print(parse_document.remote(image, output_format="html"))


```

然后您可以使用以下命令从命令行运行它：

```shell
modal run doc_ocr_jobs.py
```

## 部署文档转换服务

现在我们有了一个 Function，我们可以通过部署 App 来发布它：

```shell
modal deploy doc_ocr_jobs.py
```

发布后我们可以[查找](https://modal.com/docs/guide/trigger-deployed-functions)这个函数
从另一个Python进程并向其提交任务：

```python
fn = modal.Function.from_name("example-doc-ocr-jobs", "parse_document")
fn.spawn(my_document)
```

Modal 将自动缩放以处理排队的所有任务，并且
然后当没有剩余工作时缩小到 0。了解如何从 Python 网络使用它
应用程序，看一下[收据解析器前端](https://modal.com/docs/examples/doc_ocr_webapp)
教程。