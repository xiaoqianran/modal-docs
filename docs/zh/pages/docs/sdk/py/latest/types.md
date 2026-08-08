<!-- modal-docs: machine-translated zh-CN from English source -->

# 类型

Modal API 返回的公共数据类型。

## 账单报告项目

特定对象在特定时间间隔内生成的成本。

**属性**

<Parameter name="object_id" type="str" description="" />
<Parameter name="description" type="str" description="" />
<Parameter name="environment_name" type="str" description="" />
<Parameter name="interval_start" type="datetime" description="" />
<Parameter name="cost" type="Decimal" description="" />
<Parameter name="cost_by_resource" type="dict[str, Decimal]" description="" />
<Parameter name="tags" type="dict[str, str]" description="" />

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
* `DIRECTORY`* `SYMLINK`
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

如果此条目是符号链接，则返回`True`。

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

`Sandbox.filesystem.watch()` 报告的文件系统更改事件。

`paths` 包含受事件影响的绝对路径。对于大多数人来说
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

## 函数统计

存储正在运行的函数的统计数据的简单数据结构。

**属性**

<Parameter name="backlog" type="int" description="" />
<Parameter name="num_total_runners" type="int" description="" />
<Parameter name="num_running_inputs" type="int" description="" />
<Parameter name="input_headroom" type="int" description="" />

## 输入信息存储有关函数输入的信息的简单数据结构。

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

Modal 对象发出的日志条目。

context\_ids 字段包含与发出日志条目的上下文相对应的 ID 列表。
例如，对于函数日志条目，它将包含函数调用 ID、输入 ID 和容器 ID。

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

## 队列信息

有关队列对象的信息。

**属性**

<Parameter name="name" type="str | None" description="" />
<Parameter name="created_at" type="datetime" description="" />
<Parameter name="created_by" type="str | None" description="" />

## SandboxConnectCredentials

存储用于与沙箱建立 HTTP 连接的凭据的简单数据结构。

**属性**

<Parameter name="url" type="str" description="" />
<Parameter name="token" type="str" description="" />

## 秘密信息

有关 Secret 对象的信息。

**属性**

<Parameter name="name" type="str | None" description="" />
<Parameter name="created_at" type="datetime" description="" />
<Parameter name="created_by" type="str | None" description="" />

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