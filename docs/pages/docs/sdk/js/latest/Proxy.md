# Proxy

Proxy objects give your Modal containers a static outbound IP address.

```typescript
class Proxy {
  readonly proxyId: string;
}
```

## fromName

*Accessed via `modal.proxies`*

```typescript
async fromName(name: string, params?: ProxyFromNameParams): Promise<Proxy>
```

Reference a `Proxy` by its name.

Normally only ever accessed via the client as:

```typescript
const modal = new ModalClient();
const proxy = await modal.proxies.fromName("my-proxy");
```

**Parameters** (`ProxyFromNameParams`)

Optional parameters for `client.proxies.fromName()`.

* `environment?` (`string`)
