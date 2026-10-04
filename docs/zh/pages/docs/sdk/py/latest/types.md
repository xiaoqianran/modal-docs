<!-- modal-docs: machine-translated zh-CN from English source -->

# 类型

Modal API 返回的公共数据类型。

## 应用程序信息

有关模态应用程序的信息，包括其生命周期以及成员函数和服务器。

**属性**

<Parameter name="app_id" type="str" description="" />
<Parameter name="description" type="str" description="" />
<Parameter name="lifecycle" type="AppLifecycle" description="" />
<Parameter name="functions" type="dict[str, str]" description="" />
<Parameter name="servers" type="dict[str, str]" description="" />

## 应用程序生命周期

应用程序生命周期中事件的时间戳和归因。

当时间戳或属性不适用于此应用程序时，它们可能为“无”
（例如，应用程序未部署，应用程序未明确停止）。

**属性**

<Parameter name="state" type="AppState" description="" />
<Parameter name="version" type="int | None" description="" />
<Parameter name="created_at" type="datetime" description="" />
<Parameter name="created_by" type="str" description="" />
<Parameter name="deployed_at" type="datetime | None" description="" />
<Parameter name="deployed_by" type="str | None" description="" />
<Parameter name="stopped_at" type="datetime | None" description="" />
<Parameter name="stopped_by" type="str | None" description="" />

## 应用程序状态

```python
class AppState(str, enum.Enum)
```

一个枚举。

可能的值为：

* `EPHEMERAL`
* `DETACHED`
* `DEPLOYED`
* `STOPPING`
* `STOPPED`
* `INITIALIZING`
* `DISABLED`## 账单报告项目

特定对象在特定时间间隔内生成的成本。

**属性**

<Parameter name="object_id" type="str" description="" />
<Parameter name="description" type="str" description="" />
<Parameter name="environment_name" type="str" description="" />
<Parameter name="interval_start" type="datetime" description="" />
<Parameter name="cost" type="Decimal" description="" />
<Parameter name="cost_by_resource" type="dict[str, Decimal]" description="" />
<Parameter name="tags" type="dict[str, str]" description="" />

## CloudBucketMountInfo

**属性**

<Parameter name="bucket_name" type="str" description="" />
<Parameter name="bucket_type" type="Literal[&quot;s3&quot;, &quot;r2&quot;, &quot;gcp&quot;]" description="" />
<Parameter name="read_only" type="bool" description="" />
<Parameter name="key_prefix" type="str | None" description="" />

## 词典信息

有关 Dict 对象的信息。

**属性**

<Parameter name="name" type="str | None" description="" />
<Parameter name="created_at" type="datetime" description="" />
<Parameter name="created_by" type="str | None" description="" />

## 环境计费摘要

**属性**

<Parameter name="start" type="datetime" description="" />
<Parameter name="end" type="datetime" description="" />
<Parameter name="metered_cost" type="Decimal" description="" />
<Parameter name="metered_cost_breakdown" type="dict[str, Decimal]" description="" />

## 文件入口

模态卷中列出的文件或目录条目。

**属性**

<Parameter name="path" type="str" description="" />
<Parameter name="type" type="FileEntryType" description="" />
<Parameter name="mtime" type="int" description="" />
<Parameter name="size" type="int" description="" />

## 文件条目类型

```python
class FileEntryType(enum.IntEnum)
```

模态卷中列出的文件条目的类型。

可能的值为：

* `UNSPECIFIED`
* `FILE`
* `DIRECTORY`
* `SYMLINK`
* `FIFO`
* `SOCKET`

## 文件信息

沙箱中文件或目录条目的元数据。

**属性**

<Parameter name="name" type="str" description="" />
<Parameter name="path" type="str" description="" />
<Parameter name="type" type="FileType" description="" />
<Parameter name="size" type="int" description="" />
<Parameter name="mode" type="int" description="" />
<Parameter name="permissions" type="str" description="" />
<Parameter name="owner" type="str" description="" />
<Parameter name="group" type="str" description="" />
<Parameter name="modified_time" type="float" description="" />
<Parameter name="symlink_target" type="str | None" description="" />

### 是\_file

```python
is_file(self)
```

如果此条目是常规文件，则返回`True`。

### 是\_dir

```python
is_dir(self)
```

如果此条目是目录，则返回`True`。

### 是\_符号链接

```python
is_symlink(self)
```

如果此条目是符号链接，则返回 `True`。

## 文件类型

```python
class FileType(enum.Enum)
```

文件系统条目的类型。

可能的值为：

