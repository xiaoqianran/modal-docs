# ExperimentalOutboundPolicy

ExperimentalOutboundPolicy is an immutable configuration for replacing headers in
outbound HTTPS requests from a Sandbox.

EXPERIMENTAL: the API is subject to change.

Secret values never enter the Sandbox: they are resolved and injected into
matching requests outside the container.

```
secret, _ := client.Secrets.FromName(ctx, "api-token", nil)
outboundPolicy := modal.NewExperimentalOutboundPolicy(
	modal.ExperimentalOutboundPolicyHeaderReplacement{
		Domain:  "example.com",
		Secret:  secret,
		Headers: map`string`string{"Authorization": "Bearer $API_TOKEN"},
	},
	modal.ExperimentalOutboundPolicyHeaderReplacement{
		Domain:  "modal.com",
		Headers: map`string`string{"X-Trace-Token": "trace_abcd"},
	},
)
```

```go
type ExperimentalOutboundPolicy struct {
}
```

## NewExperimentalOutboundPolicy

```go
func NewExperimentalOutboundPolicy(replacements ...ExperimentalOutboundPolicyHeaderReplacement) ExperimentalOutboundPolicy
```

NewExperimentalOutboundPolicy returns an ExperimentalOutboundPolicy with the given header replacements.

## WithHeaderReplacement

```go
WithHeaderReplacement(replacement ExperimentalOutboundPolicyHeaderReplacement) ExperimentalOutboundPolicy
```

WithHeaderReplacement returns a new ExperimentalOutboundPolicy with an added header replacement.
