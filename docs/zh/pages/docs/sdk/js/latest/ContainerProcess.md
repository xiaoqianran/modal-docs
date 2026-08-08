<!-- modal-docs: machine-translated zh-CN from English source -->

# 容器进程

```typescript
class ContainerProcess {
  stdin: ModalWriteStream<R>;
  stdout: ModalReadStream<R>;
  stderr: ModalReadStream<R>;
}
```

## 等待

```typescript
async wait(): Promise<number>
```

等待进程完成并返回退出代码。