<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用程序

```python
class App(object)
```

模态应用程序是一组部署在一起的函数和类。

该应用程序至少有三个用途：

* 函数和类的部署单元。
* 跨进程同步（主要）函数和类的身份
  （您的本地 Python 解释器和应用程序中活动的每个 Modal 容器）。
* 管理代码中发生的所有事情的日志收集。

**使用应用程序注册功能**

向应用程序显式注册对象的最常见方法是通过`@app.function()` 装饰器。它既注册了带注释的函数本身，又
使用应用程序传递的其他对象，例如时间表和秘密：

```python
import modal

app = modal.App()

@app.function(
    secrets=[modal.Secret.from_name("some_secret")],
    schedule=modal.Period(days=1),
)
def foo():
    pass
```

在此示例中，秘密和时间表已注册到应用程序中。

```python
__init__(self, name=None, *, tags=None, image=None, secrets=[], volumes={},
    include_source=True)
```

构建一个新的应用程序，可以选择使用默认图像、安装、秘密或卷。

**参数**

<Parameter name="name" type="str | None" defaultValue="None" description="Optional app name used for registration and lookup." />
<Parameter name="tags" type="dict[str, str] | None" defaultValue="None" description="Additional metadata to set on the App." />
<Parameter name="image" type="_Image | None" defaultValue="None" description="Default image for the App (otherwise defaults to ⟦T35⟧)." />
<Parameter name="secrets" type="Sequence[_Secret]" defaultValue="[]" description="Secrets to add for all Functions in the App." />
<Parameter name="volumes" type="dict[str | PurePosixPath, _Volume]" defaultValue="&#123;&#125;" description="Volume mounts to use for all Functions." />
<Parameter name="include_source" type="bool" defaultValue="True" description="Default for whether Function source files are added to the Modal container (per-function override possible)." />

**使用**

```python notest
image = modal.Image.debian_slim().pip_install(...)
secret = modal.Secret.from_name("my-secret")
volume = modal.Volume.from_name("my-data")
app = modal.App(image=image, secrets=[secret], volumes={"/mnt/data": volume})
```

## 姓名

```python
name(self)
```

用户提供的应用程序名称。

**退货**

配置的应用程序名称（如果有）。

## 应用\_id

```python
app_id(self)
```

返回正在运行或已停止的应用程序的 app\_id。

**退货**

应用程序已部署或运行时的应用程序 ID，否则为 None。

## 描述

```python
description(self)
```
应用程序的 `name`（如果可用）或后备描述性标识符。

**退货**

应用程序的人类可读的描述字符串。

## 查找

```python
lookup(name, *, client=None, environment_name=None, create_if_missing=False)
```

查找具有给定名称的应用程序，如有必要，创建一个新应用程序。

请注意，通过此方法创建的应用程序将处于已部署状态，
但它们不会有任何关联的函数或类。这个方法
主要用于创建与沙箱关联的应用程序。

**参数**

<Parameter name="name" type="str" description="App name to resolve or create." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use; defaults to ⟦T37⟧ when omitted." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Optional environment name; defaults to the configured environment." />
<Parameter name="create_if_missing" type="bool" defaultValue="False" description="If True, create the app when it does not already exist." />

**退货**

与已部署的应用程序记录绑定的 `App` 句柄。

**使用**

```python
app = modal.App.lookup("my-app", create_if_missing=True)
modal.Sandbox.create("echo", "hi", app=app)
```

## 获取\_仪表板\_url

```python
get_dashboard_url(self)
```获取应用程序的仪表板 URL。

**退货**

应用程序的仪表板 URL。

**使用**

```python
app = modal.App.lookup("my-app")
print(app.get_dashboard_url())
```

## 运行

```python
run(self, *, name=None, client=None, detach=False, interactive=False,
    environment_name=None)
```

在 Modal 上运行临时应用程序的上下文管理器。

使用它作为模态应用程序的主要入口点。所有通话
模态函数应该在这个上下文的范围内进行
manager，他们会对应当前的App。

请注意，您不应该在您拥有的文件的全局范围内调用它
定义模态函数或类，因为当函数
或 Cls 也会导入到您的容器中。如果您想将其作为入口点运行，
考虑用`if __name__ == "__main__"`保护它。

**参数**

<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for the run session." />
<Parameter name="detach" type="bool" defaultValue="False" description="Whether to detach after starting the app." />
<Parameter name="interactive" type="bool" defaultValue="False" description="Whether to run in interactive mode." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Optional environment name; defaults to the configured environment." />

