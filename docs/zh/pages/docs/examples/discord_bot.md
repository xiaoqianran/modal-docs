<!-- modal-docs: machine-translated zh-CN from English source -->

# 在 Modal 上提供 Discord 机器人

在此示例中，我们将演示如何使用 Modal 构建和服务使用以下内容的 Discord 机器人
[斜线命令](https://discord.com/developers/docs/interactions/application-commands)。

斜杠命令将信息从 Discord 服务器成员发送到 URL 上的服务。
在这里，我们设置了一个简单的[FastAPI应用程序](https://fastapi.tiangolo.com/)
运行该服务并轻松部署它
[`@asgi_app`](https://modal.com/docs/guide/webhooks#serving-asgi-and-wsgi-apps) 装饰器。

作为我们的示例服务，我们使用了一个简单的免费 API：
[免费公共 API](https://www.freepublicapis.com/api)，
免费公共 API 目录。

[在 Discord 上尝试一下](https://discord.gg/PmG7P47EPQ)！

## 设置我们的应用程序及其镜像首先，我们定义[容器图像](https://modal.com/docs/guide/images)
我们机器人的所有部分都会运行。

我们将其设置为模态 [App](https://modal.com/docs/guide/apps) 的默认图像。
我们将在该应用程序中附加机器人的所有组件。

```python
import json
from enum import Enum

import modal

image = modal.Image.debian_slim(python_version="3.11").uv_pip_install(
    "fastapi[standard]==0.115.4", "pynacl~=1.5.0", "requests~=2.32.3"
)

app = modal.App("example-discord-bot", image=image)

```

## 使用免费的公共 API

我们首先定义我们的机器人将提供的核心服务。

在实际应用中，这可能是[音乐生成](https://modal.com/docs/examples/musicgen)，
一个[聊天机器人](https://modal.com/docs/examples/chat_with_pdf_vision),
或[与数据库交互](https://modal.com/docs/examples/cron_datasette)。

在这里，我们只需使用一个简单的免费公共 API：
[免费公共 API](https://www.freepublicapis.com) API，
一个“API of API”，返回有关免费公共 API 的信息，
比如[全球鲨鱼攻击API](https://www.freepublicapis.com/global-shark-attack-api)
以及[企业废话生成器](https://www.freepublicapis.com/corporate-bullshit-generator)。
我们将响应转换为 Markdown 格式的消息。

我们通过附加 `app.function` 装饰器将 Python 函数转换为模态函数。
我们创建函数 `async` 并添加 `@modal.concurrent()` 一个大的 `max_inputs` 值，因为
与外部 API 通信是通过异步执行获得更好性能的典型案例。
Modal 为我们处理异步事件循环之类的事情。

```python
@app.function()
@modal.concurrent(max_inputs=100)
async def fetch_api() -> str:
    import aiohttp

    url = "https://www.freepublicapis.com/api/random"

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as response:
                response.raise_for_status()
                data = await response.json()
                message = (
                    f"# {data.get('emoji') or '🤖'} [{data['title']}]({data['source']})"
                )
                message += f"\n _{''.join(data['description'].splitlines())}_"
        except Exception as e:
            message = f"# 🤖: Oops! {e}"

    return message


```

这个核心组件与Discord无关，
能够与它交互并单独测试它真是太好了。

为此，我们添加一个调用模态函数的`local_entrypoint`。
请注意，我们将 `.remote` 添加到函数名称中。

稍后，当您用更有趣的东西替换应用程序的这个组件时，
通过使用 `modal run discord_bot.py` 触发此入口点来测试它。

```python
@app.local_entrypoint()
def test_fetch_api():
    result = fetch_api.remote()
    if result.startswith("# 🤖: Oops! "):
        raise Exception(result)
    else:
        print(result)


```

## 将我们的模态函数与 Discord 交互集成

现在我们需要将此功能映射到 Discord 的界面上——
特别是[交互 API](https://discord.com/developers/docs/interactions/overview)。

查看文档，我们发现我们需要发送 JSON 有效负载
到特定的 API URL，其中包含标识我们机器人的 `app_id`
以及一个`token`，用于标识我们正在参与的交互（松散地，消息）。

所以让我们把它写出来。这个函数不需要存在于 Modal 上，
因为它只是封装了一些逻辑——我们不想将它本身变成服务或 API。
这意味着我们不需要任何模态装饰器。

```python
async def send_to_discord(payload: dict, app_id: str, interaction_token: str):
    import aiohttp

    interaction_url = f"https://discord.com/api/v10/webhooks/{app_id}/{interaction_token}/messages/@original"

    async with aiohttp.ClientSession() as session:
        async with session.patch(interaction_url, json=payload) as resp:
            print("🤖 Discord response: " + await resp.text())


```

我们应用程序的其他部分可能想要访问免费公共 API 并将结果发送到 Discord，
因此我们为此编写了一个 Python 函数，并将其提升为带有装饰器的模态函数。

请注意，我们使用 `.local` 后缀来调用我们的 `fetch_api` 函数。这意味着我们运行
该函数与我们运行所有其他 Python 函数的方式相同，而不是将其视为特殊函数
模态函数。这减少了一些额外的延迟，但将这两个函数结合得更紧密。

```python
@app.function()
@modal.concurrent(max_inputs=100)
async def reply(app_id: str, interaction_token: str):
    message = await fetch_api.local()
    await send_to_discord({"content": message}, app_id, interaction_token)


```

## 设置 Discord 应用程序

现在，我们需要实际连接到 Discord。
我们首先在 Discord 开发者门户上创建一个应用程序。

1. 前往
   [Discord 开发者门户](https://discord.com/developers/applications) 和
   使用您的 Discord 帐户登录。
2. 在门户上，转到 **应用程序** 并通过以下方式创建一个新应用程序
单击右上角个人资料图片旁边的“**新应用程序**”。
3. 为您的 Discord 机器人[创建自定义模态秘密](https://modal.com/docs/guide/secrets)。
   在 Modal 的 Secret 创建页面上，选择“Discord”。复制您的 Discord 应用程序的
   **公钥**和**应用程序 ID**（来自 Discord 开发者门户中的 **一般信息** 选项卡）
   并将它们粘贴为 `DISCORD_PUBLIC_KEY` 和 `DISCORD_CLIENT_ID` 的值。
   此外，前往 **Bot** 选项卡并使用 **Reset Token** 按钮创建新的机器人令牌。
   将其粘贴到 Secret 中的附加密钥的值中，`DISCORD_BOT_TOKEN`。将这个秘密命名为`discord-secret`。

我们在代码中访问该 Secret，如下所示：

```python
discord_secret = modal.Secret.from_name(
    "discord-secret",
    required_keys=[  # included so we get nice error messages if we forgot a key
        "DISCORD_BOT_TOKEN",
        "DISCORD_CLIENT_ID",
        "DISCORD_PUBLIC_KEY",
    ],
)

```

## 注册一个斜杠命令

接下来，我们要注册一个[斜杠命令](https://discord.com/developers/docs/interactions/application-commands#slash-commands)
对于我们的 Discord 应用程序。斜杠命令由服务器中的用户输入 `/` 和命令名称触发。

下面的模态函数将为您的机器人注册一个名为 `bored` 的斜杠命令。
有关 Slash 命令的更多信息可以在 Discord 文档中找到
[这里](https://discord.com/developers/docs/interactions/application-commands)。

您可以使用以下命令运行此函数

```bash
modal run discord_bot::create_slash_command
```

```python
@app.function(secrets=[discord_secret], image=image)
def create_slash_command(force: bool = False):
    """Registers the slash command with Discord. Pass the force flag to re-register."""
    import os

    import requests

    BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
    CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bot {BOT_TOKEN}",
    }
    url = f"https://discord.com/api/v10/applications/{CLIENT_ID}/commands"

    command_description = {
        "name": "api",
        "description": "Information about a random free, public API",
    }

    # first, check if the command already exists
    response = requests.get(url, headers=headers)
    try:
        response.raise_for_status()
    except Exception as e:
        raise Exception("Failed to create slash command") from e

    commands = response.json()
    command_exists = any(
        command.get("name") == command_description["name"] for command in commands
    )

    # and only recreate it if the force flag is set
    if command_exists and not force:
        print(f"🤖: command {command_description['name']} exists")
        return

    response = requests.post(url, headers=headers, json=command_description)
    try:
        response.raise_for_status()
    except Exception as e:
        raise Exception("Failed to create slash command") from e
    print(f"🤖: command {command_description['name']} created")


```

## 在 Modal 上托管一个 Discord Interactions 端点

如果你仔细看一下上面 Slash Command 的定义，
您会注意到，除了 ID 之外，它对我们的机器人一无所知。

要将 Discord UI 中的 Slash 命令与我们点击 Bored API 的逻辑挂钩，
我们需要设置一个监听某个 URL 并遵循特定协议的服务，
[此处](https://discord.com/developers/docs/interactions/overview#configuring-an-interactions-endpoint-url) 进行了描述。

以下是一些最重要的方面：

1. 我们需要在五秒内做出回应，否则 Discord 会认为我们已经死了。
   Modal 的快速启动无服务器容器通常启动速度更快，
   但这并不能保证。所以我们将 `min_containers` 参数添加到我们的
   功能使至少有一个实时副本可以随时快速响应。
   Modal 对活动集装箱每小时至少收费约 2 美分（定价详情[此处](https://modal.com/pricing)）。
   请注意，这仍然符合 Modal 免费套餐每月 30 美元的积分。

2.我们必须那么快地响应Discord，但我们不必那么快地响应用户。
   相反，我们会发送一条确认消息，以便他们知道我们还活着，并且可以关闭与我们的连接。
   我们还触发我们的 `reply` 模态函数，它将通过 Discord 的交互 API 响应用户，
   但我们不等待结果，我们只是 `spawn` 调用。
3. 协议包含一些强制的认证逻辑
   并由 Discord 检查。我们将在下一节中更详细地解释。

我们可以通过在 Modal 上部署 FastAPI 应用程序来设置交互端点。
这就像创建一个返回 FastAPI 应用程序的 Python 函数一样简单
并添加 `modal.asgi_app` 装饰器。
有关在 Modal 上提供 Python Web 应用程序的更多详细信息，请参阅
[本指南](https://modal.com/docs/guide/webhooks)。

```python
@app.function(secrets=[discord_secret], min_containers=1)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def web_app():
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.middleware.cors import CORSMiddleware

    web_app = FastAPI()

    # must allow requests from other domains, e.g. from Discord's servers
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @web_app.post("/api")
    async def get_api(request: Request):
        body = await request.body()

        # confirm this is a request from Discord
        authenticate(request.headers, body)

        print("🤖: parsing request")
        data = json.loads(body.decode())
        if data.get("type") == DiscordInteractionType.PING.value:
            print("🤖: acking PING from Discord during auth check")
            return {"type": DiscordResponseType.PONG.value}

        if data.get("type") == DiscordInteractionType.APPLICATION_COMMAND.value:
            print("🤖: handling slash command")
            app_id = data["application_id"]
            interaction_token = data["token"]

            # kick off request asynchronously, will respond when ready
            reply.spawn(app_id, interaction_token)

            # respond immediately with defer message
            return {
                "type": DiscordResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE.value
            }

        print(f"🤖: unable to parse request with type {data.get('type')}")
        raise HTTPException(status_code=400, detail="Bad request")

    return web_app


```

Discord 的身份验证有点复杂，但没有，
据我们所知，有任何好的 Python 库。

所以我们必须“手动”实现协议。

本质上，Discord 在其请求中发送标头
我们可以用它来验证请求来自他们。
为此，我们使用 `DISCORD_PUBLIC_KEY`
我们的申请信息页面。

细节并不是非常重要，但它们出现在下面的`authenticate`函数中
（这将真正的密码学工作推迟到 [PyNaCl](https://pypi.org/project/PyNaCl/)，
[`libsodium`](https://github.com/jedisct1/libsodium)) 的 Python 包装器。

Discord 还将检查我们是否拒绝未经授权的请求，
所以我们必须确保做到这一点！

```python
def authenticate(headers, body):
    import os

    from fastapi.exceptions import HTTPException
    from nacl.exceptions import BadSignatureError
    from nacl.signing import VerifyKey

    print("🤖: authenticating request")
    # verify the request is from Discord using their public key
    public_key = os.getenv("DISCORD_PUBLIC_KEY")
    verify_key = VerifyKey(bytes.fromhex(public_key))

    signature = headers.get("X-Signature-Ed25519")
    timestamp = headers.get("X-Signature-Timestamp")

    message = timestamp.encode() + body

    try:
        verify_key.verify(message, bytes.fromhex(signature))
    except BadSignatureError:
        # either an unauthorized request or Discord's "negative control" check
        raise HTTPException(status_code=401, detail="Invalid request")


```

上面的代码使用了一些枚举来抽象 Discord 协议的位。
既然我们已经经历了这一切，
我们能够理解它们是什么
因此它们的代码如下所示。

```python
class DiscordInteractionType(Enum):
    PING = 1  # hello from Discord during auth check
    APPLICATION_COMMAND = 2  # an actual command


class DiscordResponseType(Enum):
    PONG = 1  # hello back during auth check
    DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5  # we'll send a message later


```

## 在模态上部署

您可以通过运行以下命令在 Modal 上部署此应用程序：

```shell
modal run discord_bot.py  # checks the API wrapper, little test
modal run discord_bot.py::create_slash_command  # creates the slash command, if missing
modal deploy discord_bot.py  # deploys the web app and the API wrapper
```

复制输出中打印的模态 URL，然后返回到 **常规信息** 部分
[Discord 开发者门户](https://discord.com/developers/applications)。
粘贴 URL，确保将 `POST` 路线的路径（此处为 `/api`）附加到
**交互端点 URL** 字段，然后单击 **保存更改**。如果你的
端点 URL 不正确或者身份验证实施不正确，
Discord 将拒绝保存 URL。保存后就可以开始了
处理交互！

## 完成 Discord 机器人设置

要开始使用您刚刚设置的 Slash 命令，您需要邀请机器人
不和谐服务器。为此，请转到应用程序的 **安装** 部分
[Discord 开发者门户](https://discord.com/developers/applications)。
复制 **Discored 提供的链接** 并访问它以邀请机器人将您的机器人连接到服务器。

现在您可以打开 Discord 服务器并在频道中输入 `/api` 来触发机器人。
您可以[在我们的测试 Discord 服务器中](https://discord.gg/PmG7P47EPQ) 看到一个工作版本。