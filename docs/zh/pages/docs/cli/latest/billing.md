<!-- modal-docs: machine-translated zh-CN from English source -->

# `modal billing`

查看工作区计费信息。

**用法**：

```shell
modal billing [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**Commands**:

* `report`: Generate a billing report for the workspace.
* `summary`: Generate a billing summary for the workspace.

## `modal billing report`

生成工作区的计费报告。

The report range can be provided by setting `--start` / `--end` dates (`--end` defaults to 'now')
或者使用 `--for` 请求日期范围（例如，`--for today`、`--for 'last month'`）。

该命令提供了一个 CLI 前端
[`Workspace.billing.report`](https://modal.com/docs/sdk/py/latest/Workspace#billingreport) API。

Note that, as with the API, the start date is inclusive and the end date is exclusive.
仅报告完整时间间隔的数据。使用 `--for` 是定义
complete interval.

In addition, the `--show-resources` option further breaks the cost in each bucket by the resource
生成它的（CPU、内存、特定 GPU 类型等）。注意具体的资源类型
随着 Modal 计费模式的发展，报告中包含的内容可能会发生变化。

示例：

```bash
modal billing report --start 2025-12-01 --end 2026-01-01

modal billing report --for "last month" --tag-names team,project

modal billing report --for today --resolution h

modal billing report --for "this month" --show-resources

modal billing report --for yesterday -r h --tz local

modal billing report --for "last month" --csv > report.csv

modal billing report --start 2025-12-01 --json > report.json
```

**用法**：

```shell
modal billing report [OPTIONS]
```

**选项**：

* `--start TEXT`: Start date.日期（默认为 UTC）：ISO 格式 (2025-01-01) 或相对格式（昨天、3 天前等）。
* `--end TEXT`: End date.日期（默认为 UTC）：ISO 格式 (2025-01-01) 或相对格式（昨天、3 天前等）。 Defaults to now.
* `--for TEXT`：方便范围：今天、昨天、本周、上周、本月、上个月。
* `-r, --resolution TEXT`：时间分辨率：“d”（每天）或“h”（每小时）。
* `--tz TEXT`：日期解释的时区：“本地”、偏移量（5、-4、+05:30）或 IANA 名称。需要每小时解决。
* `-t, --tag-names TEXT`：要包含的以逗号分隔的标签名称列表。
* `--show-resources`：进一步按资源类型细分使用情况。
* `--json`：输出为 JSON。
* `--csv`：输出为 CSV。
* `--help`：显示此消息并退出。

## `modal billing summary`

生成工作区的账单摘要。

可以通过设置`--for`（例如`--for 'last month'`）来提供汇总范围。如果没有
假设，`--for`默认为“本月”。

仅针对单月间隔（与月份边界对齐）提供摘要。 To see
对于较长间隔的摘要，请针对该间隔内的每个月调用 `summary`。

该命令提供了一个 CLI 前端
[`Workspace.billing.summary`](https://modal.com/docs/sdk/py/latest/Workspace#billingsummary) API。

示例：

```bash
modal billing summary # defaults to --for "this month"

modal billing summary --for "last month"

modal billing summary --for 2026-01
```

**用法**：

```shell
modal billing summary [OPTIONS]
```

**选项**：

* `--for TEXT`：显示哪个周期的摘要。接受：“本月”、“上个月”和 ISO 8601 月份 (“YYYY-MM”)。
* `--json`：输出为 JSON。
* `--help`：显示此消息并退出。