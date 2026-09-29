# `modal function`

Inspect Modal Functions.

**Usage**:

```shell
modal function [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `calls`: Show recent inputs for a Modal Function.
* `info`: Show information about a given Modal Function.
* `logs`: Fetch or stream Function logs.
* `stats`: Show aggregate statistics for a Modal Function.
* `variants`: List the variants of a Modal Function.

## `modal function calls`

Show recent inputs for a Modal Function.

FUNCTION may be a Function ID or a deployed Function name in the form
`APP_NAME/FUNCTION_NAME`. Each unique input corresponds to one entry
in the output.

Examples:

```
modal function calls my-app/my-function
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

* `-n, --tail INTEGER RANGE`: Show up to the last N Function inputs.  \[default: 10; 1<=x<=1000]
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
