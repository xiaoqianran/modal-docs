<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal workspace`

与当前模态工作区交互。

工作区是拥有您的 Modal 资源的顶级帐户。使用这些命令
管理工作区级别的设置，例如代理令牌。

**用法**：

```shell
modal workspace [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `member-tokens`：管理会员 API 令牌。
* `members`：查看当前Workspace的成员。
* `proxy-tokens`：管理当前Workspace的代理代币。
* `service-users`：管理服务用户。
* `settings`：管理工作区设置。

## `modal workspace member-tokens`

管理会员 API 令牌。所有成员令牌都与工作区的唯一成员相关联。任何使用 Modal 的请求
令牌被验证为关联的成员（因此，受以下权限的约束）
已分配给特定成员）。工作区所有者和管理员可以使用 [`modal environment roles update`](https://modal.com/docs/cli/latest/environment#modal-environment-roles-update)
以编程方式更新这些权限。

此 CLI 允许用户列出和删除与自己关联的令牌。工作区所有者
经理可以列出其工作区中的所有令牌，并可以删除其中任何令牌。

**用法**：

```shell
modal workspace member-tokens [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `delete`：删除此工作空间中的会员令牌。
* `list`：列出工作区中的成员代币。

### `modal workspace member-tokens delete`

删除此工作区中的成员令牌。

请注意，此操作是不可逆转的。这将立即使目标令牌失效，并将
使其无法通过 Modal 进行身份验证。

```bash
# Delete the Token with ID `ak-REDACTED`
modal workspace member-tokens delete ak-REDACTED
```

**用法**：

```shell
modal workspace member-tokens delete [OPTIONS] TOKEN_ID
```

**选项**：

* `--allow-missing`：如果Token不存在，不要报错。
* `-y, --yes`：运行时不暂停确认。
* `--help`：显示此消息并退出。

### `modal workspace member-tokens list`

列出工作区中的成员令牌。工作区管理员和所有者可以看到工作区中的所有令牌
工作区。

```bash
modal workspace member-tokens list

# Show list in JSON format:
modal workspace member-tokens list --json
```

**用法**：

```shell
modal workspace member-tokens list [OPTIONS]
```

**选项**：

* `--json`：输出为 JSON。* `--help`：显示此消息并退出。

## `modal workspace members`

查看当前工作区的成员。

**用法**：

```shell
modal workspace members [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `list`：列出当前Workspace的成员。

### `modal workspace members list`

列出当前工作区的成员。

**用法**：

```shell
modal workspace members list [OPTIONS]
```

**选项**：

* `--json`
* `--help`：显示此消息并退出。

## `modal workspace proxy-tokens`

管理当前工作区的代理令牌。

代理令牌为模态端点、服务器和 Web 功能提供身份验证。

代理令牌和秘密分别具有 `wk-` 和 `ws-` 前缀。他们不能是
与 API 令牌（使用 `ak-` 和 `as-` 前缀）互换。

代理令牌作为请求标头传递，或者作为密钥/秘密对：

```
Modal-Key: wk-123
Modal-Secret: ws-456
```

或者作为单个不记名令牌：

```
Authorization: Bearer wk-123.ws-456
```

请参阅https://modal.com/docs/guide/webhook-proxy-auth了解更多信息。

在启用 RBAC 的工作区中，令牌的范围仅限于特定环境；
使用 `allow` 和 `revoke` 命令来管理环境关联。

**用法**：

```shell
modal workspace proxy-tokens [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `allow`：允许代理令牌对环境进行身份验证。
* `create`：在当前工作空间中创建代理令牌。* `delete`：从当前工作空间中删除代理令牌。
* `list`：列出当前Workspace的代理代币。
* `revoke`：撤销代理令牌对环境的访问权限。
* `update`：更新当前工作区中的代理令牌。

### `modal workspace proxy-tokens allow`

允许代理令牌对环境进行身份验证。

示例：

```
modal workspace proxy-tokens allow wk-123 prod
```

**用法**：

```shell
modal workspace proxy-tokens allow [OPTIONS] TOKEN_ID ENVIRONMENT_NAME
```

**选项**：

* `--help`：显示此消息并退出。

### `modal workspace proxy-tokens create`

在当前工作区中创建代理令牌。

新令牌的 ID 和密钥将打印到 stdout。秘密只是
在创建时显示，以后无法检索。

示例：

```
modal workspace proxy-tokens create --name production-webhooks
modal workspace proxy-tokens create --json
```

**用法**：

```shell
modal workspace proxy-tokens create [OPTIONS]
```

**选项**：
* `--name TEXT`：帮助识别令牌的名称。
* `--json`
* `--help`：显示此消息并退出。

### `modal workspace proxy-tokens delete`

从当前工作区中删除代理令牌。

示例：

```
modal workspace proxy-tokens delete wk-123
```

**用法**：

```shell
modal workspace proxy-tokens delete [OPTIONS] TOKEN_ID
```

**选项**：

* `-y, --yes`：运行时无需暂停确认。
* `--help`：显示此消息并退出。

### `modal workspace proxy-tokens list`

列出当前工作区的代理令牌。

示例：

```
modal workspace proxy-tokens list
modal workspace proxy-tokens list --environment prod
modal workspace proxy-tokens list --json
```

**用法**：

```shell
modal workspace proxy-tokens list [OPTIONS]
```

**选项**：

* `-e, --environment TEXT`：仅列出与此环境相关的令牌。省略时列出所有标记。
* `--json`
* `--help`：显示此消息并退出。

### `modal workspace proxy-tokens revoke`撤销代理令牌对环境的访问权限。

示例：

```
modal workspace proxy-tokens revoke wk-123 prod
```

**用法**：

```shell
modal workspace proxy-tokens revoke [OPTIONS] TOKEN_ID ENVIRONMENT_NAME
```

**选项**：

* `--help`：显示此消息并退出。

### `modal workspace proxy-tokens update`

更新当前工作区中的代理令牌。

可以更新以下设置：

* `name`：帮助识别令牌的名称。传递一个空值将其删除。

示例：

```
modal workspace proxy-tokens update wk-123 name production-webhooks
```

**用法**：

```shell
modal workspace proxy-tokens update [OPTIONS] TOKEN_ID SETTING VALUE
```

**选项**：

* `--help`：显示此消息并退出。

## `modal workspace service-users`

管理服务用户。必须是工作区经理或所有者。

服务用户是允许自动化系统与 Modal 交互的编程帐户。他们是
非常适合 CI/CD 管道、自动化部署和其他需要身份验证的工作流程。

服务用户凭据通常作为环境变量提供给进程：

```
export MODAL_TOKEN_ID=your-token-id
export MODAL_TOKEN_SECRET=your-token-secret
```

新创建的服务用户默认没有权限。为了与特定的人进行交互
环境、服务用户必须被授予明确的权限。

请参阅https://modal.com/docs/guide/service-users了解更多信息。

**用法**：

```shell
modal workspace service-users [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `create`：在此工作区中创建服务用户。
* `delete`：删除此工作空间中的服务用户。* `info`：检查此工作区中的服务用户。
* `list`：列出此工作区中的所有服务用户。
* `set-role`：更新服务用户在特定环境中的角色。

### `modal workspace service-users create`

在此工作区中创建服务用户。

为了运行此命令，您必须至少在工作区中拥有管理员级别权限。

默认情况下，服务用户没有权限。显式授予服务用户权限
要与给定环境交互，请使用 [`modal workspace service-users set-role`](https://modal.com/docs/cli/latest/workspace#modal-workspace-service-users-set-role)
或[`modal environment roles update`](https://modal.com/docs/cli/latest/environment#modal-environment-roles-update)。

或者，您还可以通过传递 `--expires-in` 来指定过期窗口。指定后
经过一段时间后，该服务用户将被删除，并且与此相关的任何凭据
该服务用户将停止工作。该选项需要一个正整数值，可选
后缀为单位 `s`、`m`、`h` 或 `d`，分别表示秒、分钟、小时和天。
如果未提供后缀，则该值将解释为秒。如果没有提供`--expires-in`，
新创建的服务用户永远不会过期。

示例：

```bash
# Create a Service User named `test-1`, which never expires:
modal workspace service-users create test-1

# Two ways of creating a Service User which is valid for an hour:
modal workspace service-users create test-2 --expires-in 3600
modal workspace service-users create test-3 --expires-in 1h

# Create a Service User which is valid for 1 year, outputting JSON:
modal workspace service-users create test-4 --expires-in 365d --json
```

**用法**：

```shell
modal workspace service-users create [OPTIONS] NAME
```

**选项**：* `--expires-in TEXT`：过期时间。接受整数（解释为秒）以及以 `s`、`m`、`h` 或 `d` 为后缀的值。
* `--json`：输出为 JSON。
* `--help`：显示此消息并退出。

### `modal workspace service-users delete`

删除此工作区中的服务用户。

请注意，此操作是不可逆转的。使用凭据的任何现有进程/脚本
与目标服务用户关联的用户将无法通过 Modal 进行身份验证。

```bash
# Delete the Service User named `test-service-user`
modal workspace service-users delete test-service-user
```

**用法**：

```shell
modal workspace service-users delete [OPTIONS] NAME
```

**选项**：

* `--allow-missing`：如果服务用户不存在，则不会出错。
* `-y, --yes`：直接运行，无需暂停确认。
* `--help`：显示此消息并退出。

### `modal workspace service-users info`

检查此工作区中的服务用户。

示例：

```bash
# Inspect the Service User named `test-service-user`
modal workspace service-users info test-service-user

# Inspect the Service User named `test-service-user-2`, outputting JSON
modal workspace service-users info test-service-user-2 --json
```
**用法**：

```shell
modal workspace service-users info [OPTIONS] NAME
```

**选项**：

* `--json`：输出为 JSON。
* `--help`：显示此消息并退出。

### `modal workspace service-users list`

列出此工作区中的所有服务用户。

为了运行此命令，您必须至少在工作区中拥有管理员级别权限。

示例：

```bash
# List all Service Users with a human-readable output format
modal workspace service-users list

# List all Service Users and return JSON output
modal workspace service-users list --json
```

**用法**：

```shell
modal workspace service-users list [OPTIONS]
```

**选项**：

* `--json`：输出为 JSON。
* `--help`：显示此消息并退出。

### `modal workspace service-users set-role`

更新特定环境中服务用户的角色。

示例：

```bash
# Give Contributor access in Environment `main` to Service User `test-service-user`
modal workspace service-users set-role test-service-user main contributor

# Revoke access to Environment `prod` from Service User `test-service-user`
modal workspace service-users set-role test-service-user prod no-access
```

**用法**：

```shell
modal workspace service-users set-role [OPTIONS] SERVICE_USER_NAME ENVIRONMENT_NAME ROLE
```

**选项**：

* `--help`：显示此消息并退出。

## `modal workspace settings`管理工作区设置。必须是工作区经理或所有者。

**用法**：

```shell
modal workspace settings [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `list`：查看工作区的当前设置。
* `set`：更新工作区设置。

### `modal workspace settings list`

查看工作区的当前设置。

**用法**：

```shell
modal workspace settings list [OPTIONS]
```

**选项**：

* `--json`
* `--help`：显示此消息并退出。

### `modal workspace settings set`

更新工作区设置。必须是工作区经理或所有者。

可以更新以下设置：

* `image-builder-version`：映像生成器版本决定了我们的基础映像中包含的软件。
* `default-environment`：当 SDK 或 CLI 方法中省略环境时使用的默认环境。

用途：

* `modal workspace settings set image-builder-version 2025.06`
* `modal workspace settings set default-environment main`

**用法**：

```shell
modal workspace settings set [OPTIONS] SETTING VALUE
```

**选项**：

* `--help`：显示此消息并退出。