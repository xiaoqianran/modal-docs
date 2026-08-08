<!-- modal-docs: machine-translated zh-CN from English source -->

# 模态写入流

带有便利功能的 `WritableStream` 包装。

Stream API 是异步数据流的现代标准
网络和进程边界。它允许您以块、管道的形式读取数据
并对其进行转换，并处理背压。

这个包装器添加了一些额外的函数，例如 `.writeText()` 来写入字符串
到流，或`writeBytes()`写入二进制数据。

背景：https://developer.mozilla.org/en-US/docs/Web/API/Streams\_API

```typescript
interface ModalWriteStream<R = any> extends WritableStream<R> {
  /** Write a string to the stream. Only if this is a text stream. */
  writeText(text: string): Promise<void>;

  /** Write a byte array to the stream. Only if this is a byte stream. */
  writeBytes(bytes: Uint8Array): Promise<void>;
}
```