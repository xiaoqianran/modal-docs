# Sandbox

Sandboxes are secure, isolated containers in Modal that boot in seconds.

```typescript
class Sandbox {
  readonly sandboxId: string;
  get stdin(): ModalWriteStream<string>;
  get stdout(): ModalReadStream<string>;
  get stderr(): ModalReadStream<string>;
  get filesystem(): SandboxFilesystem;
  get experimentalSidecars(): SidecarService; // Operations for managing sidecar containers that run alongside the Sandbox's main container. EXPERIMENTAL: the API is subject to change.
}
```

## create

*Accessed via `modal.sandboxes`*

```typescript
async create(
  app: App,
  image: Image,
  params: SandboxCreateParams = {},
): Promise<Sandbox>
```

Create a new `Sandbox` in the `App` with the specified `Image` and options.

**Parameters** (`SandboxCreateParams`)

Optional parameters for `client.sandboxes.create()`.

* `cpu?` (`number`): Reservation of physical CPU cores for the Sandbox, can be fractional.
* `cpuLimit?` (`number`): Hard limit of physical CPU cores for the Sandbox, can be fractional.
* `memoryMiB?` (`number`): Reservation of memory in MiB.
* `memoryLimitMiB?` (`number`): Hard limit of memory in MiB.
* `gpu?` (`string`): GPU reservation for the Sandbox (e.g. "A100", "T4:2", "A100-80GB:4").
* `timeoutMs?` (`number`): Maximum lifetime of the Sandbox in milliseconds. Defaults to 5 minutes.
* `idleTimeoutMs?` (`number`): The amount of time in milliseconds that a Sandbox can be idle before being terminated.
* `workdir?` (`string`): Working directory of the Sandbox.
* `command?` (`string[]`): Sequence of program arguments for the main process. Default behavior is to sleep indefinitely until timeout or termination.
* `env?` (`Record<string, string>`): Environment variables to set in the Sandbox.
* `secrets?` (`Secret[]`): `Secret`s to inject into the Sandbox as environment variables.
* `volumes?` (`Record<string, Volume>`): Mount points for Modal `Volume`s.
* `cloudBucketMounts?` (`Record<string, CloudBucketMount>`): Mount points for `CloudBucketMount`s.
* `pty?` (`boolean`): Enable a PTY for the Sandbox entrypoint command. When enabled, all output (stdout and stderr from the process) is multiplexed into stdout, and the stderr stream is effectively empty.
* `encryptedPorts?` (`number[]`): List of ports to tunnel into the Sandbox. Encrypted ports are tunneled with TLS.
* `h2Ports?` (`number[]`): List of encrypted ports to tunnel into the Sandbox, using HTTP/2.
* `unencryptedPorts?` (`number[]`): List of ports to tunnel into the Sandbox without encryption.
* `blockNetwork?` (`boolean`): Whether to block all network access from the Sandbox.
* `outboundCidrAllowlist?` (`string[]`): List of CIDRs the Sandbox is allowed to access. If not set, all CIDRs are allowed. Cannot be used with blockNetwork.
* `outboundDomainAllowlist?` (`string[]`): List of domain names the Sandbox is allowed to access. Supports wildcard prefixes (`*.example.com`). Cannot be used with blockNetwork.
* `inboundCidrAllowlist?` (`string[]`): List of CIDRs allowed to connect inbound to the Sandbox (tunnels and connection tokens). If not set, all IPs are allowed. Cannot be used with blockNetwork.
* `i6pn?` (`boolean`): Enable private IPv6 networking (i6pn) so Sandboxes in the same workspace can address each other directly at their `i6pn.modal.local` address. Pin every Sandbox in the group to the same specific region (e.g. `regions: ["us-east-1"]`). Cannot be used with blockNetwork.
* `cloud?` (`string`): Cloud provider to run the Sandbox on.
* `regions?` (`string[]`): Region(s) to run the Sandbox on.
* `verbose?` (`boolean`): Enable verbose logging.
* `proxy?` (`Proxy`): Reference to a Modal `Proxy` to use in front of this Sandbox.
* `readinessProbe?` (`Probe`): Probe used to determine when the Sandbox has become ready.
* `name?` (`string`): Optional name for the Sandbox. Unique within an App.
* `tags?` (`Record<string, string>`): Tags to attach to the Sandbox. Filterable via `client.sandboxes.list`.
* `experimentalOptions?` (`Record<string, any>`): Optional experimental options.
* `customDomain?` (`string`): If set, connections to this Sandbox will be subdomains of this domain rather than the default. This requires prior manual setup by Modal and is only available for Enterprise customers.
* `includeOidcIdentityToken?` (`boolean`): If true, the sandbox will receive a MODAL\_IDENTITY\_TOKEN env var for OIDC-based auth (e.g. to AWS, GCP).