**退货**

异步上下文管理器在运行时生成此 `App`。

**使用**

```python notest
with app.run():
    some_modal_function.remote()
```

要启用输出打印（即查看应用程序日志），请使用 `modal.enable_output()`：

```python notest
with modal.enable_output():
    with app.run():
        some_modal_function.remote()
```

请注意，您不应在具有 Modal 的文件的全局范围内调用此函数
定义的函数或类，因为当函数或类被定义时会运行该块
也导入到您的容器中。如果您想将其作为入口点运行，
考虑保护它：

```python
if __name__ == "__main__":
    with app.run():
        some_modal_function.remote()
```

然后您可以使用以下命令运行脚本：

```shell
python app_module.py
```

## 部署```python
deploy(self, *, name=None, environment_name=None, tag="", client=None,
    strategy="rolling")
```

部署应用程序，使其持续可用。

已部署的应用程序将可用于查找或基于 Web 的调用，直到它们停止为止。
与`App.run`不同，此方法将在部署完成后立即返回。

此方法是 `modal deploy` CLI 命令的编程替代方法。

与`App.run`不同的是，函数日志在执行后不会流回本地客户端。
应用程序已部署。

请注意，您不应在全局范围内调用此方法，因为这会重新部署
每次导入文件时都会调用该应用程序。如果您想编写程序化部署
script，保护此调用，使其仅在直接执行文件时运行。

**参数**

<Parameter name="name" type="str | None" defaultValue="None" description="Name for the deployment, overriding any set on the App." />
<Parameter name="environment_name" type="str | None" defaultValue="None" description="Environment to deploy the App in." />
<Parameter name="tag" type="str" defaultValue="&quot;&quot;" description="Optional metadata that is specific to this deployment." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Alternate client to use for communication with the server." />
<Parameter name="strategy" type="str" defaultValue="&quot;rolling&quot;" description="Deployment strategy. `⟦T45⟧⟦T46⟧⟦T47⟧` terminates all running containers as part of the deployment before new work starts." />

**退货**

部署完成后的此应用程序实例。

**使用**

```python notest
app = App("my-app")
app.deploy()
```

要启用输出打印（即查看构建日志），请使用 `modal.enable_output()`：

```python notest
app = App("my-app")
with modal.enable_output():
    app.deploy()
```

与`App.run`不同的是，应用程序部署后，函数日志不会流回本地客户端。

请注意，您不应在全局范围内调用此方法，因为这会每次都重新部署应用程序文件已导入。如果您想编写程序化部署脚本，请保护此调用，以便它
仅当直接执行文件时才运行。然后您可以使用以下命令运行脚本：

```python notest
if __name__ == "__main__":
    with modal.enable_output():
        app.deploy()
```

然后您可以使用以下方式部署您的应用程序：

```shell
python app_module.py
```

## 本地\_入口点

```python
local_entrypoint(self, _warn_parentheses_missing=None, *, name=None)
```

装饰一个函数，用作模态应用程序的 CLI 入口点。

这些函数可用于定义在本地运行以设置应用程序的代码，
并充当启动 Modal 函数的入口点。注意定期
模态函数也可以用作 CLI 入口点，但与 `local_entrypoint` 不同，
这些功能直接远程执行。

请注意，不需要显式的 [`app.run()`](https://modal.com/docs/sdk/py/latest/App#run)，因为
[应用程序](https://modal.com/docs/guide/apps) 会自动为您创建。

**参数**

<Parameter name="name" type="str | None" defaultValue="None" description="Optional name for the entrypoint; defaults to the function&#x27;s qualified name." />

**退货**

将包装的可调用对象注册为本地 CLI 入口点的装饰器。

**使用**

```python
@app.local_entrypoint()
def main():
    some_modal_function.remote()
```

您可以直接从 CLI 中使用 `modal run` 调用该函数：

```shell
modal run app_module.py
```

请注意，不需要显式的 `app.run()`，因为应用程序会自动为您创建。

**多个入口点**

如果您有多个 `local_entrypoint` 函数，请限定名称：

```shell
modal run app_module.py::app.some_other_function
```

**解析参数**

如果您的入口函数采用原始类型的参数，则 `modal run` 自动将它们解析为 CLI 选项。例如，可以使用以下函数调用
`modal run app_module.py --foo 1 --bar "hello"`：

```python
@app.local_entrypoint()
def main(foo: int, bar: str):
    some_modal_function.call(foo, bar)
