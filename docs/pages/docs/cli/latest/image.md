# `modal image`

Manage Images.

**Usage**:

```shell
modal image [OPTIONS] COMMAND [ARGS]...
```

**Options**:

* `--help`: Show this message and exit.

**Commands**:

* `build`: Build an Image from a Dockerfile and publish it as NAME.
* `logs`: Fetch build logs for an Image.
* `names`: Manage Modal Image names.
* `pull`: Pull an Image from a container registry into Modal.

## `modal image build`

Build an Image from a Dockerfile and publish it as NAME.

CONTEXT\_DIR is the build context used to resolve relative COPY paths. Use `.` for the current directory.

NAME defaults to the `latest` tag. `--env` sets the environment the build runs in and where
`--registry-secret` is looked up. The Image is published into that environment unless NAME has an
environment prefix, e.g. `my-env/my-image`.

Examples:

```
modal image build -t my-image .
modal image build --name my-image:v2 -f docker/Dockerfile .
modal image build -t my-env/my-image .
modal image build -t my-image --registry-secret my-registry-creds .
modal image build -t my-image --registry-secret-from-env REGISTRY_USERNAME,REGISTRY_PASSWORD .
```

**Usage**:

```shell
modal image build [OPTIONS] CONTEXT_DIR
```

**Options**:

* `-t, --name [ENV/]NAME[:TAG]`: Name to publish the Image as, e.g. `my-image`, `my-image:v2`, or `my-env/my-image`.  \[required]
* `-f, --file FILE`: Path to the Dockerfile. Defaults to `CONTEXT_DIR/Dockerfile`.
* `--registry-secret SECRET_NAME`: Name of a Secret with credentials for pulling the base image from a private registry.
* `--registry-secret-from-env VAR[,VAR...]`: Comma-separated local environment variable names holding registry credentials. Cannot be combined with --registry-secret.
* `--force-build`: Rebuild every layer of the Image, ignoring cached builds.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.

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

* `delete`: Delete a named Image.
* `list`: List named Images.

### `modal image names delete`

Delete a named Image.

This does not delete the underlying Image, just the
association with the name and its publishing history.

Pass an explicit tag as NAME:TAG.

Example:

```
modal image names delete sglang-image:v1
```

**Usage**:

```shell
modal image names delete [OPTIONS] NAME:TAG
```

**Options**:

* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `-y, --yes`: Run without pausing for confirmation.
* `--help`: Show this message and exit.

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

## `modal image pull`

Pull an Image from a container registry into Modal.

The `image_ref` is a registry image name (and optional tag), as passed to `modal.Image.from_registry`.
It must start with the registry host, e.g. `docker.io/node:20` for a Docker Hub image.
If `--name` is provided, the Modal Image will also be published under that name.
Use `ENV/NAME` to publish to another Environment; `--env` still selects the Environment
used for the pull and for looking up `--registry-secret`.

Examples:

```bash
modal image pull docker.io/node:20
modal image pull nvcr.io/nvidia/pytorch:25.01-py3 --name pytorch:25
modal image pull docker.io/node:20 --name prod/node:20
```

Pass `--force-build` to pull a tag again after it changes in the registry, e.g. `latest`.

Private registries need credentials from a `modal.Secret`, either one that already exists
(`--registry-secret`) or one assembled from local environment variables (`--registry-secret-from-env`).
The kind of authentication follows from the keys in the credentials:

* AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_REGION` (optionally `AWS_SESSION_TOKEN`),
  or `AWS_ROLE_ARN` and `AWS_REGION` to assume a role with OIDC
* GCP: `SERVICE_ACCOUNT_JSON`, holding the service account key's JSON
* Username and password: `REGISTRY_USERNAME` and `REGISTRY_PASSWORD`

```bash
# Authenticate with a named Secret
modal image pull ghcr.io/my-org/my-image --registry-secret my-registry-secret

# Authenticate with credentials in environment variables
modal image pull $AWS_ECR_URL/my-image \
    --registry-secret-from-env AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,AWS_REGION
```

**Usage**:

```shell
modal image pull [OPTIONS] IMAGE_REF
```

**Options**:

* `--name [ENV/]NAME[:TAG]`: Publish the pulled Image under this name. An ENV/ prefix publishes it to that Environment.
* `--registry-secret TEXT`: Name of a modal.Secret holding registry credentials.
* `--registry-secret-from-env VAR[,VAR...]`: Comma-separated local environment variable names holding registry credentials. Cannot be combined with --registry-secret.
* `--force-build`: Pull the image from the registry again, replacing a cached Image.
* `-e, --env TEXT`: Environment to interact with. If unspecified, defers to `MODAL_ENVIRONMENT`, your active local profile, or your workspace default, in that order.
* `--help`: Show this message and exit.
