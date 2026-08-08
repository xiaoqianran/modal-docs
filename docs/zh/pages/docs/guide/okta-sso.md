<!-- modal-docs: machine-translated zh-CN from English source -->

# 奥克塔单点登录

<Callout variant="gated-feature">
Okta SSO 在 <a href="/pricing">企业计划</a> 上可用。请联系 <a href="mailto:sales@modal.com">sales@modal.com</a> 了解更多信息。
</Callout>

## 先决条件

* 采用 [企业](/定价) 计划的工作区
* 对要使用 Okta 单点登录 (SSO) 配置的工作区的管理员访问权限
* Okta 组织的管理员权限

## 支持的功能

* 身份提供商 (IdP) 发起的 SSO
* 服务提供商 (SP) 发起的 SSO
* 即时账户配置

有关列出的功能的更多信息，请访问
[Okta 术语表](https://help.okta.com/okta_help.htm?type=oie\&id=ext_glossary)。

## 配置

### 在启用“需要 SSO”之前阅读此内容

启用“需要 SSO”将强制所有用户通过 Okta 登录。确保您
之前通过 Okta 帐户拥有对模态工作区的管理员访问权限
启用。

### 配置步骤

#### 第 1 步：将 Modal 应用添加到 Okta 应用程序

1. 登录您的 Okta 管理仪表板

2. 导航至“应用程序”选项卡，然后单击“浏览应用程序目录”。
   ![Okta 浏览应用程序](../../assets/docs/okta-browse-applications.png)

3. 选择“模态”并单击“完成”。

4. 选择“登录”选项卡并单击“编辑”。
   ![Okta 登录编辑](../../assets/docs/okta-sign-on-edit.png)
5. 填写工作区字段以配置您的特定模态工作区。参见
   [步骤 2](/docs/guide/okta-sso#step-2-link-your-workspace-to-okta-modal-application)
   如果您不确定这是什么。
   ![Okta 添加工作空间](../../assets/docs/okta-add-workspace-username.png)

#### 步骤 2：将您的工作区链接到 Okta Modal 应用程序

1. 在 Okta 管理页面上导航到您的应用程序。

2. 从 Okta 管理控制台复制元数据 URL（位于“登录”下方）
   选项卡）。 ![Okta 元数据 url](../../assets/docs/okta-metadata-url.png)

3. 登录https://modal.com并访问[工作空间管理](/settings/workspace-management/identity-and-provisioning)页面的`Identity and Provisioning`选项卡。

4. 将元数据 URL 粘贴到输入中，然后单击“保存更改”

#### 步骤 3：分配用户/组并测试集成

1. 在 Okta 管理仪表板上导航回您的 Okta 应用程序。
2. 单击“分配”选项卡并添加适当的人员或组。

![Okta 分配用户](../../assets/docs/okta-assign-people.png)

3. 要测试集成，请以您在上一步中分配的用户之一的身份登录。
4. 单击 Okta 仪表板上的模态应用程序以启动单点登录。
#### 注释

集成使用以下 SAML 属性：

|名称 |价值|
| ---------| -------------- |
|电子邮件 |用户.电子邮件 |
|名字 |用户.名字 |
|姓氏 |用户.姓氏 |

## SP 发起的 SSO

登录流程从https://modal.com/login/sso开始

1. 在输入框中输入您的工作区名称
2. 单击“继续使用 SSO”以使用 Okta 进行身份验证