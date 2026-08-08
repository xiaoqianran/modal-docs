<!-- modal-docs: machine-translated zh-CN from English source -->

# 代理

代理对象为您的 Modal 容器提供静态出站 IP 地址。

```typescript
class Proxy {
  readonly proxyId: string;
}
```

## 来自姓名

*通过`modal.proxies`访问*

```typescript
async fromName(name: string, params?: ProxyFromNameParams): Promise<Proxy>
```

通过名称引用 `Proxy`。

通常只能通过客户端访问：

```typescript
const modal = new ModalClient();
const proxy = await modal.proxies.fromName("my-proxy");
```

**参数** (`ProxyFromNameParams`)

`client.proxies.fromName()` 的可选参数。

* `environment?` (`string`)