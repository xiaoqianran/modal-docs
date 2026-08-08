<!-- modal-docs: machine-translated zh-CN from English source -->

# 探针

用于沙箱准备情况检查的探针配置。

## withExec

```typescript
static withExec(
  argv: string[],
  params: ProbeParams = { intervalMs: 100 },
): Probe
```

**参数** (`ProbeParams`)

`Probe.withTcp` 和 `Probe.withExec` 的可选参数。

* `intervalMs` (`number`)

## withTcp

```typescript
static withTcp(
  port: number,
  params: ProbeParams = { intervalMs: 100 },
): Probe
```

**参数** (`ProbeParams`)

`Probe.withTcp` 和 `Probe.withExec` 的可选参数。

* `intervalMs` (`number`)