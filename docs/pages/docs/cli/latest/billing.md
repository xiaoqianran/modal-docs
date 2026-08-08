# `modal billing`

View workspace billing information.

**Usage**:

```shell
modal billing [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `report`: Generate a billing report for the workspace.
* `summary`: Generate a billing summary for the workspace.

## `modal billing report`

Generate a billing report for the workspace.

The report range can be provided by setting `--start` / `--end` dates (`--end` defaults to 'now')
or by requesting a date range using `--for` (e.g., `--for today`, `--for 'last month'`).

This command provides a CLI frontend for the
[`Workspace.billing.report`](https://modal.com/docs/sdk/py/latest/Workspace#billingreport) API.

Note that, as with the API, the start date is inclusive and the end date is exclusive.
Data will be reported for full intervals only. Using `--for` is a convenient way to define a
complete interval.

In addition, the `--show-resources` option further breaks the cost in each bucket by the resource
that generated it (CPU, Memory, specific GPU types, etc.). Note that the specific resource types
included in the report are subject to change as Modal's billing model evolves.

Examples:

```bash
modal billing report --start 2025-12-01 --end 2026-01-01

modal billing report --for "last month" --tag-names team,project

modal billing report --for today --resolution h

modal billing report --for "this month" --show-resources

modal billing report --for yesterday -r h --tz local

modal billing report --for "last month" --csv > report.csv

modal billing report --start 2025-12-01 --json > report.json
```

**Usage**:

```shell
modal billing report [OPTIONS]
```

**Options**:

* `--start TEXT`: Start date. Date (in UTC by default): ISO format (2025-01-01) or relative (yesterday, 3 days ago, etc.).
* `--end TEXT`: End date. Date (in UTC by default): ISO format (2025-01-01) or relative (yesterday, 3 days ago, etc.). Defaults to now.
* `--for TEXT`: Convenience range: today, yesterday, this week, last week, this month, last month.
* `-r, --resolution TEXT`: Time resolution: 'd' (daily) or 'h' (hourly).
* `--tz TEXT`: Timezone for date interpretation: 'local', offset (5, -4, +05:30), or IANA name. Requires hourly resolution.
* `-t, --tag-names TEXT`: Comma-separated list of tag names to include.
* `--show-resources`: Further break down usage by resource type.
* `--json`: Output as JSON.
* `--csv`: Output as CSV.
* `--help`: Show this message and exit.

## `modal billing summary`

Generate a billing summary for the workspace.

The summary range can be provided by setting `--for` (e.g `--for 'last month'`). If not
provided, `--for` defaults to "this month".

Summaries are provided for single month intervals (aligned to the month boundary) only. To see
summaries for longer intervals, call `summary` for each month in the interval.

This command provides a CLI frontend for the
[`Workspace.billing.summary`](https://modal.com/docs/sdk/py/latest/Workspace#billingsummary) API.

Examples:

```bash
modal billing summary # defaults to --for "this month"

modal billing summary --for "last month"

modal billing summary --for 2026-01
```

**Usage**:

```shell
modal billing summary [OPTIONS]
```

**Options**:

* `--for TEXT`: What cycle to show a summary for. Accepts: "this month", "last month", and ISO 8601 months ("YYYY-MM").
* `--json`: Output as JSON.
* `--help`: Show this message and exit.
