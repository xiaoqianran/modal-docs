<!-- modal-docs: machine-translated zh-CN from English source -->

# 批量

```python
batched(*, max_batch_size, wait_ms)
```

应该批处理的函数或类方法的装饰器。

有关更多信息，请参阅[动态批处理指南](https://modal.com/docs/guide/dynamic-batching)。

**使用**

```python
# Stack the decorator under `@app.function()` to enable dynamic batching
@app.function()
@modal.batched(max_batch_size=4, wait_ms=1000)
async def batched_multiply(xs: list[int], ys: list[int]) -> list[int]:
    return [x * y for x, y in zip(xs, ys)]

# call batched_multiply with individual inputs
# batched_multiply.remote.aio(2, 100)

# With `@app.cls()`, apply the decorator to a method (this may change in the future)
@app.cls()
class BatchedClass:
    @modal.batched(max_batch_size=4, wait_ms=1000)
    def batched_multiply(self, xs: list[int], ys: list[int]) -> list[int]:
        return [x * y for x, y in zip(xs, ys)]
```