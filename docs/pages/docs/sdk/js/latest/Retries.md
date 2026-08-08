# Retries

Retry policy configuration for a Modal Function/Cls.

```typescript
class Retries {
  readonly maxRetries: number;
  readonly backoffCoefficient: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
}
```

## constructor

```typescript
new Retries(params: {
  maxRetries: number;
  backoffCoefficient?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
})
```
