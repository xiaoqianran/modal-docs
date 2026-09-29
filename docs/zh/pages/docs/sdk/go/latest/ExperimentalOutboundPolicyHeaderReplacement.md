<!-- modal-docs: machine-translated zh-CN from English source -->

# ExperimentalOutboundPolicyHeaderReplacement

ExperimentalOutboundPolicyHeaderReplacement 是单个域范围内的标头组
替代品。

```go
type ExperimentalOutboundPolicyHeaderReplacement struct {
	Domain  string            // Domain the replacements are scoped to. Supports "*." wildcard prefixes (matching the apex domain and subdomains) and a bare "*".
	Headers map[string]string // Headers maps header names to values. Values support `$KEY` templates referencing keys in the replacement's Secret. Literal `$` characters are written `$$`.
	Secret  *Secret           // Secret is a named Secret (e.g. from Client.Secrets.FromName) whose keys may be referenced in the header value templates. Static replacements pass nil.
}
```