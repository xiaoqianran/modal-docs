<!-- modal-docs: machine-translated zh-CN from English source -->

# 计费

## 工作区账单报告项目

**属性**

<Parameter name="object_id" type="str" description="" />
<Parameter name="description" type="str" description="" />
<Parameter name="environment_name" type="str" description="" />
<Parameter name="interval_start" type="datetime" description="" />
<Parameter name="cost" type="Decimal" description="" />
<Parameter name="tags" type="dict[str, str]" description="" />

## 工作区\_billing\_report

```python
workspace_billing_report(*, start, end=None, resolution="d", tag_names=None,
    client=None)
```

按对象和时间生成工作区使用情况的表格报告。

结果将是每个间隔的字典列表（由 `resolution` 确定）
介于 `start` 和 `end` 限制之间。字典代表单个 Modal 对象
该计费可以归因于（例如，应用程序）以及元数据（包括用户定义的
标签）用于识别该对象。该词典还包含成本值的详细信息归因于各个资源（对于应用程序，这可以是 CPU、内存、特定 GPU 类型、
等）。细目中包含的具体资源类型可能会发生变化，如下所示：
Modal 的计费模式不断发展。

`start` 和 `end` 参数需要具有 UTC 时区或者是
timezone-naive（将被解释为 UTC 时间）。结果中的时间戳将
采用 UTC 时间。即使提供了 `start` 或 `end`，也将报告整个时间间隔的成本
参数是部分的：`start`将四舍五入到其间隔的开头，而
部分`end`间隔将被排除。
如果对象具有标签，则可以在报告中包含其他用户提供的元数据
和`tag_names`（即密钥）在请求中指定。或者，通过`tag_names=["*"]`
将所有标签包含在报告中。请注意，标签将归因于整个间隔，甚至
如果它们在其中的某个时刻被添加或删除。如果标签名称在一段时间内没有被使用
间隔，它将不存在于该输出行的标签字典中。

还可以使用以下方法生成报告
[`modal billing report`](https://modal.com/docs/cli/latest/billing) CLI 命令。命令行界面
有一些方便的功能可以生成跨相对时间范围的报告。