<!-- modal-docs: machine-translated zh-CN from English source -->

# 简介

从 `Config` 解析配置对象和环境变量。

```typescript
interface Profile {
  serverUrl: string;
  tokenId?: string;
  tokenSecret?: string;
  oauthRefreshToken?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthJwtKey?: string;
  environment?: string;
  imageBuilderVersion?: string;
  logLevel?: string;
  /** Parsed from MODAL_MAX_THROTTLE_WAIT. null means unlimited. */
  maxThrottleWaitSecs?: number;
  /**
   * How long a Sandbox connection may sit idle before the client gives it up.
   * The Sandbox stays usable: the next operation reconnects. Zero keeps
   * connections open until the client closes.
   */
  sandboxChannelIdleTimeoutMs: number;
  /**
   * Set by the MODAL_SANDBOX_V2 environment variable or the sandbox_v2
   * profile key in .modal.toml.
   */
  sandboxV2: boolean;
}
```