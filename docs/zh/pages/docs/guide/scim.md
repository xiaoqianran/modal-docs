<!-- modal-docs: machine-translated zh-CN from English source -->

# SCIM 集成

<Callout variant="gated-feature">
<a href="/pricing">企业计划</a>提供 SCIM 支持。请联系 <a href="mailto:sales@modal.com">sales@modal.com</a> 了解更多信息。
</Callout>

<Callout variant="beta" />

[SCIM（跨域身份管理系统）](https://datatracker.ietf.org/doc/html/rfc7643) 是身份提供商 (IdP) 可用于在连接的应用程序中自动进行用户管理的协议。

Modal 支持 SCIM 来自动配置和取消配置用户。

## 连接 IdP

### 第 1 步：生成 SCIM 令牌

1.登录https://modal.com并访问[工作区管理](/settings/workspace-management/identity-and-provisioning)页面的“身份和配置”选项卡。如果您的工作区启用了 SCIM，则页面上 SSO 配置设置下方将有一个“SCIM 令牌”部分。如果您没有看到 SCIM 令牌部分，请联系 Modal 支持以了解为您的工作区启用 SCIM 支持。
2. 单击“新建 SCIM 令牌”，然后单击“创建令牌”。
3. 将生成一个新令牌并向您显示。从“令牌秘密”框中复制该值并将其存储在安全的地方。您还可以复制 IdP 与您的模态工作区集成所需的确切 URL。单击“完成”后，您将无法再次查看令牌密钥，并且如果您无法以其他方式访问它，则必须生成一个新密钥。

### 步骤 2：IdP 配置

#### 奥克塔

1. 创建私有 SCIM 集成。

   SCIM 集成必须与用于的模态目录应用程序分开
   SAML 单点登录。您现有的 Modal 应用程序可以继续处理 SSO；不添加单点登录
   SCIM 集成。

   在 Okta 管理控制台中：

   1. 进入“应用程序 > 应用程序”。
   2. 单击“创建新的应用程序集成”。
   3. 选择“Okta 集成向导”。
   4. 选择“配置”作为功能。
   5. 选择“SCIM 2.0”作为配置方法。

2. 配置与您的 Modal SCIM 凭据的集成。

   在向导的配置设置中，输入：

   |奥克塔设置 |模态值 |
| --------------------------------- | ---------------------------------------------------------------- |
   | SCIM 连接器基本 URL | `https://modal.com/api/<your-workspace>/scim/v2` |
   |用户的唯一标识符字段 | `userName` |
   |认证方式| HTTP 标头 |
   |授权|步骤 1 中生成的完整 SCIM 令牌 |
   |支持的配置操作 |推送新用户、推送配置文件更新和推送组 |测试 API 凭据，然后查看并部署集成。当
   出现提示时，从组织的“私有应用程序”添加应用程序实例
   目录。

   在应用程序实例的“配置 > 到应用程序”设置中，启用“创建
   用户”、“更新用户属性”和“停用用户”。分配
   Okta 应向 Modal 提供的人员和团体。

   欲了解更多信息，请参阅 Okta 的
   [Okta 集成向导文档](https://help.okta.com/en-us/Content/Topics/Apps/oiw/create-app-integration.htm)。

#### 微软 Entra ID

1. 创建自定义非图库企业应用程序。

   在【Microsoft Entra 管理中心】(https://entra.microsoft.com/)：

   1. 进入“Entra ID > 企业应用”。
2. 选择“新建应用程序 > 创建您自己的应用程序”。
   3. 输入名称，例如`Modal SCIM`。
   4. 选择“集成您在库中找不到的任何其他应用程序”
      （非画廊）”并创建应用程序。

2. 使用您的 Modal SCIM 凭据配置应用程序。

   打开企业应用程序，选择“配置>新配置”，
   并输入：

   |入口设置|模态值|
   | ------------- | ------------------------------------------------ |
   |租户网址 | `https://modal.com/api/<your-workspace>/scim/v2` ||秘密令牌|步骤 1 中生成的完整 SCIM 令牌 |

   选择“测试连接”，然后创建配置配置。
   检查用户属性映射并确保映射电子邮件地址
   到`userName`。分配 Entra 应配置的用户和组，然后
   选择“开始配置”。

   有关详细信息，请参阅 Microsoft 的
   [SCIM 配置文档](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/use-scim-to-provision-users-and-groups#integrate-your-scim-endpoint-with-the-microsoft-entra-provisioning-service)。

#### 其他 IdP

1. 创建自定义 SCIM 集成。

   创建支持出站 SCIM 2.0 的自定义或非库应用程序
   供应。将其命名为可识别的名称，例如`Modal SCIM`。一个
现有的 SSO 集成可以继续处理身份验证；是否
   SCIM 集成必须是一个单独的应用程序，具体取决于您的 IdP。

2. 配置与您的 Modal SCIM 凭据的集成。

   找到您的 IdP 的等效设置并输入：

   |设置|模态值|
   | ---------------------- | ------------------------------------------------ |
   | SCIM 版本 | 2.0 |
   | SCIM 基本 URL | `https://modal.com/api/<your-workspace>/scim/v2` ||授权方式 |不记名令牌 |
   |代币|步骤 1 中生成的完整 SCIM 令牌 |
   |唯一的用户标识符| `userName` 中的电子邮件地址 |

   启用创建、更新和停用用户。您还可以启用群组
   供应。测试连接，分配您的 IdP 所使用的用户和组
   应该配置，并开始配置。

Modal 支持以下 SCIM 功能：

|能力|支持 |笔记|
| ---------------------------------- | --------- | -------------------------------------- |
| SCIM 2.0 |是的 |                               |
|分页|是的 |                               |
|创建、更新和删除用户 |是的 |                               |
|创建、更新和删除组 |是的 |                               |
|使用 PATCH | 更新组成员资格是的 |                               |
|生成临时密码 |没有 |模式身份验证使用 SSO |IdP 还可能要求您指定支持哪些用户属性。

| SCIM 用户属性 |模态支持 |笔记|
| ------------------- | ------------- | ----------------------------------------------------------- |
|外部 ID |是的 |                                                 |
|用户名 |是的 |必需的;必须包含用户的电子邮件地址 |
|显示名称 |是的 |                                                 |
|姓名.家庭名称 |是的 |                                                 |
|名称.给定名称 |是的 |                                                 |
|电子邮件 |只读|主要电子邮件源自 `userName` |
|活跃 |是的 |                                                 |
|地址 |没有 |                                                 |
|个人资料网址 |没有 |                                                 |

## 管理代币

令牌管理仅限于工作区所有者和管理者。任何时候最多可以有两个 SCIM 令牌处于活动状态。生成第二个令牌以促进无缝令牌轮换可能很有用 - 工作区管理员可以生成一个新令牌，用它替换连接的 IdP 中的旧令牌，最后撤销旧令牌以确保在轮换过程中不会丢失任何更新。除了在轮换过程中外，我们建议一次仅激活一个 SCIM 令牌，作为安全最佳实践。

## 故障排除

如果您的 IdP 表明无法使用 Modal 进行身份验证，请首先仔细检查令牌是否已正确复制 - 完整令牌的格式为 `si-XXXXXXXXXXXXXXXXXXXXXX:ss-XXXXXXXXXXXXXXXXXXXXXX`。
如果您在 SCIM 集成方面遇到任何问题或有任何疑问，请通过 [Slack](/slack) 联系我们或发送电子邮件至 <support@modal.com>。