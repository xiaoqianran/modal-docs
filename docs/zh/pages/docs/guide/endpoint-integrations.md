<!-- modal-docs: machine-translated zh-CN from English source -->

<span id="endpoint-integrations"></span>

# 代理集成

使用 [Model API](/docs/guide/model-apis) 的主机名作为代理的主机名
型号 ID。从仪表板复制它。

如果您的代理要求提供基本 URL，请使用主机名中的区域。例如，
`my-endpoint.us-west.modal.direct` 的基本 URL 是
`https://inference.us-west.modal.direct`。对于欧盟模型，请使用其
`eu-west` 主机名和 `https://inference.eu-west.modal.direct`。包括
`/v1` 当下面的代理配置显示它时。

对于 API 密钥，请加入您的 [代理令牌](/docs/guide/webhook-proxy-auth) ID 并
带有句号的秘密 (`wk-<id>.ws-<secret>`)。该令牌需要访问您的
模型 API 的环境。要列出您的令牌可以使用的模型 ID，请在同一区域请求 `/v1/models`。

```bash
curl "https://inference.us-west.modal.direct/v1/models" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET"
```

## 开放代码

[安装OpenCode](https://opencode.ai/docs/)，运行`/connect`，选择Modal
作为[提供者](https://opencode.ai/docs/providers/)。输入您的代理令牌
作为 API 密钥。然后运行 `/models` 并
按主机名选择您的模型 API。

对于 CI 或其他无头使用，请在环境中设置令牌，而不是
运行`/connect`：

```bash
export MODAL_PROXY_TOKEN="wk-<id>.ws-<secret>"
```

默认情况下，OpenCode 的 Modal 提供程序列出来自 `us-west` 网关的模型。

## 爱马仕代理

[安装Hermes Agent](https://hermes-agent.nousresearch.com/docs/)并安装
[模态插件](https://hermes-agent.nousresearch.com/docs/plugins/modal):

```bash
hermes plugins install modal
```

出现提示时输入您的代理令牌。运行`hermes model`，选择Modal作为
提供者，然后按主机名选择您的模型 API。
要将 [Endpoint](/docs/guide/endpoints) 与 Hermes 一起使用，
例如，将 `MODAL_BASE_URL` 设置为其基本 URL
`https://<workspace>-<env>--<app>.<region>.modal.direct/v1`。

要使用 [EU 模型](/docs/guide/model-apis#eu-models)，请设置 `MODAL_BASE_URL`
到 `eu-west` 主机名或网关。

## 奥普

[安装 Omp](https://omp.sh)，运行`/login modal`，然后输入您的代理令牌。
然后运行 ​​`/model` 并按主机名选择您的模型 API。或者，设置
例如，`MODAL_BASE_URL` 到 [Endpoint](/docs/guide/endpoints) 的基本 URL
`https://<workspace>-<env>--<app>.<region>.modal.direct/v1`。

对于 CI 或其他无头使用，请在环境中设置令牌，而不是
运行`/login modal`：

```bash
export MODAL_PROXY_TOKEN="wk-<id>.ws-<secret>"
```

要使用 [EU 模型](/docs/guide/model-apis#eu-models)，请设置 `MODAL_BASE_URL`
到 `eu-west` 主机名或网关。

## 法典

[安装 Codex](https://learn.chatgpt.com/docs/codex/cli) 并将 Modal 定义为
`~/.codex/config.toml`中的模型提供者：

```toml
# ~/.codex/config.toml
[model_providers.modal]
name = "Modal"
base_url = "https://inference.us-west.modal.direct/v1"
env_key = "MODAL_PROXY_TOKEN"
wire_api = "responses"
```

然后，您可以通过以下命令运行 Codex，并将模型 API 主机名设置为
型号ID：

```bash
export MODAL_PROXY_TOKEN="$MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET"
codex \
  --model my-endpoint.us-west.modal.direct \
  --config model_provider='"modal"'
```

## 克劳德代码

[安装克劳德代码](https://code.claude.com/docs/en/quickstart)。套装
`ANTHROPIC_AUTH_TOKEN` 到您的代理令牌，`ANTHROPIC_MODEL` 到主机名
支持工具调用的模型API。

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