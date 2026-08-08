<!-- modal-docs: machine-translated zh-CN from English source -->

#`modal curl`

将经过身份验证的请求发送到模态端点。

实验性：此命令将来可能会更改或删除。

此命令允许您发送经过身份验证的请求，而不包含代理令牌
标头。身份验证通过您的本地 Modal API 凭据进行管理。基于API
身份验证会增加请求的延迟，因此仅建议使用此实用程序
实验和调试目的。

所有参数都直接传递给`curl`，它必须在本地安装。

示例：

```bash
modal curl https://user--my-app.us-west.modal.direct
modal curl -X GET https://user--my-app.us-west.modal.direct
```

**用法**：

```shell
modal curl [OPTIONS] CURL_ARGS...
```

**选项**：

* `--help`：显示此消息并退出。