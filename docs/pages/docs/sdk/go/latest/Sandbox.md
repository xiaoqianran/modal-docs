# Sandbox

Sandbox represents a Modal Sandbox, which can run commands and manage
input/output streams for a remote process. After you are done interacting with the sandbox,
we recommend calling \[Sandbox.Detach] which disconnects your client from the sandbox and
cleans up any resources associated with the connection.

```go
type Sandbox struct {
	SandboxID            string
	Stdin                io.WriteCloser
	Stdout               io.ReadCloser
	Stderr               io.ReadCloser
	Filesystem           *SandboxFilesystem // Filesystem provides high-level filesystem operations for this Sandbox.
	ExperimentalSidecars SidecarService     // ExperimentalSidecars provides operations on Sandbox Sidecar containers. EXPERIMENTAL: the API is subject to change.
}
```

## Create

*Accessed via `client.Sandboxes`*

```go
Create(ctx context.Context, app *App, image *Image, params *SandboxCreateParams) (*Sandbox, error)
```

Create creates a new Sandbox in the App with the specified Image and options.

**Parameters** (`SandboxCreateParams`)

SandboxCreateParams are options for creating a Modal Sandbox.

* `CPU` (`float64`): CPU request in fractional, physical cores.
* `CPULimit` (`float64`): Hard limit in fractional, physical CPU cores. Zero means no limit.
* `MemoryMiB` (`int`): Memory request in MiB.
* `MemoryLimitMiB` (`int`): Hard memory limit in MiB. Zero means no limit.
* `GPU` (`string`): GPU reservation for the Sandbox (e.g. "A100", "T4:2", "A100-80GB:4").
* `Timeout` (`time.Duration`): Maximum lifetime of the Sandbox. Defaults to 5 minutes. If you pass zero you get the default 5 minutes.
* `IdleTimeout` (`time.Duration`): The amount of time that a Sandbox can be idle before being terminated.
* `Workdir` (`string`): Working directory of the Sandbox.
* `Command` (`[]string`): Command to run in the Sandbox on startup.
* `Env` (`map[string]string`): Environment variables to set in the Sandbox.
* `Secrets` (`[]*Secret`): Secrets to inject into the Sandbox as environment variables.
* `Volumes` (`map[string]*Volume`): Mount points for Volumes.
* `CloudBucketMounts` (`map[string]*CloudBucketMount`): Mount points for cloud buckets.
* `PTY` (`bool`): Enable a PTY for the Sandbox entrypoint command. When enabled, all output (stdout and stderr from the process) is multiplexed into stdout, and the stderr stream is effectively empty.
* `EncryptedPorts` (`[]int`): List of encrypted ports to tunnel into the Sandbox, with TLS encryption.
* `H2Ports` (`[]int`): List of encrypted ports to tunnel into the Sandbox, using HTTP/2.
* `UnencryptedPorts` (`[]int`): List of ports to tunnel into the Sandbox without encryption.
* `BlockNetwork` (`bool`): Whether to block all network access from the Sandbox.
* `OutboundCIDRAllowlist` (`*Allowlist`): CIDRs the Sandbox is allowed to access. Non-nil enables allowlist mode; nil means open access. Cannot be used with BlockNetwork.
* `OutboundDomainAllowlist` (`*Allowlist`): Domain names the Sandbox is allowed to access (supports wildcard prefixes like \*.example.com). Non-nil enables allowlist mode; nil means open access. Cannot be used with BlockNetwork.
* `InboundCIDRAllowlist` (`[]string`): List of CIDRs allowed to connect inbound to the Sandbox (tunnels and connection tokens). If empty, all IPs are allowed.
* `I6PN` (`bool`): Enable private IPv6 networking (i6pn) so Sandboxes in the same workspace can reach each other at their i6pn.modal.local address. Pin every Sandbox in the group to the same specific region. Cannot be used with BlockNetwork.
* `Cloud` (`string`): Cloud provider to run the Sandbox on.
* `Regions` (`[]string`): Region(s) to run the Sandbox on.
* `Verbose` (`bool`): Enable verbose logging.
* `Proxy` (`*Proxy`): Reference to a Modal Proxy to use in front of this Sandbox.
* `ReadinessProbe` (`*Probe`): Probe used to determine when the Sandbox is ready.
* `Name` (`string`): Optional name for the Sandbox. Unique within an App.
* `Tags` (`map[string]string`): Tags to attach to the Sandbox. Filterable via SandboxList.
* `ExperimentalOptions` (`map[string]any`): Experimental options
* `CustomDomain` (`string`): If non-empty, connections to this Sandbox will be subdomains of this domain rather than the default. This requires prior manual setup by Modal and is only available for Enterprise customers.
* `IncludeOidcIdentityToken` (`bool`): If true, the sandbox will receive a MODAL\_IDENTITY\_TOKEN env var for OIDC-based auth (e.g. to AWS, GCP).

