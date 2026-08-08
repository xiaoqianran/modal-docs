<!-- modal-docs: machine-translated zh-CN from English source -->

# 当前\_输入\_id

```python
current_input_id()
```

返回当前输入的输入 ID。

只能从 Modal 函数调用（即在容器上下文中）。

```python
from modal import current_input_id

@app.function()
def process_stuff():
    print(f"Starting to process {current_input_id()}")
```