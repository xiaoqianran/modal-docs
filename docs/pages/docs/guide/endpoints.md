<span id="dedicated-endpoints"></span> <span id="configuration"></span>

# Endpoints

Modal Endpoints let you deploy
[supported open models](/docs/guide/supported-models)—or your own custom
weights—as production-ready inference APIs on dedicated capacity.

* Fast inference — tuned open-source serving engines, with speculative
  decoding where supported, behind Modal's low-latency request proxy.
* Managed infrastructure — Modal handles provisioning, routing, and
  capacity management.
* Open and inspectable — use familiar OpenAI- and Anthropic-compatible APIs;
  [inspect or adapt the generated source](#view-the-generated-source)
  behind an Endpoint.

For pay-per-token inference on Modal-managed capacity, see [Model APIs](/docs/guide/shared-endpoints).

<span id="create-a-dedicated-endpoint"></span>

## Create an endpoint

Choose a model from [supported models](/docs/guide/supported-models).
By default, creating an Endpoint requires a [Proxy Token](#proxy-tokens) with
access to the target Environment. If your Workspace uses RBAC, make sure the
token has been granted access before running the command.

The CLI uses dedicated capacity by default:

```bash
modal endpoint create --model Qwen/Qwen3.5-4B
```

Modal selects a compatible serving recipe and starts provisioning. The command
prints the Endpoint ID and a dashboard link to follow provisioning.
If your Environment allows public Endpoints, add `--unauthenticated` to create
one without a Proxy Token.

You can also create an Endpoint from the [Endpoints](https://modal.com/endpoints)
tab in the dashboard. Choose Create Endpoint (or Browse all models on an empty
list) and select `Qwen/Qwen3.5-4B`. If you need a Proxy Token, choose Create
token in the wizard. Then click Create Endpoint.

## Proxy tokens

Create a [Proxy Token](/docs/guide/webhook-proxy-auth) with the CLI:

```bash
modal workspace proxy-tokens create
```

In Workspaces with RBAC enabled, grant the new token access with
`modal workspace proxy-tokens allow <token-id> <environment-name>`.
Save the token ID and secret for the request examples below.

## Call an endpoint

Text-generation models on Endpoints can be called
through the OpenAI-compatible Chat Completions (`/v1/chat/completions`),
Completions (`/v1/completions`), and Responses (`/v1/responses`) APIs or the
Anthropic-compatible Messages API (`/v1/messages`). Embedding models can be
called through the OpenAI-compatible Embeddings API (`/v1/embeddings`).

### URLs and model names

An Endpoint's base URL is its hostname, shown in the dashboard after creation
and in `modal endpoint info`; for example,
`https://my-endpoint.us-west.modal.direct`. Set `model` to the
value shown in the dashboard's request examples. If you create an Endpoint with
`--name`, use that name as `model`. You can also retrieve it
through the OpenAI-compatible Models API:

```bash
export MODAL_PROXY_TOKEN_ID="wk-..."
export MODAL_PROXY_TOKEN_SECRET="ws-..."

curl "<your-endpoint-url>/v1/models" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET"
```

### Send a request

This example uses the Chat Completions API and a
[proxy token](#proxy-tokens):

<CodeTabs>
  {#snippet cli()}

```bash
curl "<your-endpoint-url>/v1/chat/completions" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<model-name>",
    "messages": [{ "role": "user", "content": "Hello!" }]
  }'
```

{/snippet}

{#snippet python()}

```python notest
import os

from openai import OpenAI

client = OpenAI(
    base_url="<your-endpoint-url>/v1",
    api_key=f"{os.environ['MODAL_PROXY_TOKEN_ID']}.{os.environ['MODAL_PROXY_TOKEN_SECRET']}",
)

completion = client.chat.completions.create(
    model="<model-name>",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(completion.choices[0].message.content)
```

{/snippet}

{#snippet javascript()}

```typescript notest
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "<your-endpoint-url>/v1",
  apiKey: `${process.env.MODAL_PROXY_TOKEN_ID}.${process.env.MODAL_PROXY_TOKEN_SECRET}`,
});

const completion = await client.chat.completions.create({
  model: "<model-name>",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(completion.choices[0].message.content);
```

{/snippet}

</CodeTabs>

For server-sent events, pass `"stream": true`. Token usage is reported in the
final streamed chunk.

## View the generated source

An Endpoint is a Modal App built with the same primitives available in
the Modal SDK, including [`@app.server()`](/docs/guide/servers). Open the
**Source** view to inspect its generated `serve.py`. You can copy and adapt that
code into your own Modal App when you need full control of the serving stack.

## Serve custom weights

Custom weights use the serving recipe for a compatible
[Endpoint model](/docs/guide/supported-models#dedicated-endpoint-models). Pass that model with `--model`,
then provide weights from Hugging Face or a Modal Volume.

From Hugging Face:

```bash
modal endpoint create \
  --name my-fine-tune \
  --model Qwen/Qwen3.6-27B \
  --custom-hf-repo aisingapore/Qwen-SEA-LION-v4.5-27B-IT \
  --custom-hf-revision da42f2c0984d716fb2032e4176d81adfac98c630
```

Use `--custom-hf-token` for gated or private repositories.

From a Modal Volume containing a `config.json` file:

```bash
modal endpoint create \
  --name my-volume-model \
  --model Qwen/Qwen3.5-4B \
  --custom-volume-name my-volume \
  --custom-volume-path /checkpoints/1234
```

## Configure capacity and placement

By default, Endpoints scale up under load and down to zero when idle.
Configure minimum, maximum, and buffer containers from the dashboard.

The routing region controls where requests enter Modal. Compute placement
controls where containers run. Set them independently:

```bash
modal endpoint create \
  --model Qwen/Qwen3.5-4B \
  --routing-region us-east \
  --compute-region us-west
```

Use `--colocate-compute` instead to run compute in the routing region. Pinning
compute to a region incurs a
[region selection multiplier](/docs/guide/region-selection#pricing).

<span id="request-routing"></span>

## Affinity routing

LLM serving engines cache the KV state of a prompt prefix, so a request that
reuses the prefix of an earlier request is fastest when it lands on the same
container. Multi-turn conversations and agent loops, where each request repeats
the previous turns, benefit the most.

Endpoints inherit [affinity routing](/docs/guide/servers#request-routing) from Servers.
To keep the requests of one conversation together, send the same routing key in
the `Modal-Routing-Affinity-Key` header on each of them. The routing key is an
arbitrary string; use one per conversation, task, or agent run.

```bash
curl "<your-endpoint-url>/v1/chat/completions" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET" \
  -H "Modal-Routing-Affinity-Key: $CUSTOM_CONVERSATION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<model-name>",
    "messages": [{ "role": "user", "content": "Hello!" }]
  }'
```

Choose the routing key to match the shared prefix:

* **One key per conversation**, not per user or application. A single key
  shared by many unrelated conversations concentrates all of that traffic on one
  container.
* **Use a new key when the prefix changes**, for example after compacting or
  summarizing a long context. The cached prefix no longer applies, and a new key
  lets the request move to a container with free capacity.

Note that requests may be routed to a different container when the Endpoint
scales or a container is replaced or overloaded.

## Metrics

The **Activity** view shows request volume over time. Use **Responses** to inspect
individual requests and **Containers** to inspect the containers serving them.

For text-generation models, **Metrics** separates **Inference metrics**—latency,
throughput, running and queued requests, cache usage, and speculative
decoding—from **Server metrics** such as autoscaling and CPU, memory, network,
and GPU utilization.

## Benchmarks

For text-generation models, the **Benchmark** view can run a repeatable real-time
or agentic workload against the live Endpoint. Benchmarks generate traffic,
trigger autoscaling, and incur the usual compute cost.

Treat results as point-in-time measurements: fleet size, placement, and cold
starts can all affect them.

<span id="manage-a-dedicated-endpoint"></span>

## Manage an Endpoint

List Endpoints in an Environment:

```bash
modal endpoint list --env prod
```

Stop an Endpoint when you no longer need it:

```bash
modal endpoint stop my-endpoint --env prod
```

Stopping an Endpoint is permanent. It tears down the serving application and
deletes its managed model cache; the Endpoint cannot be restarted.

## Pricing

Endpoints bill for the GPU, CPU, memory, and other resources used by
their containers at standard Modal compute rates. An Endpoint scaled to zero
does not incur compute charges.
