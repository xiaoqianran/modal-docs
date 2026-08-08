<!-- modal-docs: machine-translated zh-CN from English source -->

# SCIM 集成

<Callout variant="gated-feature">
<a href="/pricing">企业计划</a>提供 SCIM 支持。请联系 <a href="mailto:sales@modal.com">sales@modal.com</a> 了解更多信息。
</Callout>

<Callout variant="beta" />

[SCIM（跨域身份管理系统）](https://datatracker.ietf.org/doc/html/rfc7643) 是身份提供商 (IdP) 可用于在连接的应用程序中自动执行用户管理的协议。

Modal 支持 SCIM 来自动配置和取消配置用户。

## 连接 IdP

### 第 1 步：生成 SCIM 令牌

1. 登录https://modal.com并访问[工作空间管理](/settings/workspace-management/identity-and-provisioning)页面的`Identity and Provisioning`选项卡。如果您的工作区启用了 SCIM，则页面上 SSO 配置设置下方将有一个“SCIM 令牌”部分。如果您没有看到 SCIM 令牌部分，请联系 Modal 支持以了解为您的工作区启用 SCIM 支持。
2. 单击“新建 SCIM 令牌”，然后单击“创建令牌”。
3. 将生成一个新令牌并向您显示。从“Token Secret”框中复制该值并将其存储在安全的地方。您还可以复制 IdP 与您的模态工作区集成所需的确切 URL。单击“完成”后，您将无法再次查看令牌密钥，并且如果您无法以其他方式访问它，则必须生成一个新密钥。

### 步骤 2：IdP 配置确切的配置步骤因 IdP 而异。您的 IdP 将要求您至少提供一个 SCIM URL（格式为 `https://modal.com/api/<your-workspace>/scim/v2`）和步骤 1 中生成的令牌。

下面列出了常见 IdP 集成配置字段的设置。

|配置设置|支持模态 |价值|笔记|
| ------------------------------------------------ | ---------------- | ------------------------------------------------ | ------------------------------------------------------ |
| SCIM 版本 |是的 | 2 |
| SCIM 基本 URL |是的 | `https://modal.com/api/<your-workspace>/scim/v2` |
| Scim授权方式|是的 |不记名代币 |
|支持分页|是的 |                                                  |
|支持团体 |没有 |                                                  |未来将增加团体支持。 |
|创建和删除组 |没有 |                                                  |未来将增加团体支持。 ||使用 PATCH 编辑组 |没有 |                                                  |未来将增加团体支持。 |
|生成临时密码 |没有 |                                                  |
|用于创建帐户的用户名 |是的 |电子邮件地址 |

IdP 还可能要求您指定支持哪些用户属性。

| SCIM 用户属性 |支持模态 |笔记|
| ------------------- | ---------------- | ------------------------------------------------------ |
|外部 ID |是的 |                                            |
|用户名 |是的 |                                            |
|显示名称 |是的 |                                            |
|姓氏 |是的 |                                            |
|给定名称 |是的 |                                            ||电子邮件 |没有 |主电子邮件在用户名字段中设置 |
|活跃 |是的 |                                            |
|地址 |没有 |                                            |
|个人资料网址 |没有 |                                            |

## 管理代币

令牌管理仅限于工作区所有者和管理者。
任何时候最多可以有两个 SCIM 令牌处于活动状态。生成第二个令牌以促进无缝令牌轮换可能很有用 - 工作区管理员可以生成一个新令牌，用它替换连接的 IdP 中的旧令牌，最后撤销旧令牌以确保在轮换过程中不会丢失任何更新。除了在轮换过程中外，我们建议一次仅激活一个 SCIM 令牌，作为安全最佳实践。

## 故障排除

如果您的 IdP 表明无法使用 Modal 进行身份验证，请首先仔细检查令牌是否已正确复制 - 完整令牌的格式为 `si-XXXXXXXXXXXXXXXXXXXXXX:ss-XXXXXXXXXXXXXXXXXXXXXX`。

如果您在 SCIM 集成方面遇到任何问题或有任何疑问，请通过 [Slack](/slack) 联系我们或发送电子邮件至 <support@modal.com>。