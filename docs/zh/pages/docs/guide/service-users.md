<!-- modal-docs: machine-translated zh-CN from English source -->

# 服务用户

<Callout variant="gated-feature">
服务用户可以使用<a href="/pricing">团队和企业计划</a>。访问<a href="/settings/plans">工作空间设置</a>进行升级。
</Callout>

服务用户是允许自动化系统与 Modal 交互的编程帐户。它们非常适合 CI/CD 管道、自动化部署和其他需要身份验证的工作流程。

为了增强安全性，默认情况下服务用户无权访问工作区中的任何环境。请注意，这与工作空间成员不同，工作空间成员在所有环境中默认为 **贡献者**。

所有服务用户都必须被明确授予访问他们与之交互的任何环境的权限。服务用户可以在给定环境中担任 **查看者** 或 **贡献者** 角色，尽管这可能会随着 Modal 身份验证模型的发展而改变。有关这些角色的更深入讨论，请参阅[基于角色的访问控制](/docs/guide/rbac)。

## 创建服务用户

### 使用仪表板

服务用户仅可用于共享工作区。您将需要工作区所有者或管理员权限才能创建服务用户。

要在仪表板中创建服务用户：
1. 转到您的工作空间[令牌设置页面](/settings/tokens/service-users)
2. 单击**新服务用户**
3. 输入服务用户的名称（必须是小写字母数字，可以包含连字符或下划线）
4. 单击“**创建**”
5. 复制`MODAL_TOKEN_ID`和`MODAL_TOKEN_SECRET`。 **出于安全原因，这是您唯一可以查看令牌秘密的时间**。
6. 单击 **配置环境** 以授予服务用户对特定环境的访问权限。

### 使用命令行

或者，您可以在命令行上创建新的服务用户：

```sh
modal workspace service-users create test-service-user-cli
```

与之前一样，服务用户的名称必须由小写字母数字、`-` 和 `_` 字符组成。您可以选择通过使用 `--expires-in` 选项传递值来提供过期时间（以秒为单位）。有关更多信息，请参阅[参考文档](https://modal.com/docs/cli/latest/workspace#modal-workspace-service-users-create)。

运行此命令会将新服务用户的 `MODAL_TOKEN_ID` 和 `MODAL_TOKEN_SECRET` 值打印到标准输出。同样，出于安全原因，这是您唯一可以查看令牌秘密的时间。

要授予新服务用户对环境的访问权限，请使用 [`set-role` 子命令](https://modal.com/docs/cli/latest/workspace#modal-workspace-service-users-set-role)：

```sh
modal workspace service-users set-role test-service-user-cli dev contributor
```
有效角色包括`viewer`和`contributor`。此外，您可以通过 `no-access` 撤销对特定环境的访问。

### 直接从 Python 创建服务用户

最后，您还可以直接从 Python 创建一个新的服务用户：

```python notest
ws = modal.Workspace.from_context()
token_data = ws.service_users.create("test-service-user-sdk", expires_in=None)
```

然后，您可以向新服务用户授予角色：

```python notest
ws.service_users.set_role("test-service-user-sdk", "prod", role="viewer")
```

同样，`role`可以是`"viewer"`、`"contributor"`或`"no-access"`。

## 使用服务用户令牌

将服务用户凭据设置为自动化环境中的环境变量：

```bash
export MODAL_TOKEN_ID=your-token-id
export MODAL_TOKEN_SECRET=your-token-secret
```

配置完成后，您可以照常使用Modal的CLI和Python SDK：

```bash
modal deploy your_app.py
```

## 删除服务用户

删除服务用户将立即撤销与该服务用户关联的凭据。这意味着任何使用这些凭据的程序将无法再使用 Modal 进行身份验证。删除是不可逆的。

要在仪表板中删除服务用户：

1. 进入【令牌设置页面】(/settings/tokens/service-users)
2.找到表中的服务用户
3. 将鼠标悬停在该行上时单击“**删除**”

您也可以在命令行中执行此操作：

```sh
modal workspace service-users delete test-service-user-cli
```

或直接从Python。

```python notest
ws.service_users.delete("test-service-user-sdk")
```

## 保护服务用户的安全
由于服务用户令牌的寿命很长并且在自动化环境中使用，因此将他们的访问权限限制为仅必要的内容非常重要：

* **安全地存储令牌。** 使用机密管理器或 CI/CD 平台的内置机密存储，而不是在源代码或配置文件中硬编码令牌。
* **授予最低权限访问权限。** 由于服务用户从 **无访问权限** 开始，因此仅在他们实际需要的环境上分配 **查看者** 或 **贡献者** 角色，从而使生产与开发和登台隔离。