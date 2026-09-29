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

### 日志.fetch

```python
fetch(self, *, since, until=None, source=None, search_text="")
```获取与日期范围和过滤器相对应的服务器日志。

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

## 会话

```python
sessions: ServerSessionsManager
```

在用`@modal.sessioned()`修饰的服务器上启动和终止粘性会话。

### 会话.start

```python
start(self, idle_timeout=600)
```
启动粘性会话并返回其 ID 和令牌。

对携带返回令牌的服务器 URL 的请求将被路由到同一个容器，直到
会话在 `idle_timeout` 秒内没有连接或已终止。容器不会缩小
只要它举行现场会议。

**参数**

<Parameter name="idle_timeout" type="int" defaultValue="600" description="Seconds without an in-flight request before the session ends." />

**使用**

```python notest
server = modal.Server.from_name("my-app", "MyServer")
server_url = server.get_url()
session = server.sessions.start(idle_timeout=600)
headers = {"Modal-Authorization": f"Bearer {session.token}"}

requests.get(server_url, headers=headers).raise_for_status()

server.sessions.terminate(session.token)
```

### 会话.终止

```python
terminate(self, token)
```

终止粘性会话。

对其提出的新请求将被拒绝。该容器继续为其他会话提供服务。

**参数**

<Parameter name="token" type="str" description="The ⟦T36⟧ of the ⟦T37⟧ to terminate." />

**使用**

```python notest
server = modal.Server.from_name("my-app", "MyServer")
session = server.sessions.start()

server.sessions.terminate(session.token)
```

## 信息

```python
info(self, *, refresh=False)
```

获取服务器资源请求、关联安装、http 配置等的概述。

如果服务器句柄是，则此方法执行网络请求来填充此信息
尚未获取其信息的远程查找（例如来自`Server.from_name(...)`），
或者如果`refresh=True`。

**参数**

<Parameter name="refresh" type="bool" defaultValue="False" description="Always perform a network request. Pass ⟦T40⟧ to ensure that this method returns the most up to date information." />

**退货**

这将返回 [`modal.types.ServerInfo`](https://modal.com/docs/sdk/py/latest/types#ServerInfo)
数据类。

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

一个`ServerAutoscalerSettings`数据类，其中包含当前的自动缩放器设置
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

将本地对象与其在 Modal 服务器上的身份同步。

很少需要显式调用此方法，因为大多数操作都会需要时懒洋洋地补充水分。主要用例是当您需要访问对象时
元数据，例如其 ID。

## 来自\_name

```python
from_name(cls, app_name, name, *, environment_name=None, client=None)
```

通过名称从已部署的应用程序引用服务器。

这是一种延迟对局部进行补水的惰性方法
具有来自 Modal 服务器的元数据的对象，直到第一个
实际使用的时间。

## 来自\_id

```python
from_id(cls, server_id, *, client=None)
```

通过 ID 从已部署或正在运行的应用程序引用服务器。

这是一种延迟对局部进行补水的惰性方法
具有来自 Modal 服务器的元数据的对象，直到第一个
实际使用的时间。

**参数**

<Parameter name="server_id" type="str" description="The ID of the server." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client instance for this session." />

**使用**

```python notest
server = modal.Server.from_id("fu-456")
```

## 统计数据

```python
stats(self, *, since=None, until=None, container=None)
```

返回模式服务器的统计信息。
默认时间范围是最近一小时。最大时间范围为 7 天。

**参数**

<Parameter name="since" type="datetime | None" defaultValue="None" description="The beginning of the time range, inclusive. If omitted, this defaults to an hour before ⟦T44⟧. Values without a timezone are interpeted as local time." />
<Parameter name="until" type="datetime | None" defaultValue="None" description="The end of the time range, exclusive. If omitted, this defaults to current time. Values without a timezone are interpeted as local time." />
<Parameter name="container" type="str | None" defaultValue="None" description="If passed in, the stats are computed for only this container. Default None." />

**退货**

`ServerStats` 对象