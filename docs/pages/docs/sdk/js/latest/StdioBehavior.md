# StdioBehavior

Stdin is always present, but this option allow you to drop stdout or stderr
if you don't need them. The default is "pipe", matching Node.js behavior.

If behavior is set to "ignore", the output streams will be empty.

```typescript
type StdioBehavior = "pipe" | "ignore";
```
