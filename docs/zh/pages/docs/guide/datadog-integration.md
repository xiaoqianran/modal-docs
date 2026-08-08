<!-- modal-docs: machine-translated zh-CN from English source -->

# 将 Modal 连接到您的 Datadog 帐户

您可以使用[Modal + Datadog集成](https://docs.datadoghq.com/integrations/modal/)
将模态函数日志导出到 Datadog。你会发现模态数据狗
集成可安装在 Datadog 市场中。

## 此集成的作用

这种集成使您能够：

1.导出Datadog中的Modal审核日志
2.将Modal Function日志导出到Datadog
3. 将容器指标导出到Datadog

## 安装集成

连接此集成会在您的 Datadog 帐户中创建一个 API 密钥，该密钥需要 Datadog 组织所有者权限。如果您不是组织所有者，请要求组织所有者
完成连接。

1. 打开[模态图块](https://app.datadoghq.com/integrations?integrationId=modal)（或欧盟图块[此处](https://app.datadoghq.eu/integrations?integrationId=modal)）
   在 Datadog 集成页面中
2. 单击“安装集成”
3. 单击“连接帐户”开始对此集成的授权。
   您将被重定向到登录 Modal，登录后，您将
   被重定向到Datadog授权页面。
4. 点击“授权”完成集成设置

## 指标

Modal Datadog 集成会将以下指标转发给 Datadog：

* `modal.cpu.utilization`
* `modal.memory.usage`
* `modal.gpu.memory.usage`
* `modal.gpu.compute.utilization`
* `modal.gpu.power.usage`
* `modal.gpu.power.utilization`
* `modal.gpu.temperature`
* `modal.container.running`
* `modal.input_events.elapsed_time_us`
* `modal.input_events.input_queue_time_us`
* `modal.input_events.coldstart_time_us`
* `modal.input_events.successes`
* `modal.input_events.total_inputs`
* `modal.function.pending_inputs`
* `modal.function.running_inputs`

所有指标均标有 `container_id`、`environment_name`、`app_name`、`app_id`、
`function_name`、`function_id`、`workspace_name`、`workspace_id`。

已弃用的指标：

* `modal.memory.utilization`（使用`modal.memory.usage`）
* `modal.gpu.memory.utilization`（使用`modal.gpu.memory.usage`）

可以使用`modal.input_events.successes`和`modal.input_events.total_inputs`
衡量某个功能或应用程序的成功率。

作为[官方 Datadog 集成](https://docs.datadoghq.com/integrations/modal/)，
Datadog 上的模态指标是免费的，而日志是收费的。

## 日志属性

转发到Datadog的日志包括以下属性：

* `container_id`
* `app_id`
* `app_name`
* `function_id`
* `function_name`
* `function_call_id`
* `input_id`
* `sandbox_id`
* `environment`
* `workspace`
* `workspace_id`

这些是[日志属性](https://docs.datadoghq.com/logs/log_configuration/attributes_naming_convention/)，不是标签。您可以在 Datadog 中过滤和搜索它们
[日志浏览器](https://docs.datadoghq.com/logs/explorer/) 使用 `@` 前缀
（例如，`@container_id:<value>`）。

## 结构化日志记录

来自 Modal 的日志以纯文本形式发送到 Datadog，无需任何结构化
解析。这意味着如果您有自定义日志格式，则需要
设置【日志处理管道】(https://docs.datadoghq.com/logs/log_configuration/pipelines/?tab=source)
在 Datadog 中解析它们。

Modal 在日志记录的`.message`字段中传递日志消息。至
解析日志时，您应该对该字段进行操作。请注意，模态积分
确实建立了一些基本的管道。为了使您的管道正常工作，请确保
在日志设置中，您的管道位于 Modal 的管道之前。

## 节省成本

模态 Datadog 集成会将所有日志转发到 Datadog，这可能是
对于冗长的应用程序来说代价高昂。我们建议使用[日志管道](https://docs.datadoghq.com/logs/log_configuration/pipelines/?tab=source)
或[索引排除过滤器](https://docs.datadoghq.com/logs/indexes/?tab=ui#exclusion-filters)
在将日志发送到 Datadog 之前对其进行过滤。

所有日志都包含 `environment` 属性。最简单的过滤方法
日志是创建一个管道，过滤此属性并隔离
单独环境中的详细应用程序。

## 卸载集成

卸载集成后，所有日志将停止发送到
Datadog，授权将被撤销。

1. 进入【模态指标设置页面】(http://modal.com/settings/metrics)
   并选择“删除 Datadog 集成”。
2. 在 Datadog 模态集成磁贴的配置选项卡上，
   单击卸载集成。
3. 确认您要卸载集成。
4. 确保与此集成关联的所有 API 密钥均已
   通过在 [API 密钥](https://app.datadoghq.com/organization-settings/api-keys?filter=Modal) 上搜索集成名称来禁用
   页。