## ExperimentalCreate

*Accessed via `client.Sandboxes`*

```go
ExperimentalCreate(ctx context.Context, app *App, image *Image, params *SandboxCreateParams) (*Sandbox, error)
```

ExperimentalCreate creates a new Sandbox using the experimental V2 backend.

Supported features include exec, encrypted tunnels, wait/poll/terminate,
CPU and memory configuration, region placement, volumes, cloud bucket
mounts (with static credentials via Secret or OidcAuthRoleArn), OIDC identity
tokens, proxies, and filesystem snapshots.

Features like memory snapshots, GPUs, and custom domains are not
supported.

V2 sandboxes created with this method are not currently returned by List. A
named Sandbox can be looked up with ExperimentalFromName; otherwise store
Sandbox.SandboxID and use FromID to reattach.

**Parameters** (`SandboxCreateParams`)

SandboxCreateParams are options for creating a Modal Sandbox.

* `CPU` (`float64`): CPU request in fractional, physical cores.
* `CPULimit` (`float64`): Hard limit in fractional, physical CPU cores. Zero means no limit.
* `MemoryMiB` (`int`): Memory request in MiB.
* `MemoryLimitMiB` (`int`): Hard memory limit in MiB. Zero means no limit.
* `GPU` (`string`): GPU reservation for the Sandbox (e.g. "A100", "T4:2", "A100-80GB:4").
* `Timeout` (`time.Duration`): Maximum lifetime of the Sandbox. Defaults to 5 minutes. If you pass zero you get the default 5 minutes.
* `IdleTimeout` (`time.Duration`): The amount of time that a Sandbox can be idle before being terminated.
* `Workdir` (`string`): Working directory of the Sandbox.
* `Command` (`[]string`): Command to run in the Sandbox on startup.
* `Env` (`map[string]string`): Environment variables to set in the Sandbox.
* `Secrets` (`[]*Secret`): Secrets to inject into the Sandbox as environment variables.
* `Volumes` (`map[string]*Volume`): Mount points for Volumes.
* `CloudBucketMounts` (`map[string]*CloudBucketMount`): Mount points for cloud buckets.
* `PTY` (`bool`): Enable a PTY for the Sandbox entrypoint command. When enabled, all output (stdout and stderr from the process) is multiplexed into stdout, and the stderr stream is effectively empty.
* `EncryptedPorts` (`[]int`): List of encrypted ports to tunnel into the Sandbox, with TLS encryption.
* `H2Ports` (`[]int`): List of encrypted ports to tunnel into the Sandbox, using HTTP/2.
* `UnencryptedPorts` (`[]int`): List of ports to tunnel into the Sandbox without encryption.
* `BlockNetwork` (`bool`): Whether to block all network access from the Sandbox.
* `OutboundCIDRAllowlist` (`*Allowlist`): CIDRs the Sandbox is allowed to access. Non-nil enables allowlist mode; nil means open access. Cannot be used with BlockNetwork.
* `OutboundDomainAllowlist` (`*Allowlist`): Domain names the Sandbox is allowed to access (supports wildcard prefixes like \*.example.com). Non-nil enables allowlist mode; nil means open access. Cannot be used with BlockNetwork.
* `InboundCIDRAllowlist` (`[]string`): List of CIDRs allowed to connect inbound to the Sandbox (tunnels and connection tokens). If empty, all IPs are allowed.
* `I6PN` (`bool`): Enable private IPv6 networking (i6pn) so Sandboxes in the same workspace can reach each other at their i6pn.modal.local address. Pin every Sandbox in the group to the same specific region. Cannot be used with BlockNetwork.
* `Cloud` (`string`): Cloud provider to run the Sandbox on.
* `Regions` (`[]string`): Region(s) to run the Sandbox on.
* `Verbose` (`bool`): Enable verbose logging.
* `Proxy` (`*Proxy`): Reference to a Modal Proxy to use in front of this Sandbox.
* `ReadinessProbe` (`*Probe`): Probe used to determine when the Sandbox is ready.
* `Name` (`string`): Optional name for the Sandbox. Unique within an App.
* `Tags` (`map[string]string`): Tags to attach to the Sandbox. Filterable via SandboxList.
* `ExperimentalOptions` (`map[string]any`): Experimental options
* `CustomDomain` (`string`): If non-empty, connections to this Sandbox will be subdomains of this domain rather than the default. This requires prior manual setup by Modal and is only available for Enterprise customers.
* `IncludeOidcIdentityToken` (`bool`): If true, the sandbox will receive a MODAL\_IDENTITY\_TOKEN env var for OIDC-based auth (e.g. to AWS, GCP).

