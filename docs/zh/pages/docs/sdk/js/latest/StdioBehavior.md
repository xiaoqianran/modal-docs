<!-- modal-docs: machine-translated zh-CN from English source -->

# StdioBehavior

标准输入始终存在，但此选项允许您删除标准输出或标准错误
如果你不需要它们。默认值为“pipe”，匹配 Node.js 行为。

如果行为设置为“忽略”，则输出流将为空。

```typescript
type StdioBehavior = "pipe" | "ignore";
```