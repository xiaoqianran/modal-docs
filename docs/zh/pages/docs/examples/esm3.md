<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 ESM3、Molstar 和 Gradio 构建蛋白质折叠仪表板

![ESM3 蛋白质折叠的仪表板 UI 图片](https://modal-cdn.com/example-esm3-ui.png)

地球上可能有千万亿种不同的蛋白质，
每一件都是经过艰苦进化发现的纳米技术奇迹。
我们知道近十亿种氨基酸序列，但我们只知道
知道几十万的三维结构，
通过 X 射线晶体学等缓慢、困难的观察方法收集。
建立在这些数据之上的是机器学习模型，例如
EvolutionaryScale 的 [ESM3](https://www.evolutionaryscale.ai/blog/esm3-release)
可以在几秒钟内预测任何序列的结构。

在此示例中，我们将展示如何使用 Modal 来不
只需运行最新的蛋白质折叠模型，还可以围绕它构建工具
您和您的科学家团队了解并分析结果。

## 基本设置

```python
import base64
import io
from pathlib import Path
from typing import Optional

import modal

MINUTES = 60  # seconds

app = modal.App("example-esm3")

```

### 创建一个Volume来存储ESM3模型权重和Entrez序列数据

为了最大限度地减少冷启动时间，我们将 ESM3 模型权重存储在 Modal 上
[体积](https://modal.com/docs/guide/volumes)。
有关在 Modal 上存储模型权重的模式和最佳实践，请参阅
[本指南](https://modal.com/docs/guide/model-weights)。
我们将使用相同的分布式存储原语来存储序列数据。

```python
volume = modal.Volume.from_name("example-esm3", create_if_missing=True)
VOLUME_PATH = Path("/vol")
MODELS_PATH = VOLUME_PATH / "models"
DATA_PATH = VOLUME_PATH / "data"

```
### 定义容器镜像中的依赖关系

用于结构推理的容器镜像基于Modal默认的slim Debian
Linux 镜像包含 `esm` 用于加载和运行模型，`gemmi` 用于
管理蛋白质结构文件转换并设置环境变量
用于更快地从 Hugging Face 下载模型权重。

```python
esm3_image = (
    modal.Image.debian_slim(python_version="3.11")
    .uv_pip_install(
        "esm==3.1.1",
        "torch==2.4.1",
        "gemmi==0.7.0",
        "huggingface-hub==0.36.0",
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1", "HF_HOME": str(MODELS_PATH)})
)

```

我们还将定义一个具有不同依赖项的单独图像，
对于我们应用程序中托管仪表板的部分。
这有助于降低Python依赖管理的复杂性
通过“隔离”不同的部分，例如分离
依赖于挑剔的 ML 包的函数
远离那些依赖于迂腐的网络包的人。
依赖项包括用于在 Python 中构建 Web UI 的 `gradio` 以及
`biotite` 用于从 UniProt 登录号中提取序列。

您可以阅读有关如何在 Modal 上配置容器映像的更多信息：
[本指南](https://modal.com/docs/guide/images)。

```python
web_app_image = (
    modal.Image.debian_slim(python_version="3.11")
    .uv_pip_install("gradio~=4.44.0", "biotite==0.41.2", "fastapi[standard]==0.115.4")
    .add_local_dir(Path(__file__).parent / "frontend", remote_path="/assets")
)


```

在这里，我们“预导入”我们运行的函数将使用的库
使用 `with image.imports` 上下文管理器在给定图像中的模态上。

```python
with esm3_image.imports():
    import tempfile

    import gemmi
    import torch
    from esm.models.esm3 import ESM3
    from esm.sdk.api import ESMProtein, GenerationConfig

with web_app_image.imports():
    import biotite.database.entrez as entrez
    import biotite.sequence.io.fasta as fasta
    from fastapi import FastAPI

```

## 为ESM3定义一个`Model`推理类

接下来，我们将模型的设置和推理代码映射到 Modal 上。
1.对于只需要运行一次的设置代码，我们将其放在一个方法中
   用 `@enter` 装饰，它在容器启动时运行。欲了解详情，
   请参阅[本指南](https://modal.com/docs/guide/cold-start)。
2. 其余的推理代码放在用`@method`修饰的方法中。
3. 我们使用 GPU（特别是 A10G）加速计算密集型推理。
   有关在 Modal 上使用 GPU 的更多信息，请参阅[本指南](https://modal.com/docs/guide/gpu)。

```python
@app.cls(
    image=esm3_image,
    volumes={VOLUME_PATH: volume},
    secrets=[modal.Secret.from_name("huggingface-secret")],
    gpu="A10G",
    timeout=20 * MINUTES,
)
class Model:
    @modal.enter()
    def enter(self):
        self.model = ESM3.from_pretrained("esm3_sm_open_v1")
        self.model.to("cuda")

        print("using half precision and tensor cores for fast ESM3 inference")
        self.model = self.model.half()
        torch.backends.cuda.matmul.allow_tf32 = True

        self.max_steps = 250
        print(f"setting max ESM steps to: {self.max_steps}")

    def convert_protein_to_MMCIF(self, esm_protein, output_path):
        structure = gemmi.read_pdb_string(esm_protein.to_pdb_string())
        doc = structure.make_mmcif_document()
        doc.write_file(str(output_path), gemmi.cif.WriteOptions())

    def get_generation_config(self, num_steps):
        return GenerationConfig(track="structure", num_steps=num_steps)

    @modal.method()
    def inference(self, sequence: str):
        num_steps = min(len(sequence), self.max_steps)

        print(f"running ESM3 inference with num_steps={num_steps}")
        esm_protein = self.model.generate(
            ESMProtein(sequence=sequence), self.get_generation_config(num_steps)
        )

        print("checking for errors in output")
        if hasattr(esm_protein, "error_msg"):
            raise ValueError(esm_protein.error_msg)

        print("converting ESMProtein into MMCIF file")
        save_path = Path(tempfile.mktemp() + ".mmcif")
        self.convert_protein_to_MMCIF(esm_protein, save_path)

        print("returning MMCIF bytes")
        return io.BytesIO(save_path.read_bytes())


```

## 将仪表板作为 `asgi_app` 提供服务

在本节中，我们将围绕 ESM3 模型创建一个 Web 界面
这可以帮助科学家和利益相关者理解和询问模型的结果。

您可以部署此 UI 以及支持推理端点，
使用以下命令：

```bash
modal deploy esm3.py
```

### 模态函数积分

我们的仪表板和推理后端之间的集成
Modal SDK 使这一切变得简单：
因为`Model`类的定义在同一个Python中可用
context 作为 Web UI 的定义，
我们可以实例化一个实例并使用`.remote`调用它的方法。

推理在包含所有 ESM3 的 GPU 加速容器中运行
依赖项，而此代码在仅包含 CPU 的容器中执行
仅包含我们的网络依赖项。

```python
def run_esm(sequence: str) -> str:
    sequence = sequence.strip()

    print("running ESM")
    mmcif_buffer = Model().inference.remote(sequence)

    print("converting mmCIF bytes to base64 for compatibility with HTML")
    mmcif_content = mmcif_buffer.read().decode()
    mmcif_base64 = base64.b64encode(mmcif_content.encode()).decode()

    return get_molstar_html(mmcif_base64)


```
### 使用 Gradio 在 Python 中构建 UI

我们将使用 [Mol\* ](https://molstar.org/) 可视化结果。
Mol\*（发音为“molstar”）是一个开源工具包，用于
可视化和分析大规模分子数据，包括二级结构
和蛋白质的残基特异性位置。

其次，我们将创建链接来查找已知的元数据和结构
使用[通用蛋白质资源](https://www.uniprot.org/)的蛋白质
来自 UniProt 联盟的数据库，该联盟得到了欧洲的支持
国家人类基因组研究所生物信息研究所
研究所和瑞士生物信息学研究所。尤尼普罗特
也是链接到许多其他数据库的中心，例如 RCSB Protein
数据库。

为了提取序列数据，我们将使用 [Biotite](https://www.biotite-python.org/)
用于从中提取 [FASTA](https://en.wikipedia.org/wiki/FASTA_format) 文件的库
UniProt 包含标记序列。

您应该在 `modal deploy` 的输出中看到此 UI 的 URL
或在您的[模态应用程序仪表板](https://modal.com/apps) 上查看此应用程序。

```python
@app.function(
    image=web_app_image,
    volumes={VOLUME_PATH: volume},
    max_containers=1,  # Gradio requires sticky sessions
)
@modal.concurrent(max_inputs=100)  # Gradio can handle many async inputs
@modal.asgi_app()
def ui():
    import gradio as gr
    from fastapi.responses import FileResponse
    from gradio.routes import mount_gradio_app

    web_app = FastAPI()

    # custom styles: an icon, a background, and some CSS
    @web_app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        return FileResponse("/assets/favicon.svg")

    @web_app.get("/assets/background.svg", include_in_schema=False)
    async def background():
        return FileResponse("/assets/background.svg")

    css = Path("/assets/index.css").read_text()

    theme = gr.themes.Default(
        primary_hue="green", secondary_hue="emerald", neutral_hue="neutral"
    )

    title = "Predict & Visualize Protein Structures"

    with gr.Blocks(theme=theme, css=css, title=title, js=always_dark()) as interface:
        gr.Markdown(f"# {title}")

        with gr.Row():
            with gr.Column():
                gr.Markdown("## Enter UniProt ID ")
                uniprot_num_box = gr.Textbox(
                    label="Enter UniProt ID or select one on the right",
                    placeholder="e.g. P02768, P69905,  etc.",
                )
                get_sequence_button = gr.Button(
                    "Retrieve Sequence from UniProt ID", variant="primary"
                )

                uniprot_link_button = gr.Button(value="View protein on UniProt website")
                uniprot_link_button.click(
                    fn=None,
                    inputs=uniprot_num_box,
                    js=get_js_for_uniprot_link(),
                )

            with gr.Column():
                example_uniprots = get_uniprot_examples()

                def extract_uniprot_num(example_idx):
                    uniprot = example_uniprots[example_idx]
                    return uniprot[uniprot.index("[") + 1 : uniprot.index("]")]

                gr.Markdown("## Example UniProt Accession Numbers")
                with gr.Row():
                    half_len = int(len(example_uniprots) / 2)
                    with gr.Column():
                        for i, uniprot in enumerate(example_uniprots[:half_len]):
                            btn = gr.Button(uniprot, variant="secondary")
                            btn.click(
                                fn=lambda j=i: extract_uniprot_num(j),
                                outputs=uniprot_num_box,
                            )

                    with gr.Column():
                        for i, uniprot in enumerate(example_uniprots[half_len:]):
                            btn = gr.Button(uniprot, variant="secondary")
                            btn.click(
                                fn=lambda j=i + half_len: extract_uniprot_num(j),
                                outputs=uniprot_num_box,
                            )

        gr.Markdown("## Enter Sequence")
        sequence_box = gr.Textbox(
            label="Enter a sequence or retrieve it from a UniProt ID",
            placeholder="e.g. MVTRLE..., PVTTIMHALL..., etc.",
        )
        get_sequence_button.click(
            fn=get_sequence, inputs=[uniprot_num_box], outputs=[sequence_box]
        )

        run_esm_button = gr.Button("Run ESM3 Folding", variant="primary")

        gr.Markdown("## ESM3 Predicted Structure")
        molstar_html = gr.HTML()

        run_esm_button.click(fn=run_esm, inputs=sequence_box, outputs=molstar_html)

    # return a FastAPI app for Modal to serve
    return mount_gradio_app(app=web_app, blocks=interface, path="/")


```

## 从命令行折叠

如果您想在没有Web界面的情况下快速运行ESM3模型，您可以
从命令行运行它，如下所示：

```shell
modal run esm3
```

这将在 Modal 上运行与上面相同的推理代码。结果是
返回到[晶体信息文件](https://en.wikipedia.org/wiki/Crystallographic_Information_File)
格式，您可以使用在线[Molstar Viewer](https://molstar.org/viewer/)进行渲染。

```python
@app.local_entrypoint()
def main(sequence: Optional[str] = None, output_dir: Optional[str] = None):
    if sequence is None:
        print("using sequence for insulin [P01308]")
        sequence = "MRTPMLLALLALATLCLAGRADAKPGDAESGKGAAFVSKQEGSEVVKRLRRYLDHWLGAPAPYPDPLEPKREVCELNPDCDELADHIGFQEAYRRFYGPV"

    if output_dir is None:
        output_dir = Path("/tmp/esm3")
        output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "output.mmcif"

    print("starting inference on Modal")
    results_buffer = Model().inference.remote(sequence)

    print(f"writing results to {output_path}")
    output_path.write_bytes(results_buffer.read())


```

## 附录

该代码的其余部分是样板文件。

### 从 UniProt 入藏号中提取序列

为了检索序列信息，我们将利用 `biotite` 库
将允许我们获取 [fasta](https://en.wikipedia.org/wiki/FASTA_format)
来自[国家生物技术信息中心（NCBI）Entrez 数据库]（https://www.ncbi.nlm.nih.gov/Web/Search/entrezfs.html）的序列文件。

```python
def get_sequence(uniprot_num: str) -> str:
    try:
        DATA_PATH.mkdir(parents=True, exist_ok=True)

        uniprot_num = uniprot_num.strip()
        fasta_path = DATA_PATH / f"{uniprot_num}.fasta"

        print(f"Fetching {fasta_path} from the entrez database")
        entrez.fetch_single_file(
            uniprot_num, fasta_path, db_name="protein", ret_type="fasta"
        )
        fasta_file = fasta.FastaFile.read(fasta_path)

        protein_sequence = fasta.get_sequence(fasta_file)
        return str(protein_sequence)

    except Exception as e:
        return f"Error: {e}"


```

### Gradio 应用程序的支持功能

以下Python代码用于增强Gradio应用程序，
主要是通过生成一些额外的 HTML 和 JS 并处理样式。

```python
def get_js_for_uniprot_link():
    url = "https://www.uniprot.org/uniprotkb/"
    end = "/entry#structure"
    return f"""(uni_id) => {{ if (!uni_id) return; window.open("{url}" + uni_id + "{end}"); }}"""


def get_molstar_html(mmcif_base64):
    return f"""
    <iframe
        id="molstar_frame"
        style="width: 100%; height: 600px; border: none;"
        srcdoc='
            <!DOCTYPE html>
            <html>
                <head>
                    <script src="https://cdn.jsdelivr.net/npm/@rcsb/rcsb-molstar/build/dist/viewer/rcsb-molstar.js"></script>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@rcsb/rcsb-molstar/build/dist/viewer/rcsb-molstar.css">
                </head>
                <body>
                    <div id="protein-viewer" style="width: 1200px; height: 400px; position: center"></div>
                    <script>
                        console.log("Initializing viewer...");
                        (async function() {{
                            // Create plugin instance
                            const viewer = new rcsbMolstar.Viewer("protein-viewer");

                            // CIF data in base64
                            const mmcifData = "{mmcif_base64}";

                            // Convert base64 to blob
                            const blob = new Blob(
                                [atob(mmcifData)],
                                {{ type: "text/plain" }}
                            );

                            // Create object URL
                            const url = URL.createObjectURL(blob);

                            try {{
                                // Load structure
                                await viewer.loadStructureFromUrl(url, "mmcif");
                            }} catch (error) {{
                                console.error("Error loading structure:", error);
                            }}
                      }})();
                    </script>
                </body>
            </html>
        '>
    </iframe>"""


def get_uniprot_examples():
    return [
        "Albumin [P02768]",
        "Insulin [P01308]",
        "Hemoglobin [P69905]",
        "Lysozyme [P61626]",
        "BRCA1 [P38398]",
        "Immunoglobulin [P01857]",
        "Actin [P60709]",
        "Ribonuclease [P07998]",
    ]


def always_dark():
    return """
    function refresh() {
        const url = new URL(window.location);

        if (url.searchParams.get('__theme') !== 'dark') {
            url.searchParams.set('__theme', 'dark');
            window.location.href = url.href;
        }
    }
    """

```