```

目前支持`str`、`int`、`float`、`bool`、`datetime.datetime`。
使用 `modal run app_module.py --help` 了解更多使用信息。

## 函数

```python
function(self, *, image=None, schedule=None, env=None, secrets=None, gpu=None,
    serialized=False, network_file_systems={}, volumes={}, cpu=None,
    memory=None, ephemeral_disk=None, min_containers=None, max_containers=None,
    buffer_containers=None, scaledown_window=None, proxy=None, retries=None,
    timeout=300, startup_timeout=None, name=None, is_generator=None, cloud=None,
    region=None, routing_region=None, nonpreemptible=False,
    enable_memory_snapshot=False, block_network=False,
    restrict_modal_access=False, single_use_containers=False, i6pn=None,
    include_source=None, experimental_options=None,
    _experimental_restrict_output=False, max_inputs=None)
```

装饰器用这个应用程序注册一个新的模态函数。

**参数**

<Parameter name="image" type="_Image | None" defaultValue="None" description="The image to run as the container for the function." />
<Parameter name="schedule" type="Schedule | None" defaultValue="None" description="An optional Modal Schedule for the function." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables to set in the container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets to inject into the container as environment variables." />
<Parameter name="gpu" type="str | list[str] | None" defaultValue="None" description="GPU request; either a single GPU type or a list of types." />
<Parameter name="serialized" type="bool" defaultValue="False" description="Whether to send the function over using cloudpickle." />
<Parameter name="network_file_systems" type="dict[str | PurePosixPath, _NetworkFileSystem]" defaultValue="&#123;&#125;" description="Mountpoints for Modal NetworkFileSystems." />
<Parameter name="volumes" type="dict[str | PurePosixPath, _Volume | _CloudBucketMount]" defaultValue="&#123;&#125;" description="Mount points for Modal Volumes &amp; CloudBucketMounts." />
<Parameter name="cpu" type="float | tuple[float, float] | None" defaultValue="None" description="Specify, in fractional CPU cores, how many CPU cores to request. Or, pass (request, limit) to additionally specify a hard limit in fractional CPU cores. CPU throttling will prevent a container from exceeding its specified limit." />
<Parameter name="memory" type="int | tuple[int, int] | None" defaultValue="None" description="Specify, in MiB, a memory request which is the minimum memory required. Or, pass (request, limit) to additionally specify a hard limit in MiB." />
<Parameter name="ephemeral_disk" type="int | None" defaultValue="None" description="Specify, in MiB, the ephemeral disk size for the Function." />
<Parameter name="min_containers" type="int | None" defaultValue="None" description="Minimum number of containers to keep warm, even when Function is idle." />
<Parameter name="max_containers" type="int | None" defaultValue="None" description="Limit on the number of containers that can be concurrently running." />
<Parameter name="buffer_containers" type="int | None" defaultValue="None" description="Number of additional idle containers to maintain under active load." />
<Parameter name="scaledown_window" type="int | None" defaultValue="None" description="Max time (in seconds) a container can remain idle while scaling down." />
<Parameter name="proxy" type="_Proxy | None" defaultValue="None" description="Reference to a Modal Proxy to use in front of this function." />
<Parameter name="retries" type="int | Retries | None" defaultValue="None" description="Number of times to retry each input in case of failure." />
<Parameter name="timeout" type="int" defaultValue="300" description="Maximum execution time for inputs and startup time in seconds." />
<Parameter name="startup_timeout" type="int | None" defaultValue="None" description="Maximum startup time in seconds with higher precedence than ⟦T63⟧." />
<Parameter name="name" type="str | None" defaultValue="None" description="Sets the Modal name of the function within the app." />
<Parameter name="is_generator" type="None | bool" defaultValue="None" description="Set this to True if it&#x27;s a non-generator function returning a sync or async generator object." />
<Parameter name="cloud" type="str | None" defaultValue="None" description="Cloud provider to run the function on. Possible values are aws, gcp, oci, auto." />
<Parameter name="region" type="str | Sequence[str] | None" defaultValue="None" description="Region or regions to run the function on." />
<Parameter name="routing_region" type="str | None" defaultValue="None" description="Region to route inputs to the function through." />
<Parameter name="nonpreemptible" type="bool" defaultValue="False" description="Whether to run the function on a nonpreemptible instance." />
<Parameter name="enable_memory_snapshot" type="bool" defaultValue="False" description="Enable memory checkpointing for faster cold starts." />
<Parameter name="block_network" type="bool" defaultValue="False" description="Whether to block network access." />
<Parameter name="restrict_modal_access" type="bool" defaultValue="False" description="Whether to allow this function access to other Modal resources." />
<Parameter name="single_use_containers" type="bool" defaultValue="False" description="When True, containers will shut down after handling a single input." />
<Parameter name="i6pn" type="bool | None" defaultValue="None" description="Whether to enable IPv6 container networking within the region." />
<Parameter name="include_source" type="bool | None" defaultValue="None" description="Whether the file or directory containing the Function&#x27;s source should automatically be included in the container. When unset, falls back to the App-level configuration, or is otherwise True by default." />
<Parameter name="experimental_options" type="dict[str, Any] | None" defaultValue="None" description="Experimental options for the function." />
<Parameter name="_experimental_restrict_output" type="bool" defaultValue="False" description="Experimental; do not use pickle for return values." />
<Parameter name="max_inputs" type="int | None" defaultValue="None" description="Deprecated; replaced with ⟦T64⟧." />

**退货**

一个装饰器，将包装的可调用或部分注册为 Modal `Function`。

## cls

```python
cls(self, *, image=None, env=None, secrets=None, gpu=None, serialized=False,
    network_file_systems={}, volumes={}, cpu=None, memory=None,
    ephemeral_disk=None, min_containers=None, max_containers=None,
    buffer_containers=None, scaledown_window=None, proxy=None, retries=None,
    timeout=300, startup_timeout=None, cloud=None, region=None,
    routing_region=None, nonpreemptible=False, enable_memory_snapshot=False,
    block_network=False, restrict_modal_access=False,
    single_use_containers=False, i6pn=None, include_source=None,
    experimental_options=None, _experimental_restrict_output=False,
    max_inputs=None)
