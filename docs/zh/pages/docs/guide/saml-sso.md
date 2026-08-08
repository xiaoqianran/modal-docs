<!-- modal-docs: machine-translated zh-CN from English source -->

# 自定义 SAML SSO

<Callout variant="gated-feature">
自定义 SAML SSO 在 <a href="/pricing">企业计划</a> 上可用。请联系 <a href="mailto:sales@modal.com">sales@modal.com</a> 了解更多信息。
</Callout>

如果您使用 Okta 以外的身份提供商 (IdP)，则可以为模态工作区配置自定义 SAML SSO。

有关 Okta 特定的设置，请参阅我们的 [Okta SSO 文档](/docs/guide/okta-sso)。

## 先决条件

* 采用 [企业](/定价) 计划的工作区
* 对要使用 SSO 配置的工作区的管理员访问权限
* 您的身份提供商的管理员权限

## 支持的功能

* 身份提供商 (IdP) 发起的 SSO* 服务提供商 (SP) 发起的 SSO
* 即时账户配置

## 配置

### 模态 SAML 设置

使用以下设置配置您的 IdP：

|设置|价值|
| ---------| ------------------------------------------------- |
|实体 ID | `https://www.modal.com` |
| ACS 网址 | `https://modal.com/api/okta/saml/sso/<workspace>` |

将 `<workspace>` 替换为您的模态工作区名称。

### 必需的 SAML 属性

您的 IdP 必须发送以下 SAML 属性：

|属性 |描述 |
| ---------| -------------------- |
|电子邮件 |用户的电子邮件地址 |
|名字 |用户的名字 |
|姓氏 |用户的姓氏 |

### 配置步骤

#### 第 1 步：配置您的 IdP

1. 在您的身份提供商中创建新的 SAML 应用程序
2. 将实体ID设置为`https://www.modal.com`
3. 将 ACS URL 设置为 `https://modal.com/api/okta/saml/sso/<workspace>`（将 `<workspace>` 替换为您的工作区名称）
4. 配置所需的 SAML 属性（电子邮件、名字、姓氏）
5. 确保您的 IdP 签署 SAML 断言

#### 第 2 步：将您的工作区链接到您的 IdP

1. 从您的 IdP 获取 SAML 元数据 URL
2. 登录https://modal.com并访问[工作空间管理](/settings/workspace-management/identity-and-provisioning)页面的`Identity and Provisioning`选项卡
3. 将元数据 URL 粘贴到输入中，然后单击“保存更改”

#### 步骤 3：测试集成

1. 在 IdP 中分配用户
2. 通过单击 IdP 仪表板中的模态应用程序来测试 IdP 发起的 SSO
3. 通过访问下面的登录 URL 测试 SP 发起的 SSO

#### 步骤 4：在启用“需要 SSO”之前阅读此内容

启用“需要 SSO”将强制所有用户通过 SSO 登录。确保您
之前通过您的身份提供商拥有对您的模态工作区的管理员访问权限
启用。

## 登录网址
可以使用此 URL 以便用户可以从您的 IdP 登录到正确的工作区。

`https://modal.com/login/sso?workspace=<workspace>`（将 `<workspace>` 替换为您的工作区名称）

## 故障排除

### Microsoft Entra SAML

确保 SAML 属性映射正确。例如，`email` 应为小写，并且 SAML 属性不应具有命名空间。 [此处](https://learn.microsoft.com/en-us/entra/identity-platform/saml-claims-customization) 了解有关 Microsoft Entra SAML 属性的更多信息。