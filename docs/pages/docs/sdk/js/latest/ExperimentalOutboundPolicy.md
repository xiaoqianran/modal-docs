# ExperimentalOutboundPolicy

Immutable configuration for replacing headers in outbound HTTPS requests
from a Sandbox.

EXPERIMENTAL: the API is subject to change.

Header values support templating with keys in a replacement's secret: a
`$`-prefixed key name in the secret is replaced with the secret value.
Literal `$` characters are written `$$`.

Secret values never enter the Sandbox: they are resolved and injected into
matching requests outside the container.

```ts
const secret = await modal.secrets.fromName("api-token");

const outboundPolicy = new modal.ExperimentalOutboundPolicy()
  // Inject a secret-backed Authorization header.
  .withHeaderReplacement({
    domain: "example.com",
    secret,
    headers: { Authorization: "Bearer $API_TOKEN" },
  })
  // Inject a static header into requests to another domain.
  .withHeaderReplacement({
    domain: "modal.com",
    headers: { "X-Trace-Token": "trace_abcd" },
  });

const sb = await modal.sandboxes.create(app, image, {
  experimentalOutboundPolicy: outboundPolicy,
});
```

## withHeaderReplacement

```typescript
withHeaderReplacement(params: {
  domain: string;
  headers: Record<string, string>;
  secret?: Secret;
}): ExperimentalOutboundPolicy
```

Return a new `ExperimentalOutboundPolicy` with an added header replacement.

* `params`: .domain Domain the replacements are scoped to. Supports `*.` wildcard prefixes (matching the apex domain and subdomains) and a bare `"*"`.
* `params`: .headers Header name -> header value. Values support `$KEY` templates referencing keys in the replacement's `secret`.
* `params`: .secret Named `Secret` (e.g. from `client.secrets.fromName`) whose keys may be referenced in the header value templates. Static replacements pass no secret.
