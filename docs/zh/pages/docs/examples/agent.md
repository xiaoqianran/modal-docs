<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 Modal Sandboxes 和 LangGraph 构建编码代理

这个例子演示了如何构建一个可以生成和执行Python代码的LLM编码“代理”，使用
来自网络的文档来告知其方法。

当然，我们使用代理来生成运行语言模型的代码。

该代理是使用 [LangGraph](https://github.com/langchain-ai/langgraph) 构建的，这是一个用于构建的库
受人工智能代理开发人员欢迎的有向计算图，
并使用 OpenAI API 中的模型。

## 设置

```python
import modal

from .src import edges, nodes, retrieval
from .src.common import COLOR, PYTHON_VERSION, image

```

您将需要两个 [Modal Secrets](https://modal.com/docs/guide/secrets) 来运行此示例：一个用于访问 OpenAI API，另一个用于访问 LangSmith API 以记录代理的行为。

要创建它们，请前往[秘密仪表板](https://modal.com/secrets)，选择“创建新秘密”，
并使用为 OpenAI 和 LangSmith 提供的模板。

```python
app = modal.App(
    "example-agent",
    image=image,
    secrets=[
        modal.Secret.from_name("openai-secret", required_keys=["OPENAI_API_KEY"]),
        modal.Secret.from_name("langsmith-secret", required_keys=["LANGCHAIN_API_KEY"]),
    ],
)

```

## 创建沙箱

我们在模态[沙箱](https://modal.com/docs/guide/sandbox)中执行代理的代码，这使我们能够
在安全环境中运行任意代码。在此示例中，我们将使用 [`transformers`](https://huggingface.co/docs/transformers/index)
使用预训练模型生成文本的库。让我们创建一个具有必要依赖项的沙箱。

```python
def create_sandbox(app) -> modal.Sandbox:
    # Change this image (and the retrieval logic in the retrieval module)
    # if you want the agent to give coding advice on other libraries!
    agent_image = modal.Image.debian_slim(python_version=PYTHON_VERSION).uv_pip_install(
        "torch==2.5.0",
        "transformers==4.46.0",
    )

    return modal.Sandbox.create(
        image=agent_image,
        timeout=60 * 10,  # 10 minutes
        app=app,
        # Modal sandboxes support GPUs!
        gpu="T4",
        # you can also pass secrets here -- note that the main app's secrets are not shared
    )


```

我们还需要一种在沙箱中运行代码的方法。为此，我们将编写一个简单的包装器
围绕 Modal Sandbox `exec` 方法。我们使用`exec`，因为它允许我们运行代码而无需启动
新容器。我们可以在多次运行中重复使用同一个容器，从而保留状态。

```python
def run(code: str, sb: modal.Sandbox) -> tuple[str, str]:
    print(
        f"{COLOR['HEADER']}📦: Running in sandbox{COLOR['ENDC']}",
        f"{COLOR['GREEN']}{code}{COLOR['ENDC']}",
        sep="\n",
    )

    exc = sb.exec("python", "-c", code)
    exc.wait()

    stdout = exc.stdout.read()
    stderr = exc.stderr.read()

    if exc.returncode != 0:
        print(
            f"{COLOR['HEADER']}📦: Failed with exitcode {sb.returncode}{COLOR['ENDC']}"
        )

    return stdout, stderr


```

## 构建代理图

现在我们有了可以在其中执行代码的沙箱，我们可以构建代理的图。我们的图表是
在 `edges` 和 `nodes` 模块中定义
[与此示例相关](https://github.com/modal-labs/modal-examples/tree/main/13_sandboxes/codelangchain)。
节点是改变状态的动作。边是节点之间的过渡。

这个想法很简单：我们从节点`generate`开始，它调用LLM根据文档生成代码。
生成的代码作为称为 `check_code_execution` 的边缘的一部分执行（在沙箱中）
然后输出被传递到 LLM 进行评估（`evaluate_execution` 节点）。
如果 LLM 确定代码已正确执行——这可能意味着代码引发了异常！ --
我们沿着`decide_to_finish`边缘通过并完成。

```python
def construct_graph(sandbox: modal.Sandbox, debug: bool = False):
    from langgraph.graph import StateGraph

    from .src.common import GraphState

    # Crawl the transformers documentation to inform our code generation
    context = retrieval.retrieve_docs(debug=debug)

    graph = StateGraph(GraphState)

    # Attach our nodes to the graph
    graph_nodes = nodes.Nodes(context, sandbox, run, debug=debug)
    for key, value in graph_nodes.node_map.items():
        graph.add_node(key, value)

    # Construct the graph by adding edges
    graph = edges.enrich(graph)

    # Set the starting and ending nodes of the graph
    graph.set_entry_point(key="generate")
    graph.set_finish_point(key="finish")

    return graph


```

我们现在设置图表并编译它。详情请参见`src`模块
关于图表的内容和我们定义的节点。

```python
DEFAULT_QUESTION = "How do I generate Python code using a pre-trained model from the transformers library?"


@app.function()
def go(
    question: str = DEFAULT_QUESTION,
    debug: bool = False,
):
    """Compiles the Python code generation agent graph and runs it, returning the result."""
    sb = create_sandbox(app)

    graph = construct_graph(sb, debug=debug)
    runnable = graph.compile()
    result = runnable.invoke(
        {"keys": {"question": question, "iterations": 0}},
        config={"recursion_limit": 50},
    )

    sb.terminate()

    return result["keys"]["response"]


```

## 运行图表

现在让我们从命令行调用代理！
我们定义一个在本地运行并触发 Modal 执行的`local_entrypoint`。

您可以通过从包含 `codelangchain` 目录的文件夹中执行以下命令来调用它
[来自我们的示例存储库](https://github.com/modal-labs/modal-examples/tree/main/13_sandboxes/codelangchain)：

```bash
modal run -m codelangchain.agent --question "How do I run a pre-trained model from the transformers library?"
```

```python
@app.local_entrypoint()
def main(
    question: str = DEFAULT_QUESTION,
    debug: bool = False,
):
    """Sends a question to the Python code generation agent.

    Switch to debug mode for shorter context and smaller model."""
    if debug:
        if question == DEFAULT_QUESTION:
            question = "hi there, how are you?"

    print(go.remote(question, debug=debug))


```

如果一切正常，您应该看到如下输出：

```bash
$ modal run -m codelangchain.agent --question "generate some cool output with transformers"
---DECISION: FINISH---
---FINISHING---
To generate some cool output using transformers, we can use a pre-trained language model from the Hugging Face Transformers library. In this example, we'll use the GPT-2 model to generate text based on a given prompt. The GPT-2 model is a popular choice for text generation tasks due to its ability to produce coherent and contextually relevant text. We'll use the pipeline API from the Transformers library, which simplifies the process of using pre-trained models for various tasks, including text generation.

from transformers import pipeline
# Initialize the text generation pipeline with the GPT-2 model
generator = pipeline('text-generation', model='gpt2')

# Define a prompt for the model to generate text from
prompt = "Once upon a time in a land far, far away"

# Generate text using the model
output = generator(prompt, max_length=50, num_return_sequences=1)

# Print the generated text
print(output[0]['generated_text'])

Result of code execution:
Once upon a time in a land far, far away, and still inhabited even after all the human race, there would be one God: a perfect universal God who has always been and will ever be worshipped. All His acts and deeds are immutable,
```