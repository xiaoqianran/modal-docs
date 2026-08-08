# `modal dict`

Manage `modal.Dict` objects and inspect their contents.

**Usage**:

```shell
modal dict [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `clear`: Clear the contents of a named Dict by deleting all of its data.
* `create`: Create a named Dict object.
* `delete`: Delete a named Dict and all of its data.
* `get`: Print the value for a specific key.
* `items`: Print the contents of a Dict.
* `list`: List all named Dicts.

## `modal dict clear`

Clear the contents of a named Dict by deleting all of its data.

**Usage**:

```shell
modal dict clear [OPTIONS] NAME
```

**Options**:

* `-y, --yes`: Run without pausing for confirmation.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal dict create`

Create a named Dict object.

Note: This is a no-op when the Dict already exists.

**Usage**:

```shell
modal dict create [OPTIONS] NAME
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal dict delete`

Delete a named Dict and all of its data.

**Usage**:

```shell
modal dict delete [OPTIONS] NAME
```

**Options**:

* `--allow-missing`: Don't error if the Dict doesn't exist.
* `-y, --yes`: Run without pausing for confirmation.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal dict get`

Print the value for a specific key.

Note: When using the CLI, keys are always interpreted as having a string type.

**Usage**:

```shell
modal dict get [OPTIONS] NAME KEY
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal dict items`

Print the contents of a Dict.

Note: By default, this command truncates the contents. Use the `N` argument to control the
amount of data shown or the `--all` option to retrieve the entire Dict, which may be slow.

**Usage**:

```shell
modal dict items [OPTIONS] NAME [N]
```

**Options**:

* `-a, --all`: Ignore N and print all entries in the Dict (may be slow)
* `-r, --repr`: Display items using `repr()` to see more details
* `--json`
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal dict list`

List all named Dicts.

**Usage**:

```shell
modal dict list [OPTIONS]
```

**Options**:

* `--json`
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.
