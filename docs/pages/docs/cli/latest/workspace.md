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

* `member-tokens`: Manage Member API Tokens.
* `members`: View the members of the current Workspace.
* `proxy-tokens`: Manage the proxy tokens of the current Workspace.
* `service-users`: Manage Service Users.
* `settings`: Manage workspace settings.

## `modal workspace member-tokens`

Manage Member API Tokens.

All Member Tokens are associated with a unique Member of the Workspace. Any requests to Modal using a
Token are authenticated as the associated Member (and as such, are governed by the permissions that
have been assigned to the specific Member). Workspace Owners and Managers can use [`modal environment roles update`](https://modal.com/docs/cli/latest/environment#modal-environment-roles-update)
to update these permissions programmatically.

This CLI allows users to list and delete the tokens associated to themselves. Workspace Owners
and Managers can list all tokens in their Workspace, and can delete any of them.

**Usage**:

```shell
modal workspace member-tokens [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `delete`: Delete a Member Token in this Workspace.
* `list`: List Member Tokens in the Workspace.

### `modal workspace member-tokens delete`

Delete a Member Token in this Workspace.

Note that this action is irreversible. This will immediately invalidate the target token and will
render it unable to authenticate with Modal.

```bash
# Delete the Token with ID `ak-REDACTED`
modal workspace member-tokens delete ak-REDACTED
```

**Usage**:

```shell
modal workspace member-tokens delete [OPTIONS] TOKEN_ID
```

**Options**:

* `--allow-missing`: Don't error if the Token doesn't exist.
* `-y, --yes`: Run without pausing for confirmation.
* `--help`: Show this message and exit.

### `modal workspace member-tokens list`

List Member Tokens in the Workspace. Workspace Managers and Owners can see all tokens in the
Workspace.

```bash
modal workspace member-tokens list

# Show list in JSON format:
modal workspace member-tokens list --json
```

**Usage**:

```shell
modal workspace member-tokens list [OPTIONS]
```

**Options**:

* `--json`: Output as JSON.
* `--help`: Show this message and exit.

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

Proxy tokens provide authentication to Modal Endpoints, Servers, and Web Functions.

Proxy tokens and secrets have `wk-` and `ws-` prefixes, respectively. They cannot be
interchanged with API tokens (which use `ak-` and `as-` prefixes).

Proxy tokens are passed as request headers, either as a key / secret pair:

```
Modal-Key: wk-123
Modal-Secret: ws-456
```

Or as a single Bearer token:

```
Authorization: Bearer wk-123.ws-456
```

See https://modal.com/docs/guide/webhook-proxy-auth for more information.

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
* `update`: Update a proxy token in the current Workspace.

### `modal workspace proxy-tokens allow`

Allow a proxy token to authenticate to an environment.

Example:

```
modal workspace proxy-tokens allow wk-123 prod
```

**Usage**:

```shell
modal workspace proxy-tokens allow [OPTIONS] TOKEN_ID ENVIRONMENT_NAME
```

**Options**:

* `--help`: Show this message and exit.

### `modal workspace proxy-tokens create`

Create a proxy token in the current Workspace.

The new token's ID and secret will be printed to stdout. The secret is only
shown at creation time and cannot be retrieved later.

Examples:

```
modal workspace proxy-tokens create --name production-webhooks
modal workspace proxy-tokens create --json
```

**Usage**:

```shell
modal workspace proxy-tokens create [OPTIONS]
```

**Options**:

* `--name TEXT`: Name to help identify the token.
* `--json`
* `--help`: Show this message and exit.

### `modal workspace proxy-tokens delete`

Delete a proxy token from the current Workspace.

Example:

```
modal workspace proxy-tokens delete wk-123
```

**Usage**:

```shell
modal workspace proxy-tokens delete [OPTIONS] TOKEN_ID
```

**Options**:

* `-y, --yes`: Run without pausing for confirmation.
* `--help`: Show this message and exit.

### `modal workspace proxy-tokens list`

List the proxy tokens of the current Workspace.

Examples:

```
modal workspace proxy-tokens list
modal workspace proxy-tokens list --environment prod
modal workspace proxy-tokens list --json
```

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

Example:

```
modal workspace proxy-tokens revoke wk-123 prod
```

**Usage**:

```shell
modal workspace proxy-tokens revoke [OPTIONS] TOKEN_ID ENVIRONMENT_NAME
```

**Options**:

* `--help`: Show this message and exit.

### `modal workspace proxy-tokens update`

Update a proxy token in the current Workspace.

The following settings can be updated:

* `name`: A name to help identify the token. Pass an empty value to remove it.

Example:

```
modal workspace proxy-tokens update wk-123 name production-webhooks
```

**Usage**:

```shell
modal workspace proxy-tokens update [OPTIONS] TOKEN_ID SETTING VALUE
```

**Options**:

* `--help`: Show this message and exit.

## `modal workspace service-users`

Manage Service Users. Must be workspace manager or owner.

Service users are programmatic accounts that allow automated systems to interact with Modal. They're
ideal for CI/CD pipelines, automated deployments, and other workflows that need to authenticate.

Service User credentials are typically made available to a process as environment variables:

```
export MODAL_TOKEN_ID=your-token-id
export MODAL_TOKEN_SECRET=your-token-secret
```

A newly created Service User has no permissions by default. In order to interact with a specific
Environment, Service Users must be granted explicit permissions.

See https://modal.com/docs/guide/service-users for more information.

**Usage**:

```shell
modal workspace service-users [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `create`: Create a Service User in this workspace.
* `delete`: Delete a Service User in this Workspace.
* `info`: Inspect a Service User in this workspace.
* `list`: List all Service Users in this workspace.
* `set-role`: Update a Service User's role in a specific Environment.

### `modal workspace service-users create`

Create a Service User in this workspace.

In order to run this command, you must have at least Manager level permissions in the Workspace.

By default, Service Users have no permissions. To explicitly grant the Service User permissions
to interact with a given environment, use [`modal workspace service-users set-role`](https://modal.com/docs/cli/latest/workspace#modal-workspace-service-users-set-role)
or [`modal environment roles update`](https://modal.com/docs/cli/latest/environment#modal-environment-roles-update).

Optionally, you can also specify an expiration window by passing `--expires-in`. After the specified
amount of time elapses, this Service User will be deleted, and any credentials associated with
this Service User will stop working. The option expects a positive integer value, optionally
suffixed by the units `s`, `m`, `h`, or `d`, meaning seconds, minutes, hours, and days respectively.
If no suffix is provided, the value is interpreted as seconds. If `--expires-in` is not provided,
the newly created Service User will never expire.

Examples:

```bash
# Create a Service User named `test-1`, which never expires:
modal workspace service-users create test-1

# Two ways of creating a Service User which is valid for an hour:
modal workspace service-users create test-2 --expires-in 3600
modal workspace service-users create test-3 --expires-in 1h

# Create a Service User which is valid for 1 year, outputting JSON:
modal workspace service-users create test-4 --expires-in 365d --json
```

**Usage**:

```shell
modal workspace service-users create [OPTIONS] NAME
```

**Options**:

* `--expires-in TEXT`: Expiration time. Accepts integers (interpreted as seconds), as well as values suffixed by `s`, `m`, `h`, or `d`.
* `--json`: Output as JSON.
* `--help`: Show this message and exit.

### `modal workspace service-users delete`

Delete a Service User in this Workspace.

Note that this action is irreversible. Any existing processes / scripts that use the credentials
associated with the target Service User will stop being able to authenticate with Modal.

```bash
# Delete the Service User named `test-service-user`
modal workspace service-users delete test-service-user
```

**Usage**:

```shell
modal workspace service-users delete [OPTIONS] NAME
```

**Options**:

* `--allow-missing`: Don't error if the Service User doesn't exist.
* `-y, --yes`: Run without pausing for confirmation.
* `--help`: Show this message and exit.

### `modal workspace service-users info`

Inspect a Service User in this workspace.

Examples:

```bash
# Inspect the Service User named `test-service-user`
modal workspace service-users info test-service-user

# Inspect the Service User named `test-service-user-2`, outputting JSON
modal workspace service-users info test-service-user-2 --json
```

**Usage**:

```shell
modal workspace service-users info [OPTIONS] NAME
```

**Options**:

* `--json`: Output as JSON.
* `--help`: Show this message and exit.

### `modal workspace service-users list`

List all Service Users in this workspace.

In order to run this command, you must have at least Manager level permissions in the Workspace.

Examples:

```bash
# List all Service Users with a human-readable output format
modal workspace service-users list

# List all Service Users and return JSON output
modal workspace service-users list --json
```

**Usage**:

```shell
modal workspace service-users list [OPTIONS]
```

**Options**:

* `--json`: Output as JSON.
* `--help`: Show this message and exit.

### `modal workspace service-users set-role`

Update a Service User's role in a specific Environment.

Examples:

```bash
# Give Contributor access in Environment `main` to Service User `test-service-user`
modal workspace service-users set-role test-service-user main contributor

# Revoke access to Environment `prod` from Service User `test-service-user`
modal workspace service-users set-role test-service-user prod no-access
```

**Usage**:

```shell
modal workspace service-users set-role [OPTIONS] SERVICE_USER_NAME ENVIRONMENT_NAME ROLE
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
