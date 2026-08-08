<!-- modal-docs: machine-translated zh-CN from English source -->

# 简介

从 `Config` 解析配置对象和环境变量。

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