## experimentalCreate

*Accessed via `modal.sandboxes`*

```typescript
async experimentalCreate(
  app: App,
  image: Image,
  params: SandboxCreateParams = {},
): Promise<Sandbox>
```

Create a new `Sandbox` using the experimental V2 backend.

Supported features include exec, encrypted tunnels, wait/poll/terminate,
CPU and memory configuration, region placement, volumes, cloud bucket
mounts (with static credentials via `Secret` or `oidcAuthRoleArn`),
OIDC identity tokens, `proxies`, filesystem snapshots, and
custom domains (`customDomain` allows connections to the Sandbox via a
subdomain of that parent domain rather than a default Modal domain;
requires prior setup by Modal).

Features like memory snapshots and GPUs are not supported.

V2 sandboxes created with this method are not currently returned by
`client.sandboxes.list()`. A named Sandbox can be
looked up with
`client.sandboxes.experimentalFromName()`;
otherwise store `sandbox.sandboxId` and use
`client.sandboxes.fromId()` to reattach.

**Parameters** (`SandboxCreateParams`)

Optional parameters for `client.sandboxes.create()`.

* `cpu?` (`number`): Reservation of physical CPU cores for the Sandbox, can be fractional.
* `cpuLimit?` (`number`): Hard limit of physical CPU cores for the Sandbox, can be fractional.
* `memoryMiB?` (`number`): Reservation of memory in MiB.
* `memoryLimitMiB?` (`number`): Hard limit of memory in MiB.
* `gpu?` (`string`): GPU reservation for the Sandbox (e.g. "A100", "T4:2", "A100-80GB:4").
* `timeoutMs?` (`number`): Maximum lifetime of the Sandbox in milliseconds. Defaults to 5 minutes.
* `idleTimeoutMs?` (`number`): The amount of time in milliseconds that a Sandbox can be idle before being terminated.
* `workdir?` (`string`): Working directory of the Sandbox.
* `command?` (`string[]`): Sequence of program arguments for the main process. Default behavior is to sleep indefinitely until timeout or termination.
* `env?` (`Record<string, string>`): Environment variables to set in the Sandbox.
* `secrets?` (`Secret[]`): `Secret`s to inject into the Sandbox as environment variables.
* `volumes?` (`Record<string, Volume>`): Mount points for Modal `Volume`s.
* `cloudBucketMounts?` (`Record<string, CloudBucketMount>`): Mount points for `CloudBucketMount`s.
* `pty?` (`boolean`): Enable a PTY for the Sandbox entrypoint command. When enabled, all output (stdout and stderr from the process) is multiplexed into stdout, and the stderr stream is effectively empty.
* `encryptedPorts?` (`number[]`): List of ports to tunnel into the Sandbox. Encrypted ports are tunneled with TLS.
* `h2Ports?` (`number[]`): List of encrypted ports to tunnel into the Sandbox, using HTTP/2.
* `unencryptedPorts?` (`number[]`): List of ports to tunnel into the Sandbox without encryption.
* `blockNetwork?` (`boolean`): Whether to block all network access from the Sandbox.
* `outboundCidrAllowlist?` (`string[]`): List of CIDRs the Sandbox is allowed to access. If not set, all CIDRs are allowed. Cannot be used with blockNetwork.
* `outboundDomainAllowlist?` (`string[]`): List of domain names the Sandbox is allowed to access. Supports wildcard prefixes (`*.example.com`). Cannot be used with blockNetwork.
* `inboundCidrAllowlist?` (`string[]`): List of CIDRs allowed to connect inbound to the Sandbox (tunnels and connection tokens). If not set, all IPs are allowed. Cannot be used with blockNetwork.
* `i6pn?` (`boolean`): Enable private IPv6 networking (i6pn) so Sandboxes in the same workspace can address each other directly at their `i6pn.modal.local` address. Pin every Sandbox in the group to the same specific region (e.g. `regions: ["us-east-1"]`). Cannot be used with blockNetwork.
* `cloud?` (`string`): Cloud provider to run the Sandbox on.
* `regions?` (`string[]`): Region(s) to run the Sandbox on.
* `verbose?` (`boolean`): Enable verbose logging.
* `proxy?` (`Proxy`): Reference to a Modal `Proxy` to use in front of this Sandbox.
* `readinessProbe?` (`Probe`): Probe used to determine when the Sandbox has become ready.
* `name?` (`string`): Optional name for the Sandbox. Unique within an App.
* `tags?` (`Record<string, string>`): Tags to attach to the Sandbox. Filterable via `client.sandboxes.list`.
* `experimentalOptions?` (`Record<string, any>`): Optional experimental options.
* `customDomain?` (`string`): If set, connections to this Sandbox will be subdomains of this domain rather than the default. This requires prior manual setup by Modal and is only available for Enterprise customers.
* `includeOidcIdentityToken?` (`boolean`): If true, the sandbox will receive a MODAL\_IDENTITY\_TOKEN env var for OIDC-based auth (e.g. to AWS, GCP).

