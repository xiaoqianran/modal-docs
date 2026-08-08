<!-- modal-docs: machine-translated zh-CN from English source -->

# 与 PDF 聊天：RAG 与 ColQwen2

在这个例子中，我们演示了如何使用 [ColQwen2](https://huggingface.co/vidore/colqwen2-v0.1) 模型构建一个简单的
“与 PDF 聊天”检索增强生成 (RAG) 应用程序。
ColQwen2 模型基于 [ColPali](https://huggingface.co/blog/manu/colpali)，但使用
[Qwen2-VL-2B-Instruct](https://huggingface.co/Qwen/Qwen2-VL-2B-Instruct)视觉语言模型。
ColPali 又基于 [ColBERT](https://dl.acm.org/doi/pdf/10.1145/3397271.3401075) 中首创的后期交互嵌入方法。

具有高质量嵌入的视觉语言模型消除了对复杂预处理管道的需要。
请参阅 [Vespa 的 Jo Bergum 的这篇博文](https://blog.vespa.ai/announcing-colbert-embedder-in-vespa/) 了解更多信息。

## 设置

首先，我们将在本地导入我们需要的库并定义一些常量。

```python
from pathlib import Path
from typing import Optional
from urllib.request import urlopen
from uuid import uuid4

import modal

MINUTES = 60  # seconds

app = modal.App("example-chat-with-pdf-vision")

```

## 设置依赖关系

在 Modal 中，我们定义运行无服务器工作负载的[容器映像](https://modal.com/docs/guide/custom-container)。
我们在这些映像中安装应用程序所需的软件包。

```python
CACHE_DIR = "/hf-cache"

model_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git")
    .uv_pip_install(
        [
            "colpali-engine==0.3.5",
            "transformers>=4.45.0",
            "torch>=2.0.0",
            "huggingface-hub==0.36.0",
            "qwen-vl-utils==0.0.8",
            "torchvision==0.19.1",
        ]
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1", "HF_HUB_CACHE": CACHE_DIR})
)

```

这些依赖项仅远程安装，因此我们无法在本地导入它们。
使用 `.imports` 上下文管理器仅在 Modal 上导入它们。

```python
with model_image.imports():
    import torch
    from colpali_engine.models import ColQwen2, ColQwen2Processor
    from qwen_vl_utils import process_vision_info
    from transformers import AutoProcessor, Qwen2VLForConditionalGeneration

```

## 指定 ColQwen2 模型

用于嵌入和生成的视觉语言模型 (VLM) 又增加了一层简化
到基于矢量搜索的 RAG 应用程序：我们只需要一个模型。
```python
MODEL_NAME = "Qwen/Qwen2-VL-2B-Instruct"
MODEL_REVISION = "aca78372505e6cb469c4fa6a35c60265b00ff5a4"

```

## 使用模态卷和字典管理状态

聊天服务是有状态的：
对传入用户消息的响应取决于会话中过去的用户消息。

RAG 应用程序添加了更多状态：
从中检索的文档以及这些文档的索引，
例如嵌入。

模态函数本身是无状态的。
它们不保留从输入到输入的信息。
这就是模态函数能够自动放大和缩小的原因
[基于传入请求的数量](https://modal.com/docs/guide/cold-start)。

### 使用 Modal Dicts 管理聊天会话

在此示例中，我们使用 [`modal.Dict`](https://modal.com/docs/guide/dicts-and-queues)
存储函数调用之间的状态信息。

Modal Dicts 的行为与 Python 字典类似，
但它们由远程存储支持，并且可供所有模态函数访问。
它们可以包含任何Python对象
可以使用 [`cloudpickle`](https://github.com/cloudpipe/cloudpickle) 进行序列化。

一个 Dict 可以在大小高达 100 MiB 的键中容纳几 GB 的字节，
所以它非常适合我们的聊天会话状态，每个会话只有几 KiB，
对于我们的嵌入，每个 PDF 页面有几百 KiB，
最多约 100,000 页的 PDF。

在更大范围内，我们需要用数据库替换它，比如 Postgres，
或将更多状态推送给客户端。

```python
sessions = modal.Dict.from_name("colqwen-chat-sessions", create_if_missing=True)


class Session:
    def __init__(self):
        self.images = None
        self.messages = []
        self.pdf_embeddings = None


```

### 在模态卷上存储 PDF

从 PDF 中提取的图像比我们的会话状态或嵌入更大
\-- 每页低数十 MiB。

所以我们将它们存储在[模态卷](https://modal.com/docs/guide/volumes)中，
它可以在数万个文件中存储 TB（或更多！）的数据。

卷的行为类似于远程文件系统：
我们从它们中读取和写入就像本地文件系统一样。

```python
pdf_volume = modal.Volume.from_name("colqwen-chat-pdfs", create_if_missing=True)
PDF_ROOT = Path("/vol/pdfs/")

```

### 缓存模型权重

我们还将使用 Volume 来缓存模型权重。

```python
cache_volume = modal.Volume.from_name("hf-hub-cache", create_if_missing=True)


```

运行此函数会将模型权重下载到缓存卷中。否则，模型权重将在第一次查询时下载。有关在 Modal 上存储模型权重的更多信息，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。

```python
@app.function(
    image=model_image, volumes={CACHE_DIR: cache_volume}, timeout=20 * MINUTES
)
def download_model():
    from huggingface_hub import snapshot_download

    result = snapshot_download(
        MODEL_NAME,
        revision=MODEL_REVISION,
        ignore_patterns=["*.pt", "*.bin"],  # using safetensors
    )
    print(f"Downloaded model weights to {result}")


```

## 定义 Chat with PDF 服务

要在 Modal 上部署自动缩放的“Chat with PDF”视觉语言模型服务，
我们只需要将 Python 逻辑包装在 [Modal App](https://modal.com/docs/guide/apps) 中：

它使用 [Modal `@app.cls`](https://modal.com/docs/guide/lifecycle-functions) 装饰器
组织应用程序的“生命周期”：
在容器启动时加载模型 (`@modal.enter`) 并根据请求运行推理 (`@modal.method`)。

我们将参数包含在 `@app.cls` 装饰器中
有关该服务基础设施的所有信息：
容器映像、远程存储和 GPU 要求。

```python
@app.cls(
    image=model_image,
    gpu="A100-80GB",
    scaledown_window=10 * MINUTES,  # spin down when inactive
    volumes={"/vol/pdfs/": pdf_volume, CACHE_DIR: cache_volume},
)
class Model:
    @modal.enter()
    def load_models(self):
        self.colqwen2_model = ColQwen2.from_pretrained(
            "vidore/colqwen2-v0.1",
            torch_dtype=torch.bfloat16,
            device_map="cuda:0",
        )
        self.colqwen2_processor = ColQwen2Processor.from_pretrained(
            "vidore/colqwen2-v0.1"
        )
        self.qwen2_vl_model = Qwen2VLForConditionalGeneration.from_pretrained(
            MODEL_NAME,
            revision=MODEL_REVISION,
            torch_dtype=torch.bfloat16,
        )
        self.qwen2_vl_model.to("cuda:0")
        self.qwen2_vl_processor = AutoProcessor.from_pretrained(
            "Qwen/Qwen2-VL-2B-Instruct", trust_remote_code=True
        )

    @modal.method()
    def index_pdf(self, session_id, target: bytes | list):
        # We store concurrent user chat sessions in a modal.Dict

        # For simplicity, we assume that each user only runs one session at a time

        session = sessions.get(session_id)
        if session is None:
            session = Session()

        if isinstance(target, bytes):
            images = convert_pdf_to_images.remote(target)
        else:
            images = target

        # Store images on a Volume for later retrieval
        session_dir = PDF_ROOT / f"{session_id}"
        session_dir.mkdir(exist_ok=True, parents=True)
        for ii, image in enumerate(images):
            filename = session_dir / f"{str(ii).zfill(3)}.jpg"
            image.save(filename)

        # Generated embeddings from the image(s)
        BATCH_SZ = 4
        pdf_embeddings = []
        batches = [images[i : i + BATCH_SZ] for i in range(0, len(images), BATCH_SZ)]
        for batch in batches:
            batch_images = self.colqwen2_processor.process_images(batch).to(
                self.colqwen2_model.device
            )
            pdf_embeddings += list(self.colqwen2_model(**batch_images).to("cpu"))

        # Store the image embeddings in the session, for later retrieval
        session.pdf_embeddings = pdf_embeddings

        # Write embeddings back to the modal.Dict
        sessions[session_id] = session

    @modal.method()
    def respond_to_message(self, session_id, message):
        session = sessions.get(session_id)
        if session is None:
            session = Session()

        pdf_volume.reload()  # make sure we have the latest data

        images = (PDF_ROOT / str(session_id)).glob("*.jpg")
        images = list(sorted(images, key=lambda p: int(p.stem)))

        # Nothing to chat about without a PDF!
        if not images:
            return "Please upload a PDF first"
        elif session.pdf_embeddings is None:
            return "Indexing PDF..."

        # RAG, Retrieval-Augmented Generation, is two steps:

        # _Retrieval_ of the most relevant data to answer the user's query
        relevant_image = self.get_relevant_image(message, session, images)

        # _Generation_ based on the retrieved data
        output_text = self.generate_response(message, session, relevant_image)

        # Update session state for future chats
        append_to_messages(message, session, user_type="user")
        append_to_messages(output_text, session, user_type="assistant")
        sessions[session_id] = session

        return output_text

    # Retrieve the most relevant image from the PDF for the input query
    def get_relevant_image(self, message, session, images):
        import PIL

        batch_queries = self.colqwen2_processor.process_queries([message]).to(
            self.colqwen2_model.device
        )
        query_embeddings = self.colqwen2_model(**batch_queries)

        # This scores our query embedding against the image embeddings from index_pdf
        scores = self.colqwen2_processor.score_multi_vector(
            query_embeddings, session.pdf_embeddings
        )[0]

        # Select the best matching image
        max_index = max(range(len(scores)), key=lambda index: scores[index])
        return PIL.Image.open(images[max_index])

    # Pass the query and retrieved image along with conversation history into the VLM for a response
    def generate_response(self, message, session, image):
        chatbot_message = get_chatbot_message_with_image(message, image)
        query = self.qwen2_vl_processor.apply_chat_template(
            [*session.messages, chatbot_message],
            tokenize=False,
            add_generation_prompt=True,
        )
        image_inputs, _ = process_vision_info([chatbot_message])
        inputs = self.qwen2_vl_processor(
            text=[query],
            images=image_inputs,
            padding=True,
            return_tensors="pt",
        )
        inputs = inputs.to("cuda:0")

        generated_ids = self.qwen2_vl_model.generate(**inputs, max_new_tokens=512)
        generated_ids_trimmed = [
            out_ids[len(in_ids) :]
            for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = self.qwen2_vl_processor.batch_decode(
            generated_ids_trimmed,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )[0]
        return output_text


```

## 将 PDF 作为图像加载

视觉语言模型对图像进行操作，而不是直接对 PDF 进行操作，
所以我们需要先将 PDF 转换为图像。

我们将其与索引和聊天逻辑分开——
我们在具有不同依赖项的不同容器上运行。

```python
pdf_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("poppler-utils")
    .uv_pip_install("pdf2image==1.17.0", "pillow==10.4.0")
)


@app.function(image=pdf_image)
def convert_pdf_to_images(pdf_bytes):
    from pdf2image import convert_from_bytes

    images = convert_from_bytes(pdf_bytes, fmt="jpeg")
    return images


```

## 从终端与 PDF 聊天

在 UI 中部署之前，我们可以从终端测试我们的服务。

就跑

```bash
modal run chat_with_pdf_vision.py
```

并可选择使用 `--pdf-path` 参数传入 PDF 的路径或 URL
并使用 `--question` 参数指定问题。通过传递开始时打印到终端的会话 ID 来继续之前的聊天
与 `--session-id` 参数。

```python
@app.local_entrypoint()
def main(
    question: Optional[str] = None,
    pdf_path: Optional[str] = None,
    session_id: Optional[str] = None,
):
    model = Model()
    if session_id is None:
        session_id = str(uuid4())
        print("Starting a new session with id", session_id)

        if pdf_path is None:
            pdf_path = "https://arxiv.org/pdf/1706.03762"  # all you need

        if pdf_path.startswith("http"):
            pdf_bytes = urlopen(pdf_path).read()
        else:
            pdf_bytes = Path(pdf_path).read_bytes()

        print("Indexing PDF from", pdf_path)
        model.index_pdf.remote(session_id, pdf_bytes)
    else:
        if pdf_path is not None:
            raise ValueError("Start a new session to chat with a new PDF")
        print("Resuming session with id", session_id)

    if question is None:
        question = "What is this document about?"

    print("QUESTION:", question)
    print(model.respond_to_message.remote(session_id, question))


```

## 托管的 Gradio 界面

使用 [Gradio](https://gradio.app) 库，我们可以在 Python 中围绕我们的类创建一个简单的 Web 界面，
然后使用 Modal 托管它以供任何人尝试。

要部署您自己的，请运行

```bash
modal deploy chat_with_pdf_vision.py
```

并导航至终端中显示的 URL。
如果您正在编辑代码，请使用 `modal serve` 来查看热重载更改。

```python
web_image = pdf_image.uv_pip_install(
    "fastapi[standard]==0.115.4",
    "pydantic==2.9.2",
    "starlette==0.41.2",
    "gradio==4.44.1",
    "pillow==10.4.0",
    "gradio-pdf==0.0.15",
    "pdf2image==1.17.0",
)


@app.function(
    image=web_image,
    # gradio requires sticky sessions
    # so we limit the number of concurrent containers to 1
    # and allow it to scale to 1000 concurrent inputs
    max_containers=1,
)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def ui():
    import uuid

    import gradio as gr
    from fastapi import FastAPI
    from gradio.routes import mount_gradio_app
    from gradio_pdf import PDF
    from pdf2image import convert_from_path

    web_app = FastAPI()

    # Since this Gradio app is running from its own container,
    # allowing us to run the inference service via .remote() methods.
    model = Model()

    def upload_pdf(path, session_id):
        if session_id == "" or session_id is None:
            # Generate session id if new client
            session_id = str(uuid.uuid4())

        images = convert_from_path(path)
        # Call to our remote inference service to index the PDF
        model.index_pdf.remote(session_id, images)

        return session_id

    def respond_to_message(message, _, session_id):
        # Call to our remote inference service to run RAG
        return model.respond_to_message.remote(session_id, message)

    with gr.Blocks(theme="soft") as demo:
        session_id = gr.State("")

        gr.Markdown("# Chat with PDF")
        with gr.Row():
            with gr.Column(scale=1):
                gr.ChatInterface(
                    fn=respond_to_message,
                    additional_inputs=[session_id],
                    retry_btn=None,
                    undo_btn=None,
                    clear_btn=None,
                )
            with gr.Column(scale=1):
                pdf = PDF(
                    label="Upload a PDF",
                )
                pdf.upload(upload_pdf, [pdf, session_id], session_id)

    return mount_gradio_app(app=web_app, blocks=demo, path="/")


```

## 附录

该代码的其余部分由实用程序函数和样板文件组成
主要代码如上。

```python
def get_chatbot_message_with_image(message, image):
    return {
        "role": "user",
        "content": [
            {"type": "image", "image": image},
            {"type": "text", "text": message},
        ],
    }


def append_to_messages(message, session, user_type="user"):
    session.messages.append(
        {
            "role": user_type,
            "content": {"type": "text", "text": message},
        }
    )

```