<!-- modal-docs: machine-translated zh-CN from English source -->

# SandboxGroupStats

一段时间内一组沙箱的统计数据。

```typescript
interface SandboxGroupStats {
  /** The value of each name in `groupByTags` for the group's Sandboxes, `null` where not present. */
  tags: Record<string, string | null>;
  /** Total cost in USD as a decimal string, the sum of `costByResource`. */
  cost: string;
  /**
   * Cost in USD as decimal strings, by billed resource: `CPU`, `Memory`, and GPU types such as `H100`.
   * The resource names are subject to change as Modal's billing model evolves.
   */
  costByResource: Record<string, string>;
}
```