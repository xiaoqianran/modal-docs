<!-- modal-docs: machine-translated zh-CN from English source -->

# 将 Modal 连接到您的 OpenTelemetry Provider

您可以将 Modal 日志导出到您的 [OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/)
使用 Modal OpenTelemetry 集成的提供商。此集成兼容
任何支持 OpenTelemetry HTTP API 的可观测性提供程序。

## 此集成的作用

这种集成使您能够：

1. 将 Modal 审核日志导出到您的提供商
2. 将模态函数日志导出到您的提供商
3. 将容器指标导出到您的提供商

## 指标

Modal OpenTelemetry 集成会将以下指标转发给您的提供商：

* `modal.cpu.utilization`
* `modal.memory.usage`
* `modal.gpu.memory.usage`* `modal.gpu.compute.utilization`
* `modal.container.running`
* `modal.input_events.elapsed_time_us`
* `modal.input_events.input_queue_time_us`
* `modal.input_events.coldstart_time_us`
* `modal.input_events.successes`
* `modal.input_events.total_inputs`
* `modal.function.pending_inputs`
* `modal.function.running_inputs`

已弃用的指标：

* `modal.memory.utilization`（使用`modal.memory.usage`）
* `modal.gpu.memory.utilization`（使用`modal.gpu.memory.usage`）

`modal.input_events.successes`和`modal.input_events.total_inputs`可以用来衡量某个功能或应用程序的成功率。

这些指标标记有 `container_id`、`environment_name`、`app_name`、
`app_id`、`function_name`、`function_id`、`workspace_name` 和 `workspace_id`。

## 自定义指标

<Callout variant="beta">

请联系我们为您的工作区启用自定义指标。

</Callout>

Modal OpenTelemetry 集成允许您将自定义指标和跨度发送给您的提供商。你会
然后需要导出我们的收集器环境变量。这些配置 OpenTelemetry SDK
以 HTTP 格式向我们的收集器发送消息。您不需要执行此操作即可获得
上面的开箱即用指标，仅适用于您自己的自定义指标。

```python
@app.function(
   secrets=[modal.Secret.from_dict({
      "OTEL_EXPORTER_OTLP_ENDPOINT": "otlp-collector.modal.local:4317",
      "OTEL_EXPORTER_OTLP_INSECURE": "true",
      "OTEL_EXPORTER_OTLP_PROTOCOL": "http/protobuf",
   })],
)
def custom_metrics():
   ...
```

所有 OpenTelemetry SDK 都应选择此配置，并且您的自定义指标和跨度将是
发送到您配置的提供商。

## 安装集成

1. 找出 OpenTelemetry 提供商的端点 URL。这是网址
   Modal 集成会将日志发送到。请注意，这应该是基本 URL
   OpenTelemetry 提供程序的名称，而不是特定的端点。例如，对于
   [美国新圣物副本](https://docs.newrelic.com/docs/opentelemetry/best-practices/opentelemetry-otlp/#configure-endpoint-port-protocol),
   端点 URL 是 `https://otlp.nr-data.net`，而不是 `https://otlp.nr-data.net/v1/logs`。
2. 找出将日志发送到您的 API 密钥或其他身份验证方法
   OpenTelemetry 提供商。这是模态集成将用来进行身份验证的密钥
   与您的提供商。 Modal 可以提供任何键/值 HTTP 标头对。例如，对于
   [新遗物](https://docs.newrelic.com/docs/opentelemetry/best-practices/opentelemetry-otlp/#api-key),
   标题是`api-key`。
3. 在 Modal 中创建一个新的 OpenTelemetry Secret，每个标头有一个密钥。这些键应该是
   前缀为 `OTEL_HEADER_`，后跟标头名称。这个的价值
key 应该是 header 的值。例如，对于 New Relic，一个示例 Secret
   可能看起来像`OTEL_HEADER_api-key: YOUR_API_KEY`。如果您使用 OpenTelemetry Secret
   模板，这将为您预先填写。
4. 进入【模态指标设置页面】(http://modal.com/settings/metrics)并配置
   步骤 1 中的 OpenTelemetry 推送 URL 和步骤 3 中的 Secret。
5. 保存更改并使用测试按钮确认日志已发送至您的提供商。
   如果一切正常，您应该会看到来自 `modal.test_logs` 服务的 `Hello from Modal! 🚀` 日志。

## 卸载集成

卸载集成后，所有日志将停止发送到
您的提供商。

1. 进入【模态指标设置页面】(http://modal.com/settings/metrics)
   并禁用 OpenTelemetry 集成。