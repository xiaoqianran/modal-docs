# AppState

Lifecycle state of a Modal App.

```typescript
type AppState =
  | "ephemeral"
  | "detached"
  | "deployed"
  | "stopping"
  | "stopped"
  | "initializing"
  | "disabled"
  | "unknown";
```
