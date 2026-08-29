<!-- modal-docs: machine-translated zh-CN from English source -->

# Python SDK 发行说明

## 最新

### 1.5.5 (2026-08-28)

* 我们添加了 [`modal.Sandbox.logs`](/docs/sdk/py/latest/Sandbox#logs) API，允许您从特定日期/时间范围`fetch()` 记录日志或`tail()` 最新日志。请注意，当前仅存储来自沙箱入口点进程的日志，并且当前不支持通过此接口流式传输日志。
* 现在可以在通过 CLI 或 SDK 创建新的受限环境时配置默认角色。有关默认环境角色的更多详细信息，请参阅 [RBAC 指南](https://modal.com/docs/guide/rbac)。
* `modal` CLI 现在接受全局 `--profile` 选项，以实现更简单的临时配置文件选择。
* 我们将弃用 Modal SDK 中对象类型上的许多未记录的 API。这些 API 没有面向用户的功能，将在 1.6.0 版本中删除。为了安全起见，请在升级之前检查此版本是否有弃用警告。

### 1.5.4 (2026-08-12)
在此版本中，现在可以选择[性能更高的沙箱后端](/blog/scaling-to-1-million-concurrent-sandboxes-in-seconds)，它提供了更高的创建率和并发性。将 `MODAL_SANDBOX_V2=1` 设置为环境变量，您的沙箱将使用这个新系统，无需更改任何代码。这将成为 Python SDK 1.6.0 版本中的默认行为。请注意，新后端不支持已弃用的基于 FileIO 的 Sandbox 文件系统 API；请在启用功能标志之前[迁移](/docs/guide/migrate-sandbox-filesystem)当前发出弃用警告的任何代码。

* 我们向`modal.App`和`modal.Image`对象添加了日志API：
  * [`App.logs`](/docs/sdk/py/latest/App#logs) API 允许您`fetch()`、`tail()` 或`stream()` 来自应用程序的所有日志。
  * [`Image.logs`](/docs/sdk/py/latest/Image#logs) API 支持镜像构建日志上的 `fetch()` 和 `tail()`。目前不支持流式构建日志。
* 我们还添加了具有同等功能的 [`modal image logs`](/docs/cli/latest/image#modal-image-logs) CLI 命令。
* 我们现在支持通过 [`Workspace.billing.rates()`](/docs/sdk/py/latest/Workspace#billingrates) A​​PI 和 [`modal billing rates`](/docs/cli/latest/billing#modal-billing-rates) CLI 查询有关您的工作区当前定价结构的基本信息。
* [`Function.update_autoscaler()`](/docs/sdk/py/latest/Function#update_autoscaler) 和 [`Server.update_autoscaler()`](/docs/sdk/py/latest/Server#update_autoscaler) 方法现在在应用更新后返回自动缩放器配置的完整状态。
* [`@app.server()`](/docs/sdk/py/latest/App#server) 和 [`Server.update_autoscaler()`](/docs/sdk/py/latest/Server#update_autoscaler) 中的 `target_concurrency` 参数现在支持小数值，以便对自动缩放行为进行更细粒度的控制。

### 1.5.3 (2026-07-23)

* 我们添加了新的 API，用于以编程方式检索多种对象类型的日志：[`Function`](/docs/sdk/py/latest/Function#logs)、[`Server`](/docs/sdk/py/latest/Server#logs) 和 [`FunctionCall`](/docs/sdk/py/latest/FunctionCall#logs)。每个对象都公开三种不同的方法，允许您在生成时记录日志、特定日期/时间范围内的日志或最近的日志。
* 现在可以检索跨计费周期的计费信息摘要：
* 使用 [`modal.Workspace.billing.summary()`](/docs/sdk/py/latest/Workspace#billingsummary) 方法或 [`modal billing summary`](/docs/cli/latest/billing#modal-billing-summary) CLI 查看工作区级别支出（按类别细分）、积分使用情况以及任何计算预留的影响。
  * 使用 [`modal.Environment.billing.summary()`](/docs/sdk/py/latest/Environment#billingsummary) 方法或 [`modal environment billing summary`](/docs/cli/latest/environment#modal-environment-billing-summary) CLI 查看环境级别支出。
* 我们对管理 [RBAC](/docs/guide/rbac) 权限的界面进行了一些更改：
  * 我们现在明确表示每个环境中的所有工作区成员和服务用户角色，而不是对环境成员资格和角色有单独的概念。
  * 我们相应地引入了 [`modal.Environment.roles`](/docs/sdk/py/latest/Environment#roles) 接口（和 [`modal environment roles`](/docs/cli/latest/environment#modal-environment-roles) CLI），取代了现已弃用的 `modal.Environment.members` 接口和 `modal environment members` CLI。
* 现在可以在 [`modal endpoint create`](/docs/cli/latest/endpoint#modal-endpoint-create) 中指定一个或多个 `--compute-region` 选项来配置 Endpoint 容器运行的区域。
* 我们在多个 Sandbox 文件系统方法中将大型写入的性能提高了约 2.5 倍（[`copy_from_local()`](/docs/sdk/py/latest/Sandbox#filesystemcopy_from_local)、[`write_bytes()`](/docs/sdk/py/latest/Sandbox#filesystemwrite_bytes) 和[`write_text()`](/docs/sdk/py/latest/Sandbox#filesystemwrite_text))。

### 1.5.2 (2026-07-10)

* 我们添加了用于以编程方式管理工作区设置的新界面：
  * 使用 [`modal.Workspace.settings.list()`](/docs/sdk/py/latest/Workspace#settingslist) 方法或 [`modal workspace settings list`](/docs/cli/latest/workspace#modal-workspace-settings-list) CLI 查看当前工作区级别设置。
  * 使用 [`modal.Workspace.settings.set()`](/docs/sdk/py/latest/Workspace#settingsset) 方法或 [`modal workspace settings set`](/docs/cli/latest/workspace#modal-workspace-settings-set) CLI 配置新值。
* 我们添加了一个 [`modal.types`](/docs/sdk/py/latest/types) 模块，用于将从公共方法返回的数据类公开为公共 API。该模块中的类型通常不是由用户代码构造的，但引用它们可能很有用，例如，向包装相关 Modal API 的代码添加类型注释。
* [`modal.Function.with_options()`](/docs/sdk/py/latest/Function#with_options) 方法现在接受 `routing_region` 参数，以便在调用时动态配置 [区域路由](/docs/guide/region-selection#regional-routing)。
* [`modal container stop`](/docs/cli/latest/container#modal-container-stop) CLI 现在接受 `--graceful` 标志。有了它，容器将停止获取新输入，但在退出之前完成当前正在运行的输入，而不是取消它们并重新安排它们。仅运行模态函数或模态服务器的容器支持优雅停止。
* [`modal container logs`](/docs/cli/latest/container#modal-container-logs) CLI 现在包含容器启动阶段的日志。
* [`modal.Workspace.members.list()`](/docs/sdk/py/latest/Workspace#memberslist) 方法现在使用 `"member"` 而不是 `"user"` 作为最低权限的工作区角色，与 UI 和文档相匹配。
* [`modal.Sandbox.reload_volumes()`](/docs/sdk/py/latest/Sandbox#reload_volumes) 方法现在会阻塞，直到重新加载卷为止，并受新的 `timeout` 参数限制（默认为 55 秒）。如果重新加载未在 `timeout` 内完成，则会引发 [`modal.exception.TimeoutError`](/docs/sdk/py/latest/exception#timeouterror)。

### 1.5.1 (2026-06-23)
此版本包括几个主要的新功能，包括首次推出用于低延迟 HTTP 应用程序的新无服务器计算原语 ([`@app.server()`](/docs/sdk/py/latest/App#server)) 和一个新的 CLI，用于以最少的配置部署生产就绪的 LLM 推理端点 ([`modal endpoint`](/docs/cli/latest/endpoint))。

* 我们引入了一个新的 [`@app.server()`](/docs/sdk/py/latest/App#server) 装饰器（和 [`modal.Server`](/docs/sdk/py/latest/Server) 对象），代表一个无服务器计算原语，它与模态函数共享许多功能，同时针对以超低延迟提供基于 HTTP 的应用程序进行了优化。阅读[指南](/docs/guide/servers) 了解更多信息。
* 我们还推出了 [`modal endpoint`](/docs/cli/latest/endpoint) CLI，提供对我们新的 [Endpoints](/docs/guide/endpoints) 产品的编程访问。端点允许您以最少的配置部署生产就绪的 LLM 推理服务器。
* 我们添加了几个用于工作区配置和可观察性的新 SDK 功能：
* 我们在 [`modal.Workspace`](/docs/sdk/py/latest/Workspace) 和 [`modal.Environment`](/docs/sdk/py/latest/Environment) 对象 ([`workspace.billing.report()`](/docs/sdk/py/latest/Workspace#billingreport) 和[`environment.billing.report()`](/docs/sdk/py/latest/Environment#billingreport)，分别)。新的 API 包括资源级成本细分（CPU、内存和特定 GPU 类型）。我们还添加了 [`modal environment billing`](/docs/cli/latest/environment#modal-environment-billing) CLI，用于生成环境范围内的计费报告。新的工作区级 API 取代了现有的 [`modal.billing.workspace_billing_report`](/docs/sdk/py/latest/billing#workspace_billing_report) 函数。
  * 我们添加了对通过 [`modal.Workspace`](/docs/sdk/py/latest/Workspace) 对象 ([`workspace.proxy_tokens.create()`](/docs/sdk/py/latest/Workspace#proxy_tokenscreate) 创建和管理 [代理令牌](/docs/guide/webhook-proxy-auth) 的支持， [`workspace.proxy_tokens.list()`](/docs/sdk/py/latest/Workspace#proxy_tokenslist) 等）和新的 [`modal workspace proxy-tokens`](/docs/cli/latest/workspace#modal-workspace-proxy-tokens) CLI。默认情况下，模态服务器和端点通过代理令牌进行身份验证。
  * 我们添加了一个新的 [`modal workspace members`](/docs/cli/latest/workspace#modal-workspace-members) CLI，用于查询有关工作区成员身份的信息。
* 新的 [`modal curl`](/docs/cli/latest/curl) CLI 命令允许您向经过身份验证的端点发出请求，而无需显式传递代理令牌标头。这是一项实验性功能，将来可能会发生变化。
* [`modal app rollback`](/docs/cli/latest/app#modal-app-rollback) 命令现在接受 `--strategy`（`rolling` 或 `recreate`），如 [`modal deploy`](/docs/cli/latest/deploy) 和[`modal app rollover`](/docs/cli/latest/app#modal-app-rollover)。
* 沙盒连接令牌现在可以限定为自定义端口 ([`modal.Sandbox.create_connect_token(port=...)`](/docs/sdk/py/latest/Sandbox#create_connect_token))。
* 现在可以在使用 [`modal.Image.from_id()`](/docs/sdk/py/latest/Image#from_id) 构建的图像上调用 [`image.publish()`](/docs/sdk/py/latest/Image#publish)，而无需先调用 [`image.build()`](/docs/sdk/py/latest/Image#build)。
* Modal Python 客户端现在支持 HTTP CONNECT 和 SOCKS4/5 代理的标准环境变量（`HTTPS_PROXY` 和 `ALL_PROXY`）。代理支持需要安装额外的依赖项，即使用`uv pip install 'modal[api-proxy-support]'`。要选择退出代理支持，请设置 `MODAL_DISABLE_API_PROXY=1` 或将 `disable_api_proxy = true` 放入您的 `.modal.toml` 配置文件中。

### 1.5.0 (2026-06-09)
这是一个主要版本，包括几个新功能（[命名图像](/docs/guide/named-images)、版本固定函数查找、[沙箱域白名单](/docs/guide/sandbox-networking)）、新的 [`modal skills`](/docs/cli/latest/skills) CLI 和少量重大更改。

* 我们引入了“命名图像”概念，类似于模态本机图像注册表。此功能允许您将映像构建与应用程序部署或沙箱创建分离，并且简化了在大量不相关的应用程序之间共享规范映像的过程。
  * 新的 SDK 方法 [`modal.Image.publish()`](/docs/sdk/py/latest/Image#publish) 为现有图像分配名称。名称可以选择包含“标签”后缀（`"{name}:{tag}"`）来指定图像的变体，例如应用版本控制系统。
  * 新的 SDK 方法 [`modal.Image.from_name()`](/docs/sdk/py/latest/Image#from_name) 通过名称直接引用该图像。与指定构建配方部分的 Image 方法不同，[`modal.Image.from_name()`](/docs/sdk/py/latest/Image#from_name) 查找要么成功，要么失败并出现 [`modal.exception.NotFoundError`](/docs/sdk/py/latest/exception#notfounderror) 错误，但它永远不会触发构建。
* 新的 [`modal image names`](/docs/cli/latest/image#modal-image-names) CLI 可用于查看当前的名称分配。
* 我们正在为函数查找引入“版本固定”概念。通过将 `version=` 传递给 [`modal.Function.from_name()`](/docs/sdk/py/latest/Function#from_name) 或 [`modal.Cls.from_name()`](/docs/sdk/py/latest/Cls#from_name)，您可以检索一个实例，该实例会将所有输入发送到同一版本的 Function，即使在随后重新部署其应用程序之后也是如此。此外，同一应用程序中其他函数的任何传递调用也将固定在该版本上。当这些功能可能在部署中以不兼容的方式更改时，此功能可以轻松执行涉及多个功能的工作流。
* 现在可以限制沙箱内的进程可以连接的*域*。当您在 [`modal.Sandbox.create()`](/docs/sdk/py/latest/Sandbox#create) 中向 `outbound_domain_allowlist=[...]` 提供域列表时，允许列表之外的请求将被 Modal 基础设施阻止，并且拒绝将记录在应用程序日志中。
* 我们添加了一个新的 [`modal skills`](/docs/cli/latest/skills) CLI，用于安装基础 Modal 代理技能 ([`modal skills install`](/docs/cli/latest/skills#modal-skills-install)) 并随着时间的推移保持更新([`modal skills update`](/docs/cli/latest/skills#modal-skills-update))。请通过分享您对 Modal 代理开发影响的任何反馈来帮助我们改进它。
* 我们添加了一个新的 [`modal.Workspace`](/docs/sdk/py/latest/Workspace) 对象，用于与您的工作区配置进行编程交互。初始版本提供了 [`workspace.members.list()`](/docs/sdk/py/latest/Workspace#memberslist) 方法；期待很快会有更多功能。
* [`modal`](/docs/cli/latest) CLI 现在通过小写字母和用下划线替换非字母数字字符来标准化其 `--json` 输出的键。
* 我们向 Sandbox 文件系统 API 添加了新的 [`sandbox.filesystem.watch()`](/docs/sdk/py/latest/Sandbox#filesystemwatch) 方法，并且我们已弃用 alpha [`modal.Sandbox.watch()`](/docs/sdk/py/latest/Sandbox#watch) 方法。新方法具有不同的实现方式，并显着改善了延迟和可靠性。
* 我们对沙盒快照进行了两项小的重大更改：
* [`modal.Sandbox.snapshot_filesystem()`](/docs/sdk/py/latest/Sandbox#snapshot_filesystem) 和 [`modal.Sandbox.snapshot_directory()`](/docs/sdk/py/latest/Sandbox#snapshot_directory) 现在接受显式 `ttl=` 关键字参数，该参数为生成的图像配置保留间隔（以秒为单位）。两种方法均默认为 30 天 (`ttl=30 * 24 * 3600`)。 **注意：** 这会改变这些方法的默认行为，因为快照图像以前是无限期保留的。传递显式的 `ttl=None` 来保留之前的行为。
  * [`modal.Sandbox.snapshot_directory()`](/docs/sdk/py/latest/Sandbox#snapshot_directory) 现在还接受 `timeout=` 关键字参数（默认为 `55` 秒），这使其与[`modal.Sandbox.snapshot_filesystem()`](/docs/sdk/py/latest/Sandbox#snapshot_filesystem)。如果快照在截止日期之前没有返回，则会引发 [`modal.exception.TimeoutError`](/docs/sdk/py/latest/exception#timeouterror)。 **注意：** 这会改变默认行为，以前会无限期等待，但您可以设置任意长的超时。
* 我们删除了 Modal 存储对象（[`modal.Volume`](/docs/sdk/py/latest/Volume) 等）上的几个已弃用的静态方法（`.delete()` 和 `.create_deployed()`）。请改用 [`.objects.delete()`](/docs/sdk/py/latest/Volume#objectsdelete) 和 [`.objects.create()`](/docs/sdk/py/latest/Volume#objectscreate) 方法。

## 1.4

### 1.4.3 (2026-05-18)* 此版本为函数输入引入了新的[“区域路由”](https://modal.com/docs/guide/region-selection#regional-routing)概念，该概念现已处于公共测试版中。通过在 `@app.function()` 或 `@app.cls()` 装饰器中设置 `routing_region="..."`，您可以将 Function 配置为通过 `us-west`、`eu-west` 或 `ap-south` 中的服务器（而不是 `us-east`）路由其输入。这可以减少网络延迟并帮助您履行数据驻留义务。在 Beta 版中，此功能有一些限制：
  * `routing_region=`只能在功能的初始部署期间设置，并且不能在后续重新部署中更改。
  * 使用`us-east`之外的区域路由的函数只能通过`.remote()`和`.map()`方法调用。
* 我们添加了一个新的 `modal.Environment` 对象，用于以编程方式管理环境，并且扩展了 `modal environment` CLI 以支持 [RBAC](https://modal.com/docs/guide/rbac) 配置。
* 现在可以使用 `Function.with_options()`、`Function.with_concurrency()` 和 `Function.with_batching()` 动态配置 `modal.Function` 行为。
* 新的`modal.Volume.with_mount_options()`方法允许您将卷挂载配置为只读（`read_only=True`）和/或限制挂载到卷的子目录（`sub_path="/some/path"`）。
* 现在可以使用 `modal run`/`modal serve` 中的 `--name` 选项或通过在 `App.run()` 中设置 `name=` 为临时应用程序传递自定义应用程序名称。
* 我们在 `modal.Sandbox` [文件系统 API](https://modal.com/docs/guide/sandbox-files) 中添加了两个新方法：* `sandbox.filesystem.list_files(path)` 列出沙箱文件系统上给定目录中的条目（带有元数据）。这取代了 alpha `modal.Sandbox.ls` 方法。
  * `sandbox.filesystem.stat(path)` 返回沙箱文件系统上特定文件/符号链接/目录的元数据。
* 现在可以通过在`modal.Sandbox.create()`中设置`inbound_cidr_allowlist=[...]`来限制*入站*沙箱连接。我们还添加了一个新的 `outbound_cidr_allowlist=[...]` 参数并弃用现有的 `cidr_allowlist=[...]` 以避免混淆。
* 我们提高了`modal.Sandbox.snapshot_filesystem()`操作的可靠性，特别是对于大型快照，我们现在支持在必要时设置大于55秒的`timeout=`。
* `modal.Sandbox.snapshot_directory()` 返回的图像现在可以传递到 `modal.Sandbox.create()` 以用作新沙箱的根文件系统。
* 我们添加了一个 `modal.Image.pipe()` 方法，让您定义可重用的图像配方，与流畅的图像生成器界面完美组合。
* 现在可以在创建时使用 `modal.Sandbox.create(..., tags=tags)` 分配沙盒标签。
* 现在可以在 `modal.Image.from_dockerfile()` 中的 `COPY` 命令上使用 `--chmod` 和 `--chown` 标志。
* 我们改进了 `modal shell` 和 `modal container exec` CLI 命令的可靠性和延迟。

### 1.4.2 (2026-04-16)* 我们添加了一个新的 `modal app rollover` CLI 命令，用于触发应用程序的重新部署，而无需进行任何代码或配置更改。翻转会用新容器替换现有容器。与`modal deploy`一样，有两种部署切换策略：
  * `--strategy=rolling`（默认）将流量从旧容器平滑迁移到新容器
  * `--strategy=recreate` 将终止所有正在运行的容器，以便任何后续输入都将转到新容器
* 我们添加了一个新的 `modal bootstrap` CLI 命令，该命令可为常见 AI 应用程序（例如文本生成、文本到图像、语音到文本）获取可部署的入门代码。这是一个实验：尝试一下并向我们提供反馈！
* 我们在新的 Sandbox 文件系统 API 中添加了两种方法：
  * `sandbox.filesystem.make_directory()` 在沙盒文件系统上创建一个新目录
* `sandbox.filesystem.remove()` 从沙箱文件系统中删除文件或目录
* 新的沙箱文件系统方法取代了 `modal.Sandbox.mkdir` 和 `modal.Sandbox.rm` 方法，这些方法现已弃用。
* 沙箱现在还支持 `sb.unmount_image(path)` 从路径中删除先前安装的映像并再次显示底层沙箱文件系统。
* `modal app stop` 和 `modal container stop` CLI 命令现在提示确认（通过 `--yes` 跳过）。
* 其他几个`modal app` CLI 命令现在会将基于名称的参数映射到最近停止的使用该名称的应用程序。这对于例如在应用程序停止后从应用程序获取日志等很有用。
* 我们在 `modal.Image.dockerfile_commands()` 中添加了 `build_args` 参数。

### 1.4.1 (2026-03-30)

* 我们正在为 `modal.Sandbox` 引入“就绪探针”的概念。此功能允许您配置 TCP 端口 (`modal.Probe.with_tcp()`) 或通过执行进程 (`modal.Probe.with_exec()`) 的准备情况检查。调用`sb.wait_until_ready()`将会阻塞，直到探测成功：
  ```python notest
  app = modal.App.lookup('sandbox-app', create_if_missing=True)
  probe = modal.Probe.with_tcp(8080)
  sb = modal.Sandbox.create(
      "python3", "-m", "http.server", "8080",
      readiness_probe=probe,
      app=app,
  )
  sb.wait_until_ready()
  ```
* 我们修复了一个长期存在的错误，该错误可能会导致在处理来自同一容器的数百个连接后 WebSocket 性能下降。
* 我们改进了`modal container logs`在获取旧容器日志时的性能。
* 我们修复了 1.4.0 中引入的一个错误，该错误导致 `modal` CLI 在 `typer<0.19.0` 上崩溃。

### 1.4.0 (2026-03-25)

我们对 CLI 进行了重大改进，以便编码代理可以更轻松地访问模态日志：

* `modal app logs`和`modal container logs`命令现在能够使用计数（例如`--tail 1000`）或基于时间（例如`--since 4h`、`--until 2026-03-15`等）配置来获取历史日志。请注意，历史日志访问受计划级别保留限制的约束。
* `modal container logs` 命令还接受 `--all` 来获取该容器或沙箱的完整日志集。* 两个 CLI 命令现在都接受 `--search` 过滤器，并且还可以按 `--source` (`stdout`/`stderr`/`system`) 进行过滤。
* `modal app logs` 命令还接受 `--function`、`--function-call` 和 `--container` 过滤器。
* `modal app logs` 命令可以在每行前面添加其来源的 Function、FunctionCall 或 Container 的 ID（例如 `--show-function-id`）。
* 请注意，这些命令的默认行为已更改。以前，它们默认会遵循（即流式传输）日志，但现在您必须通过 `--follow` 才能获得此行为。新的默认设置将始终显示最近的 100 个日志条目。
我们正在发布一个新的[沙盒文件系统 API](https://modal.com/docs/guide/sandbox-files)（目前处于测试阶段），其可靠性和人体工程学性能显着提高：

* 使用`sb.filesystem.copy_from_local` / `sb.filesystem.copy_to_local` 在本地文件系统和沙箱文件系统之间传输文件内容。
* 使用 `sb.filesystem.write_text` / `sb.filesystem.read_text` 或 `sb.filesystem.write_bytes` / `sb.filesystem.read_bytes` 在本地内存和沙箱文件系统之间传输文件内容。
* 这些新 API 替换了 `modal.Sandbox.open` 方法及其返回的 `modal.file_io.FileIO` 类型；旧的 API 现已弃用。

我们引入“部署策略”的概念，以便您在重新部署应用程序时能够更加灵活地处理发生的情况：

* 通过传递`modal deploy --strategy recreate`（或SDK中的`app.deploy(strategy="recreate")`），您可以在部署完成时立即终止正在运行的任何容器。这对于开发工作流程最有用，因为它保证任何后续输入都将由运行新版本应用程序的容器处理。这会牺牲一些停机时间来换取新版本何时使用的确定性。
* 当您的应用程序以其`max_containers`限制运行时，破坏性的“重新创建”策略也很有用，否则我们无法提高替换容量。
* `modal serve` 命令现在在代码更新期间使用“重新创建”策略。
* 默认的“滚动”策略不变。此策略优先考虑正常运行时间，但这意味着旧容器可能仍会继续处理输入一段时间。

我们还添加了一些较小的新功能和改进：

* 沙盒现在接受 `modal.Sandbox.create` 中的 `include_oidc_identity_token` 参数。当设置为 `True` 时，`MODAL_IDENTITY_TOKEN` 环境变量将被注入到沙箱中，从而启用基于 OIDC 的身份验证（例如，用于 AWS 联合）。更多详情请参见【OIDC集成指南】(https://modal.com/docs/guide/oidc-integration)。
* 新的`modal.Image.from_scratch()`构造函数创建一个空Image，相当于Docker中的`FROM scratch`。这主要用作轻量级文件系统，通过 `modal.Sandbox.mount_image` 安装到沙箱中。
* `modal container list` 命令现在接受 `--app-id` 过滤器以返回特定应用程序的容器。
* 我们解决了如果沙箱在创建后立即终止，`modal.Sandbox.exec` 可能会挂起的问题。
* 现在，如果“相同”卷或 CloudBucketMount 安装在容器中的多个路径上，则会引发异常。
* 如果客户端无法与 Modal 服务器建立初始连接，它现在会更快地出错（约 60 秒）。
最后，我们引入了少量重大更改，并强制弃用了 1.0 之前的 API：

* `modal.Function.map()` 返回的异常不再包装在 `UserCodeException` 类型中，并且我们将弃用过渡性 `wrap_returned_exceptions=` 参数。
* `modal.enable_output()`上下文管理器不再产生值；这短暂地泄露了一个内部类型。
* 我们从许多 API 中删除了未使用的 `namespace` 参数。
* 现在，当使用函数引用的模块路径拼写时，需要在 CLI 上传递 `-m`（例如 `modal deploy -m project.app`）
* 我们删除了旧自动缩放器配置的向后兼容性（`keep_warm`、`concurrency_limit` 等）。
* 不再可能使用 `modal.Function.from_name` 在 Cls 上查找特定方法；请使用 `modal.Cls.from_name` 代替。

## 1.3

### 1.3.5 (2026-03-03)

* 我们添加了 `modal changelog` CLI，用于通过灵活的查询接口检索变更日志条目（例如 `modal changelog --since=1.2`、`modal changelog --since=2025-12-01`、`modal changelog --newer`）。我们希望这将成为向编码代理展示有关新功能的信息的有用方法。
* 我们添加了一个新的 `modal.Secret.update` 方法，它允许您以编程方式修改 Secret 中的环境变量。该方法具有Python的`dict.update`的语义：使用时可以覆盖或扩展秘密内容。请注意，Secret 更新仅对修改后启动的容器生效。
* `modal.Function.get_current_stats()` 返回的数据类现在包含一个 `num_running_inputs` 字段，用于报告函数当前正在处理的输入数量。

### 1.3.4 (2026-02-23)

* 我们正在推出“目录快照”：一项新的测试版功能，用于在单个沙箱的生命周期内保留特定目录。使用新方法`modal.Sandbox.snapshot_directory()`和`modal.Sandbox.mount_image()`，您可以捕获目录的状态，然后将其包含在不同的沙箱中：
  ```python notest
  sb = modal.Sandbox.create(app=app)
  snapshot = sb.snapshot_directory("/project")

  sb2 = modal.Sandbox.create(app=app)
  sb2.mount_image("/project", snapshot)
  ```
  此功能可用于将沙箱主映像中的应用程序代码的生命周期与每个沙箱会话中更改的项目代码分开。已装载快照中的文件还受益于多项优化，可以更快地读取它们。更多信息请参见【沙盒快照指南】(https://modal.com/docs/guide/sandbox-snapshots)。
* 我们添加了一个新的 `modal.Sandbox.detach()` 方法，我们建议您在与沙箱交互完成后调用该方法。此方法会断开本地客户端与沙箱的连接，并清理与该连接关联的资源。调用 `detach` 后，沙盒对象上的操作可能会引发，否则不保证正常工作。
* `modal.Sandbox.terminate()` 方法现在接受 `wait` 参数。使用`wait=True`，`terminate`将阻塞，直到沙箱完成并返回退出代码。默认的 `wait=False` 保持以前的行为。
* 写入 `modal.Sandbox.exec` 进程的 `stdin` 的吞吐量已增加 8 倍。
* 我们添加了一个新的 `modal.Volume.from_id()` 方法，用于通过对象 ID 引用卷。

### 1.3.3 (2026-02-12)

* 我们添加了新的 `modal billing report` CLI，并将 `modal.billing.workspace_billing_report` API 提升为所有团队和企业计划工作区的通用可用性。
* 我们添加了 `modal.Queue.from_id()` 和 `modal.Dict.from_id()` 方法来支持通过对象 ID 引用队列或字典。
* Modal 的异步使用警告现在默认启用。在异步上下文中使用 [Modal 对象上的阻塞接口](https://modal.com/docs/guide/async) 时，将触发这些警告。我们的目标是为如何修改代码提供详细且可操作的建议，这使得警告变得冗长。虽然我们建议解决弹出的任何警告，因为它们可能指出重大的性能问题或错误，但我们还提供了一个配置选项来禁用它们（`MODAL_ASYNC_WARNINGS=0`或`.modal.toml`中的`async_warnings = false`）。请报告任何明显的误报或不正确的修复建议。* 我们修复了使用 `@modal.asgi_app` 时 ASGI 范围的 `state` 内容可能在请求之间泄漏的错误。

### 1.3.2 (2026-01-30)

* 模态对象现在有一个 `.get_dashboard_url()` 方法。此方法将返回一个 URL，用于在模态仪表板上查看该对象：
  ```python
  fc = f.spawn()
  print(fc.get_dashboard_url())  # Easy access to logs, etc.
  ```
* 还有一个新的 `modal dashboard` CLI 和新的 `modal app dashboard` / `modal volume dashboard` CLI 子命令：
  ```bash
  modal dashboard  # Opens up the Apps homepage for the current environment
  modal dashboard <object-id>  # Opens up a view of this object
  modal app dashboard <app-name>  # Opens up the dashboard for this deployed App
  modal volume dashboard <volume-name>  # Opens up the file browser for this persistent Volume
  ```
* 您现在可以将沙盒 ID (`sb-xxxxx`) 直接传递到 `modal container logs` CLI。
* `modal token info` CLI 现在将包含令牌名称（如果在令牌创建时提供）。
* 我们修复了以下问题：`modal.Cls.with_options()`（或`with_concurrency()` / `with_batching()` 方法）在重复调用时有时可能会使用过时的参数值。
### 1.3.1 (2026-01-22)

* 我们改进了 Modal 容器内对 Python 3.14t（自由线程 Python）的实验性支持。
  * 容器环境现在将使用 Protobuf 运行时的 Python 实现，而不是不兼容的 `upb` 实现。
  * 由于 3.14t 镜像尚未发布到我们预构建的 `modal.Image.debian_slim()` 镜像的官方来源，我们建议使用 `modal.Image.from_registry` 构建 3.14t 镜像：
    ```python
    modal.Image.from_registry("debian:bookworm-slim", add_python="3.14t")
    ```
  * 请注意，3.14t 支持仅在 2025.06 [Image Builder 版本](https://modal.com/settings/image-config) 上可用。
  * 支持仍处于实验阶段，因此请分享您在 Modal 容器中运行 3.14t 时遇到的任何问题。
* 现在可以为 `modal.Sandbox` 提供 `custom_domain`：
  ```python
  sb = modal.Sandbox.create(..., custom_domain="sandboxes.mydomain.com")
  ```
  请注意，Sandbox 自定义域的工作方式与 Function 自定义域不同，目前必须由 Modal 手动设置；如果您对此功能感兴趣，请联系我们。
* 我们添加了一个新的 `modal token info` CLI 命令来检索有关当前正在使用的凭据的信息。
* 我们向多个 CLI 入口点（`modal run`、`modal serve`、`modal deploy` 和 `modal container logs`）添加了 `--timestamps` 标志，以在日志记录输出中显示时间戳。
* `modal run` 入口点的自动 CLI 创建现在支持 `Literal` 类型注释，前提是文字类型包含所有 `str` 或所有 `int` 值。
* 我们修复了一个错误，当应用程序配置错误时，该错误可能会导致应用程序构建失败，并显示无信息的`CancelledError`。
* 我们改进了运行`modal.Sandbox.exec`时的客户端资源管理，这避免了罕见的线程竞争情况。

### 1.3.0 (2025-12-19)

Modal 现在支持 Python 3.14。 Python 3.14t（自由线程构建）支持目前正在进行中，因为我们正在等待依赖项通过自由线程支持进行更新。此外，Modal 不再支持 Python 3.9，该版本已达到[生命周期结束](https://devguide.python.org/versions)。

我们正在添加实验性支持，以检测在异步上下文中使用 Modal 的阻塞 API 的情况（这可能是错误或性能问题的根源）。您可以通过将 `MODAL_ASYNC_WARNINGS=1` 设置为环境变量或将 `async_warnings = true` 设置为配置字段来选择运行时警告。将来我们将默认启用这些警告；在支持处于实验阶段时，请报告任何明显的误报或其他问题。
此版本还包括少量弃用和行为更改：

* Modal SDK 将不再向用户传播 `grpclib.GRPCError` 类型；我们将使用我们自己的 `modal.Error` 子类型。为了避免中断依赖`GRPCError`异常控制流的用户代码，我们暂时使一些异常类型继承自`GRPCError`，以便它们也可以被`except grpclib.GRPCError`语句捕获。访问异常的`.status`属性会发出弃用警告，但如果仅捕获异常对象并且没有与其进行其他交互，则无法发出警告。我们建议主动迁移任何异常处理以使用 Modal 类型，因为我们将来将完全删除对 `grpclib` 类型的依赖。有关从 gRPC 状态代码到 Modal 异常类型的映射，请参阅 [`modal.exception`](https://modal.com/docs/sdk/py/latest/exception) 文档。
* `@app.function()` 和 `@app.cls` 装饰器中的 `max_inputs` 参数已重命名为 `single_use_containers`，现在采用布尔值而不是整数。请注意，仅支持`max_inputs=1`，因此这没有功能影响。进行此更改是为了减少与 `@modal.concurrent(max_inputs=...)` 的混淆，以便 Modal 的自动缩放器可以为具有一次性容器的函数提供更好的性能。
* `modal.FunctionCall.from_id`、`modal.Image.from_id` 和 `modal.SandboxSnapshot.from_id` 中已弃用异步 (`.aio`) 接口，因为这些方法不执行 I/O。* `replace_bytes` 和 `delete_bytes` 方法已从 `modal.file_io` 文件系统接口中删除。
* 使用 2023.12 [Image Builder 版本](https://modal.com/docs/guide/images#image-builder-updates) 使用 `modal.Image.micromamba()` 构建的图像现在将默认使用与其本地环境匹配的 Python 版本，而不是默认使用 Python 3.9。

## 1.2

### 1.2.6 (2025-12-16)

* 修复了迭代 `modal.Sandbox.exec` 输出流可能引发未经身份验证的错误的错误。

### 1.2.5 (2025-12-12)

* 现在可以在不使用 `serialized=True` 的情况下为函数设置自定义 `name=`。这在多次修饰一个函数时很有用，例如将多个模态配置应用于同一实现。
* 现在可以使用模态图像 ID (`modal shell im-abc123`) 启动 `modal shell`。此外，如果您传递无效的参数组合（例如 `--cpu` 以及已运行的沙箱的 ID 等），`modal shell` 现在将发出警告。
* 修复了`modal shell`中的一个错误，该错误导致例如`vi` 因 unicode 解码错误而失败。
* 修复了`modal.Sandbox`资源清理中的线程安全问题。
* 改进了向图像添加大型本地目录时的性能。
* 从 `stdout` 或 `stderr` 读取时不阻塞事件循环，从而提高了异步沙箱性能。

### 1.2.4 (2025-11-21)

* 修复了使用`stderr=StreamType.STDOUT`时`modal.Sandbox.exec`的错误（v1.2.3中引入）。
* 在`modal.forward`中添加了新的`h2_enabled`选项，该选项在TLS建立中启用HTTP/2广告。

### 1.2.3 (2025-11-20)

* 现在可以通过在 `@app.function()` 或 `@app.cls()` 装饰器中设置 `nonpreemptible=True` 将 CPU 函数配置为在不可抢占容量上运行。当请求 GPU 时，此功能当前不可用。请注意，非抢占性会导致 CPU 和内存定价成 3 倍。有关抢占的更多信息，请参阅[指南](https://modal.com/docs/guide/preemption)。
* Modal 客户端现在可以通过后退和自动重试来更优雅地响应服务器限制（例如，速率限制）。可以使用新的 `MODAL_MAX_THROTTLE_WAIT` 配置变量来控制此行为。将配置设置为`0`将保留以前的行为并将速率限制视为例外；将其设置为非零数字（单位为秒）将允许有限的重试持续时间。
* `modal.Sandbox.exec` 实现已被重写，更加可靠和高效。
* 为 `modal shell` 添加了新的 `--add-local` 标志，允许本地文件和目录包含在 shell 的容器中。
* 修复了 v1.2.2 中引入的错误，其中某些模态对象（例如，`modal.FunctionCall`）在内存快照中捕获后不可用。当使用该对象时，该错误会导致`has no loader function`错误。

### 1.2.2 (2025-11-10)

* `modal.Image.run_commands` 现在支持`modal.Volume` 安装。通过在卷上保留包管理器缓存，这有助于加速构建：

  ```python
  cache_vol = modal.Volume.from_name("cache-mount")
  cmd_using_cache = "..."
  image = modal.Image.debian_slim().run_commands(cmd_using_cache, volumes={"/cache": cache_vol})
  ```

* 所有 Modal 对象现在在其构造方法中接受可选的 `modal.Client` 对象。如果从发出请求的 Python 进程中检索模态凭据，则传递显式客户端会很有帮助。
* 传递给 `modal.Sandbox.create` 和 `modal.Sandbox.from_name` 的 `name=` 现在需要遵循其他 Modal 对象命名规则（必须仅包含字母数字字符、短划线、句点或下划线，并且不能超过 64 个字符）。传递无效名称现在会出错。

* `modal.CloudBucketMount` 现在支持 `force_path_style=True` 禁用虚拟主机样式寻址。有关详细信息，请参阅 [mountpoint-s3 端点文档](https://github.com/awslabs/mountpoint-s3/blob/main/doc/CONFIGURATION.md#endpoints-and-aws-privatelink)。

* `modal config show` 的输出现在是有效的 JSON，可以通过 CLI 工具（例如 `jq`）进行解析。

* 修复了首次部署应用程序时出现的应用程序标签未附加到映像构建的错误。

### 1.2.1 (2025-10-22)

* 现在可以通过 `.modal.toml` 配置文件中的新 `dev_suffix` 字段或等效地使用 `MODAL_DEV_SUFFIX` 环境变量来覆盖应用于临时应用程序自动生成的 URL 的默认 `-dev` 后缀（即，使用 `modal serve` 时）。当工作区的多个用户同时处理同一代码库时，这可以帮助避免冲突。
* 修复了从 `modal.Sandbox.exec()` 读取长 stdout/stderr 可能会在 `text=True` 模式下中断的错误。
* 修复了从卷下载文件时未检查状态代码的错误。
* 如果您在应用程序运行时失去互联网连接，`modal run --detach ...` 现在将更优雅地退出。

### 1.2.0 (2025-10-09)

在此版本中，我们引入了“应用程序标签”的概念，它是简单的键值元数据，可以包含其中以提供额外的组织上下文。标签可以定义为 `modal.App` 构造函数的一部分：

```python
app = modal.App("llm-inference-server", tags={"team": "genai-platform"})
```

还可以通过新的 `modal.App.set_tags()` 方法将标签添加到活动应用程序，并且可以使用新的 `modal.App.get_tags()` 检索当前标签。

此版本还引入了用于生成表格计费报告的新 API：`modal.billing.workspace_billing_report()`。计费 API 将报告每个应用程序产生的费用，按时间间隔汇总（目前支持每日或每小时分辨率）。该报告可以选择包含应用程序标签，允许您使用自己的组织架构执行成本分配。

请注意，计费 API 的初始版本是私人测试版。请联系我们讨论访问权限。
此版本还包括对函数输入/输出序列化的一些内部更改。这些更改将为从我们的 `modal-js` 和 `modal-go`​​ SDK 调用模态函数提供更好的支持。 `modal-js` 和 `modal-go` 0.4 或更高版本将只能调用使用 Python SDK 1.2 或更高版本部署的应用程序中的函数。

其他新功能和改进：

* 新的 `modal.Sandbox.create_connect_token()` 方法有助于向沙箱中运行的服务器发出 HTTP / Websocket 请求的身份验证：

  ```python notest
  sb = modal.Sandbox.create(...)

  # Create a connect token, optionally including arbitrary user metadata
  creds = sb.create_connect_token(user_metadata={"user_id": "user123"})

  # Make an http request, passing the token in the authorization header
  requests.get(creds.url, headers={"Authorization": f"Bearer {creds.token}"})
  ```

  更多信息请参见【沙盒网络指南】(https://modal.com/docs/guide/sandbox-networking)。

* 新的`modal.Image.build()`方法允许您急切地触发图像构建。这在使用沙箱时特别有用，否则图像构建将在`modal.Sandbox.create()`内延迟发生：

  ```python notest
  app = modal.App.lookup("sandbox-app")
  image = modal.Image.from_registry("ubuntu")

  # This step will block until the build completes
  image.build(app)

  # Now the Sandbox will be created and scheduled immediately
  sb = modal.Sandbox.create(app=app, image=image)
  ```

* 我们在许多配置 Function、Sandbox 或 Image 执行的方法中添加了 `env` 参数。此参数接受字典并将内容作为环境变量添加到相关的 Modal 容器中。与使用 `modal.Secret` 相比，这可以更简单地包含非敏感信息。
* 现在可以将 `modal.CloudBucketMount` 实例传递给 `modal.Cls.with_options` 的 `volumes=` 参数（之前仅支持动态添加 `modal.Volume` 挂载点）。

* 新的`modal.Sandbox.get_tags()`方法将获取沙箱当前正在使用的标签（即调用`modal.Sandbox.set_tags()`之后）。请注意，沙盒标签与应用程序标签的新概念不同。

* `modal.Dict.pop()` 现在接受可选的 `default` 参数，类似于 Python 的 `dict.pop()`。

* 现在可以通过传递沙盒 ID (`modal shell sb-123`) 来将 `modal shell` 放入正在运行的沙盒中。* 现在可以将沙箱配置为通过 `Sandbox.create(..., pty=True)` 和 `Sandbox.exec(..., pty=True)` 公开 PTY 设备。这为 Claude Code 提供了更好的支持。

* 新的`modal.experimental.image_delete()`函数可用于根据给定的ID删除图像的最后一层，这对于清理沙箱文件系统快照特别有用。

* 使用 `modal run --interactive` （或 `-i`）现在将抑制 Modal 的状态微调器，以避免干扰本地入口点函数中的断点。我们还改进了对附加到调试器时打印大型对象的支持。

* 使用 Protobuf 运行时的 Python 实现时，我们改进了对 Protobuf 5+ 的支持。

此版本还引入了少量新的弃用内容：
* 我们弃用了 `Sandbox.set_tags()` 中的 `client` 参数。要在与沙箱交互时使用显式客户端，请将其传递到`modal.Sandbox.create()`。
* 我们弃用了 `Sandbox.create()` 和 `Sandbox.exec()` 中的 `pty_info` 参数。这是接受内部 Protobuf 类型的私有参数。请参阅新的布尔值 `pty` 参数。
* 我们在 `modal environment delete` CLI 中将 `--no-confirm` 选项替换为 `--yes`，以与通常需要确认的其他 CLI 命令保持一致。

最后，一些在 v0.73 之前开始发出弃用警告的功能现已完全删除：

* 现在需要在调用其方法之一之前“实例化”`modal.Cls`。
* eager `.lookup()` 方法已从大多数 Modal 对象类中删除（但未从 `modal.App.lookup` 中删除，该类仍然受支持）。建议使用惰性 `.from_name()` 方法来访问已部署的对象。
* `modal.mount.Mount`对象上的公共构造函数已被删除；现在这完全是一个内部类。
* `context_mount=` 参数已相应地从面向 Docker 的 `modal.Image` 方法中删除。
* 未使用的 `allow_cross_region_volumes` 参数已从函数装饰器中删除。
* `modal.experimental.update_autoscaler()`功能已移除；该功能现在有一个稳定的 API，即 `modal.Function.update_autoscaler()`。

## 1.1

### 1.1.4 (2025-09-03)

* 为 `@app.function()` 和 `@app.cls()` 装饰器添加了 `startup_timeout` 参数。使用时，它会独立于输入`timeout` 配置应用于每个容器启动周期的超时。为了向后兼容，当`startup_timeout`未设置时，`timeout`仍然适用于启动阶段。
* 为`modal.Sandbox.create()`添加了可选的`idle_timeout`参数。提供后，沙箱将在空闲 `idle_timeout` 秒后终止。* `modal.experimental.get_cluster_info()` 返回的数据类现在包含一个 `cluster_id` 字段来标识容器的集群集。
* 当在 `modal.Sandbox.create()` 中设置 `block_network=True` 时，如果还设置了 `encrypted_ports`、`h2_ports` 或 `unencrypted_ports` 中的任何一个，我们现在会引发错误。
* 用 `@modal.asgi_app()` 修饰的函数现在在输入无法到达容器的极少数情况下返回 HTTP 408（请求超时）错误代码，而不是 502（网关超时）。由于取消。
* `modal.Sandbox.create()` 现在在传递无效的 `name=` 时发出警告，应用与其他 Modal 对象名称相同的规则：名称必须是字母数字且不超过 64 个字符。这将在未来成为一个错误。

### 1.1.3 (2025-08-19)
* 修复了`v1.1.2`中引入的错误，该错误会导致通过`modal.FunctionCall.from_id`检索`FunctionCall`对象时调用`modal.FunctionCall.get`、`modal.FunctionCall.get_call_graph`、`modal.FunctionCall.cancel`和`modal.FunctionCall.gather`失败。
* 添加重试，提高`modal volume get`的鲁棒性

### 1.1.2 (2025-08-14)

我们引入了一种新的 API 模式，用于命令式管理 Modal 资源类型（`modal.Volume`、`modal.Secret`、`modal.Dict` 和 `modal.Queue`）。该 API 可通过每个类上的 `.objects` 命名空间进行访问。对象管理命名空间具有用于以下操作的方法：* `.objects.create(name)` 在我们的后端创建一个对象。例如，使用 [`modal.Volume.objects.create`](https://modal.com/docs/sdk/py/latest/Volume#create)：
  ```python notest
  modal.Volume.objects.create("huggingface-cache", environment_name="dev")
  ```
* `.objects.delete(name)` 删除具有该名称的对象。例如，使用 [`modal.Secret.objects.delete`](https://modal.com/docs/sdk/py/latest/Secret#delete)：
  ```python notest
  modal.Secret.objects.delete("aws-token")
  ```
* `.objects.list()` 返回对象实例列表。例如，使用 [`modal.Queue.objects.list`](https://modal.com/docs/sdk/py/latest/Queue#list)：
  ```python notest
  for queue in modal.Queue.objects.list():
      queue_info = queue.info()
      print(queue_info.name, queue_info.created_at, queue.len())
  ```

随着这些 API 的引入，我们将用类似的功能替换一些旧方法：

* 资源类型本身的静态 `.delete()` 方法已被弃用，因为它们太容易与资源*内容*上的操作混淆（即，调用 `modal.Dict.delete(key_name)` 是一个容易犯的错误，可能会产生严重的不良后果）。
* `modal.Volume` 和 `modal.Secret` 未记录的 `.create_deployed()` 方法已被弃用，以支持这种用于命令式管理的一致 API。

其他变化：

* `modal.Cls.with_options` 现在支持 `region` 和 `cloud` 关键字参数以支持调度的运行时约束。
* 修复了使用 `modal.FilePatternMatcher.from_file` 忽略模式时可能导致图像构建失败并出现 `'FilePatternMatcher' object has no attribute 'patterns'` 的错误。
* 修复了将 `@modal.experimental.clustered()` 与 `modal.Cls` 一起使用时忽略 `rdma=True` 的错误。

### 1.1.1 (2025-08-01)

我们针对沙箱需要对资源拥有唯一所有权的用例引入“命名沙箱”的概念。可以通过将 `name=` 传递给 `modal.Sandbox.create()` 来创建命名沙箱，并且可以使用新的 `modal.Sandbox.from_name()` 构造函数来检索它。任何时候只有一个正在运行的沙箱可以使用给定名称（范围在管理沙箱的应用程序内），因此尝试使用已使用的名称创建沙箱将会失败。沙箱终止时会释放其名称。有关使用此新功能的更多信息，请参阅[指南](https://modal.com/docs/guide/sandbox#named-sandboxes)。

其他变化：
* 我们对 `modal.Image.uv_pip_install` 方法进行了内部更改，以使其在不同的基础映像之间更加可移植。因此，在 1.1.0 上使用此方法构建的图像在下次使用时需要重建。
* 我们为 `modal.Dict`、`modal.Queue`、`modal.Volume` 和 `modal.Secret` 对象添加了 `.name` 属性和 `.info()` 方法。
* 沙盒现在支持`experimental_options` 配置以启用预览功能。
* 我们改进了 Modal 在 Jupyter 笔记本中使用时的丰富输出。

### 1.1.0 (2025-07-17)

此版本引入了对 `2025.06` [Image Builder 版本](https://modal.com/docs/guide/images#image-builder-updates) 的支持，该版本处于“预览”状态。新的图像生成器对模态客户端依赖项如何包含在模态图像中进行了几项重大更改。这些改进应该会大大降低与用户代码依赖项发生冲突的风险。它们还允许 Modal 沙箱轻松地与本身与 Modal 客户端库不兼容的现有图像或 Dockerfile 一起使用。您可以在[图像配置](https://modal.com/settings/image-config)页面查看更多详细信息并更新您的工作区。请分享您在我们努力使版本稳定时遇到的任何问题。
我们还通过新的 [`modal.Image.uv_pip_install`](https://modal.com/docs/sdk/py/latest/Image#uv_pip_install) 和 [`modal.Image.uv_sync`](https://modal.com/docs/sdk/py/latest/Image#uv_sync) 方法引入了对使用 [uv 包管理器](https://docs.astral.sh/uv/) 构建模态图像的一流支持：

```python
import modal

# uv_pip_install accepts a list of packages, like pip_install, but up to 50% faster
image = modal.Image.debian_slim().uv_pip_install("torch==2.7.1", "numpy==2.3.1")

# uv_sync accepts a local `uv_project_dir` (defaulting to the local working directory)
# and uses the pyproject.toml and uv.lock files to specify the environment
image = modal.Image.debian_slim().uv_sync()
```

请注意，由于这些方法是新的，未来的版本可能需要以破坏现有图像缓存的方式修复错误或解决边缘情况。使用 `modal.Image.uv_pip_install` 时，我们建议固定依赖版本，以便任何必要的重建都能产生一致的环境。

此版本还包括许多其他新功能和错误修复：* 优化了`Image.add_local_dir`中`ignore`参数的处理，以及忽略整个目录的情况的类似方法。
* `modal.Image.poetry_install_from_file`新增`poetry_version`参数，支持安装特定版本的`poetry`。还可以设置 `poetry_version=None` 跳过安装步骤，即当图像中已经有诗歌时。
* 添加了 [`modal.Sandbox.reload_volumes`](https://modal.com/docs/sdk/py/latest/Sandbox#reload_volumes) 方法，该方法会触发当前安装在正在运行的沙箱中的所有卷的重新加载。
* 在 `modal.Image.from_dockerfile` 中添加了 `build_args` 参数，用于将参数传递给 Dockerfile 中的 `ARG` 指令。
* 现在可以使用`@modal.experimental.clustered`和`i6pn`与`modal.Cls`联网。
* 修复了当提供已经水合的 `modal.Secret` 物体时 `Cls.with_options` 会失败的错误。
* 修复了`modal.Sandbox.exec()`中指定的超时未被`ContainerProcess.wait()`或`ContainerProcess.poll()`遵守的错误。
* 修复了直接针对远程函数使用 `modal run --detach` 时的重试处理。

最后，此版本引入了少量弃用和潜在的破坏性更改：

* 我们现在在所有 Modal 对象查找失败的情况下都会引发 `modal.exception.NotFoundError` ；以前，某些方法可能会泄漏具有 `NOT_FOUND` 状态的内部 `GRPCError`。* 我们正在对 `modal.build`、`modal.Image.copy_local_file` 和 `modal.Image.copy_local_dir` 强制执行 1.0 之前的弃用。
* 我们将弃用 `modal.Sandbox.create()` 中的 `environment_name` 参数。沙盒的环境关联现在将由其父应用程序确定。这不应该对用户产生任何影响。
* 我们已弃用 `Function`、`Cls`、`Dict`、`Queue`、`Volume`、`NetworkFileSystem` 的 `.from_name` 方法中的 `namespace` 参数，以及`Secret`，以及`modal.runner.deploy_app`。这些对象类型没有不同的命名空间的概念。

## 1.0

### 1.0.5 (2025-06-27)

* 添加了 [`modal.Volume.read_only`](/docs/sdk/py/latest/Volume#read_only) 方法，该方法将配置 Volume 实例以禁止写入：

  ```python notest
  vol = modal.Volume.from_name("models")
  read_only_vol = vol.read_only()

  @app.function(volumes={"/models": read_only_vol})
  def f():
      with open("/models/weights.pt", "w") as fid:  # Raises an OSError
          ...

  @app.local_entrypoint()
  def main():
      with read_only_vol.batch_upload() as batch:  # Raises a modal.exceptions.InvalidError
          ...

      with vol.batch_upload() as batch:  # This instance is still writeable
          ...
  ```
* 逐步修复了当设置 `return_exceptions=True` 时 `Function.map` 和 `Function.starmap` 泄漏内部异常包装类型 (`modal.exceptions.UserCodeException`) 的错误。为了避免破坏任何依赖于返回列表中的特定类型的用户代码，这些函数默认情况下将继续返回包装器类型，但它们现在会发出弃用警告。要选择未来的行为并使警告静音，您可以在调用中将 `wrap_returned_exceptions=False` 设置为 `.map` 或 `.starmap`。

* 当`@app.cls()`修饰的类继承自带有`modal.parameter()`注释的类时，父参数现在将被继承并包含在模态Cls的参数集中。

* 将参数化函数从显式构造函数迁移到`modal.parameter()`注释的重新部署现在将更优雅地处理来自过时客户端的请求，避免新容器因反序列化错误而崩溃的问题。

* Modal 客户端现在将重试与 Modal 服务器的初始连接，从而提高不稳定网络的稳定性。

### 1.0.4 (2025-06-13)
* 当在同一实例上多次调用 `modal.Cls.with_options` 时，覆盖现在将被合并。例如，以下配置将使用 H100 GPU 并请求 16 个 CPU 核心：
  ```python
  Model.with_options(gpu="A100", cpu=16).with_options(gpu="H100")
  ```
* 在 `modal shell` 中添加了 `--secret` 选项，用于在 shell 会话中包含由命名 Secret 定义的环境变量：
  ```
  modal shell --secret huggingface --secret wandb
  ```
* 为`modal.Sandbox.create()`添加了`verbose: bool`选项。当设置为`True`时，执行和文件系统操作将出现在沙箱日志中。
* 更新了`modal.Sandbox.watch()`，以便现在在调用任务中引发异常（并且可以被调用任务捕获）。

### 1.0.3 (2025-06-05)

* 添加了对在 `Cron` 计划上指定时区的支持，这允许您在特定的本地时间运行函数，而不管夏令时如何：

  ```python
  import modal
  app = modal.App()

  @app.function(schedule=modal.Cron("* 6 * * *"), timezone="America/New_York")  # Use tz database naming conventions
  def f():
      print("This function will run every day at 6am New York time.")
  ```

* 在`Sandbox.create`中添加了`h2_ports`参数，该参数使用HTTP/2公开加密端口。以下示例将在 5002 上创建一个 H2 端口，并在 5003 上创建一个使用 HTTPS over HTTP/1.1 的端口：
  ```python
  sb = modal.Sandbox.create(app=app, h2_ports = [5002], encrypted_ports = [5003])
  ```

* `modal secret create`添加了`--from-dotenv`和`--from-json`选项，将从本地文件读取以填充Secret内容。
* `Sandbox.terminate` 不再等待容器关闭完成才返回。它仍然确保终止的容器将立即关闭。要恢复之前的行为（即等待沙箱实际终止），请在调用 `sb.terminate()` 之后调用 `sb.wait(raise_on_termination=False)`。

* 改进了`modal volume get`的性能和稳定性。

* 修复了一个罕见的竞争条件，该条件有时可能导致 `Function.map` 和类似的调用陷入僵局。

* 修复了以下问题：当传递空迭代器作为输入而不是立即完成时，`Function.map` 和类似方法会停滞 55 秒。* 现在，在没有 `modal.enable_output` 上下文管理器的情况下使用交互模式时，我们会在应用程序设置过程中引发错误。以前，这将运行应用程序，但在调用 `modal.interact()` 时引发。

### 1.0.2 (2025-05-26)

* 修复了与 `aiohttp` v3.12.0 中的重大更改不兼容的问题，该更改导致体积和大输入上传问题。这些问题通常表现为 `Local data and remote data checksum mismatch` 或 `'_io.BufferedReader' object has no attribute 'getbuffer'` 错误。

### 1.0.1 (2025-05-19)

* 在 `modal app logs` 中添加了 `--timestamps` 标志，为每个日志行添加时间戳。
* 修复了`Sandbox.list`返回的对象具有`returncode == 0`用于*运行*沙箱的错误。现在运行沙箱的返回代码将为`None`。
* 修复了影响 `sys.platform.node` 名称包含 unicode 字符的系统的错误。

### 1.0.0 (2025-05-16)

在此版本中，我们开始强制执行 [1.0 迁移指南](https://modal.com/docs/guide/modal-1-0-migration) 中讨论的弃用内容。展望未来，我们将在 `1.Y.0` 版本中包含针对未决弃用的重大更改，因此，如果您尚未解决现有警告，我们建议将 Modal 固定在次要版本 (`modal~=1.0.0`) 上。虽然我们将继续改进 Modal API，但新的弃用将以大幅降低的速度引入，并且对旧客户端版本的支持窗口将会延长。

⚠️ 在此版本中，我们对 Modal 的“自动挂载”行为进行了一些重大更改。️ 如果您尚未调整源代码以响应有关自动挂载的警告，则使用 1.0+ 构建的应用程序将包含不同的文件，并且可能无法按预期运行：

* 以前，Modal 容器会自动包含由 Modal 应用程序导入的本地 Python 包的源代码。展望未来，有必要在镜像中显式包含此类包（即使用 `modal.Image.add_local_python_source`）。
* 删除了对`automount`配置（`MODAL_AUTOMOUNT`）的支持；该环境变量将不再产生任何影响。
* Modal 将继续自动包含定义 Function 的 Python 模块或包。如果函数是在包中定义的，则包含该包的整个目录树将被挂载。如果您的 Image 定义已经包含定义 Function: set `include_source=False` 在 `modal.App` 构造函数或 `@app.function` 装饰器中的包，也可以禁用此有限的自动挂载。

此外，我们还强制执行了一些先前引入的弃用内容：

* 删除了 `modal.Mount` 作为公共对象，以及各种 `mount=` 参数，其中安装可以传递到 Modal API 中。用法可以替换为 `modal.Image` 方法，例如：
  ```python
  @app.function(image=image, mounts=[modal.Mount.from_local_dir("data", "/root/data")])  # This is now an error!
  @app.function(image=image.add_local_dir("data", "/root/data"))  # Correct spelling
  ```
* 从`modal.App.run`中删除了`show_progress`参数。该参数已被`modal.enable_output`上下文管理器取代：
  ```python
  with modal.enable_output(), app.run():
    ...  # Will produce verbose Modal output
  ```
* 将标记选项传递到 `Image.pip_install` 包列表现在会引发错误。使用 `extra_options` 参数指定未通过 `Image.pip_install` 签名公开的选项：
  ```python
  image.pip_install("flash-attn", "--no-build-isolation")  # This is now an error!
  image.pip_install("flash-attn", extra_options="--no-build-isolation")  # Correct spelling
  ```
* 删除了在对象查找方法中使用 `label=` 或 `tag=` 关键字的向后兼容性。我们标准化了这些方法以使用 `name=` 作为参数名称，但我们建议使用位置参数：
  ```python
  f = modal.Function.from_name("my-app", tag="f")  # No longer supported! Will raise an error!
  f = modal.Function.from_name("my-app", "f")  # Preferred spelling
  ```
* 不再可以使用 `Function.spawn` 调用生成器函数；之前有警告，现在它提出了`InvalidError`。此外，`FunctionCall.get_gen`方法已被删除，并且在使用`FunctionCall.from_id`时不再可以设置`is_generator`。
* 删除了 Modal 对象上的 `.resolve()` 方法。该方法尚未公开记录，但在使用时可以直接用`.hydrate()`替换。请注意，显式水合很少是必要的：在大多数情况下，您可以依赖惰性水合语义（即，当调用第一个需要服务器元数据的方法时，对象将被水合）。
* 用 `@modal.asgi_app` 或 `@modal.wsgi_app` 修饰的函数现在要求为 null。之前，我们警告过使用具有默认参数的参数定义函数的情况。
* 引用已弃用的 `modal.Stub` 对象现在将引发 `AttributeError`，而之前它是 `modal.App` 的别名。这是一个简单的名称更改。