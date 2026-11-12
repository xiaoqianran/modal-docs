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
* `rotate`: Create a new token in a web session, then delete the current token.
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
* `--expires-in TEXT`: Lifetime of the new token, e.g. 12h, 7d, or 90d. Defaults to the workspace's maximum allowed lifetime.
* `--delete-existing`: In addition to creating a new token, delete the existing token in the active profile
* `--help`: Show this message and exit.

## `modal token rotate`

Create a new token in a web session, then delete the current token.

Note that this is equivalent to `modal token new --delete-existing --no-activate`. You may also
optionally provide a custom expiration window with `--expires-in`. If not provided, the token's
TTL will fall back to the workspace default.

Examples:

```bash
modal token rotate

# Set a custom TTL of 1 week
modal token rotate --expires-in 7d
```

**Usage**:

```shell
modal token rotate [OPTIONS]
```

**Options**:

* `--expires-in TEXT`: Lifetime of the new token, e.g. 12h, 7d, or 90d. Defaults to the workspace's maximum allowed lifetime.
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
* `--delete-existing`: In addition to setting a new token, delete the existing token in the active profile
* `--help`: Show this message and exit.
