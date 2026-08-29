# `modal token`

Manage tokens.

**Usage**:

```shell
modal token [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `info`: Display information about the token that is currently in use.
* `new`: Create a new token by using an authenticated web session.
* `set`: Set account credentials for connecting to Modal.

## `modal token info`

Display information about the token that is currently in use.

**Usage**:

```shell
modal token info [OPTIONS]
```

**Options**:

* `--help`: Show this message and exit.

## `modal token new`

Create a new token by using an authenticated web session.

**Usage**:

```shell
modal token new [OPTIONS]
```

**Options**:

* `--activate / --no-activate`: Activate the profile containing this token after creation.
* `--verify / --no-verify`: Make a test request to verify the new credentials.
* `--help`: Show this message and exit.

## `modal token set`

Set account credentials for connecting to Modal.

If the credentials are not provided on the command line, you will be prompted to enter them.

**Usage**:

```shell
modal token set [OPTIONS]
```

**Options**:

* `--token-id TEXT`: Account token ID.
* `--token-secret TEXT`: Account token secret.
* `--activate / --no-activate`: Activate the profile containing this token after creation.
* `--verify / --no-verify`: Make a test request to verify the new credentials.
* `--help`: Show this message and exit.
