<!-- modal-docs: machine-translated zh-CN from English source -->

# 隧道

从正在运行的 Modal `Sandbox` 内转发的端口。

```typescript
class Tunnel {
  get url(): string; // Get the public HTTPS URL of the forwarded port.
  get tlsSocket(): [string, number]; // Get the public TLS socket as a [host, port] tuple.
  get tcpSocket(): [string, number]; // Get the public TCP socket as a [host, port] tuple.
}
```