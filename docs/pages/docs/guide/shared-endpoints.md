<span id="shared-endpoints"></span>

# Model APIs

<span id="pricing"></span>

Use Model APIs to call an open-weight model and [pay per token](/docs/guide/model-api-pricing). Modal runs the
model and manages capacity. To deploy custom weights or configure your own
capacity, see the [Endpoints guide](/docs/guide/endpoints).

<span id="create-a-shared-endpoint"></span>

## Create a Model API

Create a Model API from the [Model APIs dashboard](/model-apis).
You'll need a [Proxy Token](/docs/guide/webhook-proxy-auth) with access to your Environment.
You can create one during setup.

From the CLI, use `--shared` and specify the model by ID. For example, to use Kimi K3, run

```bash
modal endpoint create --shared --model moonshotai/Kimi-K3
```

<span id="send-your-first-request"></span>

## Send a request

Model APIs support OpenAI-compatible APIs and the Anthropic-compatible Messages
API. To send a Chat Completions request, copy the service URL and model name
from the dashboard's request examples and use your Proxy Token credentials.

```bash
export MODAL_PROXY_TOKEN_ID="wk-..."
export MODAL_PROXY_TOKEN_SECRET="ws-..."

curl "<your-model-api-url>/v1/chat/completions" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<model-name>",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

To use your Model API with a coding agent, see [agent integrations](/docs/guide/endpoint-integrations).

## Concurrency limits

Each model has a limit on how many requests your Workspace can have in progress
at once. Requests to any Model API for that model count toward the same limit.
When you reach it, new requests to that model return HTTP `429`. Retry them
with exponential backoff and jitter.

You can find each model's limit under **Shared Endpoint concurrency limits** in
[Settings → Limits](/settings/limits).

## Request routing

The model determines the routing region shown in its service URL. Modal routes
requests automatically. To help reuse cached prompt prefixes across turns, you
can send the same `Modal-Routing-Affinity-Key` value on each request in a
conversation. See [affinity routing](/docs/guide/endpoints#affinity-routing).
