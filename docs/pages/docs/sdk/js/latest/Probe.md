# Probe

Probe configuration for sandbox readiness checks.

## withExec

```typescript
static withExec(
  argv: string[],
  params: ProbeParams = { intervalMs: 100 },
): Probe
```

**Parameters** (`ProbeParams`)

Optional parameters for `Probe.withTcp` and `Probe.withExec`.

* `intervalMs` (`number`)

## withTcp

```typescript
static withTcp(
  port: number,
  params: ProbeParams = { intervalMs: 100 },
): Probe
```

**Parameters** (`ProbeParams`)

Optional parameters for `Probe.withTcp` and `Probe.withExec`.

* `intervalMs` (`number`)
