# `modal environment`

Create and interact with Environments

Environments are sub-divisions of workspaces, allowing you to deploy the same app
in different namespaces. Each environment has their own set of Secrets and any
lookups performed from an app in an environment will by default look for entities
in the same environment.

Typical use cases for environments include having one for development and one for
production, to prevent overwriting production apps when developing new features
while still being able to deploy changes to a live environment.

**Usage**:

```shell
modal environment [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `billing`: View billing and usage info for the given Environment.
* `create`: Create a new environment in the current workspace.
* `delete`: Delete an environment in the current workspace.
* `list`: List all environments in the current workspace.
* `roles`: Manage the Environment Roles of users and service users.
* `update`: Update environment-level settings.

## `modal environment billing`

View billing and usage info for the given Environment.

**Usage**:

```shell
modal environment billing [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `report`: Generate a billing report for the specified Environment.
* `summary`: Generate a billing summary for the specified Environment.

### `modal environment billing report`

Generate a billing report for the specified Environment.

The report range can be provided by setting `--start` / `--end` dates (`--end` defaults to 'now')
or by requesting a date range using `--for` (e.g., `--for today`, `--for 'last month'`).

This command provides a CLI frontend for the
[`Environment.billing.report`](https://modal.com/docs/sdk/py/latest/Environment#billingreport)
API.

Note that, as with the API, the start date is inclusive and the end date is exclusive.
Data will be reported for full intervals only. Using `--for` is a convenient way to define a
complete interval.

In addition, the `--show-resources` option further breaks the cost in each bucket by the resource
that generated it (CPU, Memory, specific GPU types, etc.). Note that the specific resource types
included in the report are subject to change as Modal's billing model evolves.

Examples:

```bash
modal environment billing report --start 2025-12-01 --end 2026-01-01

modal environment billing report --for "last month" --tag-names team,project

modal environment billing report test_env --for today --resolution h

modal environment billing report test_env --for "this month" --show-resources

modal environment billing report prod_env --for yesterday -r h --tz local

modal environment billing report main_env --for "last month" --csv > report.csv

modal environment billing report main_env --start 2025-12-01 --json > report.json
```

**Usage**:

```shell
modal environment billing report [OPTIONS] [ENVIRONMENT_NAME]
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

### `modal environment billing summary`

Generate a billing summary for the specified Environment.

If no argument for `environment_name` is passed, the method returns a summary for the default
environment.

The summary range can be provided by setting `--for` (e.g `--for 'last month'`). If not
provided, `--for` defaults to "this month".

Summaries are provided for single month intervals (aligned to the month boundary) only. To see
summaries for longer intervals, call `summary` for each month in the interval.

This command provides a CLI frontend for the
[`Environment.billing.summary`](https://modal.com/docs/sdk/py/latest/Environment#billingsummary)
API.

Examples:

```bash
modal environment billing summary # defaults to --for "this month"

modal environment billing summary --for "last month" test_env

modal environment billing summary --for 2026-01
```

**Usage**:

```shell
modal environment billing summary [OPTIONS] [ENVIRONMENT_NAME]
```

**Options**:

* `--for TEXT`: What cycle to show a summary for. Accepts: "this month", "last month", and ISO 8601 months ("YYYY-MM").
* `--json`: Output as JSON.
* `--help`: Show this message and exit.

## `modal environment create`

Create a new environment in the current workspace.

**Usage**:

```shell
modal environment create [OPTIONS] NAME
```

**Options**:

* `--restricted`: Enable RBAC restrictions on the new environment
* `--help`: Show this message and exit.

## `modal environment delete`

Delete an environment in the current workspace.

Deletes all apps in the selected environment and deletes the environment irrevocably.

**Usage**:

```shell
modal environment delete [OPTIONS] NAME
```

**Options**:

* `-y, --yes`: Run without pausing for confirmation.
* `--help`: Show this message and exit.

## `modal environment list`

List all environments in the current workspace.

**Usage**:

```shell
modal environment list [OPTIONS]
```

**Options**:

* `--json`
* `--help`: Show this message and exit.

## `modal environment roles`

Manage the Environment Roles of users and service users.

An Environment Role is one of 'contributor' (read-write), 'viewer' (read-only), or
'no-access', and dictates access to Environments. See
https://modal.com/docs/guide/rbac for details on which principals can be assigned
which roles.

**Usage**:

```shell
modal environment roles [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `list`: List the roles of each user and service user in an Environment
* `update`: Update a user's or service user's role in an Environment

### `modal environment roles list`

List the roles of each user and service user in an Environment

**Usage**:

```shell
modal environment roles list [OPTIONS] ENVIRONMENT
```

**Options**:

* `--json`
* `--help`: Show this message and exit.

### `modal environment roles update`

Update a user's or service user's role in an Environment

**Usage**:

```shell
modal environment roles update [OPTIONS] ENVIRONMENT PRINCIPAL
```

**Options**:

* `--role [contributor|viewer|no-access]`: Role to assign  \[required]
* `--service-user`: Treat PRINCIPAL as the name of a service user
* `--help`: Show this message and exit.

## `modal environment update`

Update environment-level settings.

**Usage**:

```shell
modal environment update [OPTIONS] CURRENT_NAME
```

**Options**:

* `--set-name TEXT`: New name of the environment
* `--set-web-suffix TEXT`: New web suffix of environment (empty string is no suffix)
* `--help`: Show this message and exit.
