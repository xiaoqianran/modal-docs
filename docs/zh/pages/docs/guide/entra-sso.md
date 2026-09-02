<!-- modal-docs: machine-translated zh-CN from English source -->

# 微软 Entra SSO

<Callout variant="gated-feature">
Microsoft Entra SSO 在 <a href="/pricing">企业计划</a> 上可用。请联系 <a href="mailto:sales@modal.com">sales@modal.com</a> 了解更多信息。
</Callout>

## 先决条件

* 采用 [企业](/定价) 计划的工作区
* 对您要配置的工作区的管理员访问权限
  Microsoft Entra 单点登录 (SSO)
* Microsoft Entra 组织（例如云）的管理员权限
  应用程序管理员或应用程序管理员角色

## 支持的功能

* 身份提供商 (IdP) 发起的 SSO
* 服务提供商 (SP) 发起的 SSO
* 即时账户配置

## 配置

### 在启用“需要 SSO”之前阅读此内容

启用“需要 SSO”将强制所有用户通过 Microsoft Entra 登录。
确保您具有通过管理员访问模态工作区的权限
启用前的 Microsoft Entra 帐户。

### 配置步骤

#### 步骤 1：将 Modal 应用添加到 Microsoft Entra 应用程序

1. 登录【Microsoft Entra 管理中心】(https://entra.microsoft.com/)。
2. 导航至“Entra ID > 企业应用程序 > 所有应用程序”并选择
   “新应用程序”。
3. 选择“创建您自己的应用程序”。
4. 将应用程序命名为`Modal`，选择“集成您选择的任何其他应用程序”
   在图库中找不到（非图库）”，并创建应用程序。
5. 打开应用程序的“单点登录”并选择“SAML”。

有关详细信息，请参阅 Microsoft 的指南
[添加企业应用](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/add-application-portal)
和
[启用 SAML SSO](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/add-application-portal-setup-sso)。

#### 步骤 2：配置模态 SAML 设置

在“基本 SAML 配置”中，输入以下值。更换
`<workspace>` 与您的模态工作区名称。

|设置|价值|| ---------------------------------- | --------------------------------------------------- |
|标识符（实体 ID）| `https://www.modal.com` |
|回复 URL（断言消费者 URL）| `https://modal.com/api/okta/saml/sso/<workspace>` |
|登录网址 | `https://modal.com/login/sso?workspace=<workspace>` |

保存配置。登录 URL 为用户提供 SP 发起的登录路径
对于配置的工作区。

#### 步骤 3：配置 SAML 属性和声明

在“属性和声明”中，添加或编辑声明，以便 SAML 断言包括
以下属性。完全按照所示输入每个属性名称并离开
它的“命名空间”为空。
|名称 |价值|
| --------- | -------------- |
|电子邮件 |用户邮箱 |
|名字 |用户名 |
|姓氏 |用户.姓 |

如果未为每个用户填充 `user.mail`，请从 Microsoft 映射 `email`
Entra 属性包含您的用户在 Modal 中使用的电子邮件地址。对于
例如，一些组织使用 `user.userprincipalname` 作为电子邮件来源。

请参阅 Microsoft 的文档
[为令牌声明添加属性](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-add-attributes-to-token)
有关配置属性和声明的详细信息。

#### 步骤 4：将您的工作区链接到 Microsoft Entra Modal 应用程序

1. 导航回 Microsoft Entra 管理中心中的 Modal 应用程序。
2. 在应用程序的 SAML 配置中，找到“SAML
   证书”并复制“应用程序联合元数据 URL”。
3.登录https://modal.com并访问[工作区管理](/settings/workspace-management/identity-and-provisioning)页面的“身份和配置”选项卡。
4. 在输入中粘贴应用程序联合元数据 URL，然后单击“保存更改”。

#### 步骤 5：分配用户/组并测试集成

1. 导航回 Microsoft Entra 管理中心中的 Modal 应用程序。
2. 打开“用户和组”并分配适当的人员或组。参见
   微软的指南
   [分配用户和组](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/assign-user-or-group-access-portal)
   了解详细步骤。
3. 要测试集成，请以您在
   上一步。
4. 单击“Modal”应用程序
   [我的应用程序门户](https://myapps.microsoft.com/) 启动单点登录。
5. 确认之前用户已添加到预期的模态工作区中
   启用“需要 SSO”。

## SP 发起的 SSO

登录过程从https://modal.com/login/sso开始

1. 在输入框中输入您的工作区名称
2. 单击“继续使用 SSO”以通过 Microsoft Entra 进行身份验证

## 故障排除

### Modal 报告缺少 SAML 属性

确认断言包含 `email`、`firstName` 和 `lastName`
上面显示的确切大小写。每个声明必须有一个空的命名空间，
并且其源属性必须包含受影响用户的值。

### 用户无法打开应用程序

确认用户是直接分配的还是通过支持的组分配的。集团
作业需要 Microsoft Entra ID P1 或 P2，并且作业不包括
嵌套组的成员。

### Modal 无法加载身份提供者元数据
确认您复制的是“应用程序联合元数据 URL”，而不是
登录 URL、Microsoft Entra 标识符或本地证书文件。