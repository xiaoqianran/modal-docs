<!-- modal-docs: machine-translated zh-CN from English source -->

# 在Modal上部署个性化音乐视频生成服务

音乐视频[酷](https://youtu.be/Cye-1RP5jso),
但除非你很有名或者
[付出很多钱](https://youtu.be/kfVsfOSbJY0),
你不能在其中担任主演。

到目前为止！

[回购](https://github.com/modal-labs/music-video-gen)
包含部署自定义所需的所有代码
[Modal](https://modal.com) 上的音乐视频生成器，
用于数据、ML 和 AI 应用程序的无服务器基础设施平台。

以下是由 Modal Developer Advocate 生成的示例视频
[`@charles_irl`](https://twitter.com/charles_irl)。

<center>
<video src="https://github.com/user-attachments/assets/5bd90898-7251-4298-808f-6d58ed4c6b6f" controls>
<track label="English" kind="captions" srclang="en" src="data:text/vtt;base64,V0VCVlRUCgowMDowMC4wMDAgLS0+IDAwOjMwLjAwMApNdXNpYyBwbGF5aW5nCg==">
</video>
</center>

因为莫代尔是
[通用无服务器基础设施](https://twitter.com/charles_irl/status/1819438860771663923),您可以随心所欲地定制这个自定义音乐视频生成器——
它只是代码和容器！

## 设置

在您选择的 Python 环境中，
运行`pip install modal`。

如果您在使用 Python 环境时遇到问题，
我们建议使用
[这个 Google Colab 笔记本](https://colab.research.google.com/github/modal-labs/music-video-gen/blob/main/notebooks/self_contained.ipynb),
我们已经为您设置了环境。
习惯在笔记本中运行终端命令需要一些工作
如果您以前没有这样做过，但 Python 设置可以工作并且在 Colab 中运行笔记本是免费的！
您所需要的只是一个 Google 帐户。

然后，如果您从未在您正在使用的计算机上使用过 Modal，
运行 `modal setup` 在 Modal 上创建一个帐户（如果您没有）
并设置身份验证。

## 数据准备

在`data/`内创建一个文件夹，与示例数据`data/sample`平行。
您可以将其命名为任何您想要的名称。

在该文件夹中放置至少四张您自己的图像 -
最好是八个或更多。
图片应采用 `.png` 或 `.jpg` 格式
每边大约 400 到 800 像素。
为了获得最佳效果，我们建议放置各种图像，
特别是当你穿着不同的衣服并做出不同的表情时，
并包括一些有其他人的图像。
但您现在也可以拍几张自己的照片！

（可选）在同一文件夹中的 `.txt` 文件中添加字幕。
它们应该看起来像
`"[trigger] smiling at the camera, outdoor scene, close-up, selfie"`。
有关更多示例图像标题对，请参阅示例数据。

## 培训

在 Modal 上启动 JupyterLab 服务器

```bash
modal run train_from_notebook.py
```

单击输出中显示的 `modal.host` URL
在浏览器中打开 Jupyter。

打开培训笔记本`training.ipynb`。

阅读笔记本并运行它，按照说明根据需要编辑单元格。

特别是，将数据集路径更改为您创建的文件夹 -
它已安装在笔记本运行的远程云机器上。

您也可以直接将数据上传到远程机器上的`/root/data`文件夹。
您甚至可以在 JupyterLab 内编辑字幕文件！
这些数据将在运行之间保留下来，您可以使用以下命令找到它

```bash
modal volume ls finetune-video-data
```

有关详细信息，请参阅 `modal volume` 及其子命令的帮助。

笔记本电脑将开始训练，这需要几分钟的时间。
记下您的训练运行的名称。
默认情况下，它是一个类似于 `38c67a92f6ce87882044ab53bf94cce0` 的哈希值，
但你可以在笔记本中自定义它。
这是你的`finetune-id`。如果你忘记了，你可以显示你所有的`finetune-id`
通过跑步

```bash
modal volume ls finetune-video-models
```

## 推论

通过运行以下命令来测试您的新微调模型：

```bash
modal run inference.py --finetune-id {your-finetune-id} --num-frames 15
```

您还可以提供`--prompt`来自定义生成。

您可以将视频生成器部署到 Modal 上：

```bash
modal deploy inference.py
```

Modal 是无服务器的，因此当它不提供任何流量时，这不会花费您任何费用。

## 音乐视频生成

部署推理端点后，
你可以通过运行生成一个由你自己主演的音乐视频

```bash
modal run music_video_generator.py --finetune-id {your-finetune-id}
```

使用默认设置，这将在大约五分钟内创建一个三十秒的视频
通过在七台 H100 上并行运行发电。
可以通过 `--mp3-file` 参数传递不同的歌曲来更改音乐。
默认是`data/coding-up-a-storm.mp3`中的Modal主题歌曲。
这首歌是和[Suno](https://suno.com)一起创作的，
音乐生成服务——在 Modal 上运行！
如果你也想DIY音乐制作，
参见[这个例子](https://modal.com/docs/examples/generate_music)
在模态文档中。

可以通过 `--prompt-file` 参数传递不同的提示列表来更改生成的剪辑。
默认是使用 OpenAI 的 GPT-4.5 系统创建的一组提示。
您可以自己编写或使用语言模型生成它们。
如果你想服务你自己的语言模型，
参见[此示例](https://modal.com/docs/examples/llm_inference)
在模态文档中。