## fromId

*Accessed via `modal.sandboxes`*

```typescript
async fromId(sandboxId: string): Promise<Sandbox>
```

Returns a running `Sandbox` object from an ID.

**Returns:** Sandbox with ID

## fromName

*Accessed via `modal.sandboxes`*

```typescript
async fromName(
  appName: string,
  name: string,
  params?: SandboxFromNameParams,
): Promise<Sandbox>
```

Get a running `Sandbox` by name from a deployed `App`.

Raises a `NotFoundError` if no running Sandbox is found with the given name.
A Sandbox's name is the `name` argument passed to `sandboxes.create()`.

* `appName`: Name of the deployed App
* `name`: Name of the Sandbox

**Parameters** (`SandboxFromNameParams`)

Optional parameters for `client.sandboxes.fromName()`.

* `environment?` (`string`)

**Returns:** Promise that resolves to a Sandbox

## experimentalFromName

*Accessed via `modal.sandboxes`*

```typescript
async experimentalFromName(
  appName: string,
  name: string,
  params?: SandboxExperimentalFromNameParams,
): Promise<Sandbox>
```

Get a running V2 `Sandbox` by name from a deployed `App`.

This looks up V2 Sandboxes, i.e. Sandboxes created via
`client.sandboxes.experimentalCreate()`.

EXPERIMENTAL: the API is subject to change.

* `appName`: Name of the deployed App
* `name`: Name of the Sandbox

**Parameters** (`SandboxExperimentalFromNameParams`)

Optional parameters for `client.sandboxes.experimentalFromName()`.

* `environment?` (`string`)

**Returns:** Promise that resolves to a Sandbox

## list

*Accessed via `modal.sandboxes`*

```typescript
async *list(
  params: SandboxListParams = {},
): AsyncGenerator<Sandbox, void, unknown>
```

List all `Sandbox`es for the current Environment or App ID (if specified).
If tags are specified, only Sandboxes that have at least those tags are returned.

**Parameters** (`SandboxListParams`)

Optional parameters for `client.sandboxes.list()`.

