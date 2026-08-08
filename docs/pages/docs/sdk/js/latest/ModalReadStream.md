# ModalReadStream

Wrapper around `ReadableStream` with convenience functions.

The Stream API is a modern standard for asynchronous data streams across
network and process boundaries. It allows you to read data in chunks, pipe
and transform it, and handle backpressure.

This wrapper adds some extra functions like `.readText()` to read the entire
stream as a string, or `readBytes()` to read binary data.

Background: https://developer.mozilla.org/en-US/docs/Web/API/Streams\_API

```typescript
interface ModalReadStream<R = any> extends ReadableStream<R> {
  /** Read the entire stream as a string. */
  readText(): Promise<string>;

  /** Read the entire stream as a byte array. */
  readBytes(): Promise<Uint8Array>;
}
```
