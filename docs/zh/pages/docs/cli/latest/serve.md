<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal serve`

通过代码更改热重载来公开 Web 函数。

示例：

```
modal serve hello_world.py
```

当使用 `modal serve` 运行时，模态生成的 URL 将附加一个 `-dev` 后缀。
自定义此后缀（即，避免与工作区中的其他用户发生冲突）
同时为应用程序提供服务），您可以在 `.modal.toml` 文件中设置 `dev_suffix` 或
`MODAL_DEV_SUFFIX`环境变量。

**用法**：

```shell
modal serve [OPTIONS] APP_REF
```

**选项**：

* `-n, --name TEXT`：本次运行的应用程序的名称。
* `--timeout FLOAT`
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或工作区默认值的顺序。
* `-m`：将参数解释为 Python 模块路径而不是文件/脚本路径
* `--timestamps`：显示每个日志行的时间戳。
* `--help`：显示此消息并退出。