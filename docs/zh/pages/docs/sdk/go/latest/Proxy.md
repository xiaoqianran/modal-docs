<!-- modal-docs: machine-translated zh-CN from English source -->

# 代理

Proxy 代表模态代理。

```go
type Proxy struct {
	ProxyID string
}
```

## 来自姓名

*通过`client.Proxies`访问*

```go
FromName(ctx context.Context, name string, params *ProxyFromNameParams) (*Proxy, error)
```

FromName 通过名称引用 modal.Proxy。

**参数** (`ProxyFromNameParams`)

ProxyFromNameParams 是用于查找模态代理的选项。

* `Environment` (`string`)