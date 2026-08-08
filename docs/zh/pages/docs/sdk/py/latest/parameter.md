<!-- modal-docs: machine-translated zh-CN from English source -->

# 参数

```python
parameter(*, default=_no_default, init=True)
```

用于指定 modal.cls 参数的选项，类似于数据类的 dataclass.field

```
class A:
    a: str = modal.parameter()

```

如果指定了`init=False`，则该字段不被视为参数
模态类并且未在合成构造函数中使用。这可以用来
可选择注释内部使用的字段的类型，例如值
由 @enter 生命周期方法设置，不会破坏类型检查器，但它有
对类没有运行时影响。