<!-- modal-docs: machine-translated zh-CN from English source -->

# 审核日志

<Callout variant="gated-feature">
审核日志可在<a href="/pricing" target="_blank" rel="noopener">企业计划</a>上找到。请联系 <a href="mailto:sales@modal.com">sales@modal.com</a> 了解更多信息。
</Callout>

审核日志为您的工作空间提供敏感信息的仅附加记录
改变其状态的操作——谁、何时、对哪个资源做了什么，以及
从哪里来。它们专为合规审查、事件
调查，并回答诸如“*”是否有人删除此 Secret 之类的问题
上周四？”* 无需询问 Modal 支持。

审核日志可在<a href="/settings/audit-logs" target="_blank" rel="noopener" class="text-c-green-100 hover:underline">设置页面</a>中查看。

<center>
<video controls autoplay muted playsinline>
<source src="https://modal-public-assets.s3.us-east-1.amazonaws.com/docs/audit-logs-v2-demo-2.mp4" type="video/mp4"></video>
</center>

## 字段

每个审核事件都会捕获相同的形状及其发生时间：

|领域 |它是什么 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action` |发生的变化——例如`secret.create`，`app.deploy`。请参阅[下面](#actions) 的完整列表。                        |
| `actor` |发起操作的用户或服务用户。                                                                                |
| `targets` |受操作影响的资源，每个资源均按 ID 记录，以便在重命名或删除后事件仍可归因。                 |
| `context.environment` |操作范围的环境。                                                                                          || `context.ip_address` |客户端IP地址。                                                                                                             |
| `context.source` | `web` 用于仪表板，`sdk` 用于 Modal CLI 和客户端库。                                                             |
| `status` |操作是否成功或失败。                                                                                            |
| `metadata` |特定于操作的额外字段 - 例如`workspace.set_budget` 的旧预算值和新预算值，或代理请求的区域。 |

## 过滤

在表格上方的搜索栏中输入过滤器：`key:value`
成对，用空格分隔。任何过滤器都可以通过添加前缀来**否定**
使用 `-` 排除匹配事件。搜索栏自动补全键
和您键入的值。

例如：

|过滤|比赛|
| -------------------------------------------------------- | ------------------------------------------------ |
| `action:secret.create` |在选定的时间范围内创建的每个秘密。 |
| `-status:success` |所有未成功的行动。                || `action:volume.delete` `-actor_type:service` |非服务用户删除卷。           |

## 行动

下表列出了当前记录的每个操作。将有新的行动
作为附加工作区操作的检测而添加。

> 注意：**容器运行时活动不被审计。**审计日志记录
> 工作区级别的操作（部署应用程序、创建卷、撤销卷）
> 令牌) — 不是单独的函数调用或沙箱 `exec` 调用，
> 在函数和沙箱日志中捕获。

<br />

<!-- AUDIT_LOG_V2_ACTIONS_START：从ACTION_DESCRIPTIONS生成，请勿手动编辑-->
|行动|描述 || ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- || `access_grant.approve` |工作区经理批准了待定的模态管理访问权限授予。                                                                                                                                                                                                    |
| `access_grant.revoke` |工作区管理员撤销了有效的模态管理员访问授权。                                                                                                                                                                                                     |
| `app.deploy` |应用程序已部署到工作区（通过`modal deploy`或隐式通过`App.lookup`）。                                                                                                                                                                           |
| `app.rollback` |应用程序已回滚到早期部署的版本。                                                                                                                                                                                                              || `app.rollover` |应用程序已滚动 - 其当前版本已重新部署，重新启动正在运行的任务。                                                                                                                                                                              |
| `app.run` |临时应用程序是通过 `modal run` 或 `modal serve` 启动的。                                                                                                                                                                                                     |
| `app.stop` |应用程序已从仪表板或通过`modal app stop`停止。                                                                                                                                                                                                     |
| `container.stop` |正在运行的容器（任务）已从仪表板或 CLI 终止。不审核调用结束时例程容器的退出。                                                                                                                                  || `dict.create` |创建了一个字典。                                                                                                                                                                                                                                                 |
| `dict.get` |通过名称或 ID 查找现有的 Dict。                                                                                                                                                                                                                    |
| `domain.create` |自定义域已附加到环境。                                                                                                                                                                                                                     || `domain.delete` |自定义域已被删除。                                                                                                                                                                                                                                        || `environment.create` |工作区中创建了一个新环境。                                                                                                                                                                                                                     |
| `environment.delete` |环境被删除。                                                                                                                                                                                                                                         |
| `environment.get` |通过名称查找环境。                                                                                                                                                                                                                               || `environment.set_budget` |环境的支出预算已更新或清除。先前和新的每周期预算值、有效最大预算以及预算是否更改均记录在事件元数据中。                                                                        |
| `environment.set_default_member_role` |环境的默认成员角色已更新。它适用于没有明确环境角色的工作区成员；以前的和新的默认值记录在事件元数据中。                                                                               |
| `environment.set_managed` |环境在托管和非托管之间切换。禁用托管访问会删除该环境的每个环境角色；现在是否对其进行管理会记录在事件元数据中。                                                             |
| `environment.update` |环境的设置已更改 - 名称、Web 后缀或每个环境的并发限制。之前/之后的值记录在事件元数据中。                                                                                                                |
| `environment.update_group` |用户组的每个环境角色（贡献者/查看者/无访问权限）已更改，或者组的环境级别访问权限已被删除。                                                                                                                            || `environment.update_member` |用户或服务用户的每个环境角色（贡献者/查看者/无访问权限）已更改，或者其环境级别访问权限已被删除。独立于他们的工作区级别角色。                                                                             |
| `image.delete` |图像被删除。                                                                                                                                                                                                                                               |
| `invite.create_for_workspace` |工作区范围内的邀请链接由工作区管理员生成。                                                                                                                                                                                                    || `member.delete` |一名成员已从工作区中删除。                                                                                                                                                                                                                            || `member.set_role` |工作区成员的工作区范围角色（所有者/经理/用户）已更改。受影响的成员出现在事件目标中，新角色记录在事件元数据中。每个环境的访问权限通过`environment.update_member`单独设置。 |
| `nfs.create` |创建了一个网络文件系统。                                                                                                                                                                                                                                    |
| `nfs.get` |按名称查找现有的 NetworkFileSystem。                                                                                                                                                                                                                || `proxy.add_ip` |静态出口 IP 已添加到代理。                                                                                                                                                                                                                            || `proxy.create` |创建了一个代理。请求的名称和区域记录在事件元数据中。                                                                                                                                                                              |
| `proxy.delete` |代理被删除。                                                                                                                                                                                                                                                |
| `queue.delete` |队列被删除。                                                                                                                                                                                                                                                || `queue.get` |通过 ID 查找现有队列。                                                                                                                                                                                                                              || `sandbox.create` |启动了沙盒。                                                                                                                                                                                                                                             |
| `sandbox.terminate` |沙箱在自然退出之前被明确终止。                                                                                                                                                                                                        |
| `secret.create` |创建了 Secret 或者其值被覆盖（通过 `modal secret create` 或仪表板）。                                                                                                                                                                   |
| `secret.get` |命名的 Secret 被解析为 ID（例如在部署时或在仪表板中打开 Secret 时）。不返回值；只有 Secret 的 ID 和元数据是。                                                                                                   || `token.delete` | API 令牌已被撤销。                                                                                                                                                                                                                                           |
| `user.create` |创建了一个新的用户帐户。                                                                                                                                                                                                                                     |
| `volume.create` |创建了一个卷。                                                                                                                                                                                                                                               |
| `volume.delete` |卷已删除。                                                                                                                                                                                                                                               || `volume.get` |按名称或 ID 查找现有卷。                                                                                                                                                                                                                  |
| `volume.rename` |卷已重命名。                                                                                                                                                                                                                                               |
| `workspace.create` |创建了一个新的工作区。                                                                                                                                                                                                                                        |
| `workspace.downgrade` |工作区已降级为较低的计费计划。                                                                                                                                                                                                                 || `workspace.join` |用户加入工作区（通过接受邀请或自助注册）。                                                                                                                                                                                            |
| `workspace.leave` |用户离开工作区。                                                                                                                                                                                                                                            |
| `workspace.set_budget` |工作区的支出预算已更新。先前和新的每周期预算值记录在事件元数据中。                                                                                                                                            |
| `workspace.set_net_spend_limit` |工作区的自付费用（净额）支出限额已更新。先前和新的每周期限制记录在事件元数据中。                                                                                                                                || `workspace.update_github_autojoin` |链接的 GitHub 组织的成员是否可以在没有邀请的情况下加入工作区已更改。                                                                                                                                                             |
| `workspace.update_identity_provider` |工作区的身份提供程序 (Okta) 配置已更改。启用 SSO 强制实施会立即注销任何非 Okta 会话。                                                                                                                              |

<!-- AUDIT_LOG_V2_ACTIONS_END -->