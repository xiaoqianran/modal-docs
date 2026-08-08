# `modal workspace`

Interact with the current Modal Workspace.

A Workspace is the top-level account that owns your Modal resources. Use these commands
to manage workspace-level settings such as proxy tokens.

**Usage**:

```shell
modal workspace [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `members`: View the members of the current Workspace.
* `proxy-tokens`: Manage the proxy tokens of the current Workspace.
* `settings`: Manage workspace settings.

## `modal workspace members`

View the members of the current Workspace.

**Usage**:

```shell
modal workspace members [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `list`: List the members of the current Workspace.

### `modal workspace members list`

List the members of the current Workspace.

**Usage**:

```shell
modal workspace members list [OPTIONS]
```

**Options**:

* `--json`
* `--help`: Show this message and exit.

## `modal workspace proxy-tokens`

Manage the proxy tokens of the current Workspace.

Proxy tokens provide authentication to HTTP interfaces on Modal Servers and Web Functions.
They are passed as request headers (`Modal-Key` and `Modal-Secret`). See
https://modal.com/docs/guide/webhook-proxy-auth for more information.

Proxy tokens and secrets have `wk-` and `ws-` prefixes, respectively. The cannot be
interchanged with API tokens (which use `ak-` and `as-` prefixes).

On workspaces with RBAC enabled, tokens are scoped to specific environments;
use the `allow` and `revoke` commands to manage environment associations.

**Usage**:

```shell
modal workspace proxy-tokens [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `allow`: Allow a proxy token to authenticate to an environment.
* `create`: Create a proxy token in the current Workspace.
* `delete`: Delete a proxy token from the current Workspace.
* `list`: List the proxy tokens of the current Workspace.
* `revoke`: Revoke a proxy token's access to an environment.

### `modal workspace proxy-tokens allow`

Allow a proxy token to authenticate to an environment.

**Usage**:

```shell
modal workspace proxy-tokens allow [OPTIONS] TOKEN_ID ENVIRONMENT_NAME
```

**Options**:

* `--help`: Show this message and exit.

### `modal workspace proxy-tokens create`

Create a proxy token in the current Workspace.

**Usage**:

```shell
modal workspace proxy-tokens create [OPTIONS]
```

**Options**:

* `--json`
* `--help`: Show this message and exit.

### `modal workspace proxy-tokens delete`

Delete a proxy token from the current Workspace.

**Usage**:

```shell
modal workspace proxy-tokens delete [OPTIONS] TOKEN_ID
```

**Options**:

* `-y, --yes`: Run without pausing for confirmation.
* `--help`: Show this message and exit.

### `modal workspace proxy-tokens list`

List the proxy tokens of the current Workspace.

**Usage**:

```shell
modal workspace proxy-tokens list [OPTIONS]
```

**Options**:

* `-e, --environment TEXT`: Only list tokens associated with this environment. Lists all tokens when omitted.
* `--json`
* `--help`: Show this message and exit.

### `modal workspace proxy-tokens revoke`

Revoke a proxy token's access to an environment.

**Usage**:

```shell
modal workspace proxy-tokens revoke [OPTIONS] TOKEN_ID ENVIRONMENT_NAME
```

**Options**:

* `--help`: Show this message and exit.

## `modal workspace settings`

Manage workspace settings. Must be workspace manager or owner.

**Usage**:

```shell
modal workspace settings [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `list`: View the current settings for the workspace.
* `set`: Update a workspace setting.

### `modal workspace settings list`

View the current settings for the workspace.

**Usage**:

```shell
modal workspace settings list [OPTIONS]
```

**Options**:

* `--json`
* `--help`: Show this message and exit.

### `modal workspace settings set`

Update a workspace setting. Must be workspace manager or owner.

The following settings can be updated:

* `image-builder-version`: The image builder version determines the software included in our base images.
* `default-environment`: The default environment to use when the environment is omitted from SDK or CLI methods.

Usage:

* `modal workspace settings set image-builder-version 2025.06`
* `modal workspace settings set default-environment main`

**Usage**:

```shell
modal workspace settings set [OPTIONS] SETTING VALUE
```

**Options**:

* `--help`: Show this message and exit.
