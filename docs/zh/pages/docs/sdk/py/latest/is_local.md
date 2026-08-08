<!-- modal-docs: machine-translated zh-CN from English source -->

# 是\_local

```python
is_local()
```

指示当前进程的执行上下文。

注意：当当前进程处于运行状态时，该函数专门返回False
在所有其他情况下运行模态函数和 True。它将返回 True
当从函数的子进程或模态沙箱内调用时，
即使这些进程正在模态硬件上运行。