<!-- modal-docs: machine-translated zh-CN from English source -->

# 端点集成

兼容 OpenAI 的编码代理，例如 OpenCode 和 Codex，可以连接
直接连接到您的[共享端点](/docs/guide/shared-endpoints)。他们是
通过 `https://inference.us-west.modal.direct` 可用，并在
OpenAI `model` 字段，因此模型 ID 是端点的主机名，例如
`my-endpoint.us-west.modal.direct`。

要查看令牌可以到达哪些共享端点，请列出所有模型 ID：

```bash
curl "https://inference.us-west.modal.direct/v1/models" \
  -H "Authorization: Bearer $MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET"
```

## 开放代码

[安装OpenCode](https://opencode.ai/docs/)并创建一个
[代理令牌](/docs/guide/endpoints#proxy-tokens)。在 OpenCode CLI 中，运行
`/connect`，选择 Modal 作为
[provider](https://opencode.ai/docs/providers/)，并输入令牌作为
组合形式的 API 密钥，`wk-<id>.ws-<secret>`。然后运行 `/models` 并
按主机名选择您的端点。

对于 CI 或其他无头使用，请在环境中设置令牌，而不是
运行`/connect`：

```bash
export MODAL_PROXY_TOKEN="wk-<id>.ws-<secret>"
```

## 法典

[安装Codex](https://learn.chatgpt.com/docs/codex/cli)，创建一个
[代理令牌](/docs/guide/endpoints#proxy-tokens)，并将 Modal 定义为模型
`~/.codex/config.toml` 中的提供商：

```toml
# ~/.codex/config.toml
[model_providers.modal]
name = "Modal"
base_url = "https://inference.us-west.modal.direct/v1"
env_key = "MODAL_PROXY_TOKEN"
wire_api = "responses"
```

然后，您可以通过以下命令运行 Codex，端点主机名为
型号ID：

```bash
export MODAL_PROXY_TOKEN="$MODAL_PROXY_TOKEN_ID.$MODAL_PROXY_TOKEN_SECRET"
codex \
  --model my-endpoint.us-west.modal.direct \
  --config model_provider='"modal"'
```