* `FILE`
* `DIRECTORY`
* `SYMLINK`

## 文件监视事件

`Sandbox.filesystem.watch()` 报告的文件系统更改事件。`paths` 包含受事件影响的绝对路径。对于大多数人来说
它保存单个条目的事件类型。重命名操作报告为
`Modify` 事件：当源和目的地都落在
观察范围，`paths` 持有 `[source, destination]`；当只有一个时
重命名的一侧可见，`paths` 保存该单个路径。

**属性**

<Parameter name="paths" type="list[str]" description="" />
<Parameter name="type" type="FileWatchEventType" description="" />

## 文件监视事件类型

```python
class FileWatchEventType(enum.Enum)
```

`Sandbox.filesystem.watch()`报告的文件系统监视事件的类型。

可能的值为：

* `Unknown`
* `Access`
* `Create`
* `Modify`
* `Remove`

## 函数自动缩放器设置

**属性**

<Parameter name="min_containers" type="int | None" description="" />
<Parameter name="max_containers" type="int | None" description="" />
<Parameter name="scaledown_window" type="int | None" description="" />
<Parameter name="buffer_containers" type="int | None" description="" />

## 函数当前统计

存储正在运行的函数的统计数据的简单数据结构。
**属性**

<Parameter name="backlog" type="int" description="" />
<Parameter name="num_total_runners" type="int" description="" />
<Parameter name="num_running_inputs" type="int" description="" />
<Parameter name="input_headroom" type="int" description="" />

## 函数信息

包含有关函数句柄的静态信息的简单数据结构。

**属性**

<Parameter name="cpu" type="float | tuple[float, float] | None" description="" />
<Parameter name="memory_mib" type="int | tuple[int, int] | None" description="" />
<Parameter name="gpus" type="list[tuple[str, int]]" description="" />
<Parameter name="ephemeral_disk_mib" type="int | None" description="" />
<Parameter name="image_info" type="ImageInfo" description="">

<Parameter name="image_name" type="str | None" description="" />
<Parameter name="image_id" type="str | None" description="" />

</Parameter>
<Parameter name="startup_timeout" type="int | None" description="" />
<Parameter name="timeout" type="int" description="" />
<Parameter name="max_retries" type="int | None" description="" />
<Parameter name="nonpreemptible" type="bool" description="" />
<Parameter name="regions" type="list[str] | None" description="" />
<Parameter name="routing_region" type="str | None" description="" />
<Parameter name="cloud" type="str | None" description="" />
<Parameter name="cluster_info" type="ClusterInfo | None" description="">

<Parameter name="size" type="int" description="" />
<Parameter name="rdma" type="bool" description="" />
<Parameter name="fabric_size" type="int | None" description="" />

</Parameter>
<Parameter name="batching_info" type="BatchingInfo | None" description="">

<Parameter name="max_batch_size" type="int" description="" />
<Parameter name="wait_ms" type="int" description="" />

</Parameter>
<Parameter name="concurrency_info" type="ConcurrencyInfo | None" description="">

<Parameter name="max_inputs" type="int | None" description="" />
<Parameter name="target_inputs" type="int | None" description="" />

</Parameter>
<Parameter name="schedule" type="str | None" description="" />
<Parameter name="restrict_modal_access" type="bool" description="" />
<Parameter name="block_network" type="bool" description="" />
<Parameter name="single_use_containers" type="bool" description="" />
<Parameter name="volumes" type="dict[str, VolumeMountInfo]" description="" />
<Parameter name="cloud_bucket_mounts" type="dict[str, CloudBucketMountInfo]" description="" />
<Parameter name="secrets" type="list[str]" description="" />
<Parameter name="web_info" type="WebInfo | None" description="">

<Parameter name="web_url" type="str" description="" />
<Parameter name="method" type="str | None" description="" />
<Parameter name="unauthenticated" type="bool" description="" />

</Parameter>
<Parameter name="method_names" type="list[str] | None" description="" />
<Parameter name="method_details" type="dict[str, WebInfo] | None" description="">

<Parameter name="web_url" type="str" description="" />
<Parameter name="method" type="str | None" description="" />
<Parameter name="unauthenticated" type="bool" description="" />

</Parameter>

## 函数统计

某个时间范围内的历史函数统计数据。

