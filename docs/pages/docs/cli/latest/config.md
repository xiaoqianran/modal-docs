# `modal config`

Manage client configuration for the current profile.

Refer to https://modal.com/docs/sdk/py/latest/config for a full explanation
of what these options mean, and how to set them.

**Usage**:

```shell
modal config [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `set-environment`: Set the default Modal environment for the active profile
* `show`: Show current configuration values (debugging command).

## `modal config set-environment`

Set the default Modal environment for the active profile

The default environment of a profile is used when no --env flag is passed to `modal run`, `modal deploy` etc.

If no default environment is set, and there exists multiple environments in a workspace, an error will be raised
when running a command that requires an environment.

**Usage**:

```shell
modal config set-environment [OPTIONS] ENVIRONMENT_NAME
```

**Options**:

* `--help`: Show this message and exit.

## `modal config show`

Show current configuration values (debugging command).

**Usage**:

```shell
modal config show [OPTIONS]
```

**Options**:

* `--redact / --no-redact`: Redact the `token_secret` value.
* `--help`: Show this message and exit.
