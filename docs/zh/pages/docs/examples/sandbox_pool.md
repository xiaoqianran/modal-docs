<!-- modal-docs: machine-translated zh-CN from English source -->

# 维护一个健康的、准备好服务请求的温暖沙盒池

这个例子演示了如何构建一个“暖”池
[模态沙箱](https://modal.com/docs/guide/sandbox)，并部署一个
[Modal Web Function](https://modal.com/docs/guide/webhook-urls) 可让您领取
从池中获取沙箱，获取沙箱中运行的服务器的 URL。

维护一个温暖的沙箱池非常有用，例如，如果您的沙箱需要
创建后执行重要工作，例如下载代码、安装
在准备好服务请求之前，依赖项或运行测试。

它使用[模态队列](https://modal.com/docs/guide/dicts-and-queues#modal-queues)
存储对暖沙箱的引用以及维护池的功能
通过添加和删除沙箱、检查当前大小等。

池会跟踪每个沙盒的生存时间，并且始终会返回
剩下足够时间的沙盒。

每个沙盒都配置有一个
[就绪探针](https://modal.com/docs/guide/sandboxes#readiness-probes)这样我们就可以
在将服务器添加到池中之前，可靠地等待服务器准备就绪。

它分为两个应用程序：

* `example-sandbox-pool`是主App，包含维护的所有控制逻辑
  池，公开索取沙箱的方法等。
* `example-sandbox-pool-sandboxes` 包含所有实际的沙箱，除此之外别无其他。
该实现借鉴了[pawalt](https://github.com/pawalt)的[沙盒池
示例要点](https://gist.github.com/pawalt/7a505c38bba75cafae0780a5dd40e8b8)。 🙏

```python
import argparse
import time
from dataclasses import dataclass
from datetime import datetime

import modal

APP_NAME = "example-sandbox-pool"
SANDBOX_APP_NAME = "example-sandbox-pool-sandboxes"
POOL_QUEUE_NAME = "example-sandbox-pool-queue"

app = modal.App(APP_NAME)

server_image = modal.Image.debian_slim(python_version="3.11").uv_pip_install(
    "fastapi[standard]~=0.115.14",
    "requests~=2.32.4",
)

## Configuration of the pool

```

在这里，我们定义将用于运行在以下位置运行的服务器的映像：
沙盒。在这个简单的示例中，我们只运行内置的 Python HTTP 服务器
返回目录列表。

```python
sandbox_image = modal.Image.debian_slim(python_version="3.11").apt_install("curl")
SANDBOX_SERVER_PORT = 8080
READINESS_PROBE_TIMEOUT_SECONDS = 10

```

在此示例中，沙箱存在 5 分钟，我们假设它们用于
2 分钟，这意味着如果沙箱剩余时间少于 2 分钟，则将被视为
过期太快，将被终止。

您需要根据您的用例调整这些值。我们不设定`idle_timeout`：根据定义，池化沙箱是空闲的，因此它将终止它们
在他们可以被认领之前。

```python
SANDBOX_TIMEOUT_SECONDS = 5 * 60
SANDBOX_USE_DURATION_SECONDS = 2 * 60
POOL_SIZE = 3
POOL_MAINTENANCE_SCHEDULE = modal.Period(minutes=2)


```

## 主要实现

我们跟踪 `SandboxReference` 对象模态队列中的所有热沙箱。

```python
pool_queue = modal.Queue.from_name(POOL_QUEUE_NAME, create_if_missing=True)


```

Modal 不会暴露沙箱的剩余生命周期，因此我们自己跟踪它。
`expires_at` 是近似值：它是在 `create` 返回后计算的，并且仅
考虑了挂钟超时，而不是沙盒可能死亡的其他原因。

```python
@dataclass
class SandboxReference:
    id: str
    url: str
    expires_at: int


```

### 健康检查

我们运行健康检查以确定 3 种类型的状态： 准备情况
（`wait_until_ready`，创建时一次）、生命值（`is_healthy`，如下）和剩余
生命周期（`expires_at`，根本不是健康）。 `is_still_good` 结合了后两者。

`is_healthy` 在三种类型的故障上返回 false：沙盒消失、服务器丢失
崩溃了，或者隧道不稳定。要区分它们，请检查沙盒本身
（`sb.poll()`在运行时返回`None`，即未完成）。

```python
def is_healthy(url: str) -> bool:
    """Check if a Sandbox is healthy by verifying the server responds to requests."""
    import requests

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return True
    except requests.RequestException:
        return False


def is_still_good(sr: SandboxReference, check_health: bool) -> bool:
    """Check if a Sandbox is still good to use.

    It assumes that it's already been added to the pool, so we don't wait for the
    container to start.
    """
    if sr.expires_at < time.time() + SANDBOX_USE_DURATION_SECONDS:
        return False

    if check_health and not is_healthy(sr.url):
        return False

    return True


```

### 将沙盒添加到池中

此函数创建一个新的沙箱并将其添加到池中。它等待着
沙箱的准备就绪探测在添加之前通过，确保服务器处于正常状态
准备好服务请求。

我们将沙箱部署在一个名为 `example-sandbox-pool-sandboxes` 的单独模态应用程序中，将控制应用程序（日志等）与沙箱分开。

```python
@app.function(image=server_image, retries=3)
@modal.concurrent(max_inputs=20)
def add_sandbox_to_queue() -> None:
    sandbox_app = modal.App.lookup(SANDBOX_APP_NAME, create_if_missing=True)

    sandbox_cmd = ["python", "-m", "http.server", "8080"]
    sb = modal.Sandbox.create(
        *sandbox_cmd,
        app=sandbox_app,
        image=sandbox_image,
        encrypted_ports=[SANDBOX_SERVER_PORT],
        timeout=SANDBOX_TIMEOUT_SECONDS,
        readiness_probe=modal.Probe.with_exec(
            "curl", "-sf", f"http://localhost:{SANDBOX_SERVER_PORT}/"
        ),
    )
    expires_at = int(time.time()) + SANDBOX_TIMEOUT_SECONDS

    # A failed probe or tunnel lookup doesn't terminate the Sandbox, so we do it here.
    # Otherwise it keeps running untracked until its timeout expires, and `retries=3`
    # above turns each invocation into up to four orphans.
    pooled = False
    try:
        sb.wait_until_ready(timeout=READINESS_PROBE_TIMEOUT_SECONDS)
        url = sb.tunnels()[SANDBOX_SERVER_PORT].url
        pool_queue.put(
            SandboxReference(id=sb.object_id, url=url, expires_at=expires_at)
        )
        pooled = True
    except modal.exception.TimeoutError as exc:
        print(f"Sandbox '{sb.object_id}' timed out before it was ready: {exc}")
        raise  # let the Function's retries create a fresh Sandbox
    except modal.exception.ConflictError as exc:
        print(f"Sandbox '{sb.object_id}' finished before it was ready: {exc}")
        raise
    finally:
        if not pooled:
            sb.terminate()
        sb.detach()


```

我们还有一个实用函数，可以通过 `.spawn()`ed 来终止沙箱。

```python
@app.function()
def terminate_sandboxes(sandbox_ids: list[str]) -> int:
    num_terminated = 0
    for id in sandbox_ids:
        sb = modal.Sandbox.from_id(id)
        sb.terminate()
        sb.detach()
        num_terminated += 1

    print(f"Terminated {num_terminated} Sandboxes")
    return num_terminated


```

### 从池中领取沙盒

我们公开了两种从池中声明沙盒并获取服务器 URL 的方法：

* 可以通过 HTTP 寻址的公共 Web 函数
* 可以使用 Modal SDK 调用的函数（包括从 [Go 或 JS][1]）。

[1]：https://modal.com/docs/guide/sdk-javascript-go

Web 函数使用 `.local()` 调用代理`claim_sandbox`，
它在同一个容器中运行，没有额外的延迟。

返回 URL 之前运行健康检查，但已声明的沙箱仍可能死亡或
在呼叫者连接之前过期。 `SANDBOX_USE_DURATION_SECONDS` 缓冲
过期，但调用者应该准备好在连接错误时再次声明。路过
`check_health=false` 绕过健康检查并可能返回死的沙箱。

```python
@app.function(image=server_image)
@modal.fastapi_endpoint()
@modal.concurrent(max_inputs=20)
def claim_sandbox_web_function(check_health: bool = True) -> str:
    return claim_sandbox.local(check_health=check_health)


@app.function(image=server_image)
def claim_sandbox(check_health: bool = True) -> str:
    to_terminate: list[str] = []

    # Remove any expiring or unhealthy sandboxes, and return the first good one:
    while True:
        print(
            "Adding a new Sandbox to the pool to backfill "
            "(and ensure we have at least one)..."
        )
        add_sandbox_to_queue.spawn()

        # timeout=None here means we block in case we need to wait for the backfill:
        sr = pool_queue.get(timeout=None)
        if sr is None:
            continue

        if not is_still_good(sr, check_health):
            print(f"Sandbox '{sr.id}' was not good - terminating and trying another...")
            to_terminate.append(sr.id)
            continue

        break

    if to_terminate:
        terminate_sandboxes.spawn(to_terminate)

    print(f"Claimed Sandbox '{sr.id}', with URL: {sr.url}")
    return sr.url


```

### 维护池

此函数将池增大或缩小到 SANDBOX\_POOL\_SIZE。它首先删除任何
过期或不健康的沙箱，然后调整池大小以达到目标。

它按计划运行，以确保池不会偏离目标大小太远。

```python
@app.function(
    image=server_image,
    schedule=POOL_MAINTENANCE_SCHEDULE,
)
def maintain_pool():
    to_terminate: list[str] = []

    # First remove expiring and unhealthy sandboxes
    while True:
        sr = pool_queue.get(block=False)

        if sr is None:
            break

        if not is_still_good(sr, check_health=True):
            to_terminate.append(sr.id)
            continue

        # Found first good sandbox, but don't put it back in the queue to preserve
        # queue ordering.
        to_terminate.append(sr.id)
        break

    if to_terminate:
        print(f"Terminating {len(to_terminate)} expiring/unhealthy sandboxes...")
        terminate_sandboxes.spawn(to_terminate)

    # Now resize to target
    diff = POOL_SIZE - pool_queue.len()

    if diff > 0:
        for _ in add_sandbox_to_queue.starmap(() for _ in range(diff)):
            pass
    elif diff < 0:
        terminate_sandboxes.spawn(
            [sr.id for sr in pool_queue.get_many(n_values=-diff, timeout=0)]
        )

    print(f"Pool size after maintenance: {pool_queue.len()}")


```

## 用于与池交互的本地命令

### 部署应用程序这还会运行 `maintain_pool` 函数以确保池的大小正确
无需等待第一次计划的维护运行。

使用 `python 13_sandboxes/sandbox_pool.py deploy` 运行它。

```python
def deploy():
    print("Deploying the app...")
    app.deploy()
    print("Done.")

    print("\nRunning initial pool maintenance...")
    maintain_pool.remote()
    print("Done.")


```

### 检查池的当前状态

使用 `python 13_sandboxes/sandbox_pool.py check` 运行它。

```python
def check():
    print(f"Number of Sandboxes in the pool: {pool_queue.len()}")

    for sr in pool_queue.iterate():
        seconds_left = sr.expires_at - time.time()
        print(
            f"- Sandbox '{sr.id}' is at {sr.url} and expires at "
            f"{datetime.fromtimestamp(sr.expires_at).isoformat()} "
            f"({int(seconds_left)} seconds left)"
        )


```

### 从池中声明沙箱并打印其 URL

其实现方式就像您想从 Python 后端调用该函数一样
使用 Modal SDK 的应用程序，即使用 `.from_name()` 获取 Function 等。

使用 `python 13_sandboxes/sandbox_pool.py claim` 运行它。

```python
def claim() -> None:
    deployed_claim_sandbox = modal.Function.from_name(APP_NAME, "claim_sandbox")
    print(deployed_claim_sandbox.remote())


```

### 运行沙盒池的演示。

其实现方式就像您想从 Python 后端调用该函数一样
使用 Modal SDK 的应用程序，即使用 `.from_name()` 获取 Function 等。

使用 `python 13_sandboxes/sandbox_pool.py demo` 运行它。

```python
def demo():
    import urllib.request

    deploy()

    check()

    print("\nClaiming a Sandbox using the `claim_sandbox` Function...")
    deployed_claim_sandbox = modal.Function.from_name(APP_NAME, "claim_sandbox")
    sandbox_url = deployed_claim_sandbox.remote()
    print(f"Claimed Sandbox URL: {sandbox_url}")

    print("\nCall the server in the Sandbox...")
    with urllib.request.urlopen(sandbox_url) as response:
        result = response.read().decode("utf-8")
        print(f"Sandbox server response:\n{result}")

    time.sleep(2)  # wait for the pool to be backfilled in the background
    check()

    deployed_web_function = modal.Function.from_name(
        APP_NAME, "claim_sandbox_web_function"
    )
    claim_url = deployed_web_function.get_web_url()
    print(f"\nClaiming a Sandbox using the Function at '{claim_url}'...")
    with urllib.request.urlopen(claim_url) as response:
        sandbox_url = response.read().decode("utf-8").strip(' "')
        print(f"Claimed Sandbox URL: {sandbox_url}")

    print("\nCall the server in the Sandbox...")
    with urllib.request.urlopen(sandbox_url) as response:
        result = response.read().decode("utf-8")
        print(f"Sandbox server response:\n{result}")

    time.sleep(2)
    check()

    print("\nWhen you're done, stop the App to clean up:")
    print(f"  modal app stop {APP_NAME}")


```

### 清理

`deploy` 和 `demo` 保持应用程序部署，因此 `maintain_pool` 不断重新填充
池。停止它会停止计划，之后沙箱会自行过期
`SANDBOX_TIMEOUT_SECONDS`内：

```
modal app stop example-sandbox-pool
modal queue delete example-sandbox-pool-queue
```

请参阅[管理部署](https://modal.com/docs/guide/managing-deployments)
有关停止应用程序的更多信息。

```python
def main():
    parser = argparse.ArgumentParser(description="Manage Sandbox pool")
    parser.add_argument(
        "command",
        choices=["check", "deploy", "claim", "demo"],
        help="Command to execute",
    )
    args = parser.parse_args()

    if args.command == "check":
        check()
    elif args.command == "claim":
        claim()
    elif args.command == "deploy":
        deploy()
    elif args.command == "demo":
        demo()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

```