## FromID

*Accessed via `client.Sandboxes`*

```go
FromID(ctx context.Context, sandboxID string, params *SandboxFromIDParams) (*Sandbox, error)
```

FromID returns a running Sandbox object from an ID.

**Parameters** (`SandboxFromIDParams`)

SandboxFromIDParams are options for SandboxService.FromID.

*No configurable options.*

## FromName

*Accessed via `client.Sandboxes`*

```go
FromName(ctx context.Context, appName, name string, params *SandboxFromNameParams) (*Sandbox, error)
```

FromName gets a running Sandbox by name from a deployed App.

Raises a NotFoundError if no running Sandbox is found with the given name.
A Sandbox's name is the `Name` argument passed to `App.CreateSandbox`.

**Parameters** (`SandboxFromNameParams`)

SandboxFromNameParams are options for finding deployed Sandbox objects by name.

* `Environment` (`string`)

## ExperimentalFromName

*Accessed via `client.Sandboxes`*

```go
ExperimentalFromName(ctx context.Context, appName, name string, params *SandboxExperimentalFromNameParams) (*Sandbox, error)
```

ExperimentalFromName gets a running V2 Sandbox by name from a deployed App,
i.e. a Sandbox created via ExperimentalCreate.

EXPERIMENTAL: the API is subject to change.

**Parameters** (`SandboxExperimentalFromNameParams`)

SandboxExperimentalFromNameParams are options for SandboxService.ExperimentalFromName.

* `Environment` (`string`)

## List

*Accessed via `client.Sandboxes`*

```go
List(ctx context.Context, params *SandboxListParams) (iter.Seq2[*Sandbox, error], error)
```

List lists Sandboxes for the current environment (or provided App ID), optionally filtered by tags.

**Parameters** (`SandboxListParams`)

SandboxListParams are options for listing Sandboxes.

* `AppID` (`string`): Filter by App ID
* `Tags` (`map[string]string`): Only include Sandboxes that have all these tags
* `Environment` (`string`): Override environment for this request

## ExperimentalList

*Accessed via `client.Sandboxes`*

```go
ExperimentalList(ctx context.Context, params *SandboxExperimentalListParams) (iter.Seq2[*Sandbox, error], error)
```

ExperimentalList lists the V2 Sandboxes in an App, i.e. Sandboxes created via
ExperimentalCreate. If Tags are specified, only Sandboxes that have all those
tags are returned.

EXPERIMENTAL: the API is subject to change.

**Parameters** (`SandboxExperimentalListParams`)

SandboxExperimentalListParams are options for SandboxService.ExperimentalList.

* `AppID` (`string`): The App to list Sandboxes under.
* `Tags` (`map[string]string`): Only include Sandboxes that have all these tags.

## CreateConnectToken

```go
CreateConnectToken(ctx context.Context, params *SandboxCreateConnectTokenParams) (*SandboxCreateConnectCredentials, error)
```

CreateConnectToken creates a token for making HTTP connections to the Sandbox.

