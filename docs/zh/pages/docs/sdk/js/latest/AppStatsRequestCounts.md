<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用程序统计请求计数

服务器请求分为 HTTP 1xx/2xx/3xx 和所有其他结果，包括状态零。

```typescript
interface AppStatsRequestCounts {
  total: number;
  ok: number;
  failed: number;
}
```