* `appId?` (`string`): Filter Sandboxes for a specific `App`.
* `tags?` (`Record<string, string>`): Only return Sandboxes that include all specified tags.
* `environment?` (`string`): Override environment for the request; defaults to current profile.

## experimentalList

*Accessed via `modal.sandboxes`*

```typescript
async *experimentalList(
  params: SandboxExperimentalListParams,
): AsyncGenerator<Sandbox, void, unknown>
```

List the V2 `Sandbox`es in an `App`.

This lists V2 Sandboxes, i.e. Sandboxes created via
`client.sandboxes.experimentalCreate()`.
Such Sandboxes are not returned by
`client.sandboxes.list()`. If tags are specified,
only Sandboxes that have at least those tags are returned.

Yields `Sandbox` objects that are currently running in the App.

EXPERIMENTAL: the API is subject to change.

**Parameters** (`SandboxExperimentalListParams`)

Parameters for `client.sandboxes.experimentalList()`.

* `appId` (`string`): The App to list Sandboxes under.
* `tags?` (`Record<string, string>`): Only return Sandboxes that include all specified tags.

## createConnectToken

```typescript
async createConnectToken(
  params?: SandboxCreateConnectTokenParams,
): Promise<SandboxCreateConnectCredentials>
```

Create a token for making HTTP connections to the Sandbox.

**Parameters** (`SandboxCreateConnectTokenParams`)

Optional parameters for `Sandbox.createConnectToken()`.

* `userMetadata?` (`string`): Optional user-provided metadata string that will be added to the headers by the proxy when forwarding requests to the Sandbox.
* `port?` (`number`): Container port that requests are routed to when using this token. Defaults to 8080.

## detach

```typescript
detach(): void
```

Disconnect from the Sandbox, cleaning up local resources.
The Sandbox continues running on Modal's infrastructure.
After calling detach(), most operations on this Sandbox object will throw.

## exec

```typescript
async exec(
  command: string[],
  params?: SandboxExecParams & { mode?: "text" },
): Promise<ContainerProcess<string>>
async exec(
  command: string[],
  params: SandboxExecParams & { mode: "binary" },
): Promise<ContainerProcess<Uint8Array>>
```

**Parameters** (`SandboxExecParams`)

Optional parameters for `Sandbox.exec()`.

* `mode?` (`StreamMode`): Specifies text or binary encoding for input and output streams.
* `stdout?` (`StdioBehavior`): Whether to pipe or ignore standard output.
* `stderr?` (`StdioBehavior`): Whether to pipe or ignore standard error.
* `workdir?` (`string`): Working directory to run the command in.
* `timeoutMs?` (`number`): Timeout for the process in milliseconds. Defaults to 0 (no timeout).
* `env?` (`Record<string, string>`): Environment variables to set for the command.
* `secrets?` (`Secret[]`): `Secret`s to inject as environment variables for the commmand.
* `pty?` (`boolean`): Enable a PTY for the command. When enabled, all output (stdout and stderr from the process) is multiplexed into stdout, and the stderr stream is effectively empty.

## experimentalSetName

```typescript
async experimentalSetName(name: string): Promise<void>
```

Assign a name to a running V2 `Sandbox` that was created without one.

This is only supported for V2 Sandboxes, i.e. Sandboxes created via
`client.sandboxes.experimentalCreate()`.
A name may only be set once, and only on a Sandbox that has never had one;
afterwards the Sandbox can be looked up with
`client.sandboxes.experimentalFromName()`.

EXPERIMENTAL: the API is subject to change.

* `name`: Name to assign to the Sandbox. Must be unique within the App.

**Raises:**

* `AlreadyExistsError`: If another running Sandbox in the App already holds the name.
* `InvalidError`: If the server rejects the name as invalid.
* `ConflictError`: If the Sandbox already has a name or is no longer running.

## getTags

```typescript
async getTags(): Promise<Record<string, string>>
```

Get tags (key-value pairs) currently attached to this Sandbox from the server.

## mountImage

