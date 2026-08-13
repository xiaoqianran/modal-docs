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

* `members`：查看当前Workspace的成员。
* `proxy-tokens`：管理当前Workspace的代理代币。
* `settings`：管理工作区设置。

## `modal workspace members`

查看当前工作区的成员。

**用法**：

```shell
modal workspace members [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：* `list`：列出当前Workspace的成员。

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
* `create`：在当前工作空间中创建代理令牌。
* `delete`：从当前工作空间中删除代理令牌。
* `list`：列出当前Workspace的代理代币。
* `revoke`：撤销代理令牌对环境的访问权限。

### `modal workspace proxy-tokens allow`允许代理令牌对环境进行身份验证。

**用法**：

```shell
modal workspace proxy-tokens allow [OPTIONS] TOKEN_ID ENVIRONMENT_NAME
```

**选项**：

* `--help`：显示此消息并退出。

### `modal workspace proxy-tokens create`

在当前工作区中创建代理令牌。

**用法**：

```shell
modal workspace proxy-tokens create [OPTIONS]
```

**选项**：

* `--json`
* `--help`：显示此消息并退出。

### `modal workspace proxy-tokens delete`

从当前工作区中删除代理令牌。

**用法**：

```shell
modal workspace proxy-tokens delete [OPTIONS] TOKEN_ID
```

**选项**：

* `-y, --yes`：运行时不暂停确认。
* `--help`：显示此消息并退出。

### `modal workspace proxy-tokens list`

列出当前工作区的代理令牌。

**用法**：

```shell
modal workspace proxy-tokens list [OPTIONS]
```

**选项**：

* `-e, --environment TEXT`：仅列出与此环境相关的令牌。省略时列出所有标记。
* `--json`
* `--help`：显示此消息并退出。

### `modal workspace proxy-tokens revoke`

撤销代理令牌对环境的访问权限。

**用法**：

```shell
modal workspace proxy-tokens revoke [OPTIONS] TOKEN_ID ENVIRONMENT_NAME
```

**选项**：

* `--help`：显示此消息并退出。

## `modal workspace settings`

管理工作区设置。必须是工作区经理或所有者。

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