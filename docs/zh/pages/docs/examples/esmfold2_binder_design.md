<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 ESMFold2 和 ESMC 大规模设计蛋白质结合剂

蛋白质折叠是计算生物学的里程碑式突破。
但对于许多应用来说，我们不仅仅想预测现有蛋白质的结构——
我们想要设计能够调节生物学的新蛋白质。

最重要的方法之一是通过绑定。
蛋白质-蛋白质相互作用驱动许多生物功能，
以及设计结合特定目标的分子的能力
打开了新研究工具和治疗方法的大门。
最近的人工智能方法通过反转来解决活页夹设计问题
通过迭代优化过程的结构预测模型：

1. 将候选结合物与目标蛋白折叠在一起。
2. 根据活页夹折叠和粘合的程度对所得结构进行评分。
3. 在序列空间中采取提高分数的步骤。
4. 重复。

在此示例中，我们将演示如何在 Modal 上实现此过程
使用 [ESMFold2 和 ESMC](https://biohub.ai/esm/protein/about)，最先进的模型
在[Biohub](https://biohub.ai/)开发，可以预测生物分子复合物的结构。
看看他们的[技术报告](https://modal-cdn.com/esmfold2_tech_report.pdf)
了解模型是如何开发并用于设计和实验验证针对治疗相关靶标的粘合剂。

我们将从构建一个设计单个活页夹的模态函数开始；然后只用
再写几行代码，我们将编写一个协调器函数
它执行由 Modal 的自动缩放基础设施和全局 GPU 容量支持的大规模搜索。

## 设置

```python
from pathlib import Path
from typing import Optional

import modal

MINUTES = 60  # seconds
HOURS = 60 * MINUTES

app = modal.App(
    name="example-esmfold2-binder-design",
)

```

## 定义我们的模态图像

我们将使用 `Image.micromamba` 作为我们的基础镜像，因为我们需要一些包
只能通过 Conda 获得。我们还将安装 [`esm`](https://github.com/Biohub/esm)
来自 CZ Biohub 的库（它引入了 `transformers` 的自定义分支）和其他一些有用的库
用于处理蛋白质序列。

我们设置`CUBLAS_WORKSPACE_CONFIG`，它允许我们通过调用来确保再现性
`torch.use_deterministic_algorithms(True)`位于我们远程代码的顶部。

```python
ESM_REVISION = (
    "f652b471d29da828b31e9b7a9cf7d0a7803240f5"  # see https://github.com/Biohub/esm
)

image = (
    modal.Image.micromamba(python_version="3.12")
    .run_commands("apt update && apt install -y git build-essential")
    .micromamba_install(
        "anarci=2024.05.21-0",
        channels=["conda-forge", "bioconda"],
    )
    .uv_pip_install(
        f"esm @ git+https://github.com/Biohub/esm.git@{ESM_REVISION}",
        "abnumber==0.4.4",
        "pyarrow==18.1.0",
    )
    .env(
        {
            "HF_HOME": "/models",
            "HF_XET_HIGH_PERFORMANCE": "1",  # speed up Hugging Face downloads
            "XFORMERS_IGNORE_FLASH_VERSION_CHECK": "1",
            # required for torch.use_deterministic_algorithms(True)
            "CUBLAS_WORKSPACE_CONFIG": ":4096:8",
        }
    )
)

```

## 在模态体积上缓存权重和持久结果

ESMFold2 基于 6B 参数 ESMC 编码器构建；与四个人一起
用于最终评分的批评模型，模型权重约为 50 GB。
我们将它们缓存在[模态卷](https://modal.com/docs/guide/volumes)
与重新下载相比，它在冷启动时提供更好的性能
每次都来自《拥抱的脸》。

```python
models_volume = modal.Volume.from_name("esmfold2-models", create_if_missing=True)
models_dir = Path("/models")

```
第二卷将存储我们的结果。

```python
results_volume = modal.Volume.from_name(
    "esmfold2-binder-design-results", create_if_missing=True
)
results_dir = Path("/results")


```

## 在 Modal 上设计活页夹

为了在 Modal 上运行活页夹设计，我们定义了一个 `BinderDesignService` 类并
用 `@app.cls` 装饰器包裹它。装饰器接受的参数是
描述我们的代码所需的基础设施：我们的图像和两个卷
定义，加上一个 H100 GPU，它有足够的内存用于 6B 参数 ESMC 编码器和
四个 ESMFold2“英雄”评论家模型。

在类内部，[`@modal.enter()`生命周期钩子](https://modal.com/docs/guide/lifecycle-functions#modalenter)
每个容器启动时下载并初始化这些模型一次，因此后续`design` 调用同一个容器重复使用装载的重量。

我们用 `@modal.method()` 装饰我们的 `design` 方法以启用远程
执行。我们会看到它被称为via `.remote()`（单一设计）和via
`.spawn()` + [`modal.FunctionCall.gather`](https://modal.com/docs/reference/modal.FunctionCall)
（平行扫描）进一步如下。类本身是一个薄薄的包装
[`ESMFold2Designer`](https://github.com/modal-labs/modal-examples/blob/main/06_gpu_and_ml/binder-design/binder_design/models.py)
来自帮助程序包，它处理实际的模型加载和
梯度引导优化循环（`design_binder` in
[`binder_design.design`](https://github.com/modal-labs/modal-examples/blob/main/06_gpu_and_ml/binder-design/binder_design/design.py))。

```python
@app.cls(
    image=image,
    volumes={models_dir: models_volume},
    gpu="H100",
    timeout=1 * HOURS,
)
class BinderDesignService:
    """Modal entry point for ESMFold2-driven binder design.

    Set ``use_scaling_critics=True`` to also load the 15-checkpoint
    scaling-experiment ensemble (distogram binding confidence only).
    """

    use_scaling_critics: bool = modal.parameter(default=False)

    @modal.enter()
    def load(self):
        from .binder_design import ESMFold2Designer

        self._designer = ESMFold2Designer()
        self._designer.load(self.use_scaling_critics)

    @modal.method()
    def design(
        self,
        target_name: Optional[str] = None,
        target_sequence: Optional[str] = None,
        binder_name: Optional[str] = None,
        binder_sequence: Optional[str] = None,
        is_antibody: Optional[bool] = None,
        seed: int = 0,
        batch_size: int = 1,
    ):
        return self._designer.design(
            target_name=target_name,
            target_sequence=target_sequence,
            binder_name=binder_name,
            binder_sequence=binder_sequence,
            is_antibody=is_antibody,
            seed=seed,
            batch_size=batch_size,
        )


```

## 通过选择扇形扫描

单次设计运行为每个批次槽提供一个候选者。为了恢复
论文中报道的命中率，你需要很多种子，几个活页夹
模板和几个目标，然后是对设计进行排名的选择过程
ipTM / distogram-ipTM-proxy 综合评分。

我们从模态函数内部进行编排，因此您不必担心
在本地保持长时间运行的进程处于活动状态或安装任何本地依赖项。

```python
@app.function(
    image=image,
    volumes={results_dir: results_volume},
    gpu="H100",
    timeout=2 * HOURS,
)
def run_sweep(
    line_sweeps: dict[str, list],
    use_scaling_critics: bool = False,
    save_filename: str = "selection.parquet",
) -> bytes:
    """Fan a grid sweep across GPUs, gather results, select top designs, ave results + return parquet."""
    import io

    from .binder_design.sweep import expand_sweep, select_designs

    designer = BinderDesignService(use_scaling_critics=use_scaling_critics)
    configs = expand_sweep(line_sweeps)

    print(f"🧬 spawning {len(configs)} design jobs")
    calls = [designer.design.spawn(**cfg) for cfg in configs]
    raw_results = modal.FunctionCall.gather(*calls)

    df_select = select_designs(configs, raw_results)

    buf = io.BytesIO()
    df_select.to_parquet(buf, index=False)
    parquet_bytes = buf.getvalue()

    save_path = results_dir / save_filename
    save_path.write_bytes(parquet_bytes)
    results_volume.commit()
    print(f"🧬 saved {len(df_select)} selected designs to volume:{save_path}")

    return parquet_bytes


```

## 从命令行

`main` 运行单一设计。覆盖
`target_name` / `binder_name` 尝试其中一种
[捆绑目标](https://github.com/modal-labs/modal-examples/blob/main/06_gpu_and_ml/binder-design/binder_design/prompts.py)
（`cd45`、`ctla4`、`egfr`、`pd-l1`、`pdgfr`）和活页夹模板
（`minibinder`、`trastuzumab_framework_vhvl`、`atezolizumab_framework_vhvl`、
`ocankitug_framework_vhvl`)，或者传递任意的`target_sequence` /直接`binder_sequence`。

```shell
modal run -m 06_gpu_and_ml.binder-design.esmfold2_binder_design::main \
    --target-name pd-l1 --binder-name minibinder
```

```python
@app.local_entrypoint()
def main(
    target_name: Optional[str] = "pd-l1",
    target_sequence: Optional[str] = None,
    binder_name: Optional[str] = "minibinder",
    binder_sequence: Optional[str] = None,
    is_antibody: Optional[bool] = None,
    use_scaling_critics: bool = False,
    seed: int = 0,
    batch_size: int = 1,
):
    designer = BinderDesignService(use_scaling_critics=use_scaling_critics)
    seq, trajectory, results = designer.design.remote(
        target_name=target_name,
        target_sequence=target_sequence,
        binder_name=binder_name,
        binder_sequence=binder_sequence,
        is_antibody=is_antibody,
        seed=seed,
        batch_size=batch_size,
    )

    avg_final_loss = sum(r["final_loss"] for r in results) / len(results)
    print(f"🧬 designed sequence: {seq}")
    print(f"🧬 trajectory length: {len(trajectory)} steps")
    print(f"🧬 average final loss: {avg_final_loss:.4f}")


```

`sweep` 对每个 `(target, binder, seed)` 组合进行网格扫描
您传入的目标和活页夹的数量，使用 Modal 水平缩放设计
[异步作业处理](https://modal.com/docs/guide/job-queue)。
选择过程在服务器端运行，生成的镶木地板为
写入`esmfold2-binder-design-results`卷和本地
归档以供检查。

`target_names` 和 `binder_names` 作为逗号分隔的字符串传递。
默认设置将一个目标扫过两种活页夹模式 - `minibinder`
和`trastuzumab_framework_vhvl`抗体模板——所以一个
命令同时散布到两者上：

```shell
modal run -m 06_gpu_and_ml.binder-design.esmfold2_binder_design::sweep \
    --target-names pd-l1,ctla4 \
    --binder-names minibinder,trastuzumab_framework_vhvl \
    --n-seeds 8
```

```python
@app.local_entrypoint()
def sweep(
    target_names: str = "pd-l1",
    binder_names: str = "minibinder,trastuzumab_framework_vhvl",
    use_scaling_critics: bool = False,
    n_seeds: int = 8,
    output_path: Optional[str] = None,
):
    target_name_list = [
        name.strip() for name in target_names.split(",") if name.strip()
    ]
    binder_name_list = [
        name.strip() for name in binder_names.split(",") if name.strip()
    ]

    line_sweeps = {
        "target_name": target_name_list,
        "target_sequence": [None],
        "binder_name": binder_name_list,
        "binder_sequence": [None],
        "seed": list(range(n_seeds)),
        "batch_size": [1],
    }

    print(
        f"🧬 launching sweep: targets={target_name_list}, binders={binder_name_list}, "
        f"n_seeds={n_seeds}, use_scaling_critics={use_scaling_critics}"
    )
    parquet_bytes = run_sweep.remote(
        line_sweeps, use_scaling_critics=use_scaling_critics
    )

    if output_path is None:
        output_path = Path("/tmp") / "esmfold2_binder_design" / "selection.parquet"
    else:
        output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(parquet_bytes)
    print(f"🧬 wrote selection parquet to {output_path}")

```