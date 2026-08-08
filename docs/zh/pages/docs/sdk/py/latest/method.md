<!-- modal-docs: machine-translated zh-CN from English source -->

# 方法

```python
method(*, is_generator=None)
```

应转换为针对此类的 App 注册的模态函数的方法的装饰器。

**使用**

```python
@app.cls(cpu=8)
class MyCls:

    @modal.method()
    def f(self):
        ...
```