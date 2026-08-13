<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal deploy`

部署模态应用程序。

示例：

```
modal deploy my_script.py
modal deploy -m my_package.my_mod
```

**用法**：

```shell
modal deploy [OPTIONS] APP_REF
```

**选项**：

* `--name TEXT`：部署的名称。
* `-e, --env TEXT`：交互环境。如果未指定，则按照 `MODAL_ENVIRONMENT`、您的活动本地配置文件或您的工作区默认值的顺序。
* `--stream-logs`：部署时从应用程序流式传输日志。
* `--tag TEXT`：使用版本标记部署。
* `-m`：将参数解释为 Python 模块路径而不是文件/脚本路径
* `--timestamps`：显示每个日志行的时间戳。
* `--strategy [rolling|recreate]`：部署策略
* `--help`：显示此消息并退出。