<!-- modal-docs: machine-translated zh-CN from English source -->

# Google Workspace 单点登录

<Callout variant="gated-feature">
Google Workspace SSO 适用于 <a href="/pricing">企业套餐</a>。请联系 <a href="mailto:sales@modal.com">sales@modal.com</a> 了解更多信息。
</Callout>

本指南将 Google Workspace 配置为您的 SAML 身份提供商
模态工作区。它与使用“继续”登录 Modal 是分开的
谷歌”。

## 先决条件

* 采用 [企业](/定价) 计划的工作区
* 对您要使用 Google Workspace 配置的工作区的管理员访问权限
  单点登录 (SSO)
* 您的 Google Workspace 组织的超级管理员权限

## 支持的功能

* 身份提供商 (IdP) 发起的 SSO
* 服务提供商 (SP) 发起的 SSO
* 即时账户配置

## 配置

### 在启用“需要 SSO”之前阅读此内容

启用“需要 SSO”将强制所有用户通过 Google Workspace 登录。
确保您拥有通过 Google 访问模态工作区的管理员权限
启用之前的工作区帐户。

### 配置步骤

#### 第 1 步：将模态应用添加到 Google Workspace

1. 以超级用户身份登录 [Google 管理控制台](https://admin.google.com/)
   管理员。
2. 导航至“应用程序 > Web 和移动应用程序”。
3. 选择“添加应用程序 > 添加自定义 SAML 应用程序”。
4. 将应用程序命名为`Modal`，然后单击“继续”。
5. 在“Google 身份提供商详细信息”页面上，点击“下载元数据”
   保存 IdP 元数据 XML 文件，然后单击“继续”。您将上传这个
   在步骤 4 中将文件保存到 Modal。

有关详细信息，请参阅 Google 的指南
[设置自定义 SAML 应用程序](https://support.google.com/a/answer/6087519)。

#### 步骤 2：配置模态 SAML 设置

在“服务提供商详细信息”页面上，输入以下值。更换
`<workspace>` 与您的模态工作区名称。

|设置|价值|| ---------------- | ------------------------------------------------- |
| ACS 网址 | `https://modal.com/api/okta/saml/sso/<workspace>` |
|实体 ID | `https://www.modal.com` |
|开始网址 |留空 |
|签署回复 |不勾选 |
|姓名 ID 格式 | `EMAIL` |
|姓名 ID |基本信息 > 主要电子邮件 |

<Callout variant="warning">
如果“起始 URL”有值或选中“签名响应”，则登录失败。
</Callout>

实体ID必须完全匹配，包括`https://`和`www`，不能有
尾部斜杠。如果你以后
[重命名您的工作空间](/docs/guide/workspaces#renaming-a-workspace)，更新
新名称的 ACS URL。

单击“继续”。

#### 步骤 3：配置 SAML 属性映射

在“属性映射”页面上，为下面的每一行单击“添加映射”。
选择值作为 Google Directory 属性，然后输入名称作为
app 属性完全如图所示。

|名称 |价值|
| ---------| --------------------------------- |
|电子邮件 |基本信息 > 主要电子邮件 |
|名字 |基本信息 > 名字 |
|姓氏 |基本信息 > 姓氏 |

单击“完成”创建应用程序。

#### 第 4 步：将您的 Workspace 链接到 Google Workspace Modal 应用

Google Workspace 不会发布元数据网址，因此您需要上传元数据
而是使用步骤 1 中的文件。

1.登录https://modal.com并访问[工作区管理](/settings/workspace-management/identity-and-provisioning)页面的“身份和配置”选项卡。
2. 点击“上传XML文件”并选择您下载的元数据文件
   步骤1。

如果您没有在步骤 1 中下载文件，
在 Google 管理控制台中打开 Modal 应用程序，然后点击“下载
其详细信息页面上的“元数据”。

#### 步骤 5：分配用户/组并测试集成

1. 在 Google 管理控制台中导航回您的模态应用程序。
2. 打开“用户访问权限”并为所有人或特定用户打开该应用程序
   适当的组织单位或团体。请参阅 Google 的指南
   [打开 SAML 应用程序](https://support.google.com/a/answer/6087519#zippy=%2Cstep-turn-on-your-saml-app)
   了解详细步骤。
3. 要测试集成，请以您指定的用户之一身份登录 Google
   该应用程序已开启。
4. 从 Google Apps 菜单中打开 Modal 应用程序以启动 Single
   登录。管理员还可以单击“测试 SAML 登录”
   Google 管理控制台中的应用程序页面。
5. 确认之前用户已添加到预期的模态工作区中
   启用“需要 SSO”。

## SP 发起的 SSO

登录过程从https://modal.com/login/sso开始

1. 在输入框中输入您的工作区名称
2. 点击“继续使用 SSO”以通过 Google Workspace 进行身份验证

## 故障排除

### Google 验证用户身份后登录失败

确认属性映射包含`email`、`firstName`和
`lastName` 具有如上所示的确切大小写，并且受影响的
用户在 Google Workspace 中拥有名字、姓氏和主要电子邮件地址。

### Google 证书续订后登录停止工作

Modal 读取您上传的元数据文件，因此它不会拾取所做的更改
在 Google Workspace 中。在轮换应用程序的 SAML 证书后
Google 管理控制台，再次下载元数据文件并将其上传为
步骤 4 中描述。