<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用受限函数运行不受信任的代码

本指南页面记录了受限函数，可用于安全地执行模态函数中不受信任的代码。

## 创建一个受限函数

要创建受限函数，请在函数定义中设置 `restrict_modal_access=True`：

```python
@app.function(restrict_modal_access=True)
def run_untrusted_code(code_input: str):
    # This code cannot access Modal resources
    return eval(code_input)
```

当`restrict_modal_access`使能时，该功能不能

* 访问模态资源（队列、字典等）
* 调用其他函数
* 访问Modal的内部API

## 沙箱为不受信任的代码提供了替代接口

Modal 提供了两个用于运行不受信任代码的原语：受限函数和[沙箱](/docs/guide/sandboxes)。
虽然两者都可用于运行不受信任的代码，但它们提供不同的接口：
沙箱提供进程接口，
而受限函数提供了函数调用接口。
进程接口对于有状态的多阶段通信特别有用，
而函数调用接口对于无状态的输入/输出通信特别有用。

下表总结了这些差异。

|特色|功能受限|沙盒|
| ---------| ------------------------------------------ | ---------------------------------------------------------- |
|状态|无国籍|有状态 |
|接口|类似函数 |容器式|
|设置|简约装饰器|需要显式创建/终止 |
|使用案例|快速、独立的代码执行 |交互式开发、长时间运行的会话 |

## 最佳实践

运行不受信任的代码时，请考虑以下额外的安全措施：1. 使用`single_use_containers=True`保证每个容器只处理一个请求。重复使用的容器可能会导致用户之间的信息泄露。

```python
@app.function(restrict_modal_access=True, single_use_containers=True)
def isolated_function(input_data):
    # Each input gets a fresh container
    return process(input_data)
```

注意：在 v1.3.0 之前，一次性容器是通过设置 `max_inputs=1` 来配置的。

2. 设置适当的超时以防止长时间运行的操作：

```python
@app.function(
    restrict_modal_access=True,
    timeout=30,  # 30 second timeout
    single_use_containers=True
)
def time_limited_function(input_data):
    return process(input_data)
```

3. 考虑使用`block_network=True`来阻止容器发出出站网络请求：

```python
@app.function(
    restrict_modal_access=True,
    block_network=True,
    single_use_containers=True
)
def network_isolated_function(input_data):
    return process(input_data)
```

4. 最小化容器中包含的应用程序源

受限模态函数将对其源文件具有读取访问权限
容器，因此您需要避免包含任何有害的内容
如果被不受信任的进程泄露。

如果从[较大的包](/docs/guide/project-struct)中部署应用程序，
默认情况下可能会自动包含整个包源。一个最好的
实践是将不受信任的功能作为独立应用程序的一部分
包括运行所需的最少文件：

```python
restricted_app = modal.App("restricted-app", include_source=False)

image = (
    modal.Image.debian_slim()
    .add_local_file("restricted_executor.py", "/root/restricted_executor.py")
)

@restricted_app.function(
    restrict_modal_access=True,
    block_network=True,
    single_use_containers=True
)
def isolated_function(input_data):
    return process(input_data)
```

## 示例：运行 LLM 生成的代码

下面是运行由语言模型生成的代码的完整示例：

```python
import modal

app = modal.App("restricted-access-example")


@app.function(restrict_modal_access=True, single_use_containers=True, timeout=30, block_network=True)
def run_llm_code(generated_code: str):
    try:
        # Create a restricted environment
        execution_scope = {}

        # Execute the generated code
        exec(generated_code, execution_scope)

        # Return the result if it exists
        return execution_scope.get("result", None)
    except Exception as e:
        return f"Error executing code: {str(e)}"


@app.local_entrypoint()
def main():
    # Example LLM-generated code
    code = """
def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

result = calculate_fibonacci(10)
    """

    result = run_llm_code.remote(code)
    print(f"Result: {result}")

```

此示例通过以下方式锁定容器以确保代码可以安全执行：

* 限制模态访问
* 每次执行都使用新的容器
* 设置超时时间
* 阻止网络访问
* 捕获并处理潜在的错误

## 错误处理

当受限函数尝试访问 Modal 资源时，它将引发 `AuthError`：

```python
@app.function(restrict_modal_access=True)
def restricted_function(q: modal.Queue):
    try:
        # This will fail because the Function is restricted
        return q.get()
    except modal.exception.AuthError as e:
        return f"Access denied: {e}"
```

该错误消息将指示由于模态访问受限而不允许该操作。