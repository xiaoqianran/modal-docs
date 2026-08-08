# Proxy

Proxy represents a Modal Proxy.

```go
type Proxy struct {
	ProxyID string
}
```

## FromName

*Accessed via `client.Proxies`*

```go
FromName(ctx context.Context, name string, params *ProxyFromNameParams) (*Proxy, error)
```

FromName references a modal.Proxy by its name.

**Parameters** (`ProxyFromNameParams`)

ProxyFromNameParams are options for looking up a Modal Proxy.

* `Environment` (`string`)