```typescript
async mountImage(
  path: string,
  image?: Image,
  params?: SandboxMountImageParams,
): Promise<void>
```

Mount an `Image` at a path in the Sandbox filesystem.

* `path`: The path where the directory should be mounted
* `image`: Optional `Image` to mount. If undefined, mounts an empty directory.

**Parameters** (`SandboxMountImageParams`)

Optional parameters for `Sandbox.mountImage()`.

* `experimentalEncryptionKey?` (`Uint8Array`): Experimental customer-supplied encryption key used to decrypt the image. Use the same key that encrypted the snapshot.

## poll

```typescript
async poll(): Promise<number | null>
```

Check if the Sandbox has finished running.

Returns `null` if the Sandbox is still running, else returns the exit code.

## reloadVolumes

```typescript
async reloadVolumes(params?: SandboxReloadVolumesParams): Promise<void>
```

Reload all Volumes mounted in the Sandbox.

Blocks until the Volumes have been reloaded, bounded by `timeoutMs` (55000
by default). If the reload does not complete within that window, a
`TimeoutError` is thrown; note that the reload may still complete in the
background.

**Parameters** (`SandboxReloadVolumesParams`)

Optional parameters for `Sandbox.reloadVolumes()`.

* `timeoutMs?` (`number`): Overall budget for the reload call, in milliseconds. Defaults to 55000. If the reload does not complete within this window, the call is cancelled and a `TimeoutError` is thrown; note that the reload may still complete in the background.

## setTags

```typescript
async setTags(tags: Record<string, string>): Promise<void>
```

Set tags (key-value pairs) on the Sandbox. Tags can be used to filter results in `client.sandboxes.list`.

Setting tags replaces the Sandbox's entire tag set; passing an empty object clears all tags.

## snapshotDirectory

```typescript
async snapshotDirectory(
  path: string,
  params?: SandboxSnapshotDirectoryParams,
): Promise<Image>
```

Snapshots and creates a new `Image` from a directory in the running sandbox.

The resulting Image is retained for `ttlMs` (default: 30 days),
as a hard cutoff measured from creation — usage does not extend
the lifetime. Pass `ttlMs: null` to retain indefinitely.

The call has an overall `timeoutMs` budget (default: 55000). If it
elapses before a snapshot completes, the call is cancelled and an
error is thrown.

* `path`: The path of the directory to snapshot

**Parameters** (`SandboxSnapshotDirectoryParams`)

Optional parameters for `Sandbox.snapshotDirectory()`.

* `timeoutMs?` (`number`): Overall budget for the snapshot call, in milliseconds. Defaults to 55000. If it elapses before a snapshot completes, the call is cancelled and an error is thrown.
* `ttlMs?` (`number | null`): Lifetime of the resulting image in milliseconds, as a hard cutoff measured from creation. Defaults to 30 days. Pass `null` to retain the image indefinitely.
* `experimentalEncryptionKey?` (`Uint8Array`): Experimental customer-supplied encryption key used to encrypt the resulting snapshot. The same key is required when mounting the image. Modal does not persist the key.

**Returns:** Promise that resolves to an `Image`

## snapshotFilesystem

```typescript
async snapshotFilesystem(
  params?: SandboxSnapshotFilesystemParams,
): Promise<Image>
```

Snapshot the filesystem of the Sandbox.

Returns an `Image` object which can be used to spawn a new Sandbox with the same filesystem.

The call has an overall `timeoutMs` budget (default: 55000). If it
elapses before a snapshot completes, the call is cancelled and an
error is thrown.

**Parameters** (`SandboxSnapshotFilesystemParams`)

Optional parameters for `Sandbox.snapshotFilesystem()`.

* `timeoutMs?` (`number`): Overall budget for the snapshot call, in milliseconds. Defaults to 55000. If it elapses before a snapshot completes, the call is cancelled and an error is thrown.
* `ttlMs?` (`number | null`): Lifetime of the resulting image in milliseconds, as a hard cutoff measured from creation. Defaults to 30 days. Pass `null` to retain the image indefinitely.

