<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal token`

管理代币。

**用法**：

```shell
modal token [OPTIONS] COMMAND [ARGS]...
```

**选项**：

* `--help`：显示此消息并退出。

**命令**：

* `info`：显示当前正在使用的token信息。
* `new`：使用经过身份验证的 Web 会话创建新令牌。
* `rotate`：在 Web 会话中创建新令牌，然后删除当前令牌。
* `set`：设置用于连接 Modal 的帐户凭据。

## `modal token info`

显示有关当前正在使用的令牌的信息。

**用法**：

```shell
modal token info [OPTIONS]
```

**选项**：

* `--help`：显示此消息并退出。

## `modal token new`使用经过身份验证的 Web 会话创建新令牌。

**用法**：

```shell
modal token new [OPTIONS]
```

**选项**：

* `--activate / --no-activate`：创建后激活包含此令牌的配置文件。
* `--verify / --no-verify`：发出测试请求以验证新凭据。
* `--expires-in TEXT`：新代币的生命周期，例如12小时、7天或90天。默认为工作区允许的最长生命周期。
* `--delete-existing`：除了创建新令牌外，还删除活动配置文件中的现有令牌
* `--help`：显示此消息并退出。

## `modal token rotate`

在 Web 会话中创建新令牌，然后删除当前令牌。

请注意，这相当于`modal token new --delete-existing --no-activate`。您还可以
可以选择使用 `--expires-in` 提供自定义过期窗口。如果未提供，则令牌的
TTL 将回退到工作区默认值。

示例：

```bash
modal token rotate

# Set a custom TTL of 1 week
modal token rotate --expires-in 7d
```

**用法**：

```shell
modal token rotate [OPTIONS]
```

**选项**：

* `--expires-in TEXT`：新代币的生命周期，例如12小时、7天或90天。默认为工作区允许的最长生命周期。
* `--help`：显示此消息并退出。

## `modal token set`

设置用于连接到 Modal 的帐户凭据。

如果命令行上未提供凭据，系统将提示您输入它们。

**用法**：

```shell
modal token set [OPTIONS]
```

**选项**：

* `--token-id TEXT`：账户代币ID。
* `--token-secret TEXT`：账户令牌秘密。
* `--activate / --no-activate`：创建后激活包含此令牌的配置文件。
* `--verify / --no-verify`：发出测试请求以验证新凭据。
* `--delete-existing`：除了设置新令牌外，还删除活动配置文件中的现有令牌
* `--help`：显示此消息并退出。