**属性**<Parameter name="since" type="datetime" description="" />
<Parameter name="until" type="datetime" description="" />
<Parameter name="input_success_count" type="int" description="" />
<Parameter name="input_failure_count" type="int" description="" />
<Parameter name="input_timeout_count" type="int" description="" />
<Parameter name="input_running_at_end_count" type="int" description="" />
<Parameter name="input_percentile_stats" type="dict[str, StatsPercentileDistribution]" description="" />
<Parameter name="container_started_count" type="int" description="" />
<Parameter name="container_error_count" type="int" description="" />
<Parameter name="container_creating_at_end_count" type="int" description="" />
<Parameter name="container_percentile_stats" type="dict[str, StatsPercentileDistribution]" description="" />
<Parameter name="container_total_count" type="int" description="" />
<Parameter name="variant_count" type="int" description="" />
<Parameter name="all_variants" type="bool" description="" />

## 输入信息

存储有关函数输入的信息的简单数据结构。

**属性**

<Parameter name="input_id" type="str" description="" />
<Parameter name="function_call_id" type="str" description="" />
<Parameter name="task_id" type="str" description="" />
<Parameter name="status" type="InputStatus" description="" />
<Parameter name="function_name" type="str" description="" />
<Parameter name="module_name" type="str" description="" />
<Parameter name="children" type="list[&quot;InputInfo&quot;]" description="" />

## 输入状态

```python
class InputStatus(enum.IntEnum)
```

表示函数输入状态的枚举。

可能的值为：

* `PENDING`
* `SUCCESS`
* `FAILURE`
* `INIT_FAILURE`
* `TERMINATED`
* `TIMEOUT`

## 日志条目

通过 Modal 对象或 App 查询的日志条目。

object\_id 字段标识其日志管理器生成该条目的对象或应用程序。 context\_ids 字段
包含与发出日志条目的上下文相对应的逐渐缩小的 ID。例如，
对于函数日志条目，这将包含函数调用 ID、输入 ID 和容器 ID。

**属性**

<Parameter name="message" type="str" description="" />
<Parameter name="timestamp" type="datetime" description="" />
<Parameter name="source" type="LogSource" description="" />
<Parameter name="object_id" type="str" description="" />
<Parameter name="context_ids" type="list[str]" description="" />

## 代理令牌信息

有关代理令牌的元数据，不包括令牌秘密。

**属性**

<Parameter name="token_id" type="str" description="" />
<Parameter name="created_at" type="datetime" description="" />
<Parameter name="scoped" type="bool" description="" />
<Parameter name="name" type="str" defaultValue="&#x27;&#x27;" description="" />
<Parameter name="created_by" type="str" defaultValue="&#x27;&#x27;" description="" />

## 队列信息

有关队列对象的信息。

**属性**

<Parameter name="name" type="str | None" description="" />
<Parameter name="created_at" type="datetime" description="" />
<Parameter name="created_by" type="str | None" description="" />

## SandboxConnectCredentials存储用于与沙箱建立 HTTP 连接的凭据的简单数据结构。

**属性**

<Parameter name="url" type="str" description="" />
<Parameter name="token" type="str" description="" />

## 秘密信息

有关 Secret 对象的信息。

**属性**

<Parameter name="name" type="str | None" description="" />
<Parameter name="environment_name" type="str" description="" />
<Parameter name="created_at" type="datetime" description="" />
<Parameter name="created_by" type="str | None" description="" />

## 服务器自动缩放器设置

**属性**

<Parameter name="target_concurrency" type="int | float | None" description="" />
<Parameter name="min_containers" type="int | None" description="" />
<Parameter name="max_containers" type="int | None" description="" />
<Parameter name="buffer_containers" type="int | None" description="" />
<Parameter name="scaleup_window" type="int | None" description="" />
<Parameter name="scaledown_window" type="int | None" description="" />

## 服务器容器信息

有关服务服务器请求的容器的信息。

**属性**

<Parameter name="container_id" type="str" description="" />
<Parameter name="host" type="str" description="" />
<Parameter name="port" type="int" description="" />

## 服务器信息

包含有关服务器句柄的静态信息的简单数据结构。

**属性**

<Parameter name="server_url" type="str" description="" />
<Parameter name="port" type="int" description="" />
<Parameter name="unauthenticated" type="bool" description="" />
<Parameter name="h2_enabled" type="bool" description="" />
<Parameter name="routing_region" type="str | None" description="" />
<Parameter name="sessioned" type="bool" description="" />
<Parameter name="startup_timeout" type="int" description="" />
<Parameter name="exit_grace_period" type="int" description="" />
<Parameter name="image_info" type="ImageInfo" description="">

<Parameter name="image_name" type="str | None" description="" />
<Parameter name="image_id" type="str | None" description="" />

