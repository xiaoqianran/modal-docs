<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 Prometheus Pushgateway 发布自定义指标

此示例演示如何使用 Modal 将自定义指标发布到 Prometheus 实例。
由于 Modal 容器的短暂性，它不太适合传统容器
基于抓取的 Prometheus 设置。相反，我们将使用 [Prometheus Pushgateway](https://github.com/prometheus/pushgateway)
从我们的 Modal 容器收集和存储指标。我们可以在 Modal 中运行 Pushgateway
作为一个单独的进程，并让我们的应用程序将指标推送给它。

![Prometheus Pushgateway 图](./pushgateway_diagram.png)

## 安装 Prometheus Pushgateway

由于官方的 Prometheus Pushgateway 镜像没有安装 Python，我们将
使用包含 Python 的自定义映像将指标推送到 Pushgateway。推送网关
运送单个二进制文件，因此很容易将其放入 Modal 容器中。

```python
import os
import subprocess

import modal

PUSHGATEWAY_VERSION = "1.9.0"

gw_image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("wget", "tar")
    .run_commands(
        f"wget https://github.com/prometheus/pushgateway/releases/download/v{PUSHGATEWAY_VERSION}/pushgateway-{PUSHGATEWAY_VERSION}.linux-amd64.tar.gz",
        f"tar xvfz pushgateway-{PUSHGATEWAY_VERSION}.linux-amd64.tar.gz",
        f"cp pushgateway-{PUSHGATEWAY_VERSION}.linux-amd64/pushgateway /usr/local/bin/",
        f"rm -rf pushgateway-{PUSHGATEWAY_VERSION}.linux-amd64 pushgateway-{PUSHGATEWAY_VERSION}.linux-amd64.tar.gz",
        "mkdir /pushgateway",
    )
)

```

## 启动 Pushgateway

我们将把 Pushgateway 作为一个单独的 Modal 应用程序启动。这样我们就可以运行Pushgateway了
在后台，让我们的主应用程序向其推送指标。我们将使用`web_server`
装饰器来公开 Pushgateway 的 Web 界面。注意，我们必须设置`max_containers=1`
因为 Pushgateway 是一个单进程应用程序。如果我们启动多个实例，它们会
互相冲突。

这是一个示例配置，但生产就绪配置将在两个方面有所不同：

1. 您应该为Pushgateway设置身份验证。 Pushgateway 支持[基本身份验证](https://github.com/prometheus/pushgateway/blob/42c4075fc5e2564031f2852885cdb2f5d570f672/README.md#tls-and-basic-authentication)
   开箱即用。如果您需要更高级的身份验证，请考虑使用[Web功能层](https://modal.com/docs/guide/webhooks#authentication)
   将请求代理到 Pushgateway。

2. Pushgateway 应监听 [自定义域](https://modal.com/docs/guide/webhook-urls#custom-domains)。
   这将允许您配置 Prometheus 从可预测的 URL 中抓取指标，而不是
   自动生成的 URL 模态分配给您的应用程序。

```python
gw_app = modal.App(
    "example-pushgateway-server",
    image=gw_image,
)


@gw_app.function(max_containers=1)
@modal.web_server(9091)
def serve():
    subprocess.Popen("/usr/local/bin/pushgateway")


```

## 将指标推送到 Pushgateway

现在我们已经运行了 Pushgateway，我们可以将指标推送给它。我们将使用`prometheus_client`
库创建一个简单的计数器并将其推送到 Pushgateway。这个例子是一个简单的计数器，
但您可以将任何指标类型推送到 Pushgateway。

请注意，我们使用 `grouping_key` 参数来区分相同的不同实例
公制。当您有同一应用程序的多个实例将指标推送到 Pushgateway 时，这非常有用。
如果没有这个，Pushgateway 将用最新值覆盖指标。

```python
client_image = modal.Image.debian_slim().uv_pip_install(
    "prometheus-client==0.20.0", "fastapi[standard]==0.115.4"
)
app = modal.App(
    "example-pushgateway",
    image=client_image,
)

with client_image.imports():
    from prometheus_client import (
        CollectorRegistry,
        Counter,
        delete_from_gateway,
        push_to_gateway,
    )


@app.cls()
class ExampleClientApplication:
    @modal.enter()
    def init(self):
        self.registry = CollectorRegistry()
        self.web_url = serve.get_web_url()
        self.instance_id = os.environ["MODAL_TASK_ID"]
        self.counter = Counter(
            "hello_counter",
            "This is a counter",
            registry=self.registry,
        )

    # We must explicitly clean up the metric when the app exits so Prometheus doesn't
    # keep stale metrics around.
    @modal.exit()
    def cleanup(self):
        delete_from_gateway(
            self.web_url,
            job="hello",
            grouping_key={"instance": self.instance_id},
        )

    @modal.fastapi_endpoint(label="hello-pushgateway")
    def hello(self):
        self.counter.inc()
        push_to_gateway(
            self.web_url,
            job="hello",
            grouping_key={"instance": self.instance_id},
            registry=self.registry,
        )
        return f"Hello world from {self.instance_id}!"


app.include(gw_app)

```
现在，我们可以部署应用程序并在 Pushgateway 的 Web 界面中查看指标。

```shell
$ modal deploy pushgateway.py
✓ Created objects.
├── 🔨 Created mount /home/ec2-user/modal/examples/10_integrations/pushgateway.py
├── 🔨 Created function ExampleClientApplication.*.
├── 🔨 Created web function serve => https://modal-labs-examples--example-pushgateway-serve.modal.run
└── 🔨 Created web function for ExampleClientApplication.hello => https://modal-labs-examples--hello-pushgateway.modal.run
✓ App deployed! 🎉
```

您现在可以转到[客户端应用程序](https://modal-labs-examples--hello-pushgateway.modal.run)
和 [Pushgateway](https://modal-labs-examples--example-pushgateway-serve.modal.run) URL 以查看正在推送的指标。

## 连接普罗米修斯

现在我们在 Pushgateway 中有了指标，我们可以配置 Prometheus 来抓取它们。这个
就像在 Prometheus 配置中添加新作业一样简单。这是一个配置示例
片段：

```yaml
scrape_configs:
- job_name: 'pushgateway'
  honor_labels: true # required so that the instance label is preserved
  static_configs:
  - targets: ['modal-labs-examples--example-pushgateway-serve.modal.run']
```

请注意，如果您为 Pushgateway 设置了自定义域，则目标将会有所不同，
并且您可能需要配置身份验证。

将作业添加到 Prometheus 配置后，Prometheus 将开始抓取指标
来自 Pushgateway。然后，您可以使用 Grafana 或其他可视化工具来创建仪表板
并根据这些指标发出警报！

![Grafana 示例](./pushgateway_grafana.png)