<!-- modal-docs: machine-translated zh-CN from English source -->

# 服务器

Modal 服务器是一种无服务器计算原语，针对外部客户端与 Modal 上容器中运行的进程之间的低延迟 HTTP 通信进行了优化。

```python
@app.server(unauthenticated=True)
class Server:

    @modal.enter()
    def startup(self):
        import subprocess
        subprocess.Popen("python -m http.server -d / 8000", shell=True)
```

Modal Server 原语为 [Endpoints](/docs/guide/endpoints) 提供底层基础设施。它们还可以通过完全定制的应用程序逻辑直接部署。

模态服务器与模态函数共享许多功能。它们是模态应用程序的成员，并通过正常的 `modal deploy` 工作流程进行[部署](/docs/guide/managing-deployments)。服务器资源配置与Functions具有相同的[基线请求+突发语义](/docs/guide/resources)，当然它们也可以使用[GPU](/docs/guide/gpu)。服务器容器可以使用[完全定制](/docs/guide/images)映像在我们的全球队列中[在任何地方运行](/docs/guide/region-selection)，并且它们受益于相同的快速冷启动性能（包括[内存快照](/docs/guide/memory-snapshots)）。他们可以挂载[Secrets](/docs/guide/secrets)和[Volumes](/docs/guide/volumes)并拥有稳定的[出站IP地址](​​/docs/guide/proxy-ips)。
这是模态服务器的高级指南。有关参考文档，请参阅 [`@app.server()`](/docs/sdk/py/latest/App#server) 装饰器和 [`modal.Server`](/docs/sdk/py/latest/Server) 对象参考页面。

本指南强调服务器和函数之间的*差异*。服务器是从头开始设计的，旨在为侦听端口并本机使用 HTTP 的进程提供超低延迟。这引发了自动缩放、负载均衡、身份验证和容器生命周期方面的一些重要差异。这也意味着服务器缺乏模态函数的一些依赖于状态函数输入系统的操作功能。

## 定义服务器

Modal 服务器是用一个类来定义的，该类在指定容器启动（以及可选的关闭）逻辑的方法上使用 Modal 的生命周期装饰器（/docs/guide/lifecycle-functions）。该类本身使用 `@app.server()` 装饰器向应用程序注册，该装饰器采用主要的服务器配置参数集。

启动逻辑必须初始化一个绑定到 0.0.0.0 并侦听端口（默认为`8000`）的服务器进程。
与 Modal Cls 不同，服务器定义不能使用 `@modal.method()` 或 Web Function 装饰器（如 `@modal.fastapi_endpoint`）。请求处理是由侦听端口的进程执行的，而不是类上的方法。

Modal Server 最直接地类似于使用 `@modal.web_server()` 装饰器的 Modal Function，并且大多数 Web 服务器 Function 都可以直接迁移到 Server，只要迁移考虑到本指南中讨论的不同行为和配置模型。

每个服务器都分配有一个 URL 作为其公共接口。可以使用 `modal.Server.get_url()` 以编程方式检索服务器的 URL。

## 并发和自动缩放

Modal Function 容器一次处理一个输入，除非它们明确选择[输入并发](/docs/guide/concurrent-inputs)，并且 Modal 将[自动缩放](/docs/guide/scale)其他 Function 容器以满足需求。服务器则相反：服务器进程应该处理并发请求，并且服务器配置必须在需要时显式选择容器自动缩放。
要启用自动缩放，请在 `@app.server()` 装饰器中提供 `target_concurrency=` 值。 Modal 将使用此目标来管理服务器的容器池，根据每个容器的并发请求负载扩展到所需的容器数量。请注意，它仅提供软限制。如果服务器进程无法处理给定级别的请求并发性，则该进程必须执行自己的负载均衡或负载卸载。

服务器可以使用标准 `min_containers=`、`max_containers=` 和 `buffer_containers=` 参数来绑定自动缩放器或[使其他容器保持温暖](/docs/guide/cold-start)。他们还可以使用 `scaleup_window=` 和 `scaledown_window=` 来调整自动缩放器对请求率波动的响应能力。可以使用`modal.Server.update_autoscaler()`动态调整服务器自动缩放配置。与 Functions 一样，任何动态配置都将在后续部署中重置。
如果服务器配置未设置`target_concurrency=`，但通过`min_containers=`配置多个容器，则请求将分布在池中。如果需要单例容器，最好保持 `target_concurrency=` 未设置而不是设置 `max_containers=1`，因为后者将阻止 Modal 在[滚动重新部署](/docs/guide/managing-deployments#deployment-strategies)期间提出替代品以优雅地转移流量。

## 零到一缩放

由于服务器在客户端和容器之间使用无状态反向代理，因此请求在等待容器时不会像函数输入那样排队。这对于从零到一的缩放具有重大影响。当服务器没有活动容器时，请求将被拒绝，并显示 503 服务不可用状态，客户端必须处理该状态。零到一的扩展仍然是自动的，因此第一个请求将触发容器冷启动，服务器将在准备就绪后立即处理其他传入请求。

## 容器生命周期
在服务器进程侦听配置的端口之前，即使启动方法已返回，服务器容器也不会被视为准备就绪。请求将被发送到其他容器（或以 503 拒绝），直到容器准备就绪。在 `startup_timeout=` 秒内未准备就绪的容器将被终止并标记为失败。

当服务器容器处于活动状态时，Modal 将发送运行状况检查以验证其端口是否仍在侦听。如果容器连续多次未通过健康检查，它将被终止并替换。

当容器缩小规模时，它们将停止接收新请求，但它们可能会继续处理任何正在进行的请求，时间最长为 `exit_grace_period=` 秒。随后，将向容器发送 SIGTERM 以正常终止所有正在运行的进程并运行任何退出处理程序 (`@modal.exit()`)。进程终止和退出处理程序需要额外的 30 秒才能完成，之后容器如果仍在运行，将收到硬 SIGKILL 信号。

## 请求认证
与 Web Functions 不同，服务器默认要求请求中进行身份验证，并且服务器配置必须设置 `unauthenticated=True` 才能接受公共 Web 流量。如果没有此设置，未经身份验证的请求将被 Modal 的代理以 401 代码拒绝，并且不会有助于自动缩放器记帐。

要对请求进行身份验证，请将代理令牌作为单个 `Authorization: Bearer wk-<id>.ws-<secret>` 标头或作为单独的 `Modal-Key` 和 `Modal-Secret` 标头传递。

对于启用了 [RBAC](/docs/guide/rbac) 的工作区，代理令牌的范围还必须限定在部署服务器应用程序的环境中。不在相关环境范围内的有效令牌将被拒绝，并显示 403 代码。

## 请求路由

服务器配置包括将请求路由到容器的代理的区域规范（`routing_region=`）。支持以下路由区域：`us-east`（默认）、`us-west`、`ca-central`、`eu-west` 和 `ap-south`。作为一般规则，选择最接近您的客户的路由区域。还可以使用 `compute_region=` 限制同一区域内的容器调度，但请注意，这会产生[成本乘数](/docs/guide/region-selection#pricing)。
路由代理还支持“粘性会话”。如果请求包含 `Modal-Session-ID` 标头（可以是任意字符串），则共享会话 ID 的不同请求将由同一个容器处理。

## 操作特点

除了请求队列之外，服务器还缺乏用于模态函数的状态输入系统提供的其他几个操作功能，并且它们需要用户的客户端或服务器应用程序层在需要时实现这些功能。请求数据的序列化和反序列化必须在应用层处理。对于失败的请求（包括在容器被抢占或崩溃时失败的请求），没有内置的[重试](/docs/guide/retries)。请求 [timeouts](/docs/guide/timeouts) 无法在 Modal 中自定义，必须由客户端或服务器代码设置。