</Parameter>
<Parameter name="cpu" type="float | tuple[float, float] | None" description="" />
<Parameter name="memory_mib" type="int | tuple[int, int] | None" description="" />
<Parameter name="gpus" type="list[tuple[str, int]]" description="" />
<Parameter name="ephemeral_disk_mib" type="int | None" description="" />
<Parameter name="nonpreemptible" type="bool" description="" />
<Parameter name="compute_regions" type="list[str] | None" description="" />
<Parameter name="cloud" type="str | None" description="" />
<Parameter name="cluster_info" type="ClusterInfo | None" description="">

<Parameter name="size" type="int" description="" />
<Parameter name="rdma" type="bool" description="" />
<Parameter name="fabric_size" type="int | None" description="" />

</Parameter>
<Parameter name="volumes" type="dict[str, VolumeMountInfo]" description="" />
<Parameter name="cloud_bucket_mounts" type="dict[str, CloudBucketMountInfo]" description="" />
<Parameter name="secrets" type="list[str]" description="" />

## 服务器会话凭证

服务器上粘性会话的凭据。

携带`token`的请求将被路由到同一个容器。

**属性**

<Parameter name="session_id" type="str" description="" />
<Parameter name="token" type="str" description="" />

## 服务器统计

某个时间范围内的历史服务器统计信息。

**属性**

<Parameter name="since" type="datetime" description="" />
<Parameter name="until" type="datetime" description="" />
<Parameter name="request_count" type="int" description="" />
<Parameter name="request_count_by_status_code" type="dict[int, int]" description="" />
<Parameter name="request_rate_per_second" type="float" description="" />
<Parameter name="request_percentile_stats" type="dict[str, StatsPercentileDistribution]" description="" />
<Parameter name="container_started_count" type="int" description="" />
<Parameter name="container_error_count" type="int" description="" />
<Parameter name="container_creating_at_end_count" type="int" description="" />
<Parameter name="container_total_count" type="int" description="" />
<Parameter name="container_percentile_stats" type="dict[str, StatsPercentileDistribution]" description="" />
<Parameter name="inference" type="InferenceStats | None" description="">

服务器的推理引擎统计信息。

<Parameter name="engine" type="str" description="" />
<Parameter name="status" type="str" description="" />
<Parameter name="percentile_stats" type="dict[str, StatsPercentileDistribution]" description="" />
<Parameter name="scalar_stats" type="dict[str, float]" description="" />

</Parameter>

## 统计百分比

指标或策略的百分位数测量。

**属性**

<Parameter name="percentile" type="float" description="" />
<Parameter name="value" type="float" description="" />

## 统计百分比分布**属性**

<Parameter name="unit" type="str" description="" />
<Parameter name="percentiles" type="list[StatsPercentile]" description="" />

## 代币数据

令牌 ID/秘密对。

**属性**

<Parameter name="token_id" type="str" description="" />
<Parameter name="token_secret" type="str" description="" />

## 卷创建选项

创建卷时使用的选项。

**属性**

<Parameter name="experimental_options" type="NotRequired[dict[str, Any]]" description="" />

## 卷信息

有关 Volume 对象的信息。

**属性**

<Parameter name="name" type="str | None" description="" />
<Parameter name="created_at" type="datetime" description="" />
<Parameter name="created_by" type="str | None" description="" />

## 卷安装信息

**属性**

<Parameter name="name" type="str | None" description="" />
<Parameter name="volume_id" type="str | None" description="" />
<Parameter name="read_only" type="bool" description="" />
<Parameter name="sub_path" type="str | None" description="" />

## 工作区账单摘要

**属性**

<Parameter name="start" type="datetime" description="" />
<Parameter name="end" type="datetime" description="" />
<Parameter name="metered_cost" type="Decimal" description="" />
<Parameter name="metered_cost_breakdown" type="dict[str, Decimal]" description="" />
<Parameter name="adjustments" type="dict[str, Decimal]" description="" />
<Parameter name="billed_cost" type="Decimal" description="" />

## 工作区成员信息

有关工作区成员的元数据。

**属性**

<Parameter name="name" type="str" description="" />
<Parameter name="email" type="str" description="" />
<Parameter name="user_id" type="str" description="" />
<Parameter name="role" type="str" description="" />
<Parameter name="joined_at" type="datetime" description="" />
<Parameter name="last_active_at" type="Optional[datetime]" description="" />

## 工作区设置

工作区的当前设置。
**属性**

<Parameter name="default_environment" type="str" description="" />
<Parameter name="image_builder_version" type="str" description="" />