# Tunnel

Tunnel represents a port forwarded from within a running Modal Sandbox.

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

TCPSocket gets the public TCP socket as a (host, port) tuple.

## TLSSocket

```go
TLSSocket() (string, int)
```

TLSSocket gets the public TLS socket as a (host, port) tuple.

## URL

```go
URL() string
```

URL gets the public HTTPS URL of the forwarded port.
