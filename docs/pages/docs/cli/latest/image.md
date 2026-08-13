# `modal image`

Manage Images.

**Usage**:

```shell
modal image [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `logs`: Fetch build logs for an Image.
* `names`: Manage Modal Image names.

## `modal image logs`

Fetch build logs for an Image.

**Usage**:

```shell
modal image logs [OPTIONS] IMAGE_ID
```

**Options**:

* `--layers INTEGER`: Fetch logs from the last N build layers. Defaults to 1.
* `--all`: Fetch logs from all available build layers.
* `--help`: Show this message and exit.

## `modal image names`

Manage Modal Image names.

**Usage**:

```shell
modal image names [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `list`: List named Images.

### `modal image names list`

List named Images.

**Usage**:

```shell
modal image names list [OPTIONS]
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--prefix TEXT`: Only include named image tags that start with this prefix.
* `--json`
* `--help`: Show this message and exit.
