<!-- modal-docs: translation failed; English fallback -->

# SandboxSnapshot

> Sandbox memory snapshots are in **early preview**.

A `SandboxSnapshot` object lets you interact with a stored Sandbox snapshot that was created by calling
`Sandbox.experimentalSnapshot` on a Sandbox instance. This includes both the filesystem and memory state of
the original Sandbox at the time the snapshot was taken.

```typescript
class SandboxSnapshot {
  readonly snapshotId: string;
}
```

## fromId

*Accessed via `modal.sandboxSnapshots`*

```typescript
async fromId(snapshotId: string): Promise<SandboxSnapshot>
```

Construct a `SandboxSnapshot` for an existing snapshot ID.

* `snapshotId`: Snapshot ID returned when the snapshot was created.
