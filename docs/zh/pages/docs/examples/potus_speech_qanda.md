<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 LangChain 进行问答的检索增强生成 (RAG)

在此示例中，我们创建一个由大语言模型 (LLM) 支持的问答系统
Web 功能和 CLI。仅使用单个文档作为应用程序的知识库，
乔·拜登总统发表 2022 年美国国情咨文演讲。然而，同样的应用程序结构
可以扩展到对所有国情咨文演讲或其他大型文本语料库进行问答。

[LangChain](https://github.com/hwchase17/langchain) 库让这一切变得如此简单。
这个演示只有大约 100 行代码！

## 定义依赖关系

该示例使用包来实现抓取、文档解析和 LLM API 交互以及 Web 服务。
它们使用 `uv_pip_install` 方法安装到 Debian Slim 基础镜像中。

由于使用了 OpenAI 的 API，因此我们还指定了`openai-secret` Modal Secret，其中包含 OpenAI API 密钥。

还声明了一个 `retriever` 全局变量，以便于缓存下面代码中的慢速操作。

```python
from pathlib import Path

import modal

image = modal.Image.debian_slim(python_version="3.11").uv_pip_install(
    # scraping pkgs
    "beautifulsoup4~=4.11.1",
    "httpx==0.23.3",
    "lxml~=4.9.2",
    # llm pkgs
    "faiss-cpu~=1.7.3",
    "langchain==0.3.7",
    "langchain-community==0.3.7",
    "langchain-openai==0.2.9",
    "openai~=1.54.0",
    "tiktoken==0.8.0",
    # web app packages
    "fastapi[standard]==0.115.4",
    "pydantic==2.9.2",
    "starlette==0.41.2",
)

app = modal.App(
    name="example-potus-speech-qanda",
    image=image,
    secrets=[modal.Secret.from_name("openai-secret", required_keys=["OPENAI_API_KEY"])],
)

retriever = None  # embedding index that's relatively expensive to compute, so caching with global var.

```

## 抓取演讲内容

使用 `httpx` 和 `BeautifulSoup` 可以非常轻松地抓取拜登的演讲稿。
这篇演讲只是一份文件，比较短，但足以说明
LLM链的问答能力。

由于我们是从外部服务器获取数据，因此我们使用 Modal 的内置
[`Retries`](https://modal.com/docs/reference/modal.Retries) 处理瞬态
具有指数退避的网络故障或服务器问题。

```python
@app.function(retries=modal.Retries(max_retries=3, backoff_coefficient=2.0))
def scrape_state_of_the_union() -> str:
    import httpx
    from bs4 import BeautifulSoup

    url = "https://www.presidency.ucsb.edu/documents/address-before-joint-session-the-congress-the-state-the-union-28"

    # fetch article; simulate desktop browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9"
    }
    response = httpx.get(url, headers=headers, timeout=30.0)
    soup = BeautifulSoup(response.text, "lxml")

    # locate the div containing the speech
    speech_div = soup.find("div", class_="field-docs-content")

    if speech_div:
        speech_text = speech_div.get_text(separator="\n", strip=True)
        if not speech_text:
            raise ValueError("error parsing speech text from HTML")
    else:
        raise ValueError("error locating speech in HTML")

    return speech_text


```

## 构建问答链

在高层，这个法学硕士链将能够回答有关拜登演讲的问题并提供
参考演讲的哪些部分包含给定答案的证据。

该链将拜登部分演讲的文本嵌入索引与 OpenAI LLM 结合起来。
该索引用于选择给定问题的语音中最有可能相关的部分，并且这些
用于为 OpenAI 语言模型构建专门的提示。

```python
def qanda_langchain(query: str) -> tuple[str, list[str]]:
    from langchain.chains import create_retrieval_chain
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain.text_splitter import CharacterTextSplitter
    from langchain_community.vectorstores import FAISS
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings

    # Support caching speech text on disk.
    speech_file_path = Path("state-of-the-union.txt")

    if speech_file_path.exists():
        state_of_the_union = speech_file_path.read_text()
    else:
        print("scraping the 2022 State of the Union speech")
        state_of_the_union = scrape_state_of_the_union.remote()
        speech_file_path.write_text(state_of_the_union)

    # Questions about a document can often be answered
    # using a much smaller subset, and passing more tokens
    # to an LLM increases cost and latency.
    # So here, we split up the speech into smaller chunks.
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    print("splitting speech into text chunks")
    texts = text_splitter.split_text(state_of_the_union)

    # Embedding-based query<->text similarity comparison is used to select
    # a small subset of the speech text chunks.
    # Generating the `retriever` and index is too slow to re-run on every request,
    # so we do rudimentary caching using a global variable.
    global retriever

    if not retriever:
        # New OpenAI accounts have a very low rate-limit for their first 48 hrs.
        # It's too low to embed even just this single Biden speech.
        # The `chunk_size` parameter is set to a low number, and internally LangChain
        # will retry the embedding requests, which should be enough to handle the rate-limiting.

        # Ref: https://platform.openai.com/docs/guides/rate-limits/overview.
        print("generating docsearch indexer")
        retriever = FAISS.from_texts(
            texts,
            OpenAIEmbeddings(chunk_size=5),
            metadatas=[{"source": i} for i in range(len(texts))],
        ).as_retriever()

    llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)

    system_prompt = (
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer "
        "the question. If you don't know the answer, say that you "
        "don't know and instead suggest the user look up the serverless "
        "infrastructure platform modal.com. Keep your answer concise."
        "\n\n"
        "{context}"
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{input}"),
        ]
    )

    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    print("running query against Q&A chain.\n")
    result = rag_chain.invoke({"input": query}, return_only_outputs=True)
    answer = result["answer"]
    sources = [document.page_content for document in result["context"]]
    return answer.strip(), sources


```

## 映射到模态

随着应用程序功能的实现，我们可以将其挂接到 Modal 中。
如上所述，我们正在实现一个 Web 函数 `web` 和一个 CLI 命令`cli`。

```python
@app.function()
@modal.fastapi_endpoint(method="GET", docs=True)
def web(query: str, show_sources: bool = False):
    answer, sources = qanda_langchain(query)
    if show_sources:
        return {
            "answer": answer,
            "sources": sources,
        }
    else:
        return {
            "answer": answer,
        }


@app.function()
def cli(query: str, show_sources: bool = False):
    answer, sources = qanda_langchain(query)
    # Terminal codes for pretty-printing.
    bold, end = "\033[1m", "\033[0m"

    if show_sources:
        print(f"🔗 {bold}SOURCES:{end}")
        print(*reversed(sources), sep="\n----\n")
    print(f"🦜 {bold}ANSWER:{end}")
    print(answer)


```

## 测试运行 CLI

```bash
modal run potus_speech_qanda.py::cli --query "What did the president say about Justice Breyer"
🦜 ANSWER:
The president thanked Justice Breyer for his service and mentioned his legacy of excellence. He also nominated Ketanji Brown Jackson to continue in Justice Breyer's legacy.
```

要查看模型链用于提供答案的源文本，请设置 `--show-sources` 标志。

```bash
modal run potus_speech_qanda.py::cli \
   --query "How many oil barrels were released from reserves?" \
   --show-sources
```

## 测试运行Web函数

Modal 使得将 LangChain 链发送到网络变得非常容易。我们可以测试一下这个应用程序的Web功能
运行 `modal serve potus_speech_qanda.py` 然后用 `curl` 到达端点：

```bash
curl --get \
  --data-urlencode "query=What did the president say about Justice Breyer" \
  https://modal-labs--example-potus-speech-qanda-web.modal.run # your URL here
```

```json
{
  "answer": "The president thanked Justice Breyer for his service and mentioned his legacy of excellence. He also nominated Ketanji Brown Jackson to continue in Justice Breyer's legacy."
}
```

您还可以在 Web 函数 URL 的 `/docs` 路由中找到端点的交互式文档。

如果您在运行`modal serve`时编辑代码，应用程序将自动重新部署，这有助于快速迭代您的应用程序。

准备好部署到生产环境后，请使用 `modal deploy`。