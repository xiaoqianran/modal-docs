# `modal server`

Inspect Modal Servers.

**Usage**:

```shell
modal server [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `autoscaler`: View and Configure Autoscaler settings for Modal Servers.
* `info`: Show information about a given Modal Server.
* `logs`: Fetch or stream Server logs.
* `metrics`: Preview and export metrics for a Modal Server.
* `requests`: Show recent requests handled by a Modal Server.
* `stats`: Show aggregate statistics for a Modal Server.

## `modal server autoscaler`

View and Configure Autoscaler settings for Modal Servers.

**Usage**:

```shell
modal server autoscaler [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `settings`: Show the current Autsocaling settings for the provided Server.
* `update`: Update the current Autsocaling settings for the provided Server.

### `modal server autoscaler settings`

Show the current Autsocaling settings for the provided Server.

In addition to the current settings, this command also shows any active overrides to these
settings, along with metadata about who overrode the setting, and when. SERVER may be a
Server ID or a deployed Server name in the form `APP_NAME/SERVER_NAME`.

If a setting's value is the default and not overridden, its value is omitted in the output.

Examples:

Show autoscaling settings for a deployed Server:

```
modal server autoscaler settings my-app/my-server
```

Show autoscaling settings using an ID:

```
modal server autoscaler settings fu-1234
```

**Usage**:

```shell
modal server autoscaler settings [OPTIONS] FUNCTION
```

**Options**:

* `--json`: Output as JSON.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

### `modal server autoscaler update`

Update the current Autsocaling settings for the provided Server.

SERVER may be a Server ID or a deployed Server name in the form `APP_NAME/SERVER_NAME`.

Settings can be modified using the `--max-containers`, `--min-containers`, `--buffer-containers`,
`--scaledown-window`, `--scaleup-window`, and `--target-concurrency` options.

If provided, Max Containers should be a positive integer, Min and Buffer Containers should be
nonnegative integers, Scaledown and Scaleup windows should be positive integers measured in seconds,
and Target Concurrency should either be a positive floating point number, or the string "none".

Examples:

Update Max Containers for a deployed Server:

```
modal server autoscaler update my-app/my-server --max-containers 10
```

Update both Min Containers and Target Concurrency for a Server by ID:

```
modal server autoscaler update fu-1234 --min-containers 3 --target-concurrency 2.5
```

Set Target Concurrency to "none" (disabling autoscaling for the Server)

```
modal server autoscaler update my-app/my-server --target-concurrency none
```

**Usage**:

```shell
modal server autoscaler update [OPTIONS] SERVER
```

**Options**:

* `--max-containers TEXT`: Maximum concurrent containers.
* `--min-containers TEXT`: Minimum number of containers to keep running.
* `--buffer-containers TEXT`: Extra containers to keep warm beyond current demand.
* `--scaledown-window TEXT`: Maximum duration (in seconds) idle containers wait before scaling down.
* `--scaleup-window TEXT`: Seconds of sustained demand required before scaling up new containers.
* `--target-concurrency TEXT`: Target number of concurrent requests per container. May be fractional.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal server info`

Show information about a given Modal Server.

SERVER can either be a Function ID (`fu-...`) or a deployed Server name in the format
`APP_NAME/SERVER_NAME`. The output of this command includes information about any resources
requested by this Server, any scheduling/autoscaling settings, any mounted Volumes or Buckets,
and any HTTP settings.

Examples:

Providing a Server ID directly:

```
modal server info fu-0123456789abcdefghijkl
```

Referring to a Server within a deployed App:

```
modal server info hello-world-app/test_server
```

**Usage**:

```shell
modal server info [OPTIONS] SERVER
```

**Options**:

* `--json`: Output as JSON.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal server logs`

Fetch or stream Server logs.

By default, this command fetches the last 100 log entries and exits. Use `-f` to
live-stream logs from a running server instead. Fetch and follow are mutually exclusive.

Examples:

Get recent logs based on a server ID:

```
modal server logs fu-12345
```

Get recent logs for a currently deployed server based on its name:

```
modal server logs my-app/qwen-server
```

Follow (stream) logs from a running server:

```
modal server logs my-app/qwen-server -f
```

Fetch the last 1000 entries:

```
modal server logs my-app/qwen-server --tail 1000
```

Fetch logs from the last 2 hours:

```
modal server logs my-app/qwen-server --since 2h
```

Fetch logs in a specific time range:

```
modal server logs my-app/qwen-server --since 2026-09-01T05:00:00 --until 2026-09-01T08:00:00
```

Filter the logs by source:

```
modal server logs my-app/qwen-server --source stderr
```

Include timestamps along with server and container IDs on each line:

```
modal server logs my-app/qwen-server --timestamps --show-server-id --show-container-id
```

**Usage**:

```shell
modal server logs [OPTIONS] SERVER_REF
```

**Options**:

* `-f, --follow`: Stream log output until interrupted
* `--since TEXT`: Start of time range. Accepts ISO 8601 datetime or relative time, e.g. '1d' (1 day ago), '2h', '30m', etc.
* `--until TEXT`: End of time range; accepts same argument types as --since
* `-n, --tail INTEGER`: Show only the last N log entries
* `--search TEXT`: Filter by search text
* `--container TEXT`: Filter by Container ID (ta-\*)
* `-s, --source TEXT`: Filter by source: 'stdout', 'stderr', or 'system'
* `--timestamps`: Prefix each line with its timestamp
* `--show-server-id`: Prefix each line with its Server ID
* `--show-container-id`: Prefix each line with its Container ID
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal server metrics`

Preview and export metrics for a Modal Server.

SERVER may be an Object ID or a deployed Server name in the form
`APP_NAME/SERVER_NAME`.

Each metric is a time series over the window from `--since` to `--until`
(default: the last hour, maximum: 31 days). Samples are aggregated into
fixed-width buckets.

Set the width with `--bucket-size`. Each series is limited to 500 buckets, so long windows
need wider buckets. Time bounds are rounded down to bucket boundaries in UTC.
Results may include data before --since and exclude data between the last boundary and --until.

Series are grouped by name. Specify which metrics to return with `--group`.

By default, prints a schema summarizing the date range, bucket size, and time series that would
be returned. Use `--json` or `--csv` to output the raw samples instead.

Preview available Server metrics:

```shell
modal server metrics my-app/my-server
```

Export requests metrics for the last two hours as JSON:

```shell
modal server metrics my-app/my-server --group requests --since 2h --json > metrics.json
```

Export CPU, memory, network, and GPU metrics:

```shell
modal server metrics my-app/my-server --group cpu --group memory --group network --group gpu --json
```

Save container metrics with five-minute buckets as CSV:

```shell
modal server metrics fu-abc123 --group containers --bucket-size 5m --csv > metrics.csv
```

**Usage**:

```shell
modal server metrics [OPTIONS] SERVER
```

**Options**:

* `--since TEXT`: Start time: ISO 8601 or relative duration (e.g. 2h). Naive times are local.
* `--until TEXT`: End time; same syntax as --since. Defaults to now.
* `--group TEXT`: Metric group; repeat to select multiple. Defaults to all. Valid values are 'containers', 'cpu', 'memory', 'network', 'gpu', 'requests'.
* `--bucket-size DURATION`: Bucket width: 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 8h, 12h, 1d. By default, a value is chosen that splits the time range into approximately 100 buckets.
* `--json`: Fetch metric samples and output JSON.
* `--csv`: Fetch metric samples and output CSV.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal server requests`

Show recent requests handled by a Modal Server.

SERVER may be a Function ID or a deployed Server name in the form
`APP_NAME/SERVER_NAME`.

Use `--since` and/or `--until` to fetch all inputs in the time range,
oldest first. `--until` defaults to now. If `--since` is omitted, the preceeding hour
is fetched. If timezones are omitted, the time is interpreted as local time.

`--tail` cannot be combined with either date option.
By default, `--tail` returns the latest 10 inputs, newest first.

Examples:

```
modal server requests my-app/my-server
```

```
modal server requests my-app/my-server --tail 500
```

```
modal server requests my-app/my-server --since 2h --until 1h
```

Disable color in the output:

```
modal server requests my-app/my-server --no-color
```

**Usage**:

```shell
modal server requests [OPTIONS] SERVER
```

**Options**:

* `-n, --tail INTEGER RANGE`: Show up to the last N Server requests. Defaults to 10. Cannot be combined with --since or --until.  \[1<=x<=1000]
* `--since TEXT`: Fetch requests at or after this time (e.g. '2h' or an ISO 8601 datetime).
* `--until TEXT`: Fetch requests before this time (e.g. '1h' or an ISO 8601 datetime).
* `--json`: Output requests as JSON.
* `--no-color`: Disable colors in the output.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal server stats`

Show aggregate statistics for a Modal Server.

SERVER may be a Function ID or a deployed Server name in the form
`APP_NAME/SERVER_NAME`. The default time range is the most recent hour.

The available metrics and their definitions are subject to change and are provided
on a best-effort basis. They may be delayed or incomplete. Do not rely on this command
for autoscaler management.

Examples:

Show stats for the last hour:

```
modal server stats fu-abc123
```

Show stats for relative window:

```
modal server stats my-app/my-server --since 5h --until 2h
```

Show stats for one hour window ending two hours ago:

```
modal server stats my-app/my-server --until 2h
```

Show stats for explicit window in json format:

```
modal server stats my-app/my-server         --since 2026-08-28T14:00:00Z         --until 2026-08-28T16:00:00Z         --json
```

Show stats for a specific container:

```
modal server stats my-app/my-server --container-id ta-12345
```

**Usage**:

```shell
modal server stats [OPTIONS] SERVER
```

**Options**:

* `--since TEXT`: Start of time range. Treated as local time if a timezone is not supplied. Accepts an ISO 8601 datetime or relative time such as '2h' or '30m'.
* `--until TEXT`: End of time range. Treated as local time if a timezone is not supplied. Accepts the same argument types as --since.
* `--container-id CONTAINER_ID`: Compute the stats only for this container.
* `--no-color`: Disable colors in the output.
* `--json`: Output stats as JSON.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.
