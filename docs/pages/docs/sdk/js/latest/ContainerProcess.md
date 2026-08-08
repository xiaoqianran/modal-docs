# ContainerProcess

```typescript
class ContainerProcess {
  stdin: ModalWriteStream<R>;
  stdout: ModalReadStream<R>;
  stderr: ModalReadStream<R>;
}
```

## wait

```typescript
async wait(): Promise<number>
```

Wait for process completion and return the exit code.
