<!-- modal-docs: machine-translated zh-CN from English source -->

# 区域选择

Modal 在多个不同的云中全局运行容器。默认情况下，模态函数的所有输入在发送到容器执行之前都会通过我们位于美国弗吉尼亚州 (`us-east`) 的服务器进行路由。

您可以[通过环境变量](/docs/guide/environment_variables)观察容器的位置标识符。记录此环境变量以及延迟信息可以揭示地理位置何时影响应用程序性能。

## 指定容器区域

要在特定区域运行 Modal Function 容器，请将 `region=` 参数传递给 `function` 装饰器：

```python
@app.function(region=["us-west"])
def f():
    ...
```

沙箱在 `Sandbox.create` 上接受相同的 `region=` 参数：

```python notest
sb = modal.Sandbox.create(region=["us-west"], app=app)
```

当运行需要在外部数据库附近运行的延迟敏感应用程序时，这尤其有用。

### 定价

我们的[基本使用定价](/定价)之上的乘数将应用于定义了容器区域的任何函数或沙盒。

| **区域类型** | **乘数** |
| ----------------------- | -------------- |
|广泛（例如`us`）| 1.5 倍 |
|窄（例如 `us-west`）| 1.75 倍 |
下面是一个示例：假设您有一个使用 1 个 T4、1 个 CPU 核心和 1GB 内存的 Function 或 Sandbox 容器。您已指定它应在 `us-west` 中运行。运行 1 小时的成本为 `((T4 hourly cost) + (CPU hourly cost for one core) + (Memory hourly cost for one GB)) * 1.75`。

如果您指定多个容器区域并且它们跨越上述两个类别，我们将应用两个乘数中较小的一个。

### 容器区域选项

Modal 为容器区域提供不同级别的粒度。尽可能使用更广泛的区域，因为这会增加您的函数或沙盒容器可以分配到的可用资源池，从而缩短冷启动时间和可用性。

<!-- TODO: 自动生成此表，这是不可持续的 -->

```
  Broad          Narrow               Notes
 ===========================================================
  "us"                                United States
                 "us-east"
                 "us-central"
                 "us-south"
                 "us-west"
------------------------------------------------------------
  "eu"                                European Economic Area
                 "eu-west"
                 "eu-north"
                 "eu-south"
------------------------------------------------------------
  "ap"                                Asia-Pacific
                 "ap-northeast"
                 "ap-southeast"
                 "ap-south"
                 "ap-melbourne"
                 "jp"                 Japan
                 "au"                 Australia
------------------------------------------------------------
  "uk"                                United Kingdom
------------------------------------------------------------
  "ca"                                Canada
------------------------------------------------------------
  "me"                                Middle East
------------------------------------------------------------
  "sa"                                South America
------------------------------------------------------------
  "af"                                Africa
------------------------------------------------------------
  "mx"                                Mexico
```

需要访问更精细的区域定义？联系<sales@modal.com>。

## 区域路由

<Callout variant="beta" />

除了让您指定函数容器运行的区域之外，Modal 还允许您指定输入和输出将路由到哪个区域，以减少网络开销。默认情况下，这是`us-east`（美国弗吉尼亚州）。

这不适用于沙箱，因为大多数操作直接进入容器（有一些小例外是通过`us-east`路由的）。
### 指定路由区域

要使模态函数的流量路由通过特定区域，请将 `routing_region=` 参数传递给 `function` 装饰器。

```python
@app.function(routing_region="us-west")
def f():
    ...
```

`routing_region=` 的有效选项是：

* `us-east`（美国弗吉尼亚州）
* `us-west`（美国俄勒冈州）
* `ca-central`（加拿大蒙特利尔）
* `eu-west`（爱尔兰都柏林）
* `ap-south`（印度孟买）

### 当前限制

`routing_region=`只能在功能的初始部署期间设置，并且不能在后续重新部署中更改。要更改路由区域，应创建一个新函数。指定 `us-east` 之外的路由区域的函数只能使用 `.remote()` 或 `.map()` 或通过 [Web Functions](/docs/guide/webhooks) 的 HTTP 来调用。

[大于 2 MiB 的输入和输出](/docs/guide/security#function-inputs-and-outputs) 仍上传到 `us-east` 中的对象存储。

## 优化延迟

Modal 拥有多种工具来优化网络延迟，甚至在实时机器人等极端情况下可降低至约 10 毫秒。将容器区域选择与附近的路由区域结合使用可以消除大量的网络开销。
[Cloudping.co](https://www.cloudping.co) 提供了区域之间延迟的良好估计。例如，AWS `us-east`（美国弗吉尼亚州）和`us-west`（美国俄勒冈州）之间的往返延迟约为 60 毫秒。

可以使用单独的功能拆分区域部署，如下所示：

```python
def f():
    ...

@app.function(region=["us-central", "us-west"], routing_region="us-west")
def f_us_west():
    return f()

@app.function(region="ap", routing_region="ap-south")
def f_ap_south():
    return f()
```

如需进一步优化延迟，请通过 [Slack](https://modal.com/slack) 或<support@modal.com>联系我们。