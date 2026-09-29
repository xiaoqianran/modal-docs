# `modal server`

Inspect Modal Servers.

**Usage**:

```shell
modal server [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `info`: Show information about a given Modal Server.
* `logs`: Fetch or stream Server logs.
* `requests`: Show recent requests handled by a Modal Server.
* `stats`: Show aggregate statistics for a Modal Server.

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

## `modal server requests`

Show recent requests handled by a Modal Server.

SERVER may be a Function ID or a deployed Server name in the form
`APP_NAME/SERVER_NAME`.

Examples:

```
modal server requests my-app/my-server
```

```
modal server requests my-app/my-server --tail 500
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

* `-n, --tail INTEGER RANGE`: Show up to the last N Server requests.  \[default: 10; 1<=x<=1000]
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