```
装饰器用这个应用程序注册一个新的模态[Cls](https://modal.com/docs/sdk/py/latest/Cls)。

**参数**

<Parameter name="image" type="_Image | None" defaultValue="None" description="The image to run as the container for the class service." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables to set in the container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets to inject into the container as environment variables." />
<Parameter name="gpu" type="str | list[str] | None" defaultValue="None" description="GPU request; either a single GPU type or a list of types." />
<Parameter name="serialized" type="bool" defaultValue="False" description="Whether to send the class over using cloudpickle." />
<Parameter name="network_file_systems" type="dict[str | PurePosixPath, _NetworkFileSystem]" defaultValue="&#123;&#125;" description="Mountpoints for Modal NetworkFileSystems." />
<Parameter name="volumes" type="dict[str | PurePosixPath, _Volume | _CloudBucketMount]" defaultValue="&#123;&#125;" description="Mount points for Modal Volumes &amp; CloudBucketMounts." />
<Parameter name="cpu" type="float | tuple[float, float] | None" defaultValue="None" description="Specify, in fractional CPU cores, how many CPU cores to request. Or, pass (request, limit) to additionally specify a hard limit in fractional CPU cores. CPU throttling will prevent a container from exceeding its specified limit." />
<Parameter name="memory" type="int | tuple[int, int] | None" defaultValue="None" description="Specify, in MiB, a memory request which is the minimum memory required. Or, pass (request, limit) to additionally specify a hard limit in MiB." />
<Parameter name="ephemeral_disk" type="int | None" defaultValue="None" description="Specify, in MiB, the ephemeral disk size for the Function." />
<Parameter name="min_containers" type="int | None" defaultValue="None" description="Minimum number of containers to keep warm, even when Function is idle." />
<Parameter name="max_containers" type="int | None" defaultValue="None" description="Limit on the number of containers that can be concurrently running." />
<Parameter name="buffer_containers" type="int | None" defaultValue="None" description="Number of additional idle containers to maintain under active load." />
<Parameter name="scaledown_window" type="int | None" defaultValue="None" description="Max time (in seconds) a container can remain idle while scaling down." />
<Parameter name="proxy" type="_Proxy | None" defaultValue="None" description="Reference to a Modal Proxy to use in front of this function." />
<Parameter name="retries" type="int | Retries | None" defaultValue="None" description="Number of times to retry each input in case of failure." />
<Parameter name="timeout" type="int" defaultValue="300" description="Maximum execution time for inputs and startup time in seconds." />
<Parameter name="startup_timeout" type="int | None" defaultValue="None" description="Maximum startup time in seconds with higher precedence than ⟦T66⟧." />
<Parameter name="cloud" type="str | None" defaultValue="None" description="Cloud provider to run the function on. Possible values are aws, gcp, oci, auto." />
<Parameter name="region" type="str | Sequence[str] | None" defaultValue="None" description="Region or regions to run the function on." />
<Parameter name="routing_region" type="str | None" defaultValue="None" description="Region to route inputs to the function through." />
<Parameter name="nonpreemptible" type="bool" defaultValue="False" description="Whether to run the function on a non-preemptible instance." />
<Parameter name="enable_memory_snapshot" type="bool" defaultValue="False" description="Enable memory checkpointing for faster cold starts." />
<Parameter name="block_network" type="bool" defaultValue="False" description="Whether to block network access." />
<Parameter name="restrict_modal_access" type="bool" defaultValue="False" description="Whether to allow this class access to other Modal resources." />
<Parameter name="single_use_containers" type="bool" defaultValue="False" description="When True, containers will shut down after handling a single input." />
<Parameter name="i6pn" type="bool | None" defaultValue="None" description="Whether to enable IPv6 container networking within the region." />
<Parameter name="include_source" type="bool | None" defaultValue="None" description="When `⟦T67⟧`, don&#x27;t automatically add the App source to the container." />
<Parameter name="experimental_options" type="dict[str, Any] | None" defaultValue="None" description="Experimental options for the class service." />
<Parameter name="_experimental_restrict_output" type="bool" defaultValue="False" description="Experimental; do not use pickle for return values." />
<Parameter name="max_inputs" type="int | None" defaultValue="None" description="Deprecated; replaced with ⟦T68⟧." />

**退货**

将包装类或部分注册为 Modal `Cls` 的装饰器。

## 服务器

```python
server(self, *, image=None, env=None, secrets=None, gpu=None, serialized=False,
    volumes={}, cpu=None, memory=None, ephemeral_disk=None,
    target_concurrency=None, min_containers=None, max_containers=None,
    buffer_containers=None, scaleup_window=None, scaledown_window=None,
    startup_timeout=30, name=None, port=8000, unauthenticated=False,
    h2_enabled=False, exit_grace_period=0, routing_region="us-east",
    compute_region=None, cloud=None, nonpreemptible=False, proxy=None,
    i6pn=None, enable_memory_snapshot=False, include_source=None,
    experimental_options=None)
