<!-- modal-docs: machine-translated zh-CN from English source -->

# 工作区

```python
class Workspace(modal.object.Object)
```

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作
需要时会懒洋洋地补充水分。主要用例是当您需要时
访问对象元数据，例如其 ID。

*在 v0.72.39 中添加*：此方法取代了已弃用的 `.resolve()` 方法。

## 姓名

```python
name(self)
```

## 成员

```python
members: WorkspaceMembersManager
```

具有管理工作空间成员身份的方法的命名空间。

### 成员.list

```python
list(self)
```

返回工作区的成员。

**示例：**

```python notest
members = modal.Workspace.from_context().members.list()
print([m.name for m in members])
```

## 来自\_context```python
from_context(*, client=None)
```

查找与当前上下文关联的工作区。

这将返回活动模态凭据进行身份验证的工作空间
（即您的活动配置文件或 `MODAL_TOKEN_ID` / `MODAL_TOKEN_SECRET` 环境
变量）。如果在 Modal 容器内调用，它将返回该容器所在的工作区
容器正在运行。

## 计费

```python
billing: WorkspaceBillingManager
```

Workspace 计费 API 的命名空间。

### 计费费率

```python
rates(self)
```

返回给定工作区的当前定价。

**退货**

包含成本值的单个映射。所有值均报告为 `decimal.Decimal`s。

### 账单.报告

```python
report(self, *, start, end=None, resolution="d", tag_names=None)
```
返回所有工作区使用情况的成本报告，按对象和时间细分。

**参数**

<Parameter name="start" type="datetime" description="Start of the report, inclusive and rounded to the beginning of the interval. Must be in UTC or timezone-naive (interpreted as UTC)." />
<Parameter name="end" type="datetime | None" defaultValue="None" description="End of the report, exclusive. Must be in UTC or timezone-naive. Partial final intervals will be excluded from the report." />
<Parameter name="resolution" type="str" defaultValue="&quot;d&quot;" description="Resolution, e.g. &quot;d&quot; for daily or &quot;h&quot; for hourly." />
<Parameter name="tag_names" type="list[str] | None" defaultValue="None" description="List of tag names; each row will include the tag name and value in use for that object during the relevant time interval. Pass ⟦T31⟧ to include all tags in the report." />

**退货**

`BillingReportItem` 数据类列表。每个项目报告的成本归因于
给定时间间隔内的特定 Modal 对象。成本进一步细分为
生成它的资源类型（例如 CPU、内存、特定 GPU 使用情况）。请注意
细目中包含的具体资源类型可能会根据 Modal 的变化而变化
计费模式不断演变。

**另见**

* [`modal billing report`](https://modal.com/docs/cli/latest/billing#modal-billing-report):工作区报告 CLI，具有围绕相对时间范围查询的便利功能
  和 JSON/CSV 输出。
* [`Environment.billing.report()`](https://modal.com/docs/sdk/py/latest/Environment#billingreport):
  仅限于特定环境的类似报告 API。

### 账单.摘要

```python
summary(self, cycle=None)
```

返回由 `cycle` 确定的单个计费周期内工作区成本的摘要

**参数**

<Parameter name="cycle" type="str | datetime | None" defaultValue="None" description="Start of the summary, inclusive. Must be the first of a month, and must be in UTC or timezone-naive (interpreted as UTC). If provided as a string, it must either be formatted as an ISO 8601 month (YYYY-MM), or must be one of the convenience spellings &quot;this month&quot; or &quot;last month&quot;. If not provided, ⟦T36⟧ defaults to the first of the current month (in which case a summary is generated for the current billing cycle)." />

**退货**

包含以下字段的单个`WorkspaceBillingSummary`数据类：

* `metered_cost` 代表调整前的成本，
* `billed_cost` 代表实际开具发票的成本，包括所有调整，
* `adjustments` 包含弥补差异的调整细目
  `metered_cost` 和 `billed_cost` 之间。这可以包括免费数量的折扣
存储、由于计划积分而进行的调整等。其确切密钥取决于
  随着 Modal 计费模式的发展而变化。
* `metered_cost_breakdown` 包含按 Modal 资源划分的成本明细
  产生它的。确切的键可能会随着 Modal 的计费而变化
  模型不断发展。

所有值均报告为 `decimal.Decimal`s。

**另见**

* [`modal billing summary`](https://modal.com/docs/cli/latest/billing#modal-billing-summary):
  工作区摘要 CLI，具有围绕相对时间范围查询的便利功能。
* [`Environment.billing.summary()`](https://modal.com/docs/sdk/py/latest/Environment#billingsummary):
  仅限于特定环境的类似摘要 API。

## 代理\_tokens

```python
proxy_tokens: WorkspaceProxyTokenManager
```具有用于管理工作空间中代理令牌的方法的命名空间。

有关代理令牌的更多信息，请参阅[指南](https://modal.com/docs/guide/webhook-proxy-auth)。

### proxy\_tokens.create

```python
create(self)
```

为工作区创建新的代理令牌。

**使用**

```python notest
token = modal.Workspace.from_context().proxy_tokens.create()
print(token.token_id, token.token_secret)
```

### proxy\_tokens.list

```python
list(self, environment_name=None)
```

列出工作区中的代理令牌。

**参数**

<Parameter name="environment_name" type="Optional[str]" defaultValue="None" description="When provided, list only the tokens associated with this environment." />

**使用**

```python notest
ws = modal.Workspace.from_context()

