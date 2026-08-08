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
* `set`：设置连接 Modal 的帐户凭据。

## `modal token info`

显示有关当前正在使用的令牌的信息。

**用法**：

```shell
modal token info [OPTIONS]
```

**选项**：

* `--help`：显示此消息并退出。

## `modal token new`

使用经过身份验证的 Web 会话创建新令牌。

**用法**：

```shell
modal token new [OPTIONS]
```

**选项**：* `--profile TEXT`：为其设置凭据的模态配置文件。如果未指定（并且未设置 MODAL\_PROFILE 环境变量），则使用与凭据关联的工作区名称。
* `--activate / --no-activate`：创建后激活包含此令牌的配置文件。
* `--verify / --no-verify`：发出测试请求以验证新凭据。
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
* `--profile TEXT`：为其设置凭据的模态配置文件。如果未指定（并且未设置 MODAL\_PROFILE 环境变量），则使用与凭据关联的工作区名称。
* `--activate / --no-activate`：创建后激活包含此令牌的配置文件。
* `--verify / --no-verify`：发出测试请求以验证新凭据。
* `--help`：显示此消息并退出。