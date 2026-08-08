<!-- modal-docs: machine-translated zh-CN from English source -->

# 重试

重试模态函数/Cl 的策略配置。

```typescript
class Retries {
  readonly maxRetries: number;
  readonly backoffCoefficient: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
}
```

## 构造函数

```typescript
new Retries(params: {
  maxRetries: number;
  backoffCoefficient?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
})
```