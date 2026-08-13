<!-- modal-docs: machine-translated zh-CN from English source -->

# 服务器

```python
class Server(object)
```

服务器运行以 `@modal.enter` 方法启动的 HTTP 服务器。

更多信息请参阅[指南](https://modal.com/docs/guide/servers)。

一般情况下，你不会直接构建一个Server。
相反，请使用 [`@app.server()`](https://modal.com/docs/sdk/py/latest/App#server) 装饰器。

```python notest
@app.server(port=8080, routing_region="us-east")
class MyServer:
    @modal.enter()
    def start_server(self):
        self.process = subprocess.Popen(["python3", "-m", "http.server", "8080"])
```

## 对象\_id

```python
object_id(self)
```

此服务器实例的 Modal 内部 ID。

## 日志

```python
logs: ServerLogsManager
```

`Server` 的访问日志。

使用[`fetch()`](#logsfetch)
从 UTC 时间范围读取日志，[`tail()`](#logstail)
读取最新日志，以及 [`stream()`](#logsstream)
在新日志到达时对其进行跟踪。

**另见**

* [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs):
  CLI 访问应用程序的日志。

### 日志.fetch```python
fetch(self, *, since, until=None, source=None, search_text="")
```

获取与日期范围和过滤器相对应的服务器日志。

**参数**

<Parameter name="since" type="datetime" description="Start date to fetch logs from. Must be in UTC or timezone-naive, which is interpreted as local time." />
<Parameter name="until" type="datetime | None" defaultValue="None" description="Defaults to current date if None. Must be in UTC or timezone-naive, which is interpreted as local time." />
<Parameter name="source" type="LogSource | None" defaultValue="None" description="Filter by source: &#x27;stdout&#x27;, &#x27;stderr&#x27;, or &#x27;system&#x27;." />
<Parameter name="search_text" type="str" defaultValue="&quot;&quot;" description="Filter by search text." />

**产量**

`LogEntry` 按时间顺序排列的对象。

**使用**

```python notest
server = modal.Server.from_name("my-app", "web")

for entry in server.logs.fetch(
    since=datetime.now() - timedelta(minutes=25),
    source="stdout",
):
    print(entry.message, end="")
```

### 日志.tail

```python
tail(self, entries=100, *, source=None)
```

获取最新的服务器日志。

**参数**

<Parameter name="entries" type="int" defaultValue="100" description="The number of log entries to return." />
<Parameter name="source" type="LogSource | None" defaultValue="None" description="Filter by source: &#x27;stdout&#x27;, &#x27;stderr&#x27;, or &#x27;system&#x27;." />

**产量**

`LogEntry` 按时间顺序排列的对象。

**使用**

```python notest
server = modal.Server.from_name("my-app", "web")

for entry in server.logs.tail(20):
    print(entry.message, end="")
```

### 日志.stream

```python
stream(self, timeout=None)
```

流式传输新的服务器日志，直到达到超时。

**参数**

<Parameter name="timeout" type="float | None" defaultValue="None" description="Number of seconds to wait between log entries before terminating the stream. By default, this will block until it is interrupted." />

**产量**

`LogEntry` 物体到达时。

**使用**

```python notest
server = modal.Server.from_name("my-app", "web")

for entry in server.logs.stream(timeout=60):
    print(entry.message, end="")
```

## 获取\_url

```python
get_url(self)
```

用于向此服务器发出请求的 URL。

## 更新\_自动缩放器

```python
update_autoscaler(self, *, target_concurrency=None, min_containers=None,
    max_containers=None, buffer_containers=None, scaleup_window=None,
    scaledown_window=None)
```
覆盖此服务器当前的自动缩放程序行为。

未指定的参数将保留其当前值，即静态值
来自 `@app.server()` 装饰器，或之前调用此方法的覆盖值。

包含此服务器的应用程序的后续部署会将自动缩放器重置回
它的静态配置。

**参数**

<Parameter name="target_concurrency" type="float | None" defaultValue="None" description="Target number of concurrent requests per container. May be fractional, e.g. 1.5 to target three concurrent requests per two containers." />
<Parameter name="min_containers" type="int | None" defaultValue="None" description="Minimum number of containers to keep running regardless of demand." />
<Parameter name="max_containers" type="int | None" defaultValue="None" description="Limit on the number of containers that can be concurrently running." />
<Parameter name="buffer_containers" type="int | None" defaultValue="None" description="Extra containers to scale up beyond current demand." />
<Parameter name="scaleup_window" type="int | None" defaultValue="None" description="Seconds of sustained demand required before scaling up new containers." />
<Parameter name="scaledown_window" type="int | None" defaultValue="None" description="Maximum duration (in seconds) idle containers wait before scaling down." />

**退货**

一个`ServerAutoscalerSettings`数据类，包含当前的自动缩放器设置
调用后此服务器。

**使用**

```python notest
server = modal.Server.from_name("my-app", "Server")

# Always have at least 2 containers running, with an extra buffer of 2 containers
server.update_autoscaler(min_containers=2, buffer_containers=1)

# Limit this Server to avoid spinning up more than 5 containers
server.update_autoscaler(max_containers=5)

# Require 30 seconds of sustained demand before scaling up
server.update_autoscaler(scaleup_window=30)

# Adjust Server autoscaling to target 20 concurrent requests per replica
server.update_autoscaler(target_concurrency=20)

# Target three concurrent requests for every two containers
server.update_autoscaler(target_concurrency=1.5)

# Disable the Server autoscaling by setting target_concurrency to 0
server.update_autoscaler(target_concurrency=0)
```

## 水合物

```python
hydrate(self, client=None)
```

将本地对象与其在 Modal 服务器上的标识同步。

很少需要显式调用此方法，因为大多数操作都会
需要时懒洋洋地补充水分。主要用例是当您需要访问对象时
元数据，例如其 ID。

## 来自\_name

```python
from_name(cls, app_name, name, *, environment_name=None, client=None)
```

通过名称从已部署的应用程序引用服务器。

这是一种延迟给局部补水的惰性方法
具有来自 Modal 服务器的元数据的对象，直到第一个
实际使用的时间。