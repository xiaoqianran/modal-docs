# Tunnel

A port forwarded from within a running Modal `Sandbox`.

```typescript
class Tunnel {
  get url(): string; // Get the public HTTPS URL of the forwarded port.
  get tlsSocket(): [string, number]; // Get the public TLS socket as a [host, port] tuple.
  get tcpSocket(): [string, number]; // Get the public TCP socket as a [host, port] tuple.
}
```