**Returns:** Promise that resolves to an `Image`

## terminate

```typescript
async terminate(): Promise<void>
async terminate(params: { wait: true }): Promise<number>
```

**Parameters** (`SandboxTerminateParams`)

Optional parameters for `Sandbox.terminate()`.

* `wait?` (`boolean`): If true, wait for the Sandbox to finish and return the exit code.

## tunnels

```typescript
async tunnels(timeoutMs = 50000): Promise<Record<number, Tunnel>>
```

Get `Tunnel` metadata for the Sandbox.

Raises `SandboxTimeoutError` if the tunnels are not available after the timeout.

**Returns:** A dictionary of `Tunnel` objects which are keyed by the container port.

## unmountImage

```typescript
async unmountImage(path: string): Promise<void>
```

Unmounts an `Image` previously mounted at a path in the Sandbox filesystem.

* `path`: The mount path to unmount

## updateNetworkPolicy

```typescript
async updateNetworkPolicy(
  params: SandboxUpdateNetworkPolicyParams,
): Promise<void>
```

Updates the outbound network policy of a running Sandbox.

Established connections that the new policy no longer permits are terminated.

**Parameters** (`SandboxUpdateNetworkPolicyParams`)

Parameters for `Sandbox.updateNetworkPolicy()`.

Each dimension is independent: `undefined` leaves that dimension unchanged,
while a defined value replaces it (an empty array blocks all egress for that
dimension; a wildcard entry such as `"0.0.0.0/0"` or `"*"` allows everything).

Currently, both dimensions must be provided (the underlying transport does
not yet support partial updates). This requirement will be relaxed in a
future release.

* `outboundCidrAllowlist?` (`string[]`)
* `outboundDomainAllowlist?` (`string[]`)

## wait

```typescript
async wait(): Promise<number>
```

## waitUntilReady

```typescript
async waitUntilReady(timeoutMs = 300_000): Promise<void>
```

Wait until the Sandbox readiness probe reports the Sandbox is ready.

This method only works for Sandboxes configured with a readiness probe.

* `timeoutMs`: Maximum total time to wait, in milliseconds.

**Returns:** A promise that resolves once the Sandbox is ready.

**Raises:**

* `TimeoutError`: If readiness is not reported before `timeoutMs`.

## Sandbox.experimentalSidecars

Operations for managing sidecar containers that run alongside the
Sandbox's main container.

EXPERIMENTAL: the API is subject to change.

### create

```typescript
async create(
  name: string,
  image: Image,
  params?: SidecarCreateParams,
): Promise<SidecarContainer>
```

Start a new sidecar container in the Sandbox. The `Image` must
already be built by calling `Image.build()` before it is
passed to `create`.

**Parameters** (`SidecarCreateParams`)

Options for `SidecarService.create()`.

* `command?` (`string[]`): Command to run in the sidecar container on startup.
* `env?` (`Record<string, string>`): Environment variables to set in the sidecar container.
* `secrets?` (`Secret[]`): `Secret`s to inject into the sidecar container as environment variables.
* `workdir?` (`string`): Working directory of the sidecar container.

### get

```typescript
async get(
  name: string,
  params?: SidecarGetParams,
): Promise<SidecarContainer>
```

Return a sidecar container by name.

**Parameters** (`SidecarGetParams`)

Options for `SidecarService.get()`.

* `includeTerminated?` (`boolean`): If true, return the latest container with the name even if it has terminated.

### list

```typescript
async list(params?: SidecarListParams): Promise<SidecarContainer[]>
```

Return all sidecar containers (not including the main container).

**Parameters** (`SidecarListParams`)

Options for `SidecarService.list()`.

* `includeTerminated?` (`boolean`): If true, include terminated containers.

## Sandbox.filesystem

Namespace for Sandbox filesystem APIs.

### copyFromLocal

```typescript
async copyFromLocal(localPath: string, remotePath: string): Promise<void>
```

Copy a local file into the Sandbox.

