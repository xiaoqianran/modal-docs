<!-- modal-docs: machine-translated zh-CN from English source -->

# 在模态沙箱中运行 OpenCode

本例演示如何运行[OpenCode](https://opencode.ai/docs)
远程并从本地终端或浏览器连接到它。

将自托管 OpenCode 与[服务于大型智能模型](https://modal.com/docs/examples/very_large_models)相结合
在 Modal 上，您就拥有了“家里的编码代理”！

当编码代理拥有上下文和工具时，它们是最有用的。
默认情况下，此脚本克隆 [Modal 示例存储库](https://github.com/modal-labs/modal-examples)
并允许代理访问您的 Modal 凭据，
因此它可以运行和调试示例（包括这个！）。
元。![OpenCode Web UI 的屏幕截图，显示此编码代理正在运行自己的代码](https://modal-cdn.com/examples-opencode-server-webui.png)

## 在 Modal 上设置 OpenCode

```python
import argparse
import os
from pathlib import Path

import modal

MINUTES = 60
HOURS = 60 * MINUTES
OPENCODE_PORT = 4096
DEFAULT_GITHUB_REPO = "modal-labs/modal-examples"

```

首先，我们定义一个Modal容器[Image](https://modal.com/docs/guide/images)
安装了 OpenCode。

```python
def define_base_image() -> modal.Image:
    image = (
        modal.Image.debian_slim()
        .apt_install("curl", "git", "gh")
        .run_commands("curl -fsSL https://opencode.ai/install | bash")
        .env({"PATH": "/root/.opencode/bin:${PATH}"})
    )

    # We also bring the global default OpenCode configuration along for the ride.

    CONFIG_PATH = Path("~/.config/opencode/opencode.json").expanduser()
    if CONFIG_PATH.exists():
        print("🏖️  Including config from", CONFIG_PATH)
        image = image.add_local_file(
            CONFIG_PATH, "/root/.config/opencode/opencode.json", copy=True
        )

    return image


```

## 克隆 GitHub 存储库

接下来，我们克隆我们希望代理处理的代码。
存储库在构建时克隆到容器映像中，
所以当沙盒启动时它就可用。

```python
def clone_github_repo(
    image: modal.Image, repo: str, ref: str, token: str | None = None
) -> modal.Image:
    git_config = "git config --global advice.detachedHead false"

    # For private repositories, pass a GitHub personal access token via `--github-token`.
    # For public repositories, no token is needed.

    if token:
        clone_cmd = f"GIT_ASKPASS=echo git clone --quiet --depth 1 --branch {ref} --no-single-branch https://oauth2:{token}@github.com/{repo}.git /root/code"
    else:
        clone_cmd = f"GIT_TERMINAL_PROMPT=0 git clone --quiet --depth 1 --branch {ref} --no-single-branch https://github.com/{repo}.git /root/code"

    print(f"🏖️  Cloning {repo}@{ref} to /root/code")
    return image.run_commands(git_config, clone_cmd, force_build=True)


```

## 授予 Modal 凭据

由于代理使用模态代码，因此我们还可以轻松提供模态访问。
此存储库中的示例应该只安装 `modal` 即可运行 --
除了少数使用`fastapi`。

```python
def add_modal_access(image: modal.Image) -> modal.Image:
    image = image.uv_pip_install("modal", "fastapi~=0.128.0")

    # We grant the agent our Modal permissions,
    # either via environment variables or the local credentials file.

    modal_token_id = os.environ.get("MODAL_TOKEN_ID")
    modal_token_secret = os.environ.get("MODAL_TOKEN_SECRET")

    if modal_token_id and modal_token_secret:
        return image.env(
            {"MODAL_TOKEN_ID": modal_token_id, "MODAL_TOKEN_SECRET": modal_token_secret}
        )

    MODAL_PATH = Path("~/.modal.toml").expanduser()
    if MODAL_PATH.exists():
        print("🏖️  Including Modal auth from", MODAL_PATH)
        return image.add_local_file(MODAL_PATH, "/root/.modal.toml", copy=True)

    raise EnvironmentError(
        "No Modal credentials found. "
        "Either set MODAL_TOKEN_ID and MODAL_TOKEN_SECRET environment variables, "
        "or ensure ~/.modal.toml exists."
    )


```

## 启动沙箱
现在，我们创建一个[模态沙箱](https://modal.com/docs/guide/sandboxes)
运行我们的编码代理会话。
这个沙箱有我们的环境镜像和用于身份验证的密码。

我们开放`OPENCODE_PORT`，以便可以通过互联网访问服务器。

```python
def create_sandbox(
    image: modal.Image,
    timeout: int,
    app: modal.App,
    secrets: list[modal.Secret],
    working_dir: str | None = None,
) -> modal.Sandbox:
    print("🏖️  Creating sandbox")

    with modal.enable_output():
        return modal.Sandbox.create(
            "opencode",
            "serve",
            "--hostname=0.0.0.0",
            f"--port={OPENCODE_PORT}",
            "--log-level=DEBUG",
            "--print-logs",
            encrypted_ports=[OPENCODE_PORT],
            secrets=secrets,
            timeout=timeout,
            image=image,
            app=app,
            workdir=working_dir,
        )


```

OpenCode 是真正的开放——底层有很多接口
编码代理服务器。
在这里我们打印信息：

* 直接访问底层 Modal Sandbox 进行调试或与代理“配对编码”
* 从本地浏览器访问 Web UI（需要身份验证！）
* 从本地终端访问 TUI

```python
def print_access_info(sandbox: modal.Sandbox, password_secret_name: str):
    print(
        "🏖️  Access the sandbox directly:",
        f"modal shell {sandbox.object_id}",
        sep="\n\t",
    )

    tunnel = sandbox.tunnels()[OPENCODE_PORT]
    print(
        "🏖️  Access the WebUI:",
        tunnel.url,
        "Username: opencode",
        sep="\n\t",
    )
    print(
        "🏖️  Access the TUI:",
        f"OPENCODE_SERVER_PASSWORD=YOUR_PASSWORD opencode attach {tunnel.url}",
        sep="\n\t",
    )
    print(
        "🏖️  Display the password:",
        f"modal shell --secret {password_secret_name} --cmd 'env | grep OPENCODE_SERVER_PASSWORD='",
        sep="\n\t",
    )


```

服务器通过 [Modal Secret](https://modal.com/docs/guide/secrets) 中的密码进行保护。
您可以通过前往 [Secrets Dashboard](https://modal.com/secrets) 创建一个
并创建一个新的“自定义”秘密。使用`OPENCODE_SERVER_PASSWORD`作为密钥
和密码作为值。

CLI 还会为您提供有用的提示信息，您可以使用它来恢复密码
与您的 Modal 凭证一起使用，以防您忘记。

## 将它们放在一起

```python
def main(
    timeout: int,
    app_name: str,
    allow_modal_access: bool,
    github_repo: str,
    github_ref: str,
    github_token: str | None,
    password_secret_name: str,
):
    app = modal.App.lookup(app_name, create_if_missing=True)
    image = define_base_image()

    if allow_modal_access:
        image = add_modal_access(image)

    image = clone_github_repo(image, github_repo, github_ref, github_token)

    password_secret = modal.Secret.from_name(password_secret_name)

    sandbox_secrets = [password_secret]
    if github_token:
        sandbox_secrets.append(modal.Secret.from_dict({"GH_TOKEN": github_token}))

    sandbox = create_sandbox(image, timeout, app, sandbox_secrets, "/root/code")
    print_access_info(sandbox, password_secret_name)


```

## 命令行选项

该脚本支持通过命令行参数进行配置。
使用 `--help` 运行以查看所有选项。

要向代理授予与您相同的 GitHub 权限，您可以传递 GitHub 个人访问令牌。
如果您使用 `gh` CLI，则可以使用 shell 命令替换来传递当前的身份验证：

```bash
    python 13_sandboxes/opencode_server.py --github-token $(gh auth token)
```

```python
def parse_timeout(timeout_str: str) -> int:
    if timeout_str.endswith("h"):
        minutes = int(timeout_str[:-1]) * 60
    elif timeout_str.endswith("m"):
        minutes = int(timeout_str[:-1])
    else:
        minutes = int(timeout_str) * 60

    if minutes < 1:
        raise argparse.ArgumentTypeError("Timeout must be at least 1 minute")
    if minutes > 24 * 60:
        raise argparse.ArgumentTypeError("Timeout cannot exceed 24 hours")

    return minutes * MINUTES


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Launch OpenCode server on Modal")
    parser.add_argument(
        "--timeout",
        type=str,
        default="12",
        help="Server timeout (e.g. 2h, 90m). No suffix -> hours. Default: 12",
    )
    parser.add_argument(
        "--app-name",
        type=str,
        default="example-opencode-server",
        help="Modal app name. Default: example-opencode-server",
    )
    parser.add_argument(
        "--no-modal-access",
        action="store_false",
        dest="allow_modal_access",
        help="Disable Modal credential access",
    )
    parser.add_argument(
        "--password-secret",
        dest="password_secret_name",
        help="Name",
        default="opencode-secret",
    )
    parser.add_argument(
        "--github-repo",
        type=str,
        default=DEFAULT_GITHUB_REPO,
        help=f"GitHub repo in owner/repo format. Default: {DEFAULT_GITHUB_REPO}",
    )
    parser.add_argument(
        "--github-ref",
        type=str,
        default="main",
        help="Git ref to checkout (branch, tag, SHA). Default: main",
    )
    parser.add_argument(
        "--github-token",
        type=str,
        default=None,
        help="GitHub PAT for private repos and gh CLI auth. Tip: use $(gh auth token)",
    )

    args = parser.parse_args()

    main(
        parse_timeout(args.timeout),
        args.app_name,
        args.allow_modal_access,
        args.github_repo,
        args.github_ref,
        args.github_token,
        args.password_secret_name,
    )

```