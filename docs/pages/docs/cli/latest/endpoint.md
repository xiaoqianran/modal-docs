# `modal endpoint`

Create and manage LLM inference endpoints.

Modal Endpoints deploy production-ready LLM inference servers with minimal coding or configuration.
Endpoints support pre-trained open models along with custom weights from a private Hugging Face repo
or Modal Volume.

See https://modal.com/docs/guide/endpoints for more information.

**Usage**:

```shell
modal endpoint [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `create`: Deploy a new Endpoint.
* `info`: Show details about an Endpoint, such as the model, URL, and status.
* `list`: List Endpoints that are provisioning or running in an environment.
* `logs`: Fetch or stream logs for a dedicated Endpoint.
* `stats`: Show aggregate Server statistics for a dedicated Endpoint.
* `stop`: Permanently stop an Endpoint and terminate any running containers.

## `modal endpoint create`

Deploy a new Endpoint.

Examples:

Create an Endpoint from a base model:

```bash
modal endpoint create --model Qwen/Qwen3.6-27B-FP8
```

Create an Endpoint with an explicit name:

```bash
modal endpoint create --name qwen-chat --model Qwen/Qwen3.6-27B-FP8
```

Create an Endpoint with explicit routing and compute regions:

```bash
modal endpoint create --model Qwen/Qwen3.6-27B-FP8 \
  --routing-region us-east --compute-region us-west
```

Create an Endpoint from a private Hugging Face model:

```bash
modal endpoint create --name my-ft --model Qwen/Qwen3.6-27B-FP8 \
  --custom-hf-repo acme/qwen-ft --custom-hf-token $HF_TOKEN
```

Create an Endpoint from custom weights in a Modal Volume:

```bash
modal endpoint create --name my-ft --model Qwen/Qwen3.6-27B-FP8 \
  --custom-volume-name qwen-ft --custom-volume-path /models/qwen
```

**Usage**:

```shell
modal endpoint create [OPTIONS]
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--name TEXT`: Endpoint name. If not provided, a default will be derived from the model name.
* `--model TEXT`: Hugging Face repo ID for the base model architecture (e.g., 'Qwen/Qwen3.6-27B-FP8').  \[required]
* `--routing-region TEXT`: Region to route inference requests through. Defaults to us-west.
* `--compute-region TEXT`: Region to run Endpoint containers in. May be specified multiple times. This incurs a region selection price multiplier.
* `--colocate-compute`: Run all containers within the routing region. This incurs a region selection price multiplier.
* `--unauthenticated`: Allow unauthenticated HTTP requests to the endpoint.
* `--custom-hf-repo TEXT`: Hugging Face repo ID for fine-tuned model weights.
* `--custom-hf-revision TEXT`: Git revision for --custom-hf-repo.
* `--custom-hf-token TEXT`: Hugging Face token for private --custom-hf-repo.
* `--custom-volume-name TEXT`: Modal Volume name containing custom model weights.
* `--custom-volume-path TEXT`: Path within Volume containing model weights.
* `--help`: Show this message and exit.

## `modal endpoint info`

Show details about an Endpoint, such as the model, URL, and status.

Examples:

Get information about an Endpoint by name:

```bash
modal endpoint info qwen-chat
```

Get information about an Endpoint by ID:

```bash
modal endpoint info ep-123456
```

Output the information as JSON:

```bash
modal endpoint info qwen-chat --json
```

Disable color output:

```bash
modal endpoint info qwen-chat --no-color
```

**Usage**:

```shell
modal endpoint info [OPTIONS] ENDPOINT_IDENTIFIER
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--json`
* `--no-color`: Disable colors in the output.
* `--help`: Show this message and exit.

## `modal endpoint list`

List Endpoints that are provisioning or running in an environment.

**Usage**:

```shell
modal endpoint list [OPTIONS]
```

**Options**:

* `--json`
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal endpoint logs`

Fetch or stream logs for a dedicated Endpoint.

By default, this command fetches the last 100 log entries and exits. Use `-f` to
live-stream logs from a running Endpoint instead. Fetch and follow are mutually exclusive.

Examples:

Get recent logs by Endpoint name:

```bash
modal endpoint logs qwen-chat
```

Get recent logs by Endpoint ID:

```bash
modal endpoint logs ep-123456
```

Follow logs from a running Endpoint:

```bash
modal endpoint logs qwen-chat -f
```

Fetch the last 1000 entries:

```bash
modal endpoint logs qwen-chat --tail 1000
```

Fetch logs from the last two hours:

```bash
modal endpoint logs qwen-chat --since 2h
```

Fetch logs in a specific time range:

```bash
modal endpoint logs qwen-chat --since 2026-09-01T05:00:00 --until 2026-09-01T08:00:00
```

Filter logs and include timestamps:

```bash
modal endpoint logs qwen-chat --source stderr --search timeout --timestamps
```

**Usage**:

```shell
modal endpoint logs [OPTIONS] ENDPOINT_IDENTIFIER
```

**Options**:

* `-f, --follow`: Stream log output until interrupted
* `--since TEXT`: Start of time range. Accepts ISO 8601 datetime or relative time, e.g. '1d', '2h', or '30m'.
* `--until TEXT`: End of time range; accepts the same argument types as --since
* `-n, --tail INTEGER`: Show only the last N log entries
* `--search TEXT`: Filter by search text
* `--container TEXT`: Filter by Container ID (ta-\*)
* `-s, --source TEXT`: Filter by source: 'stdout', 'stderr', or 'system'
* `--timestamps`: Prefix each line with its timestamp
* `--show-server-id`: Prefix each line with its Server ID
* `--show-container-id`: Prefix each line with its Container ID
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal endpoint stats`

Show aggregate Server statistics for a dedicated Endpoint.

The default time range is the most recent hour. Metrics are provided on a
best-effort basis and may be delayed or incomplete.

Examples:

Show stats for the last hour by Endpoint name:

```bash
modal endpoint stats qwen-chat
```

Show stats by Endpoint ID:

```bash
modal endpoint stats ep-123456
```

Show stats for a relative time range:

```bash
modal endpoint stats qwen-chat --since 5h --until 2h
```

Show stats for the hour ending two hours ago:

```bash
modal endpoint stats qwen-chat --until 2h
```

Show stats for an explicit time range as JSON:

```bash
modal endpoint stats qwen-chat \
    --since 2026-09-01T05:00:00Z \
    --until 2026-09-01T08:00:00Z \
    --json
```

Show stats for a specific container:

```bash
modal endpoint stats qwen-chat --container-id ta-12345
```

**Usage**:

```shell
modal endpoint stats [OPTIONS] ENDPOINT_IDENTIFIER
```

**Options**:

* `--since TEXT`: Start of time range. Treated as local time if a timezone is not supplied. Accepts an ISO 8601 datetime or relative time such as '2h' or '30m'.
* `--until TEXT`: End of time range. Treated as local time if a timezone is not supplied.
* `--container-id CONTAINER_ID`: Compute the stats only for this container.
* `--no-color`: Disable colors in the output.
* `--json`: Output stats as JSON.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal endpoint stop`

Permanently stop an Endpoint and terminate any running containers.

**Usage**:

```shell
modal endpoint stop [OPTIONS] ENDPOINT_IDENTIFIER
```

**Options**:

* `-y, --yes`: Run without pausing for confirmation.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.
