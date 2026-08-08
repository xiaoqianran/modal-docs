<!-- modal-docs: machine-translated zh-CN from English source -->

# 并发

```python
concurrent(*, max_inputs=None, target_inputs=None)
```

允许单个容器同时处理多个输入的装饰器。

并发机制取决于函数是否异步：

* 异步函数将在单个线程上作为异步任务运行输入。
* 同步函数将使用多线程。代码必须是线程安全的。

输入并发对于 IO 绑定的工作流程最有用
（例如，发出网络请求）或运行支持的推理服务器时
动态批处理。

当设置`target_inputs`时，Modal的自动缩放器将尝试配置资源
这样每个容器都同时运行许多输入，而不是
基于`max_inputs`的自动缩放。容器可能会爆裂至`max_inputs`
如果资源不足以保持目标并发，例如当
输入的到达率增加。这可以权衡平均数的小幅增加
延迟以避免输入队列产生较大的尾部延迟。

*在 v0.73.148 中添加：* 该装饰器替换了 `allow_concurrent_inputs` 参数
在`@app.function()`和`@app.cls()`。

**使用**

```python
# Stack the decorator under `@app.function()` to enable input concurrency
@app.function()
@modal.concurrent(max_inputs=100)
async def f(data):
    # Async function; will be scheduled as asyncio task
    ...

# With `@app.cls()`, apply the decorator at the class level, not on individual methods
@app.cls()
@modal.concurrent(max_inputs=100, target_inputs=80)
class C:
    @modal.method()
    def f(self, data):
        # Sync function; must be thread-safe
        ...

```