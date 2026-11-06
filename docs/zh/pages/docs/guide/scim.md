<!-- modal-docs: machine-translated zh-CN from English source -->

# SCIM 集成

<Callout variant="gated-feature">
<a href="/pricing">企业计划</a>提供 SCIM 支持。请联系 <a href="mailto:sales@modal.com">sales@modal.com</a> 了解更多信息。
</Callout>

[SCIM（跨域身份管理系统）](https://datatracker.ietf.org/doc/html/rfc7643)
是身份提供商 (IdP) 用于自动化用户管理的协议
连接的应用程序。

Modal 支持 SCIM 来自动配置和取消配置用户以及
[用户组](/docs/guide/user-groups)。

## 先决条件

* 采用 [企业](/定价) 计划并启用 SCIM 的工作区
* 您想要的工作空间中的工作空间所有者或工作空间管理员角色
  使用 SCIM 配置
* IdP 的管理员权限

## 连接 IdP

### 第 1 步：生成 SCIM 令牌

1. 打开**身份和配置**选项卡
   [工作区管理设置页面](/settings/workspace-management/identity-and-provisioning)。
   如果您的工作区启用了 SCIM，则会出现 **SCIM 令牌** 部分
   **单点登录 (SSO)** 部分下方。如果您没有看到，请联系
   <support@modal.com> 为您启用 SCIM
   工作区。
2. 单击“**新建 SCIM 令牌**”，然后单击“**创建令牌**”。
3. 从 **Token Secret** 框中复制值并将其存储在安全的地方。
该对话框还显示您的工作区的 **SCIM 端点** URL，其中
   一些 IdP 需要。

   这是模态框唯一一次显示令牌秘密。单击“**完成**”后，
   您无法再次查看；如果丢失，请生成新令牌。

### 步骤 2：IdP 配置

#### 奥克塔

**支持的功能**

Okta 中的 [Modal 应用程序](https://www.okta.com/integrations/modal/)
集成网络 (OIN) 支持以下配置功能：

* 创建用户
* 更新用户属性
* 停用用户
* 群组推送

Modal 应用程序不支持以下功能：

* 导入用户
* 导入组
* 同步密码
* 资料来源

有关列出的功能的更多信息，请访问
[Okta 术语表](https://help.okta.com/okta_help.htm?type=oie\&id=ext_glossary)。

推送的组在模态中显示为 [用户组](/docs/guide/user-groups)。集团
名称在工作区中必须是唯一的，忽略大小写，跨自定义和
SCIM 组，因此如果已存在同名组，则组推送会失败。
请参阅[组名称冲突](/docs/guide/user-groups#group-name-conflicts)
如何解决这个问题。

**配置步骤**

1. 将 Modal 应用程序添加到 Okta。

   如果您已将 Modal 应用程序用于 [Okta SSO](/docs/guide/okta-sso)，
在 Okta 管理控制台中的 **应用程序 > 应用程序** 下选择它并
   继续执行步骤 2。否则，从 Okta 集成网络添加它：

   1. 在 Okta 管理控制台中，转至 **应用程序 > 应用程序**，然后单击
      **浏览应用程序目录**。
   2. 选择 **模态** 并单击 **完成**。
   3. 选择**登录**选项卡并单击**编辑**。
   4. 在 **工作空间** 字段中输入您的模态工作空间名称，然后单击
      **保存**。您的工作区名称显示在**工作区名称**下
      **身份和配置**选项卡
      [工作区管理设置页面](/settings/workspace-management/identity-and-provisioning)。

2. 使用您的 Modal SCIM 凭据配置应用程序。

   选择 **配置** 选项卡，单击 **配置 API 集成**，选择
   **启用 API 集成**，然后输入：

   |奥克塔设置 |模态值 |
   | ------------ | --------------------------------------------------- |
   | API 令牌 |步骤 1 中生成的完整 SCIM 令牌 |

   单击“**测试 API 凭据**”，然后单击“**保存**”。

3. 启用模态配置。

   在**配置**选项卡上，选择**到应用程序**并单击**编辑**。使能够
**创建用户**、**更新用户属性**和**停用用户**，然后
   单击**保存**。

4. 分配用户和组。

   选择 **分配** 选项卡并分配 Okta 需要的人员和组
   应提供给模态。 Modal 通过电子邮件地址识别用户，因此请保留
   **登录**选项卡上的**应用程序用户名格式**设置为**电子邮件**。

5. 推送群组。

   选择“**推送组**”选项卡，单击“**推送组**”，然后选择组
   其成员资格 Okta 应同步到 Modal。

   欲了解更多信息，请参阅 Okta 的
   [配置文档](https://help.okta.com/en-us/content/topics/provisioning/lcm/lcm-provision-application.htm)。

#### 微软 Entra ID

1. 创建或选择企业应用程序。

   在【Microsoft Entra 管理中心】(https://entra.microsoft.com/)：

   * 如果您已经有一个用于使用的 Modal 企业应用程序
     [Microsoft Entra SSO](/docs/guide/entra-sso)，您可以将其重复用于 SCIM
     供应。转至 **Entra ID > 企业应用** 并选择
     应用程序。
   * 否则，请转到 **Entra ID > 企业应用程序** 并创建应用程序：
     1. 选择 **新建应用程序 > 创建您自己的应用程序**。
     2. 输入名称，例如`Modal SCIM`。
3. 选择 **集成您在库中找不到的任何其他应用程序
        （非图库）** 并创建应用程序。

2. 使用您的 Modal SCIM 凭据配置应用程序。

   打开企业应用程序，选择**配置>新配置**，
   并输入以下值。将 `<workspace>` 替换为您的模态框
   工作区名称。

   |入口设置|模态值 |
   | ------------- | ------------------------------------------------------- |
   |租户网址 | `https://modal.com/api/<workspace>/scim/v2` |
   |秘密令牌|步骤 1 中生成的完整 SCIM 令牌 |

   选择**测试连接**，然后创建配置配置。
   检查用户属性映射并确保映射电子邮件地址
   到`userName`。分配 Entra 应配置的用户和组，然后
   选择**开始配置**。

   有关详细信息，请参阅 Microsoft 的
   [SCIM 配置文档](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/use-scim-to-provision-users-and-groups#integrate-your-scim-endpoint-with-the-microsoft-entra-provisioning-service)。

#### 其他 IdP

1. 创建自定义 SCIM 集成。

   创建支持出站 SCIM 2.0 的自定义或非库应用程序
   供应。将其命名为可识别的名称，例如 `Modal SCIM`。一个
现有的 SSO 集成可以继续处理身份验证；是否
   SCIM 集成必须是一个单独的应用程序，具体取决于您的 IdP。

2. 配置与您的 Modal SCIM 凭证的集成。

   找到您的 IdP 的等效设置并输入以下值。
   将 `<workspace>` 替换为您的模态工作区名称。

   |设置|模态值 |
   | ---------------------------------- | ------------------------------------------------------- |
   | SCIM 版本 | 2.0 || SCIM 基本 URL | `https://modal.com/api/<workspace>/scim/v2` |
   |授权方式 |不记名令牌 |
   |代币|步骤 1 中生成的完整 SCIM 令牌 |
   |唯一的用户标识符 | `userName` 中的电子邮件地址 |

   启用创建、更新和停用用户。您还可以启用群组
   供应。测试连接，分配您的 IdP 所使用的用户和组
   应该配置，并开始配置。

Modal 支持以下 SCIM 功能：

|能力|支持 |笔记|
| ---------------------------------- | ---------| -------------------------------------- |
| SCIM 2.0 |是的 |                               |
|分页|是的 |                               |
|创建、更新和删除用户 |是的 |                               |
|创建、更新和删除组 |是的 |                               |
|使用 PATCH | 更新组成员资格是的 |                               |
|生成临时密码 |没有 |模式身份验证使用 SSO |您的 IdP 还可能询问 Modal 支持哪些用户属性：

| SCIM 用户属性 |模态支持 |笔记|
| ------------------- | ------------- | ----------------------------------------------------------- |
|外部 ID |是的 |                                                 |
|用户名 |是的 |必需的;必须包含用户的电子邮件地址 |
|显示名称 |是的 |不显示在 UI 中 |
|姓名.家庭名称 |是的 |不显示在 UI 中 |
|名称.给定名称 |是的 |不显示在 UI 中 |
|电子邮件 |只读 |主要电子邮件源自 `userName` |
|活跃 |是的 |                                                 |
|地址 |没有 |                                                 |
|个人资料网址 |没有 |                                                 |

## 管理代币

只有工作区所有者和工作区管理员可以管理 SCIM 令牌。一次最多可以有两个 SCIM 令牌处于活动状态，因此您可以轮换令牌而无需
删除更新：

1. 生成新的代币。
2. 将 IdP 中的旧令牌替换为新令牌。
3. 撤销旧令牌。

在轮换之外，仅保持一个 SCIM 代币处于活动状态作为最佳安全措施
练习。

## 故障排除

### 您的 IdP 无法使用 Modal 进行身份验证

确认您复制了完整的令牌。它具有以下形式
`si-XXXXXXXXXXXXXXXXXXXXXX:ss-XXXXXXXXXXXXXXXXXXXXXX`。

### 组推送失败并出现“已存在”错误

您的工作区已经有一个同名的组，忽略大小写。集团
名称在自定义组和 SCIM 组中必须是唯一的，因此请重命名其中一个
在重试推送之前先确定冲突的组。参见
[组名称冲突](/docs/guide/user-groups#group-name-conflicts)
详细信息。

### 其他问题

如果您对 SCIM 集成有任何问题或疑问，请通过以下方式联系
[Slack](/slack) 或发送电子邮件至 <support@modal.com>。