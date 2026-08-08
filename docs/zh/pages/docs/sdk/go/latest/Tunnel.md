<!-- modal-docs: machine-translated zh-CN from English source -->

# 隧道

隧道代表从正在运行的模态沙箱内转发的端口。

```go
type Tunnel struct {
	Host            string // The public hostname for the tunnel
	Port            int    // The public port for the tunnel
	UnencryptedHost string // The unencrypted hostname (if applicable)
	UnencryptedPort int    // The unencrypted port (if applicable)
}
```

## TCPSocket

```go
TCPSocket() (string, int, error)
```

TCPSocket 获取公共 TCP 套接字作为（主机，端口）元组。

## TLSSocket

```go
TLSSocket() (string, int)
```

TLSSocket 获取公共 TLS 套接字作为（主机，端口）元组。

## 网址

```go
URL() string
```

URL 获取转发端口的公共 HTTPS URL。