```

装饰器用这个应用程序注册一个新的模态服务器。

服务器运行以 `@modal.enter()` 方法启动的 HTTP 服务器。与 `@app.cls()` 不同，服务器仅公开 HTTP 端点，而不公开
支持`.remote()`方法调用。

更多信息请参阅[指南](https://modal.com/docs/guide/servers)。

**参数**

<Parameter name="image" type="_Image | None" defaultValue="None" description="The image to run as the container for the server." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables to set in the container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets to inject into the container as environment variables." />
<Parameter name="gpu" type="str | list[str] | None" defaultValue="None" description="GPU request; either a single GPU type or a list of types." />
<Parameter name="serialized" type="bool" defaultValue="False" description="Whether to send the server class over using cloudpickle." />
<参数名称=“卷”类型=“字典[
        STR | PurePosixPath，_Volume | _CloudBucketMount
    ]" defaultValue="{}" description="模态卷和 CloudBucketMount 的挂载点。" />
<Parameter name="cpu" type="float | tuple[float, float] | None" defaultValue="None" description="Specify, in fractional CPU cores, how many CPU cores to request. Or, pass (request, limit) to additionally specify a hard limit in fractional CPU cores. CPU throttling will prevent a container from exceeding its specified limit." />
<Parameter name="memory" type="int | tuple[int, int] | None" defaultValue="None" description="Specify, in MiB, a memory request which is the minimum memory required. Or, pass (request, limit) to additionally specify a hard limit in MiB." />
<Parameter name="ephemeral_disk" type="int | None" defaultValue="None" description="Specify, in MiB, the ephemeral disk size for the server." />
<Parameter name="target_concurrency" type="int | None" defaultValue="None" description="Target concurrency for the server; 0 disables autoscaling." />
<Parameter name="min_containers" type="int | None" defaultValue="None" description="Minimum number of containers to keep running regardless of demand." />
<Parameter name="max_containers" type="int | None" defaultValue="None" description="Limit on the number of containers that can be concurrently running." />
<Parameter name="buffer_containers" type="int | None" defaultValue="None" description="Extra containers to scale up beyond current demand." />
<Parameter name="scaleup_window" type="int | None" defaultValue="None" description="Seconds of sustained demand required before scaling up new containers." />
<Parameter name="scaledown_window" type="int | None" defaultValue="None" description="Maximum duration (in seconds) idle containers wait before scaling down." />
<Parameter name="startup_timeout" type="int" defaultValue="30" description="Maximum container startup time in seconds." />
<Parameter name="name" type="str | None" defaultValue="None" description="Sets the Modal name of the function within the app, defaults to class name." />
<Parameter name="port" type="int" defaultValue="8000" description="Port the HTTP server listens on." />
<Parameter name="unauthenticated" type="bool" defaultValue="False" description="Whether the endpoint requires proxy authentication; required by default." />
<Parameter name="h2_enabled" type="bool" defaultValue="False" description="Enable HTTP/2." />
<Parameter name="exit_grace_period" type="int" defaultValue="0" description="Grace period for in-flight requests on shutdown." />
<Parameter name="routing_region" type="str" defaultValue="&quot;us-east&quot;" description="Region to route Server requests through." />
<Parameter name="compute_region" type="str | Sequence[str] | None" defaultValue="None" description="Region(s) where containers can be scheduled." />
<Parameter name="cloud" type="str | None" defaultValue="None" description="Cloud provider (aws, gcp, oci, auto)." />
<Parameter name="nonpreemptible" type="bool" defaultValue="False" description="Whether to use non-preemptible instances." />
<Parameter name="proxy" type="_Proxy | None" defaultValue="None" description="Modal Proxy to use in front of this server." />
<Parameter name="i6pn" type="bool | None" defaultValue="None" description="Enable IPv6 container networking." />
<Parameter name="enable_memory_snapshot" type="bool" defaultValue="False" description="Enable memory checkpointing." />
<Parameter name="include_source" type="bool | None" defaultValue="None" description="Whether to add source to container." />
<Parameter name="experimental_options" type="dict[str, Any] | None" defaultValue="None" description="Experimental options." />

**使用**

```python
@app.server(port=8000, routing_region="us-east")
class MyServer:
    @modal.enter()
    def start(self):
        self.proc = subprocess.Popen(["python3", "-m", "http.server", "8000"])

    @modal.exit()
    def stop(self):
        self.proc.terminate()