`remotePath` must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

**Raises:**

* `SandboxFilesystemNotADirectoryError`: a parent component of `remotePath` is not a directory.
* `SandboxFilesystemIsADirectoryError`: `remotePath` points to a directory.
* `SandboxFilesystemPermissionError`: write permission is denied in the Sandbox.
* `SandboxFilesystemError`: the command fails for any other reason.
* `Error`: `localPath` does not exist, is a directory, or cannot be read (`ENOENT`, `EISDIR`, `EACCES`).

### copyToLocal

```typescript
async copyToLocal(remotePath: string, localPath: string): Promise<void>
```

Copy a file from the Sandbox to a local path.

`remotePath` must be an absolute path to a file in the Sandbox.
Parent directories for `localPath` are created if needed. The local file
is overwritten if it already exists.

**Raises:**

* `SandboxFilesystemNotFoundError`: the remote path does not exist.
* `SandboxFilesystemIsADirectoryError`: the remote path points to a directory.
* `SandboxFilesystemFileTooLargeError`: the file exceeds the read size limit.
* `SandboxFilesystemPermissionError`: read permission is denied in the Sandbox.
* `SandboxFilesystemError`: the command fails for any other reason.
* `Error`: `localPath` points to a directory, or writing it is not permitted.

### listFiles

```typescript
async listFiles(remotePath: string): Promise<FileInfo[]>
```

List files and directories in a Sandbox directory.

`remotePath` must be an absolute path to a directory in the Sandbox.
Returns an array of `FileInfo` objects sorted by name.

**Raises:**

* `SandboxFilesystemNotFoundError`: the path does not exist.
* `SandboxFilesystemNotADirectoryError`: the path is not a directory.
* `SandboxFilesystemPermissionError`: read permission is denied.
* `SandboxFilesystemError`: the command fails for any other reason.

### makeDirectory

```typescript
async makeDirectory(
  remotePath: string,
  options?: { createParents?: boolean },
): Promise<void>
```

Create a new directory in the Sandbox.

`remotePath` must be an absolute path in the Sandbox.

When `createParents` is `true` (the default), any missing parent
directories are created and the call is idempotent (succeeds if the
directory already exists). When `createParents` is `false`, the immediate
parent must already exist and the path must not already exist.

**Raises:**

* `SandboxFilesystemNotFoundError`: the parent does not exist and `createParents` is `false`.
* `SandboxFilesystemPathAlreadyExistsError`: the path already exists and `createParents` is `false`.
* `SandboxFilesystemNotADirectoryError`: a path component is not a directory.
* `SandboxFilesystemPermissionError`: creation is not permitted.
* `InvalidError`: the operation is not supported by the mount.
* `SandboxFilesystemError`: the command fails for any other reason.

### readBytes

```typescript
async readBytes(remotePath: string): Promise<Uint8Array>
```

Read a file from the Sandbox and return its contents as bytes.

`remotePath` must be an absolute path to a file in the Sandbox.

**Raises:**

* `SandboxFilesystemNotFoundError`: the path does not exist.
* `SandboxFilesystemIsADirectoryError`: the path points to a directory.
* `SandboxFilesystemFileTooLargeError`: the file exceeds the read size limit.
* `SandboxFilesystemPermissionError`: read permission is denied.
* `SandboxFilesystemError`: the command fails for any other reason.

### readText

```typescript
async readText(remotePath: string): Promise<string>
```

Read a file from the Sandbox and return its contents as a UTF-8 string.

`remotePath` must be an absolute path to a file in the Sandbox.

**Raises:**

* `SandboxFilesystemNotFoundError`: the path does not exist.
* `SandboxFilesystemIsADirectoryError`: the path points to a directory.
* `SandboxFilesystemFileTooLargeError`: the file exceeds the read size limit.
* `SandboxFilesystemPermissionError`: read permission is denied.
* `SandboxFilesystemError`: the command fails for any other reason.

### remove

```typescript
async remove(
  remotePath: string,
  options?: { recursive?: boolean },
): Promise<void>
```