**Parameters** (`SandboxCreateConnectTokenParams`)

SandboxCreateConnectTokenParams are optional parameters for CreateConnectToken.

* `UserMetadata` (`string`): Optional user-provided metadata string that will be added to the headers by the proxy when forwarding requests to the Sandbox.
* `Port` (`int`): Container port that requests are routed to when using this token. Defaults to 8080.

## Detach

```go
Detach() error
```

Detach disconnects from the running Sandbox

## Exec

```go
Exec(ctx context.Context, command []string, params *SandboxExecParams) (*ContainerProcess, error)
```

Exec runs a command in the Sandbox and returns the process handle.

**Parameters** (`SandboxExecParams`)

SandboxExecParams defines options for executing commands in a Sandbox.

* `Stdout` (`StdioBehavior`): Stdout defines whether to pipe or ignore standard output.
* `Stderr` (`StdioBehavior`): Stderr defines whether to pipe or ignore standard error.
* `Workdir` (`string`): Workdir is the working directory to run the command in.
* `Timeout` (`time.Duration`): Timeout is the timeout for command execution. Defaults to 0 (no timeout).
* `Env` (`map[string]string`): Environment variables to set for the command.
* `Secrets` (`[]*Secret`): Secrets to inject as environment variables for the command.
* `PTY` (`bool`): PTY defines whether to enable a PTY for the command. When enabled, all output (stdout and stderr from the process) is multiplexed into stdout, and the stderr stream is effectively empty.

## GetTags

```go
GetTags(ctx context.Context, params *SandboxGetTagsParams) (map[string]string, error)
```

GetTags fetches any tags (key-value pairs) currently attached to this Sandbox from the server.

**Parameters** (`SandboxGetTagsParams`)

SandboxGetTagsParams are options for Sandbox.GetTags.

*No configurable options.*

## MountImage

```go
MountImage(ctx context.Context, path string, image *Image, params *SandboxMountImageParams) error
```

MountImage mounts an Image at a path in the Sandbox filesystem.

If image is nil, mounts an empty directory.

**Parameters** (`SandboxMountImageParams`)

SandboxMountImageParams are options for Sandbox.MountImage.

* `ExperimentalEncryptionKey` (`[]byte`): ExperimentalEncryptionKey is a customer-supplied encryption key used to decrypt the image. Use the same key that encrypted the snapshot.

## Poll

```go
Poll(ctx context.Context, params *SandboxPollParams) (*int, error)
```

Poll checks if the Sandbox has finished running.
Returns nil if the Sandbox is still running, else returns the exit code.

**Parameters** (`SandboxPollParams`)

SandboxPollParams are options for Sandbox.Poll.

*No configurable options.*

## ReloadVolumes

```go
ReloadVolumes(ctx context.Context, params *SandboxReloadVolumesParams) error
```

ReloadVolumes reloads all Volumes mounted in the Sandbox.

Blocks until the Volumes have been reloaded, bounded by the timeout (55
seconds by default; see \[SandboxReloadVolumesParams]). If the reload does not
complete within that window, a TimeoutError is returned; note that the reload
may still complete in the background.

**Parameters** (`SandboxReloadVolumesParams`)

SandboxReloadVolumesParams are options for Sandbox.ReloadVolumes.

* `Timeout` (`time.Duration`): Timeout bounds how long the call waits for the reload to complete. Defaults to 55 seconds. If the reload does not complete within this window, the call is cancelled and a TimeoutError is returned.

## SetTags

```go
SetTags(ctx context.Context, tags map[string]string, params *SandboxSetTagsParams) error
```

SetTags sets key-value tags on the Sandbox. Tags can be used to filter results in SandboxList.

**Parameters** (`SandboxSetTagsParams`)

SandboxSetTagsParams are options for Sandbox.SetTags.

*No configurable options.*

## SnapshotDirectory

```go
SnapshotDirectory(ctx context.Context, path string, params *SandboxSnapshotDirectoryParams) (*Image, error)
```

SnapshotDirectory snapshots and creates a new image from a directory in the running sandbox.

If params is nil, the resulting image is retained for 30 days as a hard
cutoff measured from creation, and the call has a 55-second timeout.
See \[SandboxSnapshotDirectoryParams] for control over both.

