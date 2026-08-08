<!-- modal-docs: machine-translated zh-CN from English source -->

# 观看浏览器使用代理通过 VNC 驱动 Chromium

计算机使用代理是可以与网络浏览器循环交互的法学硕士。
他们不是调用一组固定的 API，而是查看呈现的页面或屏幕，
决定接下来要单击或输入的内容，采取该操作，然后再看一次。

本示例使用[浏览器使用](https://docs.browser-use.com/)构建一个。
由 Modal 提供的开放权重模型
[端点](https://modal.com/docs/guide/endpoints) 为代理提供动力。代理
在 Modal 中驱动 Chromium
[虚拟机沙盒](https://modal.com/docs/guide/vm-sandboxes),
而小型 Web UI 嵌入了 noVNC 桌面，因此您可以实时观看它的工作情况。

## 运行示例

以编程方式测试示例：

```bash
modal run 13_sandboxes/cua/computer_use_vnc.py
```

您还可以启动交互式 UI：

```bash
modal serve 13_sandboxes/cua/computer_use_vnc.py
```

## 设置

```python
import asyncio
import json
import subprocess
import sys
import textwrap
import time
import urllib.request
from pathlib import Path

import fastapi
import modal
from fastapi.responses import HTMLResponse

app = modal.App("example-computer-use-vnc")
MINUTES = 60

```

我们可以将浏览器使用指向 OpenAI 或 Anthropic 等托管提供商
您的 API 密钥。然而，出于我们的目的，我们提供开放权重模型
我们自己通过模态[端点](https://modal.com/docs/guide/endpoints)。
只需一条命令即可为代理创建兼容 OpenAI 的服务器
打电话。不需要外部 API 密钥，整个演示在 Modal 上运行。

```python
ENDPOINT_MODEL = "Qwen/Qwen3.6-27B-FP8"
ENDPOINT_NAME = "example-computer-use-vnc"
ENDPOINT_ROUTING_REGION = "us-west"
ENDPOINT_WARMUP_TIME = 5 * MINUTES
endpoint_server = modal.Server.from_name(f"ep-{ENDPOINT_NAME}", "Server")

VNC_PORT = 6080
SESSION_START_TIMEOUT = 2 * MINUTES
SANDBOX_TIMEOUT = 60 * MINUTES

PAGE_PATH = Path(__file__).parent / "computer_use_vnc.html"
PAGE_REMOTE = "/root/computer_use_vnc.html"
RESULT_PREFIX = "__BROWSER_USE_RESULT__="
DESKTOP_READY_PATH = "/tmp/desktop_ready"

```

## 设置可共享的虚拟桌面

默认情况下，浏览器使用会启动 Chromium headless。不过，我们想看的是
实时浏览器。在每个Sandbox中，Xvfb提供了一个虚拟显示，
x11vnc 通过 VNC 提供服务，websockify 将流桥接到 noVNC
UI 嵌入的页面。

```python
base_image = modal.Image.debian_slim(python_version="3.12")
web_image = base_image.uv_pip_install("fastapi[standard]==0.139.2").add_local_file(
    PAGE_PATH, remote_path=PAGE_REMOTE
)
sandbox_image = (
    base_image.apt_install("novnc", "websockify", "x11vnc", "xvfb")
    .uv_pip_install("browser-use==0.13.6", "playwright==1.61.0")
    .run_commands("playwright install --with-deps chromium")
)

SANDBOX_COMMAND = textwrap.dedent(
    """
    set -euo pipefail
    export DISPLAY=:99
    Xvfb :99 -screen 0 1280x720x24 >/tmp/xvfb.log 2>&1 &
    sleep 1
    x11vnc -display :99 -forever -shared -nopw -listen 0.0.0.0 -rfbport 5900 -xkb >/tmp/x11vnc.log 2>&1 &
    websockify --web=/usr/share/novnc/ 6080 localhost:5900 >/tmp/websockify.log 2>&1 &
    exec python -c "$AGENT_SCRIPT"
    """
).strip()

```

## 使用代理循环驱动浏览器

代理循环是代理的核心。在每一步中，它都会查看当前
页面，选择一个操作，例如单击、键入或导航，并使用
浏览器使用。循环重复直到模型决定任务完成。

```python
AGENT_SCRIPT = textwrap.dedent(
    """
    import asyncio
    import json
    import os
    import time
    import urllib.parse
    import urllib.request
    from pathlib import Path

    from browser_use import Agent, Browser, ChatOpenAI, Tools

    model = os.environ["ENDPOINT_MODEL"]
    base_url = os.environ["ENDPOINT_BASE_URL"]
    start_page = "data:text/html," + urllib.parse.quote(
        "<body style='margin:0;background:#222;color:#ddd;font:28px system-ui;"
        "display:grid;place-items:center;height:100vh'>Starting desktop...</body>"
    )


    def wait_for_endpoint() -> None:
        deadline = time.monotonic() + int(os.environ["ENDPOINT_WARMUP_TIME"])
        while True:
            try:
                urllib.request.urlopen(f"{base_url}/health", timeout=5).close()
                return
            except Exception:
                pass
            if time.monotonic() >= deadline:
                raise TimeoutError("Timed out waiting for the model Endpoint.")
            time.sleep(1)


    async def main() -> None:
        browser = Browser(
            headless=False,
            window_size={"width": 1280, "height": 720},
            chromium_sandbox=False,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        )
        await browser.start()
        await browser.navigate_to(start_page)
        Path(os.environ["DESKTOP_READY_PATH"]).write_text("1", encoding="utf-8")
        await asyncio.to_thread(wait_for_endpoint)
        llm = ChatOpenAI(
            model=model,
            api_key="unused",
            base_url=f"{base_url}/v1",
            reasoning_effort="none",
            reasoning_models=[model],
            timeout=3 * 60,
        )
        agent = Agent(
            task=os.environ["AGENT_TASK"],
            llm=llm,
            tools=Tools(),
            browser=browser,
            use_thinking=False,
            llm_timeout=3 * 60,
        )
        history = await agent.run()
        result = history.final_result() or "Agent stopped without a final result."
        print(os.environ["RESULT_PREFIX"] + json.dumps(result), flush=True)


    asyncio.run(main())
    """
).strip()

```

## 创建共享端点

端点可能需要一些时间才能准备就绪，因为它的容器会缩放为零。
启动在两个地方等待：

1. `start_session` 等待新的端点注册其服务器并公开 URL。
2. 沙盒会等待端点准备就绪，然后再启动代理。

```python
def create_endpoint_if_missing() -> None:
    command = [sys.executable, "-m", "modal", "endpoint"]
    endpoints = json.loads(
        subprocess.check_output([*command, "list", "--json"], text=True)
    )
    if any(endpoint["name"] == ENDPOINT_NAME for endpoint in endpoints):
        print(f"Using existing Endpoint {ENDPOINT_NAME!r}.")
        return
    subprocess.run(
        [
            *command,
            "create",
            "--name",
            ENDPOINT_NAME,
            "--model",
            ENDPOINT_MODEL,
            "--routing-region",
            ENDPOINT_ROUTING_REGION,
            "--unauthenticated",
        ],
        check=True,
    )
    print(f"Created Endpoint {ENDPOINT_NAME!r}.")


async def wait_for_endpoint_url(deadline: float) -> str:
    while True:
        try:
            url = await endpoint_server.get_url.aio()
        except modal.exception.NotFoundError:
            url = None
        if url:
            return url
        if time.monotonic() >= deadline:
            raise TimeoutError(f"Timed out waiting for Endpoint {ENDPOINT_NAME!r}.")
        await asyncio.sleep(1)


def is_server_up(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            return response.status == 200
    except Exception:
        return False


```

## 运行代理

来自 UI 的请求会为一项任务创建一个沙箱。它的入口点开始
虚拟桌面，绘制 Chromium，然后运行浏览器使用。 `start_session`
等待桌面就绪标记存在并且 noVNC 页面响应，然后
返回沙箱 ID 和观看 URL。

浏览器嵌入该 URL 并使用 ID 轮询状态路由。当
代理退出，沙箱终止，状态路由返回其最终状态
结果。启动失败会在返回错误之前终止沙箱。

```python
@app.function(image=web_image, timeout=SESSION_START_TIMEOUT + 30)
async def start_session(task: str):
    sandbox = None
    try:
        deadline = time.monotonic() + SESSION_START_TIMEOUT
        await asyncio.to_thread(create_endpoint_if_missing)
        endpoint_url = await wait_for_endpoint_url(deadline)
        sandbox = await modal.Sandbox.create.aio(
            "bash",
            "-lc",
            SANDBOX_COMMAND,
            app=app,
            image=sandbox_image,
            experimental_options={"vm_runtime": True},
            env={
                "AGENT_SCRIPT": AGENT_SCRIPT,
                "AGENT_TASK": task,
                "DESKTOP_READY_PATH": DESKTOP_READY_PATH,
                "ENDPOINT_BASE_URL": endpoint_url,
                "ENDPOINT_MODEL": ENDPOINT_MODEL,
                "ENDPOINT_WARMUP_TIME": str(ENDPOINT_WARMUP_TIME),
                "RESULT_PREFIX": RESULT_PREFIX,
            },
            encrypted_ports=[VNC_PORT],
            timeout=SANDBOX_TIMEOUT,
            readiness_probe=modal.Probe.with_exec("test", "-f", DESKTOP_READY_PATH),
        )
        remaining = max(1, int(deadline - time.monotonic()))
        await sandbox.wait_until_ready.aio(timeout=remaining)
        remaining = max(1, int(deadline - time.monotonic()))
        tunnel = (await sandbox.tunnels.aio(timeout=remaining))[VNC_PORT]
        watch_url = (
            f"{tunnel.url.rstrip('/')}/vnc.html?autoconnect=1&resize=scale&reconnect=1"
        )
        while not is_server_up(watch_url):
            if time.monotonic() >= deadline:
                raise TimeoutError("Timed out waiting for noVNC.")
            await asyncio.sleep(1)
        return {"sandbox_id": sandbox.object_id, "watch_url": watch_url}
    except Exception:
        if sandbox is not None:
            await sandbox.terminate.aio()
        raise
    finally:
        if sandbox is not None:
            await sandbox.detach.aio()


```

## 提供网络用户界面

下面的代码是一个简单的 FastAPI 应用程序，它为 Web UI 和 API 提供服务。

```python
web_app = fastapi.FastAPI()


@web_app.get("/")
async def index():
    return HTMLResponse(Path(PAGE_REMOTE).read_text())


@web_app.post("/api/session")
async def create_session(body: dict):
    task = str(body.get("task", "")).strip()
    if not task:
        raise fastapi.HTTPException(status_code=400, detail="Task must not be empty.")
    try:
        return await start_session.remote.aio(task)
    except Exception as exc:
        raise fastapi.HTTPException(500, f"Starting Sandbox: {exc}") from exc


@web_app.get("/api/session/{sandbox_id}")
async def session_status(sandbox_id: str):
    try:
        sandbox = await modal.Sandbox.from_id.aio(sandbox_id)
    except modal.exception.NotFoundError as exc:
        raise fastapi.HTTPException(404, "Session not found.") from exc

    try:
        returncode = await sandbox.poll.aio()
        if returncode is None:
            return {"state": "running"}
        stdout = await sandbox.stdout.read.aio()
        stderr = await sandbox.stderr.read.aio()
    finally:
        await sandbox.detach.aio()

    if returncode == 0:
        result = None
        for line in reversed(stdout.splitlines()):
            if line.startswith(RESULT_PREFIX):
                result = json.loads(line.removeprefix(RESULT_PREFIX))
                break
        if result is None:
            result = "Agent finished without a result."
        return {"state": "succeeded", "result": result}
    message = (stderr or stdout).strip()[-4000:]
    return {
        "state": "failed",
        "result": message or f"Agent exited with code {returncode}.",
    }


@app.function(image=web_image)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def web():
    return web_app


```

## 测试会话API

我们可以在没有 Web UI 的情况下以编程方式测试此示例。
下面的入口点在临时 Web 应用程序上点击 `POST /api/session`，
断言沙盒和 noVNC URL 已返回，
检查`GET /api/session/{id}`报告实时会话，并且
终止沙箱。

```python
@app.local_entrypoint()
def test_session(
    task: str = "Open https://example.com and report the page title in one line.",
):
    url: str | None = web.get_web_url()
    if not url:
        raise RuntimeError("web App has no URL.")
    print(f"web url: {url}")

    payload = json.dumps({"task": task}).encode()
    request = urllib.request.Request(
        f"{url.rstrip('/')}/api/session",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(
        request, timeout=SESSION_START_TIMEOUT + 60
    ) as response:
        session = json.loads(response.read().decode())

    sandbox_id = session.get("sandbox_id")
    watch_url = session.get("watch_url")
    if not sandbox_id or not watch_url:
        raise RuntimeError(f"Session response missing fields: {session}")
    print(f"sandbox_id={sandbox_id}")
    print(f"watch_url={watch_url}")

    if not is_server_up(watch_url):
        raise RuntimeError(f"noVNC not reachable at {watch_url}")

    status_url = f"{url.rstrip('/')}/api/session/{sandbox_id}"
    with urllib.request.urlopen(status_url, timeout=30) as response:
        status = json.loads(response.read().decode())
    print(f"status={status}")
    if status.get("state") not in ("running", "succeeded"):
        raise RuntimeError(f"Unexpected session state: {status}")

    sandbox = modal.Sandbox.from_id(sandbox_id)
    try:
        sandbox.terminate()
    finally:
        sandbox.detach()
    print("session start ok")


```

## 清理

每个沙箱都使用代理进程作为其入口点，因此当
任务完成或超时。启动失败终止它
立即，每个代码路径都会分离其本地沙箱句柄。
`test_session` 还会在 API 检查后终止沙箱。

与 `Ctrl-C` 停止`modal serve`。空闲时共享端点缩放为零，
但仍可用于以后的提示。完成后将其关闭：

```bash
modal endpoint stop example-computer-use-vnc
```