Remove a file or directory in the Sandbox.

`remotePath` must be an absolute path in the Sandbox. When `remotePath`
is a directory and `recursive` is `false` (the default), it is removed
only if empty. When `recursive` is `true`, the directory and all its
contents are removed. Recursive removal is not supported on all mounts —
`CloudBucketMount` does not support it.

**Raises:**

* `SandboxFilesystemNotFoundError`: the path does not exist.
* `SandboxFilesystemDirectoryNotEmptyError`: `recursive` is `false` and the directory is not empty.
* `SandboxFilesystemPermissionError`: removal is not permitted.
* `InvalidError`: the operation is not supported by the mount.
* `SandboxFilesystemError`: the command fails for any other reason.

### stat

```typescript
async stat(remotePath: string): Promise<FileInfo>
```

Return metadata for a single file, directory, or symlink in the Sandbox.

`remotePath` must be an absolute path in the Sandbox. If `remotePath` is
a symlink, the returned `FileInfo` describes the symlink itself, not
the target it points to.

**Raises:**

* `SandboxFilesystemNotFoundError`: the path does not exist.
* `SandboxFilesystemNotADirectoryError`: a non-leaf component of the path is not a directory.
* `SandboxFilesystemPermissionError`: a path component is not searchable.
* `SandboxFilesystemError`: the command fails for any other reason.

### watch

```typescript
async *watch(
  remotePath: string,
  params: {
    filter?: FileWatchEventType[];
    recursive?: boolean;
    timeoutMs?: number;
  } = {},
): AsyncIterable<FileWatchEvent>
```

Watch a path in the Sandbox for filesystem changes.

`remotePath` must be an absolute path in the Sandbox. If it points to a
file, events for that file are reported. If it points to a directory,
events for entries directly inside it are reported. Set `recursive: true`
to also receive events for all nested subdirectories. If `remotePath` is
a symlink, it is followed and events reference paths under the resolved
target.

Yields `FileWatchEvent` objects as changes occur, until either the
timeout elapses, the iterator is closed, or the Sandbox is terminated.

Optionally restrict the kinds of events emitted to those included in
`filter`. An undefined `filter` permits all types; passing an empty array
suppresses all events.

`timeoutMs` is truncated to whole seconds. Omit it to watch indefinitely.
When the timeout elapses, the iterator stops without raising an exception.

**Raises:**

* `SandboxFilesystemNotFoundError`: `remotePath` does not exist.
* `SandboxFilesystemPermissionError`: watch access is denied.
* `InvalidError`: the filesystem does not support watching.
* `SandboxFilesystemError`: the command fails for any other reason.

### writeBytes

```typescript
async writeBytes(
  data: Uint8Array | ArrayBuffer | Buffer,
  remotePath: string,
): Promise<void>
```

Write binary content to a file in the Sandbox.

`remotePath` must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

**Raises:**

* `TypeError`: `data` is not a `Uint8Array`, `ArrayBuffer`, or `Buffer`.
* `SandboxFilesystemNotADirectoryError`: a parent component of `remotePath` is not a directory.
* `SandboxFilesystemIsADirectoryError`: `remotePath` points to a directory.
* `SandboxFilesystemPermissionError`: write permission is denied.
* `SandboxFilesystemError`: the command fails for any other reason.

### writeText

```typescript
async writeText(data: string, remotePath: string): Promise<void>
```

Write UTF-8 text to a file in the Sandbox.

`remotePath` must be an absolute path to a file in the Sandbox.
Parent directories are created if needed. The remote file is overwritten
if it already exists.

**Raises:**

* `TypeError`: `data` is not a string.
* `SandboxFilesystemNotADirectoryError`: a parent component of `remotePath` is not a directory.
* `SandboxFilesystemIsADirectoryError`: `remotePath` points to a directory.
* `SandboxFilesystemPermissionError`: write permission is denied.
* `SandboxFilesystemError`: the command fails for any other reason.
