<!-- modal-docs: machine-translated zh-CN from English source -->

# 当前\_function\_call\_id

```python
current_function_call_id()
```

返回当前输入的函数调用 ID。

只能从 Modal 函数调用（即在容器上下文中）。

```python
from modal import current_function_call_id

@app.function()
def process_stuff():
    print(f"Starting to process input from {current_function_call_id()}")
```