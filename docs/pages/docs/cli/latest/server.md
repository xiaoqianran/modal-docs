# `modal server`

Deploy and inspect Modal Servers.

**Usage**:

```shell
modal server [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `autoscaler`: View and Configure Autoscaler settings for Modal Servers.
* `deploy`: Deploy a container image as a Server.
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

## `modal server deploy`

Deploy a container image as a Server.

Runs an existing container image on Modal without writing any Python. `--image` is either a
container image reference that includes its registry, such as `docker.io/nginx`, or the
name of a Modal Image published with `modal image build` or `Image.publish()`, such as
`my-image:v1`. A published Modal Image takes precedence over a registry image with the
same reference. The image needs no Python and no Modal client; it only has to serve HTTP
on `--port`.
The server is started by the image's own ENTRYPOINT and CMD; `--entrypoint` and `--cmd`
override them.

A registry image is pulled once and reused by later deploys of the same reference. If a
tag such as `latest` changes in the registry, pass `--force-build` to pull it again,
or reference the image by digest.

The Server is named "Server" and deployed under the App given by `--app-name`, which
defaults to the image's repository name without its tag, so deploying a new tag of an
image updates the same App. For example, `ghcr.io/org/api:v2` and `ghcr.io/org/api:v3`
both deploy to the App `api`. Other `modal server` commands refer to it as
`APP_NAME/Server`, e.g. `modal server logs api/Server`. Redeploying an App that is
already deployed asks for confirmation first unless `--yes` is given. Without an
interactive terminal, such as in CI, redeploying aborts unless `--yes` is given.

Examples:

Deploy a public image that starts its server through its own ENTRYPOINT and CMD:

```
modal server deploy --image docker.io/nginx --port 80 --unauthenticated
```

Deploy a private image with GPU, a Secret, a Volume, and an environment variable:

```
modal server deploy --image my-registry.com/api:v2 --port 8000 \
    --registry-secret my-registry-creds --gpu A100 --secret my-api-keys \
    --volume my-models:/models --env-var LOG_LEVEL=debug
```

Deploy an AWS ECR image with registry credentials and an API key taken from the local
environment:

```
modal server deploy --image 123456789012.dkr.ecr.us-east-1.amazonaws.com/api:v2 --port 8000 \
    --registry-secret-from-env AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,AWS_REGION \
    --secret-from-env OPENAI_API_KEY
```

Deploy an image with a custom entrypoint and command:

```
modal server deploy --image docker.io/python:3.12 --port 8000 \
    --entrypoint "python -m" --cmd "http.server 8000"
```

Build a Dockerfile in the current directory into a named Modal Image, then deploy it:

```
modal image build -t my-image:v1 .
modal server deploy --image my-image:v1 --port 8000
```

**Usage**:

```shell
modal server deploy [OPTIONS]
```

**Options**:

* `--image TEXT`: Container image including its registry, e.g. 'docker.io/nginx', or the name of a published Modal Image, e.g. 'my-image:v1'.  \[required]
* `--port INTEGER`: Port the server listens on inside the container.  \[required]
* `--registry-secret TEXT`: Name of a Modal Secret with credentials for pulling a private registry image. Its keys select the kind of authentication: AWS\_ACCESS\_KEY\_ID, AWS\_SECRET\_ACCESS\_KEY and AWS\_REGION (optionally AWS\_SESSION\_TOKEN), or AWS\_ROLE\_ARN and AWS\_REGION, for AWS ECR; SERVICE\_ACCOUNT\_JSON for GCP; or REGISTRY\_USERNAME and REGISTRY\_PASSWORD for any other registry.
* `--registry-secret-from-env KEYS`: Comma-separated names of local environment variables whose values are used to pull a private registry image, e.g. REGISTRY\_USERNAME,REGISTRY\_PASSWORD. Accepts the same keys as --registry-secret.
* `--force-build`: Pull the registry image again instead of using a cached pull, e.g. after its tag is updated. Later builds from the same image reference also use the new pull.
* `--entrypoint TEXT`: Override the image's ENTRYPOINT, which also clears its CMD unless --cmd is given. --cmd is appended as arguments, e.g. --entrypoint 'python -m' --cmd 'http.server 8000'.
* `--cmd TEXT`: Command to start the server, overriding the image's CMD, e.g. 'python -m http.server 8000'. Split into arguments with shell quoting rules, so quote an argument that contains spaces, e.g. --cmd 'sh -c "python -m http.server 8000"'.
* `--env-var KEY=VALUE`: Set an environment variable in the container, e.g. LOG\_LEVEL=debug. Repeatable.
* `--secret TEXT`: Name of a Modal Secret whose keys are set as environment variables in the running container. Repeatable. Unlike --registry-secret, it is not used to pull the image.
* `--secret-from-env KEYS`: Comma-separated names of local environment variables whose values are set as environment variables in the running container, e.g. API\_KEY,API\_TOKEN. Unlike --registry-secret-from-env, they are not used to pull the image.
* `--volume NAME:PATH`: Mount a Modal Volume at an absolute path in the container, creating it if needed. Repeatable.
* `--cpu CORES[,LIMIT]`: CPU cores to request, which may be fractional, e.g. 2. Add a comma and a hard limit to also cap usage, e.g. 2,4.
* `--memory MIB[,LIMIT]`: Memory in MiB to request, e.g. 4096. Add a comma and a hard limit to also cap usage, e.g. 4096,8192.
* `--gpu GPU[,FALLBACK...]`: GPU request, e.g. 'A100' or 'H100:8'. Pass a comma-separated list to fall back to the next GPU type when the earlier ones are unavailable, e.g. 'H100,A100'.
* `--region TEXT`: Region where Server requests enter Modal before reaching a container.  \[default: us-east]
* `--unauthenticated`: Accept requests without credentials. By default, requests must carry a workspace proxy token in Modal-Key and Modal-Secret headers; see 'modal workspace proxy-tokens'.
* `--h2`: Forward requests to the container over HTTP/2. The server must accept cleartext HTTP/2 (h2c) on --port.
* `--sessioned`: Enable sticky sessions. Clients start a session with 'Server.sessions.start()' and send its token in a 'Modal-Authorization: Bearer <token>' header; requests with the same token reach the same container.
* `--target-concurrency FLOAT|none`: Concurrent requests each container aims to handle before scaling up. May be fractional. 'none' keeps the server on a single container.
* `--max-concurrency INTEGER|none`: Maximum concurrent requests per container; requests above it receive a 429. 'none' means unlimited.
* `--min-containers INTEGER`: Minimum number of containers to keep warm.
* `--max-containers INTEGER|none`: Maximum number of containers. 'none' means bounded only by your workspace's container limit.
* `--buffer-containers INTEGER`: Additional idle containers under active load.
* `--scaleup-window INTEGER`: Seconds of sustained demand before scaling up containers.
* `--scaledown-window INTEGER`: Maximum seconds idle containers wait before scaling down.
* `--startup-timeout INTEGER`: Maximum container startup time in seconds.  \[default: 30]
* `--exit-grace-period INTEGER`: Seconds to let in-flight requests finish on container shutdown.  \[default: 0]
* `--app-name TEXT`: App to deploy under. Defaults to the image's repository name, e.g. 'api' for 'ghcr.io/org/api:v2'.
* `--stream-logs`: Stream logs from the Server upon deployment.
* `-y, --yes`: Run without pausing for confirmation.
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
