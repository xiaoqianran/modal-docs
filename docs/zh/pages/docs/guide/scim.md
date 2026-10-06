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

1. 创建新的 SCIM 集成或选择现有的自定义应用程序。

   如果您使用[模态目录应用程序](https://www.okta.com/integrations/modal/)
   对于 [Okta SSO](/docs/guide/okta-sso)，创建单独的私有 SCIM
   整合。您现有的 Modal 应用程序可以继续处理 SSO；不要添加
   SSO 到新 SCIM 集成。

   如果您使用自定义应用程序进行 SSO，则可以将其重新用于 SCIM 配置。
   在 Okta 管理控制台中选择您现有的应用程序，然后继续执行步骤 2。

   要在 Okta 管理控制台中创建新集成：

   1. 转至 **应用程序 > 应用程序**。
   2. 单击**创建新的应用程序集成**。
   3. 选择 **Okta 集成向导**。
   4. 选择 **配置** 作为功能。
   5. 选择 **SCIM 2.0** 作为配置方法。

2. 配置与您的 Modal SCIM 凭据的集成。

   在新的集成向导或现有自定义应用程序的配置中
设置，输入以下值。将 `<workspace>` 替换为您的
   模态工作区名称。

   |奥克塔设置 |模态值 |
   | --------------------------------- | ---------------------------------------------------------------- |
   | SCIM 连接器基本 URL | `https://modal.com/api/<workspace>/scim/v2` |
   |用户的唯一标识符字段 | `userName` |
   |认证方式| HTTP 标头 ||授权|步骤 1 中生成的完整 SCIM 令牌 |
   |支持的配置操作 |推送新用户、推送配置文件更新和推送组 |

   单击“**测试 API 凭据**”。如果您创建了新的集成，请查看并
   部署它。出现提示时，从您的组织的应用程序实例中添加应用程序实例
   **私人应用程序**目录。

   在应用程序实例的 **Provisioning > To App** 设置中，启用
   **创建用户**、**更新用户属性**和**停用用户**。
   将 Okta 应配置的人员和组分配给 Modal。

   欲了解更多信息，请参阅 Okta 的
[Okta 集成向导文档](https://help.okta.com/en-us/Content/Topics/Apps/oiw/create-app-integration.htm)。

#### 微软 Entra ID

1. 创建或选择企业应用程序。

   在【Microsoft Entra 管理中心】(https://entra.microsoft.com/)：

   * 如果您已经有一个用于使用的 Modal 企业应用程序
     [Microsoft Entra SSO](/docs/guide/entra-sso)，您可以将其重复用于 SCIM
     供应。转至 **Entra ID > 企业应用** 并选择
     应用程序。
   * 否则，请转到 **Entra ID > 企业应用程序** 并创建一个应用程序：
     1. 选择 **新建应用程序 > 创建您自己的应用程序**。2. 输入名称，例如`Modal SCIM`。
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
   供应。将其命名为可识别的名称，例如`Modal SCIM`。一个现有的 SSO 集成可以继续处理身份验证；是否
   SCIM 集成必须是一个单独的应用程序，具体取决于您的 IdP。

2. 配置与您的 Modal SCIM 凭据的集成。

   找到您的 IdP 的等效设置并输入以下值。
   将 `<workspace>` 替换为您的模态工作区名称。

   |设置|模态值 |
   | ---------------------------------- | ------------------------------------------------------- |
   | SCIM 版本 | 2.0 |
   | SCIM 基本 URL | `https://modal.com/api/<workspace>/scim/v2` |
|授权方式 |不记名令牌 |
   |代币|步骤 1 中生成的完整 SCIM 令牌 |
   |唯一的用户标识符 | `userName` 中的电子邮件地址 |

   启用创建、更新和停用用户。您还可以启用群组
   供应。测试连接，分配您的 IdP 所使用的用户和组
   应该配置，并开始配置。

Modal 支持以下 SCIM 功能：

|能力|支持 |笔记|| ---------------------------------- | ---------| -------------------------------------- |
| SCIM 2.0 |是的 |                               |
|分页 |是的 |                               |
|创建、更新和删除用户 |是的 |                               |
|创建、更新和删除组 |是的 |                               |
|使用 PATCH | 更新组成员资格是的 |                               |
|生成临时密码 |没有 |模式身份验证使用 SSO |
您的 IdP 还可能询问 Modal 支持哪些用户属性：

| SCIM 用户属性 |模态支持 |笔记|
| ------------------- | ------------- | ----------------------------------------------------------- |
|外部 ID |是的 |                                                 |
|用户名 |是的 |必需的;必须包含用户的电子邮件地址 |
|显示名称 |是的 |                                                 ||姓名.家庭名称 |是的 |                                                 |
|名称.给定名称 |是的 |                                                 |
|电子邮件 |只读 |主要电子邮件源自 `userName` |
|活跃 |是的 |                                                 |
|地址 |没有 |                                                 |
|个人资料网址 |没有 |                                                 |

## 管理代币

只有工作区所有者和工作区管理员可以管理 SCIM 令牌。
一次最多可以有两个 SCIM 令牌处于活动状态，因此您可以轮换令牌而无需
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