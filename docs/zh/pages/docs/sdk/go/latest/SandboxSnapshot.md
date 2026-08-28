<!-- modal-docs: translation failed; English fallback -->

# SandboxSnapshot

SandboxSnapshot is a stored Sandbox memory snapshot created by calling
ExperimentalSnapshot on a Sandbox instance. This includes both the filesystem
and memory state of the original Sandbox at the time the snapshot was taken.

```go
type SandboxSnapshot struct {
	SnapshotID string
}
```

## FromID

*Accessed via `client.SandboxSnapshots`*

```go
FromID(ctx context.Context, snapshotID string, params *SandboxSnapshotFromIDParams) (*SandboxSnapshot, error)
```

FromID constructs a SandboxSnapshot for an existing snapshot ID.

**Parameters** (`SandboxSnapshotFromIDParams`)

SandboxSnapshotFromIDParams are options for SandboxSnapshotService.FromID.

*No configurable options.*
