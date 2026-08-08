<!-- modal-docs: machine-translated zh-CN from English source -->

# 冷启动性能

本指南页面详细介绍了用于提高冷启动性能的技术和模态功能。

## 什么是冷启动？

模态函数在[容器](/docs/guide/images)中运行。

如果容器已经准备好运行您的函数，它将被重用。

如果没有，Modal 会启动一个新容器。
这称为“冷启动”，
并且它通常与较高的延迟相关。

冷启动期间延迟增加的原因有两个：

1. 输入可能**花费更多时间在队列中等待**容器
   准备好或“温暖”。
2. 当刚启动的容器处理输入时，
   可能有**额外的工作只需要在第一次调用时完成**
   （“初始化”）。

如果您在没有热容器的情况下调用函数
或者如果您发现输入花费太多时间处于“待处理”状态，
你应该
[优化的目标排队时间](#reduce-time-spent-queueing-for-warm-containers)。

如果您发现某些函数调用比其他函数调用花费的时间长得多，
这些调用首先由新容器处理，
你应该
[优化目标初始化](#reduce-latency-from-initialization)。
## 减少排队等待热容器的时间

当没有足够的其他热容器来启动新容器时
处理当前的输入数量。

例如，第一次向函数发送输入时，
有零个热容器并且有一个输入，
因此必须启动单个容器。
输入的总延迟将包括
启动容器所需的时间。

如果您在第一个输入完成后立即发送另一个输入，
将有一个温暖的容器和一个待处理的输入，
并且不会启动任何新容器。

概括而言，有两个因素会影响输入排队的时间：
容器启动并变热所需的时间（我们通过更快启动来解决这个问题）
以及直到有热容器可用于处理输入的时间（我们通过使用更多热容器来解决这个问题）。

### 更快地预热容器

容器变热所需的时间
准备输入的时间范围可以从几秒到几分钟不等。

Modal 的自定义容器堆栈已经过大量优化，以减少这个时间。
您可以[此处](https://modal.com/blog/jono-containers-talk)了解我们的一些优化。
容器在大约一秒内启动。
但在容器被认为是温暖的并准备好处理输入之前，
我们需要在代码的全局范围内执行任何逻辑（例如导入）
或在任何
[`modal.enter` 方法](/docs/guide/lifecycle-functions)。
因此，如果您的启动速度很慢，这些是首先要进行优化的地方。

例如，您可能正在从模型服务器下载大型模型
在启动过程中。
你可以改为
[提前下载模型](/docs/guide/model-weights),
这样就只需要下载一次。

对于数十GB的型号，
这可以将启动时间从几分钟缩短到几秒钟。

### 运行更多热容器

并不总是能够充分加快启动速度。
例如，加载模型所增加的延迟数秒可能不会
在交互环境中是可以接受的。

在这种情况下，唯一的选择是运行更多的热容器。
这增加了输入由热容器处理的机会，
例如，在另一个容器启动时完成输入。

Modal 目前公开了[三个参数](/docs/guide/scale) 来控制如何
许多容器会是温暖的：`scaledown_window`，`min_containers`，
和`buffer_containers`。
所有这些策略都会增加您的函数消耗的资源
因此需要在冷启动延迟和成本之间进行权衡。

#### 使用 `scaledown_window` 使容器保温更长时间

模态容器在关闭之前将保持短暂空闲状态。由
默认情况下，最大空闲时间为 60 秒。您可以通过设置来配置它
[`@function`](/docs/sdk/py/latest/App#function) 上的 `scaledown_window`
装饰师。该值以秒为单位测量，可以设置为
两秒二十分钟。

```python
import modal

app = modal.App()

@app.function(scaledown_window=300)
def my_idle_greeting():
    return {"hello": "world"}
```

增加`scaledown_window`会减少后续请求的机会
需要冷启动，但您需要为使用的任何资源付费
当容器空闲时（例如，GPU 预留或剩余内存
占用）。请注意，容器不一定会一直保持活动状态
整个窗口，因为当
功能严重过剩。

#### 使用 `min_containers` 和 `buffer_containers` 过度配置资源

如果没有温暖的容器，将已经温暖的容器保存更长时间也无济于事
首先是容器，就像函数从零开始缩放一样。

要使某些容器始终保持温暖并运行，请设置 `min_containers`
[`@function`](/docs/sdk/py/latest/App#function) 装饰器上的值。这个
对容器数量设置下限，以便函数不会扩展
为零。 Modal 仍将扩展并缩减更多容器，因为
与往常一样，您的函数的需求波动在 `min_containers` 值之上。

当 `min_containers` 在函数空闲时过度配置容器时，
`buffer_containers` 在功能激活时提供额外的容器。
如果满足以下条件，则额外容器的“缓冲区”将空闲并准备好处理输入：
请求率增加。该参数对于以下情况特别有用
突发请求模式，其中一个输入的到达预示更多输入的到达，
就像新用户或客户开始使用该功能时一样。

```python
import modal

app = modal.App(image=modal.Image.debian_slim().pip_install("fastapi"))

@app.function(min_containers=3, buffer_containers=3)
def my_warm_greeting():
    return "Hello, world!"
```

## 减少初始化延迟

第一次调用函数时会完成一些工作
但可以在每次后续调用中使用。
这是
[*摊销工作*](https://www.cs.cornell.edu/courses/cs312/2006sp/lectures/lec18.html)
在初始化时完成。

例如，您可能正在使用大型预训练模型
第一次使用时需要将其权重从磁盘加载到内存。

这会导致第一次调用热容器的延迟更长，
这在应用程序中显示为偶尔缓慢的调用：高尾部延迟或升高的 p9X。

### 将初始化工作移出第一次调用

第一次调用时完成的一些工作可以提前完成。

任何可以保存到磁盘的工作，例如
[下载模型权重](/docs/guide/model-weights),
应尽早完成。结果可以包含在
[容器图像](/docs/guide/images)
或保存到
[模态卷](/docs/guide/volumes)。

有些工作很难序列化，例如启动网络连接或推理服务器。
如果您可以将此初始化逻辑移出函数体并移至全局范围或
[容器`enter`方法](https://modal.com/docs/guide/lifecycle-functions#enter),
你可以把这项工作移入热身期。
在所有 `enter` 方法完成之前，容器不会被认为是热的，
因此，不会将任何输入路由到尚未完成此初始化的容器。

有关如何将 `enter` 与机器学习模型权重结合使用的更多信息，请参阅
[本指南](/docs/guide/model-weights)。

请注意，`enter` 并没有消除延迟——
它只是将延迟移至预热期，
可以在哪里处理
[运行更多热容器](#run-more-warm-containers)。

### 使用内存快照在冷启动时共享初始化工作

使用 Modal 还可以加快冷启动速度
[内存快照](/docs/guide/memory-snapshots)。

第一个函数之后的调用
速度更快，部分原因是内存已经填充
具有其他需要计算或从磁盘读取的值，
就像导入库的内容一样。

内存快照捕获容器内存的状态
预热后在用户控制点
并在未来的启动中重用该状态，这可以大大提高
减少冷启动延迟惩罚和预热期持续时间。

请参阅[内存快照指南](/docs/guide/memory-snapshots)
了解详情。

### 优化初始化代码

有时，除了加快这项工作之外，别无他法。

在这里，我们分享优化初始化时出现的特定模式
在模态函数中。

#### 同时加载多个大文件

通常模态应用程序需要将大文件读入内存（例如模型
权重），然后才能处理输入。在可行的情况下这些大文件
读取应该同时发生，而不是顺序发生。并发IO占用
充分利用我们平台的高磁盘和网络带宽
以减少延迟。

缓慢顺序 IO 的一个常见示例是加载多个独立的
Huggingface `transformers` 系列型号。

```python notest
from transformers import CLIPProcessor, CLIPModel, BlipProcessor, BlipForConditionalGeneration
model_a = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor_a = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model_b = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
processor_b = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")
```

上面的代码片段按顺序执行了四个 `.from_pretrained` 加载。
没有一个组件依赖于另一个已加载到内存中的组件，因此它们
可以同时加载。

它们可以使用如下函数同时加载：

```python notest
from concurrent.futures import ThreadPoolExecutor, as_completed
from transformers import CLIPProcessor, CLIPModel, BlipProcessor, BlipForConditionalGeneration

def load_models_concurrently(load_functions_map: dict) -> dict:
    model_id_to_model = {}
    with ThreadPoolExecutor(max_workers=len(load_functions_map)) as executor:
        future_to_model_id = {
            executor.submit(load_fn): model_id
            for model_id, load_fn in load_functions_map.items()
        }
        for future in as_completed(future_to_model_id.keys()):
            model_id_to_model[future_to_model_id[future]] = future.result()
    return model_id_to_model

components = load_models_concurrently({
    "clip_model": lambda: CLIPModel.from_pretrained("openai/clip-vit-base-patch32"),
    "clip_processor": lambda: CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32"),
    "blip_model": lambda: BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large"),
    "blip_processor": lambda: BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")
})
```

如果对大文件读取执行并发 IO 不会加速您的冷处理速度
开始，函数代码的某些部分可能持有
Python [GIL](https://wiki.python.org/moin/GlobalInterpreterLock) 和减少
多线程执行器的功效。