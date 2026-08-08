<!-- modal-docs: machine-translated zh-CN from English source -->

# 环境

```python
class Environment(modal.object.Object)
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

## 对象

```python
objects: EnvironmentManager
```

具有管理环境对象方法的命名空间。

### 对象.create

```python
create(self, name, *, restricted=False, client=None)
```

创建一个新环境。

**示例：**

```python notest
modal.Environment.objects.create("my-environment")
```

### 对象.list

```python
list(self, *, client=None)
```返回水合环境对象的列表。

**示例：**

```python notest
environments = modal.Environment.objects.list()
print([e.name for e in environments])
```

### 对象.删除

```python
delete(self, name, *, client=None)
```

删除已命名的环境。

警告：这是不可逆的，并且会间接删除环境中的所有对象。

**示例：**

```python notest
modal.Environment.objects.delete("my-environment")
```

## 角色

```python
roles: EnvironmentRolesManager
```

具有用于管理用户和服务用户的环境角色的方法的命名空间。

有关环境角色的更多信息，请参阅https://modal.com/docs/guide/rbac。

### 角色.list

```python
list(self)
```

枚举工作区中每个用户和服务用户的环境角色。

**示例：**

```python notest
roles = modal.Environment.from_name("my-env").roles.list()
print(roles)
# {
#     "users": {"alice": "contributor", "bob": "viewer", "carol": "contributor"},
#     "service_users": {"alice-bot": "contributor", "ops-bot": "viewer", "ci-bot": "no-access"},
# }
```

### 角色.更新

```python
update(self, *, users=None, service_users=None)
```

更新用户和服务用户的环境角色。
每个角色都是“贡献者”、“查看者”或“无访问权限”之一。服务用户可以是
在任何环境中分配角色，而工作区成员只能分配一个角色
在受限环境中的作用。

**示例：**

```python notest
env = modal.Environment.from_name("my-restricted-env")
env.roles.update(
    users={"alice": "contributor", "bob": "viewer"},
    service_users={"alice-bot": "contributor"},
)
```

## 来自\_context

```python
from_context(*, client=None)
```

使用当前上下文查找环境对象。

该方法返回本地配置定义的环境
（即您的活动配置文件或 `MODAL_ENVIRONMENT` 环境变量），或者
当本地未定义时，它会从服务器获取默认环境。
如果在 Modal 容器内调用，它将返回该容器的环境
与 相关联。

## 来自\_name

```python
from_name(name, *, create_if_missing=False, client=None)
```

使用名称查找环境对象。

## 计费

```python
billing: EnvironmentBillingManager
```

环境计费 API 的命名空间。

```python
__init__(self, environment)
```

MDMD：忽略

### 账单.报告

```python
report(self, *, start, end=None, resolution="d", tag_names=None)
```

返回环境使用的成本报告，按对象和时间细分。

**参数**

<Parameter name="start" type="datetime" description="Start of the report, inclusive and rounded to the beginning of the interval. Must be in UTC or timezone-naive (interpreted as UTC)." />
<Parameter name="end" type="datetime | None" defaultValue="None" description="End of the report, exclusive. Must be in UTC or timezone-naive. Partial final intervals will be excluded from the report." />
<Parameter name="resolution" type="str" defaultValue="&quot;d&quot;" description="Resolution, e.g. &quot;d&quot; for daily or &quot;h&quot; for hourly." />
<Parameter name="tag_names" type="list[str] | None" defaultValue="None" description="List of tag names; each row will include the tag name and value in use for that object during the relevant time interval. Pass ⟦T23⟧ to include all tags in the report." />

**退货**

`BillingReportItem` 数据类列表。每个项目报告的成本归因于
给定时间间隔内的特定 Modal 对象。成本进一步细分为
生成它的资源类型（例如 CPU、内存、特定 GPU 使用情况）。
请注意，细分中包含的特定资源类型可能会发生变化
随着 Modal 计费模式的发展。

**另见**

* [`modal environment billing report`](https://modal.com/docs/cli/latest/environment#modal-environment-billing-report):
  环境报告 CLI，具有相对时间范围查询的便利功能
  和 JSON/CSV 输出。
* [`Workspace.billing.report()`](https://modal.com/docs/sdk/py/latest/Workspace#billingreport):
  适用于整个工作区的类似报告 API。

### 账单.摘要

```python
summary(self, cycle=None)
```

返回由 `cycle` 确定的单个计费周期内的环境成本摘要。

与类似的 `Workspace.billing.summary()` 不同，此 API 仅发出计量成本信息。这是因为由于积分、免费存储等而导致的账单调整是
应用在工作空间级别，因此不能归因于各个环境。

**参数**

<Parameter name="cycle" type="str | datetime | None" defaultValue="None" description="Start of the summary, inclusive. Must be the first of a month, and must be in UTC or timezone-naive (interpreted as UTC). If provided as a string, it must either be formatted as an ISO 8601 month (YYYY-MM), or must be one of the convenience spellings &quot;this month&quot; or &quot;last month&quot;. If not provided, ⟦T29⟧ defaults to the first of the current month (in which case a summary is generated for the current billing cycle)." />

**退货**

包含以下字段的单个`EnvironmentBillingSummary`数据类：

* `metered_cost` 代表调整前的成本，以及
* `metered_cost_breakdown` 包含按 Modal 资源划分的成本明细
  产生它的。确切的键可能会随着 Modal 的计费而变化
  模型不断发展。

所有值均报告为 `decimal.Decimal`s。

**另见**

* [`modal environment billing summary`](https://modal.com/docs/cli/latest/billing#modal-environment-billing-summary):
  环境摘要 CLI，具有相对时间范围查询的便利功能。
* [`Environment.billing.report()`](https://modal.com/docs/sdk/py/latest/Environment#billingreport):
仅限于特定环境的类似报告 API。