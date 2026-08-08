<!-- modal-docs: machine-translated zh-CN from English source -->

# 模态读取流

带有便利功能的 `ReadableStream` 包装。

Stream API 是异步数据流的现代标准
网络和进程边界。它允许您以块、管道的形式读取数据
并对其进行转换，并处理背压。

这个包装器添加了一些额外的函数，例如 `.readText()` 来读取整个内容
作为字符串流，或 `readBytes()` 读取二进制数据。

背景：https://developer.mozilla.org/en-US/docs/Web/API/Streams\_API

```typescript
interface ModalReadStream<R = any> extends ReadableStream<R> {
  /** Read the entire stream as a string. */
  readText(): Promise<string>;

  /** Read the entire stream as a byte array. */
  readBytes(): Promise<Uint8Array>;
}
```