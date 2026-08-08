# `modal volume`

Read and edit `modal.Volume` volumes.

Note: users of `modal.NetworkFileSystem` should use the `modal nfs` command instead.

**Usage**:

```shell
modal volume [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `cp`: Copy within a modal.Volume.
* `create`: Create a named, persistent modal.Volume.
* `dashboard`: Open the Volume's dashboard page in your web browser.
* `delete`: Delete a named Volume and all of its data.
* `get`: Download files from a modal.Volume object.
* `list`: List the details of all modal.Volume volumes in an Environment.
* `ls`: List files and directories in a modal.Volume volume.
* `put`: Upload a file or directory to a modal.Volume.
* `rename`: Rename a modal.Volume.
* `rm`: Delete a file or directory from a modal.Volume.

## `modal volume cp`

Copy within a modal.Volume.

Copy source file to destination file or multiple source files to destination directory.

**Usage**:

```shell
modal volume cp [OPTIONS] VOLUME_NAME PATHS...
```

**Options**:

* `-r, --recursive`: Copy directories recursively
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal volume create`

Create a named, persistent modal.Volume.

**Usage**:

```shell
modal volume create [OPTIONS] NAME
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--version INTEGER`: VolumeFS version. (Experimental)
* `--help`: Show this message and exit.

## `modal volume dashboard`

Open the Volume's dashboard page in your web browser.

**Usage**:

```shell
modal volume dashboard [OPTIONS] VOLUME_NAME
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal volume delete`

Delete a named Volume and all of its data.

**Usage**:

```shell
modal volume delete [OPTIONS] NAME
```

**Options**:

* `--allow-missing`: Don't error if the Volume doesn't exist.
* `-y, --yes`: Run without pausing for confirmation.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal volume get`

Download files from a modal.Volume object.

If a folder is passed for REMOTE\_PATH, the contents of the folder will be downloaded
recursively, including all subdirectories.

Examples:

````
```
modal volume get <volume_name> logs/april-12-1.txt
modal volume get <volume_name> / volume_data_dump
```
````

Use "-" as LOCAL\_DESTINATION to write file contents to standard output.

**Usage**:

```shell
modal volume get [OPTIONS] VOLUME_NAME REMOTE_PATH [LOCAL_DESTINATION]
```

**Options**:

* `--force`
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal volume list`

List the details of all modal.Volume volumes in an Environment.

**Usage**:

```shell
modal volume list [OPTIONS]
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--json`
* `--help`: Show this message and exit.

## `modal volume ls`

List files and directories in a modal.Volume volume.

**Usage**:

```shell
modal volume ls [OPTIONS] VOLUME_NAME [PATH]
```

**Options**:

* `--json`
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal volume put`

Upload a file or directory to a modal.Volume.

Remote parent directories will be created as needed.

Ending the REMOTE\_PATH with a forward slash (/), it's assumed to be a directory
and the file will be uploaded with its current name under that directory.

**Usage**:

```shell
modal volume put [OPTIONS] VOLUME_NAME LOCAL_PATH [REMOTE_PATH]
```

**Options**:

* `-f, --force`: Overwrite existing files.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal volume rename`

Rename a modal.Volume.

**Usage**:

```shell
modal volume rename [OPTIONS] OLD_NAME NEW_NAME
```

**Options**:

* `-y, --yes`: Run without pausing for confirmation.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

## `modal volume rm`

Delete a file or directory from a modal.Volume.

**Usage**:

```shell
modal volume rm [OPTIONS] VOLUME_NAME REMOTE_PATH
```

**Options**:

* `-r, --recursive`: Delete directory recursively
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.
