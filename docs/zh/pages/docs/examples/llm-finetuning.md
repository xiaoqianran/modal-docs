<!-- modal-docs: machine-translated zh-CN from English source -->

# DoppelBot：微调法学硕士来取代你的首席执行官

*（快速链接：
[添加到您自己的Slack](https://github.com/modal-labs/doppel-bot#usage);
[源代码](https://github.com/modal-labs/doppel-bot))*

在 Modal 内部，我们花了很多时间在 Slack 上互相交谈。
现在，随着开源大型语言模型的出现，我们开始
想知道这一切是不是有点多余。我们可以有这些语言吗
在 Slack 上为我们建立自行车棚模型，这样我们就可以把时间花在更高的杠杆上
活动，例如
[大溪地桨板冲浪](https://x.com/modal/status/1642262543757352960)
相反？

为了测试这一点，我们进行了微调
[骆驼 3.1](https://ai.meta.com/blog/meta-llama-3-1/) 上
[Erik](https://twitter.com/bernhardsson) 的 Slack 消息，`@erik-bot` 是出生。

![erik-bot](https://modal-cdn.com/erik-bot-1.jpeg)

从那时起，`@erik-bot` 就成为我们的宝贵资产，涉及领域包括：
从[API设计](https://modal-cdn.com/erik-bot-2.png)到
[法律建议](https://modal-cdn.com/erik-bot-3.png)思想领导力。

![erik-bot-3](https://modal-cdn.com/erik-bot-4.png)

我们原本计划向全世界发布`@erik-bot`的权重，但是所有
自从我们
把他推出...

所以，我们正在发布下一个最好的东西。 `DoppelBot` 是一个 Slack 机器人，您可以
可以安装在您自己的工作区中，并根据您自己的 Slack 消息进行微调。
按照[此处](https://github.com/modal-labs/doppel-bot#usage)的说明进行操作
今天用法学硕士取代你自己的首席执行官。
所有组件——抓取、微调、推理和松弛事件处理程序都运行
在 Modal 上，并且代码本身是开源的并且可用
[这里](https://github.com/modal-labs/doppel-bot)。如果您是 Modal 新手，那么
值得重申的是，**所有这些组件也是无服务器且可扩展的
为零**。这意味着您可以部署并忘记它们，因为您将
仅在使用您的应用程序时支付计算费用！

## 它是如何工作的

DoppelBot 使用 Slack SDK 从 Slack 工作区中抓取消息，并且
将它们转换为提示/响应对。它使用这些来微调语言
使用[低秩适应（LoRA）]（https://arxiv.org/abs/2106.09685）的模型，a
产生可以与基本模型合并的小型适配器的技术
当需要时，而不是修改基础模型中的所有参数。的
为每个用户微调的适配器存储在 Modal 中
[卷](/docs/guide/volumes)。当用户`@`是机器人时，
Slack 向 Modal 发送 Webhook 调用，后者加载该用户的适配器并
生成响应。

我们将详细介绍下面的每个步骤，并提供命令
单独运行它们中的每一个。跟随，
[克隆存储库](https://github.com/modal-labs/doppel-bot) 和
[设置 Slack 代币](https://github.com/modal-labs/doppel-bot#create-a-slack-app)
为了你自己。
### 消除松弛

<GuideGithubLink url="https://github.com/modal-labs/doppel-bot/blob/main/src/scrape.py" />

抓取工具使用 Modal 的 [`.map()`](/docs/guide/scale#scaling-out) 来获取
来自所有公共渠道的消息并行。每个线程被分成
来自目标用户的连续消息和来自其他用户的连续消息
用户。这些将按照以下格式作为提示输入到模型中：

```
[system]: You are {user}, employee at a fast-growing startup. Below is an input conversation that takes place in the company's internal Slack. Write a response that appropriately continues the conversation.

[user]: <slack thread>

[assistant]: <target user's response>
```

模型的初始版本容易产生简短的响应
——这并不奇怪，因为 Slack 的大部分沟通都非常简洁。
为目标用户的消息添加最小字符长度解决了这个问题。

如果您在家中进行操作，则可以使用以下命令运行抓取工具
命令：

```bash
modal run -m src.scrape::scrape --user="<user>"
```

抓取的结果存储在模态中
[Volume](/docs/guide/volumes)，以便下一步可以使用它们。

### 微调

<GuideGithubLink url="https://github.com/modal-labs/doppel-bot/blob/main/src/finetune.py" />

接下来，我们使用提示来微调语言模型。我们选择了
[Llama 3.1](https://ai.meta.com/blog/meta-llama-3-1/) 因为其许可许可和相对于其小尺寸的高质量。微调是
使用[低阶适应（LoRA）]（https://arxiv.org/abs/2106.09685）完成，
[参数高效微调](https://huggingface.co/blog/peft)技术
生成一个小型适配器，可以在需要时与基本模型合并
（我们使用的等级约为 60MB）。
我们的微调实现使用 [torchtune](https://github.com/pytorch/torchtune)，这是一个新的 PyTorch 库，可轻松配置微调运行。

由于我们使用的样本量通常较小，因此需要进行训练
超过几百步（我们的批量大小为 128）很快就会导致
过度拟合。诚然，我们还没有彻底评估超参数
空间尚未 - 如果您有兴趣就此进行合作，请联系我们！

![train-loss](../../assets/docs/train-loss.png)

要亲自尝试此步骤，请运行：

```bash
modal run -m src.finetune --user="<user>"
```

### 推论

<GuideGithubLink url="https://github.com/modal-labs/doppel-bot/blob/main/src/inference.py" />我们使用 [vLLM](https://github.com/vllm-project/vllm) 作为推理引擎，它现在支持动态交换 LoRA 适配器[开箱即用](https://docs.vllm.ai/en/latest/features/lora.html)。

通过参数化函数，每个用户模型都有自己的容器池
当有传入请求时会扩展，当有传入请求时会扩展为 0
没有。下面是精简到最基本的内容：

```python notest
@app.cls(gpu="L40S")
class Model():
    @modal.enter()
    def enter(self):
        self.engine = AsyncLLMEngine.from_engine_args(AsyncEngineArgs(...))
        self.loras: dict[str, int] = dict()  # per replica LoRA identifier

    @modal.method()
    def generate(self, input: str):
        if (ident := f"{user}-{team_id}") not in self.loras:
            self.loras[ident] = len(self.loras) + 1

        lora_request = LoRARequest(
            ident, self.loras[ident], lora_local_path=checkpoint_path
        )

        tokenizer = await self.engine.get_tokenizer(lora_request=lora_request)

        prompt = tokenizer.apply_chat_template(
            conversation=inpt, tokenize=False, add_generation_prompt=True
        )

        results_generator = self.engine.generate(prompt, lora_request=lora_request,)
```

如果您已经在上一步中微调了模型，则可以运行推理
现在使用它：

```bash
modal run -m src.inference --user="<user>"
```

（我们在文件中有一个示例输入列表，但您也可以尝试使用
你自己的消息！）

### Slack 机器人

<GuideGithubLink url="https://github.com/modal-labs/doppel-bot/blob/main/src/bot.py" />

最后，这一切都集中在
[`bot.py`](https://github.com/modal-labs/doppel-bot/blob/main/src/bot.py)。作为
您可能已经猜到，Slack 中的所有事件均由无服务器 Modal 处理
功能。我们处理 3 种类型的事件：

* [`url_verification`](https://github.com/modal-labs/doppel-bot/blob/24609583c43c0e722f56f85a1c00bb55b46c7754/src/bot.py#L112):
  为了验证这是一个 Slack 应用程序，Slack 希望我们返回一个质询
  字符串。
* [`app_mention`](https://github.com/modal-labs/doppel-bot/blob/main/src/bot.py#L118):
  当频道中提到机器人时，我们会从以下位置检索最近的消息
  该线程，进行一些基本的清理并调用用户的模型来生成
  回应。

```python notest
model = OpenLlamaModel.remote(user, team_id)
result = model.generate(messages)
```

* [`doppel`斜线命令](https://github.com/modal-labs/doppel-bot/blob/main/src/bot.py#L182):
  此命令为用户启动抓取 -> 微调管道。

要完整部署 slackbot，您需要运行：

```shell
modal deploy -m src.bot
```<div>

### 多工作空间支持

</div>

到目前为止，我们讨论的所有内容都是针对单一工作区 Slack 应用程序的。至
使其适用于多个工作区，我们需要处理
[工作区安装和OAuth身份验证](https://api.slack.com/authentication/oauth-v2),
并为每个工作区存储一些状态。

幸运的是，Slack 的 [Bolt](https://slack.dev/bolt-python/concepts) 框架
提供完整的（但记录简洁的）OAuth 实现。一个简洁的功能
OAuth 状态可以由文件系统支持，所以我们需要做的就是
[点螺栓](https://github.com/modal-labs/doppel-bot/blob/24609583c43c0e722f56f85a1c00bb55b46c7754/src/bot.py#L78)
在模态 [Volume](/docs/guide/volumes)，然后我们不需要担心
我们自己管理这个状态。

为了存储每个工作区的状态，我们使用 [Neon](https://neon.tech/)，一个
无服务器 Postgres 数据库非常容易设置并且*正常工作*。如果
您有兴趣开发多工作空间应用程序，
[按照我们的指示](https://github.com/modal-labs/doppel-bot#optional-multi-workspace-app)
关于如何使用 Modal 设置 Neon。

## 后续步骤

如果您已经做到了这一步，那么您刚刚找到了一种提高团队能力的方法
生产力提高 10 倍！祝贺您度过了一个值得的假期！ 🎉

如果您有兴趣了解有关 Modal 的更多信息，请查看我们的 [文档](/docs)
和其他[示例](/示例)。