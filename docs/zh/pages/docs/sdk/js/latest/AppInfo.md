<!-- modal-docs: translation failed; English fallback -->

# AppInfo

Information about an App, its lifecycle, and its member Functions and Servers.

```typescript
interface AppInfo {
  appId: string;
  description: string;
  lifecycle: AppLifecycle;
  /** Function names mapped to Function IDs. */
  functions: Record<string, string>;
  /** Server names mapped to Function IDs. */
  servers: Record<string, string>;
}
```