**Parameters** (`SandboxSnapshotDirectoryParams`)

SandboxSnapshotDirectoryParams configures a \[Sandbox.SnapshotDirectory] call.

* `Timeout` (`time.Duration`): Timeout is the overall budget for the snapshot call. Zero means the default (55 seconds). If it elapses before a snapshot completes, a TimeoutError is returned.
* `TTL` (`time.Duration`): TTL is the lifetime of the resulting image. Zero (or omitted) means use the default of 30 days, as a hard cutoff measured from creation. A positive value sets a custom lifetime; sub-second values are rejected. Pass \[NoExpiryTTL] to retain the image indefinitely. See \[NoExpiryTTL].
* `ExperimentalEncryptionKey` (`[]byte`): ExperimentalEncryptionKey is a customer-supplied encryption key used to encrypt the resulting snapshot. The same key is required when mounting the image. Modal does not persist the key.

## SnapshotFilesystem

```go
SnapshotFilesystem(ctx context.Context, params *SandboxSnapshotFilesystemParams) (*Image, error)
```

SnapshotFilesystem takes a snapshot of the Sandbox's filesystem.
Returns an Image object which can be used to spawn a new Sandbox with the same filesystem.

If params is nil, the resulting image is retained for 30 days as a hard
cutoff measured from creation, and the call has a 55-second timeout.
See \[SandboxSnapshotFilesystemParams] for control over both.

**Parameters** (`SandboxSnapshotFilesystemParams`)

SandboxSnapshotFilesystemParams configures a \[Sandbox.SnapshotFilesystem] call.

* `Timeout` (`time.Duration`): Timeout is the overall budget for the snapshot call. Zero means the default (55 seconds). If it elapses before a snapshot completes, a TimeoutError is returned.
* `TTL` (`time.Duration`): TTL is the lifetime of the resulting image. Zero (or omitted) means use the default of 30 days, as a hard cutoff measured from creation. A positive value sets a custom lifetime; sub-second values are rejected. Pass \[NoExpiryTTL] to retain the image indefinitely. See \[NoExpiryTTL].

## Terminate

```go
Terminate(ctx context.Context, params *SandboxTerminateParams) (int, error)
```

Terminate stops the Sandbox.

**Parameters** (`SandboxTerminateParams`)

SandboxTerminateParams are options for Terminate.

* `Wait` (`bool`): Wait, when true, will wait for the Sandbox to terminate and return the exit code.

## Tunnels

```go
Tunnels(ctx context.Context, timeout time.Duration, params *SandboxTunnelsParams) (map[int]*Tunnel, error)
```

Tunnels gets Tunnel metadata for the Sandbox.
Returns SandboxTimeoutError if the tunnels are not available after the timeout.
Returns a map of Tunnel objects keyed by the container port.

**Parameters** (`SandboxTunnelsParams`)

SandboxTunnelsParams are options for Sandbox.Tunnels.

*No configurable options.*

## UnmountImage

```go
UnmountImage(ctx context.Context, path string, params *SandboxUnmountImageParams) error
```

UnmountImage removes an image mount from a path in the Sandbox filesystem.

**Parameters** (`SandboxUnmountImageParams`)

SandboxUnmountImageParams are options for Sandbox.UnmountImage.

*No configurable options.*

## UpdateNetworkPolicy

```go
UpdateNetworkPolicy(ctx context.Context, params *SandboxUpdateNetworkPolicyParams) error
```

UpdateNetworkPolicy updates the outbound network policy of a running Sandbox.

Established connections that the new policy no longer permits are terminated.

**Parameters** (`SandboxUpdateNetworkPolicyParams`)

SandboxUpdateNetworkPolicyParams are options for Sandbox.UpdateNetworkPolicy.

Each dimension is independent: a nil *Allowlist leaves that dimension
unchanged, while a non-nil value replaces it (an empty Entries blocks all
egress; an allow-all entry such as "0.0.0.0/0" or "*" allows everything).

Currently, both dimensions must be provided (the underlying transport does
not yet support partial updates). This requirement will be relaxed in a
future release.

* `OutboundCIDRAllowlist` (`*Allowlist`)
* `OutboundDomainAllowlist` (`*Allowlist`)

