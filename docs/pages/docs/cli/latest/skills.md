# `modal skills`

Install and update Modal's agent skills.

**Usage**:

```shell
modal skills [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `install`: Install Modal skills.
* `show`: Print Modal skill content to the terminal.
* `update`: Update installed Modal skills.

## `modal skills install`

Install Modal skills.

**Usage**:

```shell
modal skills install [OPTIONS]
```

**Options**:

* `-y, --yes`: Run without pausing for confirmation.
* `--no-docs`: Skip downloading Modal documentation resources.
* `-g, --global`: Install in the user home directory.
* `--claude`: Install to .claude/ rather than .agents/.
* `--help`: Show this message and exit.

## `modal skills show`

Print Modal skill content to the terminal.

**Usage**:

```shell
modal skills show [OPTIONS]
```

**Options**:

* `--help`: Show this message and exit.

## `modal skills update`

Update installed Modal skills.

**Usage**:

```shell
modal skills update [OPTIONS]
```

**Options**:

* `-y, --yes`: Run without pausing for confirmation.
* `--no-docs`: Skip downloading Modal documentation resources.
* `-g, --global`: Install in the user home directory.
* `--claude`: Install to .claude/ rather than .agents/.
* `--help`: Show this message and exit.
