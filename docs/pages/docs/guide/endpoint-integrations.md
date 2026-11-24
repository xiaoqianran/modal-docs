<span id="endpoint-integrations"></span>

# Agent integrations

Use the hostname of your [Model API](/docs/guide/shared-endpoints) as the agent's
model ID. Copy it from the dashboard.

If your agent asks for a base URL, use the region in the hostname. For example,
the base URL for `my-endpoint.us-west.modal.direct` is
`https://inference.us-west.modal.direct`. For an EU model, use its
`eu-west` hostname and `https://inference.eu-west.modal.direct`. Include
`/v1` when the agent's configuration below shows it.

For the API key, join your [Proxy Token](/docs/guide/webhook-proxy-auth) ID and
secret with a period (`wk-<id>.ws-<secret>`). The token needs access to your
Model API's Environment.

To list the model IDs your token can use, request `/v1/models` in the same region.

```bash
curl "https://inference.us-west.modal.direct/v1/models" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET"
```

## OpenCode

[Install OpenCode](https://opencode.ai/docs/), run `/connect`, and select Modal
as the [provider](https://opencode.ai/docs/providers/). Enter your Proxy Token
as the API key. Then run `/models` and
select your Model API by hostname.

For CI or other headless use, set the token in the environment instead of
running `/connect`:

```bash
export MODAL_PROXY_TOKEN="wk-<id>.ws-<secret>"
```

## Hermes Agent

[Install Hermes Agent](https://hermes-agent.nousresearch.com/docs/) and install
the [Modal plugin](https://hermes-agent.nousresearch.com/docs/plugins/modal):

```bash
hermes plugins install modal
```

Enter your Proxy Token when prompted. Run `hermes model`, select Modal as the
provider, and select your Model API by hostname.

To use an [Endpoint](/docs/guide/endpoints) with Hermes,
set `MODAL_BASE_URL` to its base URL, for example
`https://<workspace>-<env>--<app>.<region>.modal.direct/v1`.

## Omp

[Install Omp](https://omp.sh), run `/login modal`, and enter your Proxy Token.
Then run `/model` and select your Model API by hostname.

For CI or other headless use, set the token in the environment instead of
running `/login modal`:

```bash
export MODAL_PROXY_TOKEN="wk-<id>.ws-<secret>"
```

## Codex

[Install Codex](https://learn.chatgpt.com/docs/codex/cli) and define Modal as a
model provider in `~/.codex/config.toml`:

```toml
# ~/.codex/config.toml
[model_providers.modal]
name = "Modal"
base_url = "https://inference.us-west.modal.direct/v1"
env_key = "MODAL_PROXY_TOKEN"
wire_api = "responses"
```

Then you can run Codex via the following command with the Model API hostname as
the model ID:

```bash
export MODAL_PROXY_TOKEN="$MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET"
codex \
  --model my-endpoint.us-west.modal.direct \
  --config model_provider='"modal"'
```

## Claude Code

[Install Claude Code](https://code.claude.com/docs/en/quickstart). Set
`ANTHROPIC_AUTH_TOKEN` to your Proxy Token and `ANTHROPIC_MODEL` to the hostname
of a Model API that supports tool calling.

```bash
export ANTHROPIC_BASE_URL="https://inference.us-west.modal.direct"
export ANTHROPIC_AUTH_TOKEN="wk-<id>.ws-<secret>"
export ANTHROPIC_MODEL="my-endpoint.us-west.modal.direct"
export ANTHROPIC_DEFAULT_FABLE_MODEL="$ANTHROPIC_MODEL"
export ANTHROPIC_DEFAULT_OPUS_MODEL="$ANTHROPIC_MODEL"
export ANTHROPIC_DEFAULT_SONNET_MODEL="$ANTHROPIC_MODEL"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="$ANTHROPIC_MODEL"
claude
```
