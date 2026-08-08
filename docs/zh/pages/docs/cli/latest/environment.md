<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal environment`

创建环境并与环境交互

环境是工作区的细分，允许您部署相同的应用程序
在不同的命名空间中。每个环境都有自己的一套秘密和任何
默认情况下，从环境中的应用程序执行的查找将查找实体
在相同的环境下。

环境的典型用例包括一个用于开发，一个用于
生产，以防止在开发新功能时覆盖生产应用程序
同时仍然能够将更改部署到实时环境。

**用法**：

```shell
modal environment [OPTIONS] COMMAND [ARGS]...
```

**选项**：* `--help`：显示此消息并退出。

**命令**：

* `billing`：查看给定环境的账单和使用信息。
* `create`：在当前工作空间中创建一个新环境。
* `delete`：删除当前工作空间中的环境。
* `list`：列出当前工作空间中的所有环境。
* `roles`：管理用户和服务用户的环境角色。
* `update`：更新环境级别设置。

## `modal environment billing`

查看给定环境的账单和使用信息。

**用法**：

```shell
modal environment billing [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `report`：生成指定环境的计费报告。
* `summary`：生成指定环境的账单摘要。

### `modal environment billing report`

生成指定环境的计费报告。

可以通过设置 `--start` / `--end` 日期来提供报告范围（`--end` 默认为“现在”）
或者使用 `--for` 请求日期范围（例如，`--for today`、`--for 'last month'`）。

该命令提供了一个 CLI 前端
[`Environment.billing.report`](https://modal.com/docs/sdk/py/latest/Environment#billingreport)
API。

请注意，与 API 一样，包含开始日期，不包含结束日期。
仅报告完整时间间隔的数据。使用 `--for` 是定义
完整的区间。此外，`--show-resources`选项进一步按资源划分每个桶中的成本
生成它的（CPU、内存、特定 GPU 类型等）。注意具体的资源类型
随着 Modal 计费模式的发展，报告中包含的内容可能会发生变化。

示例：

```bash
modal environment billing report --start 2025-12-01 --end 2026-01-01

modal environment billing report --for "last month" --tag-names team,project

modal environment billing report test_env --for today --resolution h

modal environment billing report test_env --for "this month" --show-resources

modal environment billing report prod_env --for yesterday -r h --tz local

modal environment billing report main_env --for "last month" --csv > report.csv

modal environment billing report main_env --start 2025-12-01 --json > report.json
```

**用法**：

```shell
modal environment billing report [OPTIONS] [ENVIRONMENT_NAME]
```

**选项**：

* `--start TEXT`：开始日期。日期（默认为 UTC）：ISO 格式 (2025-01-01) 或相对格式（昨天、3 天前等）。
* `--end TEXT`：结束日期。日期（默认为 UTC）：ISO 格式 (2025-01-01) 或相对格式（昨天、3 天前等）。默认为现在。
* `--for TEXT`：方便范围：今天、昨天、本周、上周、本月、上个月。
* `-r, --resolution TEXT`：时间分辨率：“d”（每天）或“h”（每小时）。
* `--tz TEXT`：日期解释的时区：“本地”、偏移量（5、-4、+05:30）或 IANA 名称。需要每小时解决。
* `-t, --tag-names TEXT`：要包含的以逗号分隔的标签名称列表。
* `--show-resources`：进一步按资源类型细分使用情况。
* `--json`：输出为 JSON。
* `--csv`：输出为 CSV。
* `--help`：显示此消息并退出。

### `modal environment billing summary`

生成指定环境的账单摘要。如果没有传递 `environment_name` 的参数，该方法将返回默认值的摘要
环境。

可以通过设置`--for`（例如`--for 'last month'`）来提供汇总范围。如果没有
假设，`--for`默认为“本月”。

仅针对单月间隔（与月份边界对齐）提供摘要。去看
对于较长间隔的摘要，请为该间隔内的每个月调用 `summary`。

该命令提供了一个 CLI 前端
[`Environment.billing.summary`](https://modal.com/docs/sdk/py/latest/Environment#billingsummary)
API。

示例：

```bash
modal environment billing summary # defaults to --for "this month"

modal environment billing summary --for "last month" test_env

modal environment billing summary --for 2026-01
```

**用法**：

```shell
modal environment billing summary [OPTIONS] [ENVIRONMENT_NAME]
```

**选项**：

* `--for TEXT`：显示哪个周期的摘要。接受：“本月”、“上个月”和 ISO 8601 月份 (“YYYY-MM”)。
* `--json`：输出为 JSON。
* `--help`：显示此消息并退出。
## `modal environment create`

在当前工作区中创建一个新环境。

**用法**：

```shell
modal environment create [OPTIONS] NAME
```

**选项**：

* `--restricted`：在新环境上启用RBAC限制
* `--help`：显示此消息并退出。

## `modal environment delete`

删除当前工作区中的环境。

删除所选环境中的所有应用程序并不可撤销地删除该环境。

**用法**：

```shell
modal environment delete [OPTIONS] NAME
```

**选项**：

* `-y, --yes`：运行时不暂停确认。
* `--help`：显示此消息并退出。

## `modal environment list`

列出当前工作区中的所有环境。

**用法**：

```shell
modal environment list [OPTIONS]
```

**选项**：

* `--json`
* `--help`：显示此消息并退出。## `modal environment roles`

管理用户和服务用户的环境角色。

环境角色是“贡献者”（读写）、“查看者”（只读）或
“禁止访问”，并规定对环境的访问。参见
https://modal.com/docs/guide/rbac 了解可以分配哪些主体的详细信息
哪些角色。

**用法**：

```shell
modal environment roles [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `list`：列出环境中每个用户和服务用户的角色
* `update`：更新环境中用户或服务用户的角色

### `modal environment roles list`

列出环境中每个用户和服务用户的角色

**用法**：

```shell
modal environment roles list [OPTIONS] ENVIRONMENT
```

**选项**：
* `--json`
* `--help`：显示此消息并退出。

### `modal environment roles update`

更新环境中用户或服务用户的角色

**用法**：

```shell
modal environment roles update [OPTIONS] ENVIRONMENT PRINCIPAL
```

**选项**：

* `--role [contributor|viewer|no-access]`: 分配的角色\[必需]
* `--service-user`：将 PRINCIPAL 视为服务使用者的名称
* `--help`：显示此消息并退出。

## `modal environment update`

更新环境级别设置。

**用法**：

```shell
modal environment update [OPTIONS] CURRENT_NAME
```

**选项**：

* `--set-name TEXT`：环境的新名称
* `--set-web-suffix TEXT`: 新增环境web后缀（空字符串无后缀）
* `--help`：显示此消息并退出。