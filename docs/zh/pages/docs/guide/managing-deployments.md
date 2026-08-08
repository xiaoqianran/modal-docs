<!-- modal-docs: machine-translated zh-CN from English source -->

# 管理部署

使用 `modal run` 或 `modal serve` 迭代 Modal 后
代码，是时候部署了。模态部署创建并保留
应用程序及其对象，提供以下好处：

* 重复执行的应用程序功能将分组在部署下，
  帮助可观察性和使用情况跟踪。以编程方式触发大量
  短暂的应用程序运行可能会使您的 Web 和 CLI 界面变得混乱。
* 函数调用速度更快，因为部署的函数是持久的并且
  重用，而不是通过调用按需创建。了解如何触发部署
  功能于
  [调用已部署的函数](/docs/guide/trigger-deployed-functions)。
* [预定功能](/docs/guide/cron) 将继续单独安排
  您所做的任何本地迭代，并将在失败时通知您。
* [Web Functions](/docs/guide/webhooks) 在您关闭笔记本电脑时继续运行，
  并且它们的 URL 地址与部署名称匹配。

## 创建部署

部署是使用 [`modal deploy`](/docs/cli/latest/deploy) 命令创建的。

```
 % modal deploy -m whisper_pod_transcriber.main
✓ Initialized. View app page at https://modal.com/apps/ap-PYc2Tb7JrkskFUI8U5w0KG.
✓ Created objects.
├── 🔨 Created populate_podcast_metadata.
├── 🔨 Mounted /home/ubuntu/whisper_pod_transcriber at /root/whisper_pod_transcriber
├── 🔨 Created fastapi_app => https://modal-labs-whisper-pod-transcriber-fastapi-app.modal.run
├── 🔨 Mounted /home/ubuntu/whisper_pod_transcriber/whisper_frontend/dist at /assets
├── 🔨 Created search_podcast.
├── 🔨 Created refresh_index.
├── 🔨 Created transcribe_segment.
├── 🔨 Created transcribe_episode..
└── 🔨 Created fetch_episodes.
✓ App deployed! 🎉

View Deployment: https://modal.com/apps/modal-labs/whisper-pod-transcriber
```

在现有部署上运行此命令将重新部署应用程序，
增加其版本。有关实时部署的应用程序如何过渡的详细信息
在版本之间，请参阅[更新部署](#updating-deployments) 部分。

还可以使用以下命令以编程方式创建部署
Modal 的 Python SDK 中的 [`app.deploy()`](/docs/sdk/py/latest/App#deploy) 方法。

## 查看部署

可以在 [web UI](/apps) 中应用程序的“部署历史记录”中查看部署
页面，或从命令行使用
[`modal app list`](/docs/cli/latest/app#modal-app-list) 命令。

### 图表上的部署事件

您可以通过启用在函数的指标图表上覆盖部署历史信息
**显示部署** 切换。每个标记代表一个或多个部署
在一个时间段内发生的事情。

将鼠标悬停在标记上会显示每个部署的版本号和时间戳，以及完整“部署历史记录”页面的链接。

![指标图表上的部署历史记录](https://modal-cdn.com/cdnbot/deployment-historyt991cvw__b284b7fa.webp)

## 更新部署

部署可以创建新的应用程序或重新部署现有的已部署应用程序
一个新版本。了解 Modal 如何处理之间的转换很有用
重新部署应用程序时的版本。总的来说，Modal 旨在支持
通过逐步将流量过渡到新版本来实现零停机部署，
但也可以选择版本之间的急剧切换。

如果部署涉及构建应用程序使用的映像的新版本，
构建过程需要在任何新容器之前成功完成
已开始。现有版本的应用程序将继续处理输入
这段时间。构建过程中出现错误将中止部署，且不会出现任何错误
更改应用程序的状态。

### 部署策略

构建完成后，Modal 将开始运行新的容器
该应用程序的最新版本。确切的机制取决于选择
部署策略，配置为`--strategy`
[`modal deploy`](/docs/cli/latest/deploy) CLI 或 `strategy=` 在
[`app.deploy()`](/docs/sdk/py/latest/App#deploy) 方法。

使用默认的`rolling`策略，现有容器将继续处理
输入（使用应用程序的先前版本），直到新容器完成
完成了冷启动。流量将转移到这些新的集装箱
它们上线，但旧容器在完成之前不会关闭
处理分配给他们的任何输入。
通过选择加入`recreate`策略，版本之间的转换将是
更突然。新版本发布后现有容器将被终止
处于活动状态，输入将排队直到新容器上线（包括
在旧容器上运行的输入，将在新容器上重试）。

`rolling` 策略可避免停机，推荐用于任何生产
应用程序。 `recreate` 策略主要在开发过程中有用，因为
您可以确定新容器将用于之后发送的任何输入
部署命令返回。

## 无操作部署和翻转

应用程序是部署单元。如果应用程序配置中没有任何内容
更改后，部署命令将变为无操作，并且 App 版本将不会
增量。但是，对任何函数的更改都会导致所有函数更新。

可以循环为应用程序提供服务的容器，而无需对应用程序进行任何更改
使用 [`modal app 进行代码或配置
rollover`](/docs/cli/latest/app#modal-app-rollover) 命令。这可能是
如果应用程序依赖于 Secret 或其他外部资源，则这是必要的
在容器启动时加载并已失效。翻转事件将
作为新版本出现在部署历史记录中。与正常部署一样，
可以使用 `rolling` 或 `recreate` 策略执行展期。

## 部署回滚

<Callout variant="gated-feature">
<a href="/pricing">团队和企业计划</a>提供部署回滚。访问<a href="/settings/plans">工作空间设置</a>进行升级。
</Callout>

快速将应用程序重置回以前的版本（例如，如果您发现某个应用程序
新版本有严重缺陷），您可以执行部署*回滚*。
可以从应用程序仪表板中的“部署历史记录”选项卡触发回滚
或使用 [`modal app rollback`](/docs/cli/latest/app#modal-app-rollback)
命令行界面。回滚部署看起来像新部署：它们增加版本
编号并归因于触发回滚的用户。但该应用程序的
功能和元数据将独立重置为之前的状态
您当前的应用程序代码库。

## 停止部署

可以通过单击 Web UI 中的红色“停止应用程序”按钮来停止已部署的应用程序
应用程序的“概述”页面，或者使用命令行
[`modal app stop`](/docs/cli/latest/app#modal-app-stop) 命令。

停止应用程序是一种破坏性行为。应用程序无法从此状态重新启动；
需要从相同的源文件部署新的应用程序。关联对象
停止部署最终将被垃圾收集。