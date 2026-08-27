<!-- modal-docs: machine-translated zh-CN from English source -->

# 松弛通知

<Callout variant="beta" />

您可以将模态工作区与 Slack 集成，以及时接收重要通知。

## 先决条件

* 您是要在其中安装 Slack 集成的模态工作区中的[工作区管理员](/docs/guide/workspaces#administrate-workspace-members)。
* 您有权在 Slack 工作区中安装应用程序。

## 支持的通知

* 计划功能运行失败时发出警报。
* 函数中崩溃循环容器的警报。
* 针对热容器数周没有运行任何输入的功能发出警报。
* 当您的任何应用程序的客户端版本已过期时发出警报。
* 当您达到 GPU 资源限制时发出警报。
* 当您的工作区接近或达到其使用限制或预算时发出警报。
* 当环境接近或达到其预算时发出警报。
* 当积分添加到您的工作区时发出通知。

## 松弛权限

Modal Slack 应用程序请求以下权限才能与 Slack 集成：

* 开始与人直接消息
* 以@modal形式发送消息
* 添加人们可以使用的快捷方式和/或斜线命令
* 查看工作区公共频道的基本信息
* 查看已添加Modal的私信频道基本信息
* 查看已添加Modal的私信基本信息
* 查看已添加Modal的群私信基本信息
* 查看工作空间中的人员

## 配置

### 第 1 步：安装 Slack 集成

访问模态工作区中 [设置](/settings/slack-notifications) 页面上的 *Slack 通知* 部分，然后单击 **添加到 Slack** 按钮。

### 第 2 步：邀请 Modal 应用程序加入您的 Slack 频道

导航到 Slack 频道和 `/invite` Modal 应用程序，以便应用程序可以将消息发布到频道。

![将应用程序添加到 Slack 频道](https://modal-cdn.com/cdnbot/slack-invite-app_vpxfskj_f0dc9524.webp)

### 步骤 3：将 Modal 应用添加到您的 Slack 频道

导航到要添加 Modal 应用程序的 Slack 频道，然后单击频道标题。在集成选项卡上，您可以添加模态应用程序。

![将 Modal 应用添加到 Slack 频道](../../assets/docs/slack-add-modal-app.jpg)

### 步骤 4：使用 `/modal link` 将 Slack 通道链接到您的模态工作区
系统将提示您选择要链接到 Slack 频道的工作区。您始终可以通过访问模态工作区中[设置](/settings/slack-notifications)页面上的*Slack通知*部分来取消链接Slack通道。