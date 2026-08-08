<!-- modal-docs: machine-translated zh-CN from English source -->

# 启用\_输出

```python
enable_output()
```

使用 Python SDK 时启用输出的上下文管理器。

这将打印到 stdout 和 stderr 诸如

1. 运行函数的日志
2. 创建对象状态
3. 地图进度

**使用**

```python
app = modal.App()
with modal.enable_output():
    with app.run():
        ...
```