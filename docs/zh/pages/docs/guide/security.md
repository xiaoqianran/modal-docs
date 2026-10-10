<!-- modal-docs: machine-translated zh-CN from English source -->

# Modal 的安全和隐私

本页概述了 Modal 的安全和隐私承诺。

我们的[信任中心](https://trust.modal.com/) 提供[合规](#compliance-standards) 文档，包括我们的 SOC 2 Type II 报告、我们的子处理者列表以及我们的安全控制详细信息。

## 信息安全计划

我们的信息安全 (InfoSec) 计划涵盖三个实践领域：应用程序安全、企业安全以及网络和基础设施安全。

<Collapsible title="Application security (AppSec)">

AppSec 涵盖了我们如何构建、测试、审查和部署 Modal 平台。

* 我们使用内存安全的编程语言构建我们的软件，包括 Rust（用于我们的工作运行时和存储基础设施）和 Python（用于我们的 API 服务器和 Modal 客户端）。
* 软件依赖性会自动审核已知漏洞。
* 我们做出的决策会最大限度地减少我们的攻击面。大多数与 Modal 的交互都在 gRPC API 中得到了很好的描述，并通过我们的开源命令行工具和 Python 客户端库 [`modal`](https://pypi.org/project/modal) 进行。
* 我们拥有自动化综合监控测试应用程序，可以在运行时持续检查网络和应用程序的隔离情况。
* 我们对所有服务强制使用 HTTPS (TLS)，包括我们的公共网站和仪表板。我们的[客户端库](https://pypi.org/project/modal) 通过 TLS 连接到 Modal 的服务器，并在每个连接上验证 TLS 证书。
* 您的数据在传输过程中和静态时均已加密。
* 所有公共 Modal API 均使用 [TLS 1.3](https://datatracker.ietf.org/doc/html/rfc8446)。
* 内部代码审查是使用基于 PR 的开发工作流程进行的，并且我们聘请外部渗透测试公司来评估我们的软件安全性。

</Collapsible>

<Collapsible title="Corporate security (CorpSec)">

CorpSec 涵盖我们的员工如何访问内部系统。

* 访问内部系统需要通过我们的身份提供商进行单点登录 (SSO)。
* 所有员工帐户都需要防网络钓鱼多重身份验证 (MFA)。
* 我们定期审核对内部系统的访问。
* 员工笔记本电脑已加入移动设备管理 (MDM)，并强制执行全磁盘加密。

</Collapsible>

<Collapsible title="Network and infrastructure security (InfraSec)">

InfraSec 涵盖了我们如何保护运行您的工作负载的基础设施。

* 我们通过第三方可观测性提供商持续监控平台日志和指标。
* 每个容器都在自己的沙箱中运行，与主机隔离，使用 [gVisor](https://github.com/google/gvisor) 或 microVM 等原语。
* 我们每年都会进行业务连续性和安全事件演习。

</Collapsible>

### 漏洞修复

我们在以下时间范围内修复 Modal 系统中的漏洞（从修复可用时开始计算）。严重性基于漏洞的 CVSS 评级以及我们对其对 Modal 影响的评估。

#### 严重性时间范围

* **重要：** 24 小时
* **最高：** 1 周
* **中：** 1 个月
* **低：** 3 个月
* **信息：** 3 个月或更长时间

### 漏洞赏金计划

我们欢迎安全社区负责任地披露信息，并通过 HackerOne 运行私人错误赏金计划。要参与，请发送电子邮件至 <security@modal.com> 并附上您的 HackerOne 用户名，我们将发送邀请。执行安全研究时，您必须使用名称以 `-H1-<username>` 结尾的模态工作区，其中 `<username>` 是您的 HackerOne 用户名。

## 数据隐私

本节介绍每种类型的数据保留多长时间、哪些产品根本不保留数据以及数据的存储位置。

### 数据保留

保留率因产品而异；下表显示了每种类型数据的保留时间。所有存储的数据都是静态加密的。
|数据|产品 |保留|| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
|输入和输出| [函数](/docs/guide)（`.remote`、`.spawn`、`.map`、[Web 函数](/docs/guide/webhooks)、计划函数）|最多7天，然后删除|
|请求和响应有效负载 | [服务器](/docs/guide/servers) 和 [自动端点](/docs/guide/endpoints) |不存储 - 直接代理到您的容器 |
|应用程序和容器日志 | [功能](/docs/guide), [沙箱](/docs/guide/sandboxes) |取决于计划：Starter 1 天，Team 30 天，Enterprise 上可配置（请参阅[定价](/pricing)）|
|审核日志|工作空间（企业）|每个企业合同（请参阅[审核日志](/docs/guide/audit-logs)）||文件 | [卷](/docs/guide/volumes)、[图像](/docs/guide/images) |持续存在直至您删除它们 |
|内存快照| [函数内存快照](/docs/guide/memory-snapshots)、[沙盒内存快照](/docs/guide/sandbox-snapshots) |创建后 7 天 |
|文件系统快照 | [沙盒文件系统快照](/docs/guide/sandbox-snapshots) |创建后 30 天（可配置；存储为图像）|
|目录快照 | [沙盒目录快照](/docs/guide/sandbox-snapshots) |创建后 30 天（可配置）||条目 | [字典](/docs/guide/dicts) |上次读取或写入后 7 天 |
|隔断| [队列](/docs/guide/queues) |可配置的每个分区 TTL（默认 24 小时）|
|应用程序、功能和容器元数据 |所有产品 |在您的帐户的生命周期内存储 |

<Callout variant="info">

虽然我们在操作平台时存储应用程序日志和元数据，但只有在您允许的情况下才能访问它们，以帮助解决问题。

</Callout>

### 零数据保留

[专用](/docs/guide/dedicated-endpoints) 和[共享](/docs/guide/shared-endpoints) 推理端点的数据保留为零。请求和响应有效负载永远不会写入磁盘，并且仅作为动态网络流量通过 Modal。

### 数据驻留

请参阅我们的[数据驻留指南](/docs/guide/data-residency)，了解每种类型数据的存储位置以及可用于满足驻留要求的控件。

## 共同责任模型

Modal 优先考虑客户数据的完整性、安全性和可用性。根据我们的共同责任模式，您还承担以下领域的责任。
|面积 |莫代尔 |客户|
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|访问和秘密|提供访问控制，包括 SSO、SCIM、API 令牌和 RBAC，以及用于存储凭据的 [Secrets](/docs/guide/secrets) 管理。                                                       |管理工作区中的身份、分配角色以及轮换和删除 API 令牌。拥有您的秘密的内容和轮换。                                                                                               ||加密与网络安全|使用 TLS 1.3 加密传输中的数据和静态数据。                                                                                                                                                |决定您公开哪些端点以及如何对它们进行身份验证。应用数据所需的任何额外加密，例如在敏感字段到达 Modal 之前对其进行加密。                                                    |
|漏洞|在我们的[严重性时间范围](#severity-timeframes)内修补平台和运行时，并审核我们的依赖项是否存在已知漏洞。                                                   |修补您的图像、依赖项和代码。                                                                                                                                                                                            |
|不受信任的代码 |提供隔离原语，用于通过[受限函数和沙箱](/docs/guide/restricted-access#sandboxes-offer-an-alternative-interface-for-untrusted-code)运行不受信任的代码。 |使用这些原语并带有出口限制、资源限制和超时等防护措施，运行不受信任的代码，例如 LLM 生成的或最终用户提交的代码。确保机密和凭证远离不受信任的工作负载。 |
|数据生命周期 |确保托管存储的持久性并应用我们的[保留](#data-retention) 和删除策略。                                                                                     |维护您在 Modal 中存储的数据的备份，并定期验证其完整性。                                                                                                                                                 ||运营|操作平台以实现高可用性、对其进行监控并对平台事件做出响应。                                                                                                     |监控您的应用程序并设计故障转移。                                                                                                                                                                                    |
|合规|在我们的[信任中心](https://trust.modal.com) 上提供我们的审计报告和控制文档。                                                                                       |确定哪些法律和法规适用于您的组织和您的数据，并配置和使用 Modal 来满足这些法律和法规。                                                                                                              |

### 安全功能我们在产品中提供安全功能，帮助您保护工作负载，例如单点登录、基于角色的访问控制 (RBAC)、沙箱网络访问控制、审核日志和客户提供的加密密钥。

|产品 |特点|
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|工作空间 | [阻止未经身份验证的端点](/docs/guide/webhook-proxy-auth#blocking-unauthenticated-urls)、[基于角色的访问控制 (RBAC)](/docs/guide/rbac)、[代理（静态出口 IP）](/docs/guide/proxy-ips) |
|功能| [受限功能](/docs/guide/restricted-access) ||沙箱 | [出站访问控制](/docs/guide/sandbox-networking#outbound-access-control)、[入站访问控制](/docs/guide/sandbox-networking#inbound-access-control) |
|身份 | [Okta SSO](/docs/guide/okta-sso)、[Microsoft Entra SSO](/docs/guide/entra-sso)、[自定义 SAML SSO](/docs/guide/saml-sso)、[SCIM 集成](/docs/guide/scim?idp=okta)、[OIDC 集成](/docs/guide/oidc-integration) |
|可观察性| [审核日志](/docs/guide/audit-logs)、[Datadog 集成](/docs/guide/datadog-integration)、[OpenTelemetry 集成](/docs/guide/otel-integration) |
|加密 | [客户提供的加密密钥](/docs/guide/customer-supplied-encryption-keys) |

## 合规标准

### 系统和组织控制 (SOC) 2 类型 II

如需我们最新的 SOC 2 Type II 审计报告，请访问我们的[信任中心](https://trust.modal.com) 申请访问。

### 一般数据保护条例 (GDPR)

我们的[信任中心](https://trust.modal.com) 提供了数据处理附录 (DPA)。### 健康保险流通与责任法案 (HIPAA)

<Callout variant="gated-feature">
请联系 <a href="mailto:sales@modal.com">sales@modal.com</a>，开始使用 <a href="/pricing">企业计划</a> 的 HIPAA。
</Callout>

以下产品超出范围，不应用于受保护的健康信息 (PHI)：

|超出 PHI 范围 |笔记|
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [卷 v1](/docs/guide/volumes) |使用 [Volumes v2](/docs/guide/volumes#volumes-v2) 代替 |
| [图片](/docs/guide/images) |排除[文件系统和目录快照](/docs/guide/sandbox-snapshots) |
| [内存快照](/docs/guide/memory-snapshots) | — |
|用户代码| — |

## 联系方式

<security@modal.com>