## Wait

```go
Wait(ctx context.Context, params *SandboxWaitParams) (int, error)
```

Wait blocks until the Sandbox exits, and returns its exit code.

**Parameters** (`SandboxWaitParams`)

SandboxWaitParams are options for Sandbox.Wait.

*No configurable options.*

## WaitUntilReady

```go
WaitUntilReady(ctx context.Context, timeout time.Duration, params *SandboxWaitUntilReadyParams) error
```

WaitUntilReady blocks until the Sandbox readiness probe reports ready.

**Parameters** (`SandboxWaitUntilReadyParams`)

SandboxWaitUntilReadyParams are options for Sandbox.WaitUntilReady.

*No configurable options.*

## Sandbox.ExperimentalSidecars

ExperimentalSidecars provides operations on Sandbox Sidecar containers.

EXPERIMENTAL: the API is subject to change.

### Create

```go
Create(ctx context.Context, name string, image *Image, params *SidecarCreateParams) (*SidecarContainer, error)
```

Create starts a new sidecar container in the Sandbox. The Image must
already be built by calling \[Image.Build] before it's passed to Create.

**Parameters** (`SidecarCreateParams`)

SidecarCreateParams holds options for creating a sidecar container.

* `Command` (`[]string`): Command to run in the sidecar container on startup.
* `Env` (`map[string]string`): Env are environment variables to set in the sidecar container.
* `Secrets` (`[]*Secret`): Secrets to inject into the sidecar container as environment variables.
* `Workdir` (`string`): Workdir sets the working directory of the sidecar container.

### Get

```go
Get(ctx context.Context, name string, params *SidecarGetParams) (*SidecarContainer, error)
```

Get returns a sidecar container by name.

**Parameters** (`SidecarGetParams`)

SidecarGetParams holds options for retrieving a sidecar by name.

* `IncludeTerminated` (`bool`)

### List

```go
List(ctx context.Context, params *SidecarListParams) ([]*SidecarContainer, error)
```

List returns all sidecar containers (not including the main container).

**Parameters** (`SidecarListParams`)

SidecarListParams holds options for listing sidecars.

* `IncludeTerminated` (`bool`)

## Sandbox.Filesystem

Filesystem provides high-level filesystem operations for this Sandbox.

### CopyFromLocal

```go
CopyFromLocal(ctx context.Context, localPath, remotePath string, params *SandboxFilesystemCopyFromLocalParams) error
```

CopyFromLocal copies a local file into the Sandbox.

remotePath must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

Returns \[SandboxFilesystemNotADirectoryError] if a parent component of
remotePath is not a directory, \[SandboxFilesystemIsADirectoryError] if
remotePath points to a directory, \[SandboxFilesystemPermissionError] if
write permission is denied, or an \*os.PathError if localPath does not
exist, is a directory, or cannot be read.

**Parameters** (`SandboxFilesystemCopyFromLocalParams`)

SandboxFilesystemCopyFromLocalParams holds optional parameters for \[SandboxFilesystem.CopyFromLocal].

*No configurable options.*

### CopyToLocal

```go
CopyToLocal(ctx context.Context, remotePath, localPath string, params *SandboxFilesystemCopyToLocalParams) (retErr error)
```

CopyToLocal copies a file from the Sandbox to a local path.

remotePath must be an absolute path to a file in the Sandbox.
Parent directories for localPath are created if needed. The local file is
overwritten if it already exists.

Returns \[SandboxFilesystemNotFoundError] if the remote path does not exist,
\[SandboxFilesystemIsADirectoryError] if the remote path points to a directory,
\[SandboxFilesystemFileTooLargeError] if the file exceeds the read size limit,
or \[SandboxFilesystemPermissionError] if read permission is denied.

**Parameters** (`SandboxFilesystemCopyToLocalParams`)

SandboxFilesystemCopyToLocalParams holds optional parameters for \[SandboxFilesystem.CopyToLocal].

*No configurable options.*

### ListFiles

```go
ListFiles(ctx context.Context, remotePath string, params *SandboxFilesystemListFilesParams) ([]FileInfo, error)
```

ListFiles lists files and directories in a Sandbox directory.

