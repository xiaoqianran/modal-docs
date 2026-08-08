<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 FastMCP 在 Modal 上部署远程、无状态 MCP 服务器

这个例子演示了如何部署一个简单的
[MCP服务器](https://modelcontextprotocol.io/)
在莫代尔上。

服务器提供了一个工具来获取给定时区的当前日期和时间。
它是一个无状态 MCP 服务器，这意味着它不存储请求之间的任何状态，
这对于映射到 Modal 的无服务器函数非常重要。
它使用“可流式 HTTP”传输类型。

## 构建 MCP 服务器

首先，我们定义我们的依赖关系。

我们使用[FastMCP库](https://github.com/jlowin/fastmcp)来创建MCP服务器。我们使用 FastAPI 服务器进行封装​​，将其暴露给互联网。

```python
import modal

app = modal.App("example-mcp-server-stateless")

image = modal.Image.debian_slim(python_version="3.12").uv_pip_install(
    "fastapi==0.115.14",
    "fastmcp==2.10.6",
    "pydantic==2.11.10",
)


```

接下来，我们使用 FastMCP 创建 MCP 服务器本身，并向其中添加一个工具
允许法学硕士获取给定时区的当前日期和时间。

```python
def make_mcp_server():
    from fastmcp import FastMCP

    mcp = FastMCP("Date and Time MCP Server")

    @mcp.tool()
    async def current_date_and_time(timezone: str = "UTC") -> str:
        """Get the current date and time.

        Args:
            timezone: The timezone to get the date and time in (optional). Defaults to UTC.

        Returns:
            The current date and time in the given timezone, in ISO 8601 format.
        """
        from datetime import datetime
        from zoneinfo import ZoneInfo

        try:
            tz = ZoneInfo(timezone)
        except Exception:
            raise ValueError(
                f"Invalid timezone '{timezone}'. Please use a valid timezone like 'UTC', "
                "'America/New_York', or 'Europe/Stockholm'."
            )
        return datetime.now(tz).isoformat()

    return mcp


```

然后，我们使用 FastMCP 创建一个 Starlette 应用程序，并使用 `streamable-http` 作为传输
输入，并设置`stateless_http=True`使其无状态。

这将由 FastAPI 应用程序安装，我们将其部署为
[模态网页功能](https://modal.com/docs/guide/webhooks)
使用[`asgi_app`装饰器](https://modal.com/docs/reference/modal.asgi_app)：

```python
@app.function(image=image)
@modal.asgi_app()
def web():
    """Web gateway for the MCP server"""
    from fastapi import FastAPI

    mcp = make_mcp_server()
    mcp_app = mcp.http_app(transport="streamable-http", stateless_http=True)

    fastapi_app = FastAPI(lifespan=mcp_app.router.lifespan_context)
    fastapi_app.mount("/", mcp_app, "mcp")

    return fastapi_app


```

我们就完成了！

## 测试 MCP 服务器

现在你可以[服务](https://modal.com/docs/reference/cli/serve#modal-serve)MCP
服务器通过运行：

```bash
modal serve mcp_server_stateless.py
```

然后打开【MCP检查器】(https://github.com/modelcontextprotocol/inspector)：

```bash
npx @modelcontextprotocol/inspector
```
输入上面的`modal serve`命令打印的MCP服务器的URL，
后缀为 `/mcp/` （例如
`https://modal-labs-examples--datetime-mcp-server-web-dev.modal.run/mcp/`）。还有
确保选择“Streamable HTTP”作为“传输类型”。

连接并单击“工具”选项卡中的“列出工具”后，您应该会看到您的
列出了 `current_date_and_time` 工具，如果您“运行工具”，它应该为您提供
当前日期和时间（UTC）！

为了自动测试 MCP 服务器，我们启动一个客户端并让它列出工具。

```python
@app.function(image=image)
async def test_tool(tool_name: str | None = None):
    from fastmcp import Client
    from fastmcp.client.transports import StreamableHttpTransport

    if tool_name is None:
        tool_name = "current_date_and_time"

    transport = StreamableHttpTransport(url=f"{web.get_web_url()}/mcp/")
    client = Client(transport)

    async with client:
        tools = await client.list_tools()

        for tool in tools:
            print(tool)
            if tool.name == tool_name:
                result = await client.call_tool(tool_name)
                print(result.data)
                return

    raise Exception(f"could not find tool {tool_name}")


```

该测试是通过使用 `modal run` 运行脚本来执行的：

```bash
modal run mcp_server_stateless::test_tool
```

## 部署 MCP 服务器

`modal serve` 创建一个临时的热重载服务器，
这对于测试和开发很有用。

当需要转移到生产时，
您可以使用以下命令部署服务器

```bash
modal deploy mcp_server_stateless
```