# `modal queue`

Manage `modal.Queue` objects and inspect their contents.

**Usage**:

```shell
modal queue [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `clear`: Clear the contents of a queue by removing all of its data.
* `create`: Create a named Queue.
* `delete`: Delete a named Queue and all of its data.
* `len`: Print the length of the queue or one of its partitions.
* `list`: List all named Queues.
* `peek`: Print the next N items without removing them.

## `modal queue clear`

Clear the contents of a queue by removing all of its data.

**Usage**:

```shell
modal queue clear [OPTIONS] NAME
```

**Options**:

* `-p, --partition TEXT`: Name of the partition to use, otherwise use the default (anonymous) partition.
* `-a, --all`: Clear the contents of all partitions.
* `-y, --yes`: Run without pausing for confirmation.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal queue create`

Create a named Queue.

Note: This is a no-op when the Queue already exists.

**Usage**:

```shell
modal queue create [OPTIONS] NAME
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal queue delete`

Delete a named Queue and all of its data.

**Usage**:

```shell
modal queue delete [OPTIONS] NAME
```

**Options**:

* `--allow-missing`: Don't error if the Queue doesn't exist.
* `-y, --yes`: Run without pausing for confirmation.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal queue len`

Print the length of the queue or one of its partitions.

**Usage**:

```shell
modal queue len [OPTIONS] NAME
```

**Options**:

* `-p, --partition TEXT`: Name of the partition to use, otherwise use the default (anonymous) partition.
* `-t, --total`: Compute the sum of the queue lengths across all partitions
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal queue list`

List all named Queues.

**Usage**:

```shell
modal queue list [OPTIONS]
```

**Options**:

* `--json`
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal queue peek`

Print the next N items without removing them.

**Usage**:

```shell
modal queue peek [OPTIONS] NAME [N]
```

**Options**:

* `-p, --partition TEXT`: Name of the partition to use, otherwise use the default (anonymous) partition.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.