remotePath must be an absolute path to a directory in the Sandbox.
Returns a slice of \[FileInfo] objects sorted by name.

Returns \[SandboxFilesystemNotFoundError] if the path does not exist,
\[SandboxFilesystemNotADirectoryError] if the path is not a directory,
or \[SandboxFilesystemPermissionError] if read permission is denied.

**Parameters** (`SandboxFilesystemListFilesParams`)

SandboxFilesystemListFilesParams holds optional parameters for \[SandboxFilesystem.ListFiles].

*No configurable options.*

### MakeDirectory

```go
MakeDirectory(ctx context.Context, remotePath string, params *SandboxFilesystemMakeDirectoryParams) error
```

MakeDirectory creates a new directory in the Sandbox.

remotePath must be an absolute path in the Sandbox.

When params.CreateParents is true (the default when params is nil), any
missing parent directories are created and the call is idempotent (succeeds
if the directory already exists). When false, the immediate parent must
already exist and the path must not already exist.

Returns \[SandboxFilesystemNotFoundError] if the parent does not exist and
CreateParents is false, \[SandboxFilesystemPathAlreadyExistsError] if the
path already exists, \[SandboxFilesystemNotADirectoryError] if a path
component is not a directory, \[SandboxFilesystemPermissionError] if
creation is not permitted, or \[InvalidError] if the mount does not
support this operation.

**Parameters** (`SandboxFilesystemMakeDirectoryParams`)

SandboxFilesystemMakeDirectoryParams holds optional parameters for \[SandboxFilesystem.MakeDirectory].

* `CreateParents` (`*bool`): CreateParents controls whether missing parent directories are created automatically. Defaults to true when nil.

### ReadBytes

```go
ReadBytes(ctx context.Context, remotePath string, params *SandboxFilesystemReadParams) ([]byte, error)
```

ReadBytes reads a file from the Sandbox and returns its contents as bytes.

remotePath must be an absolute path to a file in the Sandbox.

Returns \[SandboxFilesystemNotFoundError] if the path does not exist,
\[SandboxFilesystemIsADirectoryError] if the path points to a directory,
\[SandboxFilesystemFileTooLargeError] if the file exceeds the read size limit,
or \[SandboxFilesystemPermissionError] if read permission is denied.

**Parameters** (`SandboxFilesystemReadParams`)

SandboxFilesystemReadParams holds optional parameters for \[SandboxFilesystem.ReadBytes] and \[SandboxFilesystem.ReadText].

*No configurable options.*

### ReadText

```go
ReadText(ctx context.Context, remotePath string, params *SandboxFilesystemReadParams) (string, error)
```

ReadText reads a file from the Sandbox and returns its contents as a UTF-8 string.

remotePath must be an absolute path to a file in the Sandbox.

Returns \[SandboxFilesystemNotFoundError] if the path does not exist,
\[SandboxFilesystemIsADirectoryError] if the path points to a directory,
\[SandboxFilesystemFileTooLargeError] if the file exceeds the read size limit,
or \[SandboxFilesystemPermissionError] if read permission is denied.

**Parameters** (`SandboxFilesystemReadParams`)

SandboxFilesystemReadParams holds optional parameters for \[SandboxFilesystem.ReadBytes] and \[SandboxFilesystem.ReadText].

*No configurable options.*

### Remove

```go
Remove(ctx context.Context, remotePath string, params *SandboxFilesystemRemoveParams) error
```

Remove a file or directory in the Sandbox.

remotePath must be an absolute path in the Sandbox. When remotePath is a
directory and params.Recursive is false (the default when params is nil),
it is removed only if empty. When Recursive is true, the directory and all
its contents are removed. Recursive removal is not supported on all mounts.

Returns \[SandboxFilesystemNotFoundError] if the path does not exist,
\[SandboxFilesystemDirectoryNotEmptyError] if Recursive is false and the
directory is not empty, \[SandboxFilesystemPermissionError] if removal is
not permitted, or \[InvalidError] if the mount does not support this operation.

**Parameters** (`SandboxFilesystemRemoveParams`)

SandboxFilesystemRemoveParams holds optional parameters for \[SandboxFilesystem.Remove].