```

## 包括

```python
include(self, /, other_app, inherit_tags=True)
```

将另一个应用程序的对象包含在这个应用程序中。
对于将模态应用程序拆分到不同的独立文件中非常有用。

当`inherit_tags=True`时，其他App上设置的任何标签都会被本App继承
（如果发生冲突，此应用程序的标签优先）。

**参数**

<Parameter name="other_app" type="&quot;_App&quot;" description="App whose registered functions and classes are merged into this app." />
<Parameter name="inherit_tags" type="bool" defaultValue="True" description="If True, merge tags from ⟦T74⟧ into this app (this app wins on conflicts)." />

**退货**

此应用程序实例用于链接。

**使用**

```python
app_a = modal.App("a")
@app_a.function()
def foo():
    ...

app_b = modal.App("b")
@app_b.function()
def bar():
    ...

app_a.include(app_b)

@app_a.local_entrypoint()
def main():
    # use function declared on the included app
    bar.remote()
```

## 设置\_标签

```python
set_tags(self, tags, *, client=None)
```

将键值元数据附加到应用程序。

标签元数据可用于向应用程序添加特定于组织的上下文，并且可以
包含在计费报告和其他信息 API 中。标签也可以设置在
应用程序构造函数。

如果在调用此方法之前在应用程序上设置的任何标签都将被删除
包含在参数中（即，该方法没有 `.update()` 语义）。

**参数**

<Parameter name="tags" type="Mapping[str, str]" description="Complete tag set to store on the app (replaces previous tags)." />
<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for the RPC." />

## 获取\_标签

```python
get_tags(self, *, client=None)
```

获取当前附加到应用程序的标签。

**参数**

<Parameter name="client" type="_Client | None" defaultValue="None" description="Modal client to use for the RPC." />

**退货**

标签作为从键到值的映射。