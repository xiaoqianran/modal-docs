# `modal function`

Inspect Modal Functions.

**Usage**:

```shell
modal function [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `autoscaler`: View and Configure Autoscaler settings for Modal Functions.
* `calls`: Show recent inputs for a Modal Function.
* `info`: Show information about a given Modal Function.
* `logs`: Fetch or stream Function logs.
* `metrics`: Preview and export metrics for a Modal Function.
* `stats`: Show aggregate statistics for a Modal Function.
* `variants`: List the variants of a Modal Function.

## `modal function autoscaler`

View and Configure Autoscaler settings for Modal Functions.

**Usage**:

```shell
modal function autoscaler [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `settings`: Show the current Autsocaling settings for the provided Function.
* `update`: Update the current Autsocaling settings for the provided Function.

### `modal function autoscaler settings`

Show the current Autsocaling settings for the provided Function.

In addition to the current settings, this command also shows any active overrides to these
settings, along with metadata about who overrode the setting, and when. FUNCTION may be a
Function ID or a deployed Function name in the form `APP_NAME/FUNCTION_NAME`.

If a setting's value is the default and not overridden, its value is omitted in the output.

Examples:

Show autoscaling settings for a deployed Function:

```
modal function autoscaler settings my-app/my-function
```

Show autoscaling settings using a Function ID:

```
modal function autoscaler settings fu-1234
```

**Usage**:

```shell
modal function autoscaler settings [OPTIONS] FUNCTION
```

**Options**:

* `--json`: Output as JSON.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

### `modal function autoscaler update`

Update the current Autsocaling settings for the provided Function.

FUNCTION may be a Function ID or a deployed Function name in the form `APP_NAME/FUNCTION_NAME`.

Settings can be modified using the `--max-containers`, `--min-containers`, `--buffer-containers`,
and `--scaledown-window` options.

If provided, Max Containers should be a positive integer, Min/Buffer Containers should be
nonnegative integers, and Scaledown window should be a positive integer measured in seconds.

Examples:

Update Max Containers for a deployed Function:

```
modal function autoscaler update my-app/my-function --max-containers 10
```

Update both Min and Buffer Containers for a Function by ID:

```
modal function autoscaler update fu-1234 --min-containers 3 --buffer-containers 2
```

**Usage**:

```shell
modal function autoscaler update [OPTIONS] FUNCTION
```

**Options**:

* `--max-containers TEXT`: Maximum concurrent containers.
* `--min-containers TEXT`: Minimum number of containers to keep running.
* `--buffer-containers TEXT`: Extra containers to keep warm beyond current demand.
* `--scaledown-window TEXT`: Maximum duration (in seconds) idle containers wait before scaling down.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal function calls`

Show recent inputs for a Modal Function.

FUNCTION may be a Function ID or a deployed Function name in the form
`APP_NAME/FUNCTION_NAME`. Each unique input corresponds to one entry
in the output.

Use `--since` and/or `--until` to fetch all inputs in the time range,
oldest first. `--until` defaults to now. If `--since` is omitted, the preceeding hour
is fetched. If timezones are omitted, the time is interpreted as local time.

`--tail` cannot be combined with either date option.
By default, `--tail` returns the latest 10 inputs, newest first.

Examples:

```
modal function calls my-app/my-function
```

```
modal function calls my-app/my-function --since 2h --until 1h
```

Show recent calls across all variants of a Cls:

```
modal function calls 'my-app/MyClass.*' --all-variants --tail 500
```

Disable color in the output:

```
modal function calls my-app/my-function --no-color
```

**Usage**:

```shell
modal function calls [OPTIONS] FUNCTION
```

**Options**:

* `-n, --tail INTEGER RANGE`: Show up to the last N Function inputs. Defaults to 10. Cannot be combined with --since or --until.  \[1<=x<=1000]
* `--since TEXT`: Fetch inputs enqueued at or after this time (e.g. '2h' or an ISO 8601 datetime).
* `--until TEXT`: Fetch inputs enqueued before this time (e.g. '1h' or an ISO 8601 datetime).
* `--all-variants`: Include inputs from the base Function and all its variants.
* `--show-function-call-id`: Include the Function Call ID in table output.
* `--json`: Output calls as JSON.
* `--no-color`: Disable colors in the output.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal function info`

Show information about a given Modal Function.

FUNCTION can either be a Function ID (`fu-...`) or a deployed Function name in the format
`APP_NAME/FUNCTION_NAME`. The output of this command includes information about any resources
requested by this Function, any scheduling/autoscaling settings, any mounted Volumes or Buckets,
and any HTTP settings.

Examples:

Providing a Function ID directly:

```
modal function info fu-0123456789abcdefghijkl
```

Referring to a Function within a deployed App:

```
modal function info hello-world-app/test_web_function
```

**Usage**:

```shell
modal function info [OPTIONS] FUNCTION
```

**Options**:

* `--json`: Output as JSON.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal function logs`

Fetch or stream Function logs.

By default, this command fetches the last 100 log entries and exits. Use `-f` to
live-stream logs from a running function instead. Fetch and follow are mutually exclusive.

By default, logs are limited to the specified ID. Pass `--all-variants` to
include the base and all its variants, even when specifying a variant ID.

Examples:

Get recent logs based on a function ID:

```
modal function logs fu-12345
```

Get recent logs for a currently deployed Function based on its name:

```
modal function logs my-app/image-gen
```

Follow (stream) logs from a running Function:

```
modal function logs my-app/image-gen -f
```

Fetch the last 1000 entries:

```
modal function logs my-app/image-gen --tail 1000
```

Fetch logs from the last 2 hours:

```
modal function logs my-app/image-gen --since 2h
```

Fetch logs in a specific time range:

```
modal function logs my-app/image-gen --since 2026-09-01T05:00:00 --until 2026-09-01T08:00:00
```

Filter the logs by source:

```
modal function logs my-app/image-gen --source stderr
```

Include timestamps along with function and container IDs on each line:

```
modal function logs my-app/image-gen --timestamps --show-function-id --show-container-id
```

**Usage**:

```shell
modal function logs [OPTIONS] FUNCTION_REF
```

**Options**:

* `-f, --follow`: Stream log output until interrupted
* `--since TEXT`: Start of time range. Accepts ISO 8601 datetime or relative time, e.g. '1d' (1 day ago), '2h', '30m', etc.
* `--until TEXT`: End of time range; accepts same argument types as --since
* `-n, --tail INTEGER`: Show only the last N log entries
* `--search TEXT`: Filter by search text
* `--function-call TEXT`: Filter by FunctionCall ID (fc-\*)
* `--container TEXT`: Filter by Container ID (ta-\*)
* `-s, --source TEXT`: Filter by source: 'stdout', 'stderr', or 'system'
* `--timestamps`: Prefix each line with its timestamp
* `--show-function-id`: Prefix each line with its Function ID
* `--show-function-call-id`: Prefix each line with its FunctionCall ID
* `--show-container-id`: Prefix each line with its Container ID
* `--all-variants`: Include logs from the base and all its variants.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal function metrics`

Preview and export metrics for a Modal Function.

Function may be an Object ID or a deployed Function name in the form
`APP_NAME/FUNCTION_NAME`.

Each metric is a time series over the window from `--since` to `--until`
(default: the last hour, maximum: 31 days). Samples are aggregated into
fixed-width buckets.

Set the width with `--bucket-size`. Each series is limited to 500 buckets, so long windows
need wider buckets. Time bounds are rounded down to bucket boundaries in UTC.
Results may include data before --since and exclude data between the last boundary and --until.

Series are grouped by name. Specify which metrics to return with `--group`.

By default, prints a schema summarizing the date range, bucket size, and time series that would
be returned. Use `--json` or `--csv` to output the raw samples instead.

Preview available Function metrics:

```shell
modal function metrics my-app/my-function
```

Export calls metrics for the last two hours as JSON:

```shell
modal function metrics my-app/my-function --group calls --since 2h --json > metrics.json
```

Export CPU, memory, network, and GPU metrics:

```shell
modal function metrics my-app/my-function --group cpu --group memory --group network --group gpu --json
```

Save container metrics with five-minute buckets as CSV:

```shell
modal function metrics fu-abc123 --group containers --bucket-size 5m --csv > metrics.csv
```

Export all metrics groups across all parametrized variants:

```shell
modal function metrics my-app/MyClass.* --all-variants --json > metrics.json
```

**Usage**:

```shell
modal function metrics [OPTIONS] FUNCTION
```

**Options**:

* `--since TEXT`: Start time: ISO 8601 or relative duration (e.g. 2h). Naive times are local.
* `--until TEXT`: End time; same syntax as --since. Defaults to now.
* `--group TEXT`: Metric group; repeat to select multiple. Defaults to all. Valid values are 'containers', 'cpu', 'memory', 'network', 'gpu', 'calls'.
* `--bucket-size DURATION`: Bucket width: 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 8h, 12h, 1d. By default, a value is chosen that splits the time range into approximately 100 buckets.
* `--json`: Fetch metric samples and output JSON.
* `--csv`: Fetch metric samples and output CSV.
* `--all-variants`: Aggregate the root Function and its variants.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal function stats`

Show aggregate statistics for a Modal Function.

FUNCTION may be a Function ID or a deployed Function name in the form
`APP_NAME/FUNCTION_NAME`. By default, stats describe the specified Function ID.
Pass `--all-variants` to aggregate across all its direct variants.

If --since and --until are omitted, the stats are returned for the last hour.

The available metrics and their definitions are subject to change and are provided
on a best-effort basis. They may be delayed or incomplete. Do not rely on this command
for autoscaler management.

Examples:

Show stats from the last hour using a Function ID:

```
modal function stats fu-abc123
```

Show stats for a deployed Function by name:

```
modal function stats my-app/my-function
```

Show stats across all parameterized instances of a deployed `modal.Cls`:

```
modal function stats 'my-app/MyClass.*' --all-variants
```

Show stats from a specific relative window:

```
modal function stats my-app/my-function --since 5h --until 2h
```

Show stats for an explicit time range as JSON:

```
modal function stats my-app/my-function         --since 2026-08-28T14:00:00Z         --until 2026-08-28T16:00:00Z         --json
```

Show stats for a specific container:

```
modal function stats my-app/my-function --container ta-12345
```

**Usage**:

```shell
modal function stats [OPTIONS] FUNCTION
```

**Options**:

* `--since TEXT`: Start of time range. Treated as local time if a timezone is not supplied.Accepts an ISO 8601 datetime or relative time such as '2h' or '30m'.
* `--until TEXT`: End of time range. Treated as local time if a timezone is not supplied. Accepts the same argument types as --since.
* `--all-variants`: Aggregate the base Function and its variants.
* `--container CONTAINER`: Compute the stats only for this container. Takes precedence over --all-variants.
* `--no-color`: Disable colors in the output.
* `--json`: Output stats as JSON.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal function variants`

List the variants of a Modal Function.

Variants are the parameterized instances of a `modal.Cls` and the Functions created with
`.with_options()`. FUNCTION may be a Function ID or a deployed Function name in the form
`APP_NAME/FUNCTION_NAME`.

By default, the busiest variants are listed first. If you ask for more variants than can be
ranked, or for all of them, they are listed newest first instead.

Examples:

List the busiest variants of a deployed Function:

```
modal function variants my-app/my-function
```

List the parameterized instances of a deployed `modal.Cls`:

```
modal function variants 'my-app/MyClass.*'
```

Show only the ten busiest variants:

```
modal function variants my-app/my-function --limit 10
```

List every variant of a Function ID as JSON:

```
modal function variants fu-abc123 --limit 0 --json
```

**Usage**:

```shell
modal function variants [OPTIONS] FUNCTION
```

**Options**:

* `-n, --limit INTEGER`: Show at most N variants, those running the most containers first. Use 0 to list every variant, newest first.  \[default: 200]
* `--json`: Output as JSON.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.
