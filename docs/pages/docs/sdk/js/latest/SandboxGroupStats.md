# SandboxGroupStats

Statistics for a group of Sandboxes over a time range.

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
