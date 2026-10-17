<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数统计

```typescript
interface FunctionStats {
  since: Date;
  until: Date;
  inputSuccessCount: number;
  inputFailureCount: number;
  inputTimeoutCount: number;
  inputRunningAtEndCount: number;
  containerStartedCount: number;
  containerErrorCount: number;
  containerCreatingAtEndCount: number;
  variantCount: number;
  inputPercentileStats: Record<string, StatsPercentileDistribution>;
  containerPercentileStats: Record<string, StatsPercentileDistribution>;
  allVariants: boolean;
}
```