# List all proxy tokens in the Workspace
tokens = ws.proxy_tokens.list()
print([t.token_id for t in tokens])

# List only the proxy tokens associated with a specific Environment
env_tokens = ws.proxy_tokens.list(environment_name="prod")
```

### proxy\_tokens.allow

```python
allow(self, proxy_token_id, environment_name)
```

允许代理令牌对给定环境的请求进行身份验证。

**参数**

<Parameter name="proxy_token_id" type="str" description="The token ID (⟦T47⟧) to operate on." />
<Parameter name="environment_name" type="str" description="The name of the environment to allow access to." />

**使用**

```python notest
ws = modal.Workspace.from_context()
token = ws.proxy_tokens.create()
ws.proxy_tokens.allow(token.token_id, "prod")
```

### proxy\_tokens.revoke

```python
revoke(self, proxy_token_id, environment_name)
```

撤销代理令牌对给定环境的访问权限。
代理令牌不会被删除，它将继续对任何请求进行身份验证
与其关联的其他环境。

**参数**

<Parameter name="proxy_token_id" type="str" description="The token ID (⟦T48⟧) to operate on." />
<Parameter name="environment_name" type="str" description="The name of the environment to revoke access from." />

**使用**

```python notest
ws = modal.Workspace.from_context()
ws.proxy_tokens.revoke(token_id, "prod")
```

### proxy\_tokens.delete

```python
delete(self, proxy_token_id)
```

从工作区中删除代理令牌。

这无法恢复。当前使用该代币的任何客户将立即
失去对关联资源的访问。

**参数**

<Parameter name="proxy_token_id" type="str" description="The token ID (⟦T49⟧) to delete." />

**使用**

```python notest
modal.Workspace.from_context().proxy_tokens.delete(token_id)
```

## 设置

```python
settings: WorkspaceSettingsManager
```

工作区设置 API 的命名空间。

### settings.valid\_settings

```python
valid_settings(cls)
```

### 设置.list

```python
list(self)
```

返回当前工作区设置。

**退货**

`WorkspaceSettings` 数据类。

### 设置.set

```python
set(self, name, value)
```

将工作区设置设置为新值。必须是工作区经理或所有者。

可以更新以下设置：

* 镜像构建器版本：镜像构建器版本决定了我们的基础镜像中包含的软件。
* default-environment：当 SDK 或 CLI 方法中省略环境时的默认环境。

**参数**

<Parameter name="name" type="str" description="The name of the setting." />
<Parameter name="value" type="str" description="The new value of the setting." />

**使用**

```python notest
modal.Workspace.from_context().settings.set("default-environment", "dev")
```