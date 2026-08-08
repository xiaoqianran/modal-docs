<!-- modal-docs: machine-translated zh-CN from English source -->

# 流模式

指定将从沙箱或容器中读取的数据类型
过程。 “text”表示数据将被读取为UTF-8文本，而“binary”
意味着数据将被读取为原始字节（Uint8Array）。

```typescript
type StreamMode = "text" | "binary";
```