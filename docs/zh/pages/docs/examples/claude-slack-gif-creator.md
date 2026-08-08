<!-- modal-docs: machine-translated zh-CN from English source -->

# 克劳德·斯莱克 GIF 创建者

<p align="center">
  <img src="https://modal-cdn.com/claude-slack-gif-creator/claude-pelican-bicycle.gif" alt="GIF of a pelican riding a bicycle" style="display:inline-block;">
  <img src="https://modal-cdn.com/claude-slack-gif-creator/agi-party.gif" alt="GIF of an AGI party" style="display:inline-block;">
  <img src="https://modal-cdn.com/claude-slack-gif-creator/gongy-ships.gif" alt="GIF of Gongy shipping" style="display:inline-block;">
</p>

[此仓库](https://github.com/modal-projects/claude-slack-gif-creator)
展示如何构建
由 Claude 支持的机器人，可创建自定义的 Slackmoji-ready GIF。

或者，以 GIF 形式：

![由 Claude 支持的机器人，可创建自定义 Slackmoji-ready GIF](https://modal-cdn.com/claude-slack-gif-creator/claude-gif-gif.gif)

该机器人在 [Modal](https://modal.com/) 上运行并使用 [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
使用[来自人类的`slack-gif-creator`技能](https://github.com/anthropics/skills/)。

## 特点

* **自然语言 GIF 生成**：描述您想要什么，Claude 将创建一个 128x128 表情符号优化的 GIF* **持久线程**：每个 Slack 线程都会创建一个对话上下文，并持久保存在 Modal 上
* **图像上传支持**：将图像上传到机器人以将其合并到您的 GIF 中
* **背景删除**：使用`rembg`工具删除背景，这样您就可以制作朋友的GIF
* **实时工具记录**：在 Slack 线程中查看 Claude 的工具使用情况

## 架构

该机器人由三个主要组件组成：
Slack 机器人服务器，
克劳德特工沙箱，
和 Anthropic API 代理。

### Slack 机器人服务器

该组件处理 Slack 事件（提及和线程回复）并管理 [Modal Sandboxes](https://modal.com/docs/guide/sandbox)。
这是一个托管在 Modal 上的简单 [FastAPI ASGI 应用程序](https://modal.com/docs/guide/webhooks)。
### 克劳德特工沙箱

该组件运行 Claude 客户端并执行 Claude 技能，
例如 Bash 执行和 GIF 创建。

因为这些技能相当于让代理完全控制计算环境
我们将允许任何可以访问机器人的人来提示代理，
我们需要隔离并保护这个组件。
为此，它在模态[沙箱](https://modal.com/docs/guide/sandbox)内运行。
Modal 可以轻松扩展到[数百或数千个沙箱](https://modal.com/blog/modal-vibe)。

每个 Slack 线程都有自己的持久性 [Modal Sandbox](https://modal.com/docs/guide/sandbox)，以及一个专用的 [Volume](https://modal.com/docs/guide/volumes)，用于存储生成的 GIF 和会话数据。

### Anthropic API 代理

该组件将请求代理到 Anthropic API。

代理将 API 密钥保留在沙箱之外。
它包含在内，这样 Claude 就不会在以下情况下泄露您的 API 密钥：
顽皮的提示黑客要求提供包含它的 GIF，
如下面的（模拟）示例所示。

![GIF 中揭露的假 API 密钥](https://modal-cdn.com/claude-slack-gif-creator/mocked-pwn.gif)

## 先决条件

* Python 3.10或更高版本
* 一个[模态](https://modal.com/)账户
* Slack 工作区
* Anthropic API 密钥

## 设置

### 1.安装依赖项

```bash
pip install modal
```

就是这样！

如果您以前从未在这台机器上使用过 Modal，也可以运行

```bash
modal setup
```
### 2. 配置 Slack 应用程序

在您的工作区中[创建一个新的 Slack 应用程序](https://api.slack.com/apps)。

您的 Slack 应用程序需要：

[**OAuth 范围**](https://api.slack.com/scopes)

* `app_mentions:read`
* `chat:write`
* `files:read`
* `files:write`
* `channels:history`
* `groups:history`
* `im:history`
* `mpim:history`

[**活动订阅**](https://api.slack.com/apis/connections/events-api):

* `app_mention`
* `message.channels`
* `message.groups`
* `message.im`
* `message.mpim`

### 3.配置模态机密

创建两个模态[Secrets](https://modal.com/docs/guide/secrets)：

**人类秘密**：

* `ANTHROPIC_API_KEY`：您的 Anthropic API 密钥

**claude-code-slackbot-secret** 具有：

* `SLACK_BOT_TOKEN`：您的 [Slack 机器人令牌](https://api.slack.com/authentication/token-types#bot)（以 `xoxb-` 开头）
* `SLACK_SIGNING_SECRET`：您的 Slack 应用程序的 [签名秘密](https://api.slack.com/authentication/verifying-requests-from-slack#about)

### 4. 部署到模态

```bash
modal deploy src/main.py
```部署后，Modal 将提供一个 webhook URL。将此 URL 添加到 Slack 应用程序的 [事件订阅请求 URL](https://api.slack.com/apis/connections/events-api#the-events-api__subscribing-to-event-types__events-api-request-urls)。

最后，[将应用程序安装到您的工作空间](https://api.slack.com/start/quickstart#installing)并邀请机器人到您想要使用它的频道。

## 用法

### 提及机器人

在任何频道中提及机器人并附上您想要的 GIF 的描述：

> @GIFBot 创建鹈鹕骑自行车的 GIF

![鹈鹕骑自行车](https://modal-cdn.com/claude-slack-gif-creator/claude-pelican-bicycle.gif)

### 上传图片

将图像附加到您的消息中，以便机器人合并：

> @GIFBot 制作该实体的派对 GIF，其中闪烁字母“AGI”

> \[附加图片]
![感受到AGI了吗？](https://modal-cdn.com/claude-slack-gif-creator/agi-party.gif)

### 背景去除

请求删除透明 GIF 的背景：

> @GIFBot 制作一个这个家伙在船上骑的 GIF

> \[附加带背景的图像]

![贡吉船](https://modal-cdn.com/claude-slack-gif-creator/gongy-ships.gif)

### 主题回复

在线程中回复机器人的消息以继续对话：

> @GIFBot 制作一个 GIF，显示“由 Claude 支持的机器人，可创建自定义的 Slackmoji-ready GIF”。在屏幕上

> 文本超出屏幕，修复换行

![由 Claude 支持的机器人，可创建自定义 Slackmoji-ready GIF](https://modal-cdn.com/claude-slack-gif-creator/claude-gif-gif.gif)

## 它是如何工作的1. 用户在话题中提及机器人或回复
2. Slack 向 Modal webhook 发送事件
3. 机器人为该线程创建或恢复模态沙箱
4. 消息附件图像被下载并上传到沙盒
5. Claude Agent SDK在Sandbox内运行并带有用户的消息
6.克劳德使用`slack-gif-creator`技能生成GIF
7.生成的GIF上传回Slack线程
8. 沙箱将保持活动状态 20 分钟以供后续请求

## 调试模式

在 `src/main.py` 中设置 `DEBUG_TOOL_USE = True` 以在 Slack 线程中启用实时工具日志记录。

## 资源

* [模态文档](https://modal.com/docs)
* [模态沙箱](https://modal.com/products/sandboxes)
* [克劳德代理SDK](https://github.com/anthropics/anthropic-sdk-python)
* [Slack API 文档](https://api.slack.com/)
* [松紧螺栓框架](https://slack.dev/bolt-python/)
* [构建 Slack 应用程序](https://api.slack.com/start)
* [`slack-gif-creator`技能](https://github.com/anthropics/skills/)