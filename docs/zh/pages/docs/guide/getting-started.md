<!-- modal-docs: machine-translated zh-CN from English source -->

# 模态入门

使用 Modal 需要一个帐户。如果您或您的组织还没有帐户，请访问[注册](/signup) 页面开始该过程。企业用户帐户也可以通过 [SAML SSO](/docs/guide/saml-sso) 或 [SCIM](/docs/guide/scim) 进行管理。

您还可以要求代理帮助您进行设置：

```
Read https://modal.com/docs/guide/getting-started.md and walk me through Modal setup.
```

## 安装模态 CLI

`modal` CLI 是与平台交互的关键工具。它将与 Python SDK 一起安装：

{#snippet uv()}

```bash
uv add modal
```

{#snippet pip()}

```bash
pip install modal
```

{#snippet conda()}

```bash
conda install conda-forge::modal-client
```如果在 [TypeScript](/docs/sdk/js/latest) 或 [Go](/docs/sdk/go/latest) 项目中使用 Modal，您还可以通过 [`uvx.sh`](https://uvx.sh/) 将 CLI 安装为独立工具：

```bash
curl -LsSf uvx.sh/modal/install.sh | sh
```

## 设置模态令牌

您需要模态令牌才能使用服务。安装 CLI 后，运行以下命令来配置本地系统：

```bash
modal setup
```

此步骤需要 Web 浏览器进行身份验证。设置流程完成后，您可以验证令牌是否有效：

```bash
modal token info
```

## 安装代理技巧

Modal 提供了一种[技能](https://github.com/modal-labs/modal-client/blob/main/py/modal/skills/modal/SKILL.md)，可以帮助编码代理最有效地与平台合作。

该技能可以通过 CLI 安装和维护：

```bash
modal skills install  # [--claude] [--global]
```
通过 CLI 安装时，技能文件将进行版本控制，并且技能参考将使用版本一致的文档进行填充。

该技能还可以通过 [`npx skills`](https://www.skills.sh/modal-labs/modal-client/modal) 等工具进行管理，尽管它不包含额外的参考文档。

由于该技能旨在让代理了解最新功能，因此我们鼓励定期更新：

```bash
modal skills update  # [--claude] [--global]
```

## 测试一下

通过运行一个简单的脚本来测试您的设置：

```python
import modal

app = modal.App("getting-started")


@app.function()
def square(x: int) -> int:
    print("Using cloud compute for advanced mathematics!")
    return x**2


@app.local_entrypoint()
def main(x: int = 42):
    print(f"The square of {x} is {square.remote(x)}")
```

将其保存到`getting_started.py`并使用`modal run getting_started.py`执行。

或者向您的编码代理索取演示：

```
Write me a simple script that demonstrates the power of the Modal cloud platform.
```

## 后续步骤

* 了解 Modal 强大的计算原语：[Function](/docs/guide/functions)、[Sandbox](/docs/guide/sandboxes) 和 [Server](/docs/guide/servers)
* 只需点击几下即可设置高性能推理 [Endpoint](/endpoints)
* 查看[示例](/docs/examples) 以了解您还可以在 Modal 上执行哪些操作
* 安装 Modal 的 [JavaScript/TypeScript](/docs/sdk/js/latest) 或 [Go](/docs/sdk/go/latest) SDK