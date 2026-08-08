# Profile

Resolved configuration object from `Config` and environment variables.

```typescript
interface Profile {
  serverUrl: string;
  tokenId?: string;
  tokenSecret?: string;
  environment?: string;
  imageBuilderVersion?: string;
  logLevel?: string;
  /** Parsed from MODAL_MAX_THROTTLE_WAIT. null means unlimited. */
  maxThrottleWaitSecs?: number;
}
```
