# ModalWriteStream

Wrapper around `WritableStream` with convenience functions.

The Stream API is a modern standard for asynchronous data streams across
network and process boundaries. It allows you to read data in chunks, pipe
and transform it, and handle backpressure.

This wrapper adds some extra functions like `.writeText()` to write a string
to the stream, or `writeBytes()` to write binary data.

Background: https://developer.mozilla.org/en-US/docs/Web/API/Streams\_API

```typescript
interface ModalWriteStream<R = any> extends WritableStream<R> {
  /** Write a string to the stream. Only if this is a text stream. */
  writeText(text: string): Promise<void>;

  /** Write a byte array to the stream. Only if this is a byte stream. */
  writeBytes(bytes: Uint8Array): Promise<void>;
}
```
