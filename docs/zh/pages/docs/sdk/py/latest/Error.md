<!-- modal-docs: machine-translated zh-CN from English source -->

# 错误

```python
class Error(Exception)
```

所有模态错误的基类。参见[`modal.exception`](https://modal.com/docs/sdk/py/latest/exception)
对于专门的错误类。

**使用**

```python notest
import modal

try:
    ...
except modal.Error:
    # Catch any exception raised by Modal's systems.
    print("Responding to error...")
```