* `Recursive` (`bool`): Recurisve controls whether contens of a removed directory are recursively removed. Defaults to false when nil.

### Stat

```go
Stat(ctx context.Context, remotePath string, params *SandboxFilesystemStatParams) (*FileInfo, error)
```

Stat returns metadata for a single file, directory, or symlink in the Sandbox.

remotePath must be an absolute path in the Sandbox. If remotePath is a
symlink, the returned \[FileInfo] describes the symlink itself, not the
target it points to.

Returns \[SandboxFilesystemNotFoundError] if the path does not exist,
\[SandboxFilesystemNotADirectoryError] if a non-leaf component of the path
is not a directory, or \[SandboxFilesystemPermissionError] if a path
component is not searchable.

**Parameters** (`SandboxFilesystemStatParams`)

SandboxFilesystemStatParams holds optional parameters for \[SandboxFilesystem.Stat].

*No configurable options.*

### Watch

```go
Watch(
	ctx context.Context,
	remotePath string,
	params *SandboxFilesystemWatchParams,
) (iter.Seq2[FileWatchEvent, error], error)
```

Watch a path in the Sandbox for filesystem changes.

remotePath must be an absolute path in the Sandbox. If it points to a
file, events for that file are reported. If it points to a directory,
events for entries directly inside it are reported. Set params.Recursive
to also receive events for all nested subdirectories. If remotePath is a
symlink, it is followed and events reference paths under the resolved
target.

The returned \[iter.Seq2] yields \[FileWatchEvent] values as changes occur,
until the timeout elapses, the caller breaks from the range loop, ctx is
cancelled, or the Sandbox is terminated. The remote watch process is not
started until iteration begins, so a sequence that is never ranged over
launches nothing.

Set params.Filter to restrict which event types are emitted. A nil filter
permits all types; an empty slice suppresses all events.

A nil params.Timeout watches indefinitely, while a zero params.Timeout
returns immediately without waiting for events. Otherwise the duration is
rounded down to whole seconds, and when it elapses the iterator stops
without returning an error.

Pass nil params for defaults (no filter, non-recursive, no timeout).

Returns \[SandboxFilesystemNotFoundError] if remotePath does not exist,
\[SandboxFilesystemPermissionError] if watch access is denied, or
\[InvalidError] if the filesystem does not support watching.

**Parameters** (`SandboxFilesystemWatchParams`)

SandboxFilesystemWatchParams holds optional parameters for \[SandboxFilesystem.Watch].

* `Filter` (`[]FileWatchEventType`)
* `Recursive` (`bool`)
* `Timeout` (`*time.Duration`): Timeout is the maximum duration to watch. A nil Timeout watches indefinitely, while a zero Timeout returns immediately without waiting for events. Durations are rounded-down to the nearest whole number of seconds.

### WriteBytes

```go
WriteBytes(ctx context.Context, data []byte, remotePath string, params *SandboxFilesystemWriteParams) error
```

WriteBytes writes binary content to a file in the Sandbox.

remotePath must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

Returns \[SandboxFilesystemNotADirectoryError] if a parent component of
remotePath is not a directory, \[SandboxFilesystemIsADirectoryError] if
remotePath points to a directory, or \[SandboxFilesystemPermissionError]
if write permission is denied.

**Parameters** (`SandboxFilesystemWriteParams`)

SandboxFilesystemWriteParams holds optional parameters for \[SandboxFilesystem.WriteBytes] and \[SandboxFilesystem.WriteText].

*No configurable options.*

### WriteText

```go
WriteText(ctx context.Context, data string, remotePath string, params *SandboxFilesystemWriteParams) error
```

WriteText writes UTF-8 text to a file in the Sandbox.

remotePath must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

Returns \[SandboxFilesystemNotADirectoryError] if a parent component of
remotePath is not a directory, \[SandboxFilesystemIsADirectoryError] if
remotePath points to a directory, or \[SandboxFilesystemPermissionError]
if write permission is denied.

**Parameters** (`SandboxFilesystemWriteParams`)

SandboxFilesystemWriteParams holds optional parameters for \[SandboxFilesystem.WriteBytes] and \[SandboxFilesystem.WriteText].

*No configurable options.*
