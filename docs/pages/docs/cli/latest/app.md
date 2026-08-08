# `modal app`

Manage deployed and running apps.

**Usage**:

```shell
modal app [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `dashboard`: Open an App's dashboard page in your web browser.
* `history`: Show an App's deployment history.
* `list`: List Apps that are running, deployed or recently stopped.
* `logs`: Fetch or stream App logs.
* `rollback`: Redeploy a previous version of an App.
* `rollover`: Redeploy an App to get new containers without code changes.
* `stop`: Permanently stop an App and terminate its running containers.

## `modal app dashboard`

Open an App's dashboard page in your web browser.

Examples:

Open dashboard for an app by name:

```
modal app dashboard my-app
```

Use a specified environment:

```
modal app dashboard my-app --env dev
```

**Usage**:

```shell
modal app dashboard [OPTIONS] APP_IDENTIFIER
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal app history`

Show an App's deployment history.

Examples:

Get the history based on an app ID:

```
modal app history ap-123456
```

Get the history for an App based on its name:

```
modal app history my-app
```

**Usage**:

```shell
modal app history [OPTIONS] APP_IDENTIFIER
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--json`
* `--help`: Show this message and exit.

## `modal app list`

List Apps that are running, deployed or recently stopped.

**Usage**:

```shell
modal app list [OPTIONS]
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--json`
* `--help`: Show this message and exit.

## `modal app logs`

Fetch or stream App logs.

By default, this command fetches the last 100 log entries and exits. Use `-f` to
live-stream logs from a running App instead. Fetch and follow are mutually exclusive.

Examples:

Get recent logs based on an app ID:

```
modal app logs ap-123456
```

Get recent logs for a currently deployed App based on its name:

```
modal app logs my-app
```

Follow (stream) logs from a running App:

```
modal app logs my-app -f
```

Fetch the last 1000 entries:

```
modal app logs my-app --tail 1000
```

Fetch logs from the last 2 hours:

```
modal app logs my-app --since 2h
```

Fetch logs in a specific time range:

```
modal app logs my-app --since 2026-03-01T05:00:00 --until 2026-03-01T08:00:00
```

Filter the logs by source and function:

```
modal app logs my-app --source stderr --function fu-abc123
```

Include timestamps along with Function and Container IDs on each line:

```
modal app logs my-app --timestamps --show-function-id --show-container-id
```

**Usage**:

```shell
modal app logs [OPTIONS] APP_IDENTIFIER
```

**Options**:

* `-f, --follow`: Stream log output until App stops
* `--since TEXT`: Start of time range. Accepts ISO 8601 datetime or relative time, e.g. '1d' (1 day ago), '2h', '30m', etc.
* `--until TEXT`: End of time range; accepts same argument types as --since
* `-n, --tail INTEGER`: Show only the last N log entries
* `--search TEXT`: Filter by search text
* `--function TEXT`: Filter by Function ID (fu-\*)
* `--function-call TEXT`: Filter by FunctionCall ID (fc-\*)
* `--container TEXT`: Filter by Container ID (ta-\*)
* `-s, --source TEXT`: Filter by source: 'stdout', 'stderr', or 'system'
* `--timestamps`: Prefix each line with its timestamp
* `--show-function-id`: Prefix each line with its Function ID
* `--show-function-call-id`: Prefix each line with its FunctionCall ID
* `--show-container-id`: Prefix each line with its Container ID
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal app rollback`

Redeploy a previous version of an App.

Note that the App must currently be in a "deployed" state.
Rollbacks will appear as a new deployment in the App history, although
the App state will be reset to the state at the time of the previous deployment.

Examples:

Rollback an App to its previous version:

```
modal app rollback my-app
```

Rollback an App to a specific version:

```
modal app rollback my-app v3
```

Rollback an App using its App ID instead of its name:

```
modal app rollback ap-abcdefghABCDEFGH123456
```

**Usage**:

```shell
modal app rollback [OPTIONS] APP_IDENTIFIER [VERSION]
```

**Options**:

* `--strategy [rolling|recreate]`: Strategy for rollback
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal app rollover`

Redeploy an App to get new containers without code changes.

A rollover replaces existing containers with fresh ones built from the same
App version — useful for refreshing containers without changing your code.
The rollover appears as a new entry in the App's deployment history.

Examples:

Rollover an App using a rolling deployment. Running containers are now considered
outdated and will be gracefully replaced by new ones.

```
modal app rollover my-app
```

Rollover an App by terminating any running containers. Inputs on the queue will
start new containers.

```
modal app rollover my-app --strategy recreate
```

**Usage**:

```shell
modal app rollover [OPTIONS] APP_IDENTIFIER
```

**Options**:

* `--strategy [rolling|recreate]`: Strategy for rollover
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal app stop`

Permanently stop an App and terminate its running containers.

**Usage**:

```shell
modal app stop [OPTIONS] APP_IDENTIFIER
```

**Options**:

* `-y, --yes`: Run without pausing for confirmation.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.
