# StreamMode

Specifies the type of data that will be read from the Sandbox or container
process. "text" means the data will be read as UTF-8 text, while "binary"
means the data will be read as raw bytes (Uint8Array).

```typescript
type StreamMode = "text" | "binary";
```
