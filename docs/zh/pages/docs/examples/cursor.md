<!-- modal-docs: machine-translated zh-CN from English source -->

# 在模态上运行光标云代理

使用[光标自带机器 (BYOM) 池](https://cursor.com/docs/cloud-agent/bring-your-own-machine)
在 [Modal Sandboxes](https://modal.com/docs/guide/sandboxes) 中运行 Cursor Cloud Agent 工作线程。
在Cursor中选择池，Modal Cursor为每个池启动一个Modal Sandbox
云代理会话。

## 开始之前

* Python 3.11 或更高版本
* [`uv`](https://docs.astral.sh/uv/)
* 一个【模态账户】(https://modal.com/docs/guide/modal-user-account-setup)
* 矿池工作人员的 Cursor 服务帐户 API 密钥

安装`uv`
[官方独立安装程序](https://docs.astral.sh/uv/getting-started/installation/)
如果尚未安装：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

默认配置使用[Modal Secret](https://modal.com/docs/guide/secrets)
命名为`cursor-service-account`，包含`CURSOR_API_KEY`。`CURSOR_API_KEY` 是一个长期存在的服务帐户密钥。每个都可以使用
光标工作者的环境，因此在工作者沙箱中运行的代码可以读取它。
将工作人员代码和图像视为此密钥信任边界的一部分，并且不要
打印密钥或将其包含在日志中。

## 部署工作池

为池指定一个可识别的名称，例如 `gpu-training`。你会选择这个
启动云代理会话时光标中的名称。

运行交互式设置向导：

```bash
uvx modal-cursor init
```

从要保留集成的目录运行这些命令
配置，例如小型部署存储库的根。默认情况下，
`init` 相对于当前目录写入`pools/<pool-name>.py`。的
`deploy`、`doctor` 和 `destroy` 命令还会在 `pools/` 中查找池文件
相对于当前目录；使用 `--pools-dir` 使用不同的
目录。

如果需要，向导会配置 Modal，询问池名称和 Cursor
服务帐户密钥，创建 `cursor-service-account` Secret，写入
池文件，并提供部署它。接受部署提示以部署
注册并为池提供服务的模态服务。

要在部署之前查看或编辑生成的文件，请传递名称和
`--no-deploy` 改为：

```bash
uvx modal-cursor init gpu-training --no-deploy
```编辑完成后，部署`pools/`中的所有池文件：

```bash
uvx modal-cursor deploy
```

验证部署：

```bash
uvx modal-cursor doctor
```

## 启动云代理

在 Cursor 中，打开云代理仪表板并使用
您通常使用的工作流程。在会话的工作人员或机器选择器中，选择
您在启动之前创建的 BYOM 池（在此示例中为 `gpu-training`）
会议。部署完成且 Cursor 已收到后，将列出该池
游泳池；如果不可用，请运行 `uvx modal-cursor doctor`。

启动会话后，Cursor 将请求放入该池中。莫代尔
Cursor 声明它，创建一个 Modal 沙箱，启动 Cursor 工作线程，然后等待
让 Cursor 将工作人员报告为已连接。然后会话将在此基础上运行
沙箱。

## 配置存储库和工作人员

生成的池文件是普通的Python。例如，`uvx 模态光标初始化
gpu-training` 写入一个包含下面的池和秘密声明的文件。
`CURSOR_SECRET_NAME` 命名包含光标的模态秘密
服务帐户密钥。将`WORKER_SECRET_NAMES`留空，除非工人需要
额外的秘密；需要时将这些模态秘密的名称添加到其中。

```python notest
"""Generated configuration for one editable Cursor worker pool."""

import modal

from modal_cursor import Pool

CURSOR_SECRET_NAME = "cursor-service-account"
WORKER_SECRET_NAMES = ()

pool = Pool(name="gpu-training")
worker = pool.machine(
    image=pool.worker_image(),  # Add application-specific image layers here.
    secrets=[modal.Secret.from_name(name) for name in WORKER_SECRET_NAMES],
    # gpu="A10G",
    # cpu=4,
    # memory=16384,
)
```

在 `pool.machine()` 调用中设置工作线程资源。请参阅 Modal 的指南
【GPU加速】(https://modal.com/docs/guide/gpu)和【CPU、内存、磁盘
配置](https://modal.com/docs/guide/resources)。

### 存储库范围的池

要使池可用于一个存储库，请在以下情况下包含其 HTTPS GitHub URL：
生成池：

```bash
uvx modal-cursor init payments \
  --repo-url https://github.com/acme/payments \
  --no-deploy
```

仅接受 `https://github.com/<owner>/<repo>` 形式的 URL。的
存储库 URL 将该存储库的请求与池关联起来。

对于私有存储库，添加 `--private-repo`。向导会提示您输入
GitHub 令牌并创建 `github-token` Secret：

```bash
uvx modal-cursor init payments \
  --repo-url https://github.com/acme/payments \
  --private-repo \
  --no-deploy
```

`GITHUB_TOKEN` 仅用于初始克隆，并在克隆之前被删除
游标工作者启动。它不嵌入远程 URL 中或可供
工人。工作人员可以编辑文件并创建本地提交；取、拉、
或推送私有存储库需要配置单独的凭据
工人。

### 自定义工人图像

`pool.worker_image()` 包含固定的 Cursor 代理 CLI 和 Git。扩展这个
[模态图像](https://modal.com/docs/guide/images) 使用工具或应用程序
在将其传递给 `pool.machine()` 之前先检查依赖关系：

```python notest
worker_image = (
    pool.worker_image()
    .apt_install("ripgrep")
    # .pip_install("your-application-dependency")
)

worker = pool.machine(
    image=worker_image,
    secrets=[modal.Secret.from_name(name) for name in WORKER_SECRET_NAMES],
    gpu="A10G",
)
```

`pool.machine()` 是您自定义工人图像、资源、额外内容的地方
秘密，以及[模态沙箱](https://modal.com/docs/guide/sandboxes)设置。
从 `pool.worker_image()` 派生自定义图像，以便固定的 Cursor 代理 CLI
和 Git 仍然可用。添加额外的模态秘密名称
`WORKER_SECRET_NAMES`。更改池文件后，再次部署：

```bash
uvx modal-cursor deploy
```

## 删除部署

要停止 Modal 部署并从 Cursor 中删除一个池：

```bash
uvx modal-cursor destroy pools/gpu-training.py --yes
```

要删除 `pools/` 中的所有池：

```bash
uvx modal-cursor destroy --yes
```

`destroy` 停止共享 Modal 部署并从中删除匹配池
光标。由于所有池文件都使用一项共享服务，因此也会破坏一个池
停止每个池的新会话，直到您再次部署。它不会删除
本地池文件或模态机密。

参考部分介绍了现有会话和工作沙箱。

## 参考

### 架构

部署分为两部分：
* 名为 `modal-cursor-control-plane` 的单个 Modal 应用程序运行
  `pools/` 中所有池文件的控制器。
* 每个已声明的请求都会从其池中创建一个临时 Modal 沙箱
  `Machine`配置。

控制器使用 Cursor 的挂起请求流并通过以下方式路由请求
`pool` 标签。工作人员通过出站连接连接到 Cursor，
没有入站端口或公共 IP 地址。

集成传递每个`Machine`的图像、工人秘密、环境、
超时，并将共享 Modal 应用程序设置为`modal.Sandbox.create`。配置这些
通过`pool.machine()`的值；不要通过`image`、`secrets`、`env`、`timeout`，或再次通过 `sandbox_options` `app`，因为这些字段是
由模态光标保留。

### 停止部署

`destroy` 停止 `modal-cursor-control-plane` Modal 应用程序并删除
与您选择的池文件匹配的游标池记录。它停止了
控制器正在运行的容器，但没有显式终止工作线程
已运行会话的沙箱。这些会议可以继续
直到他们的工作人员退出或其沙箱寿命或空闲限制达到。的
保留本地池文件和模态机密，并且不会创建新会话
在应用程序停止时声明。

### 请求生命周期
对于分配给池的请求：

1. 控制器发现来自 Cursor 的待处理请求。
2. 声明请求并获取工人身份。
3. 它使用池的 `Machine` 配置创建一个 Modal 沙箱。
4. 沙箱克隆所请求的存储库（如果适用）并启动
   游标工作线程 CLI。
5. 控制器轮询 Cursor，直到工作线程连接。

当沙箱在连接之前退出或工作人员通过以下方式保持不可见时
准备超时，配置失败，并且声明被释放以进行重试。此集成注册`workerReadyTimeoutSeconds=0`。工人们跑进来
短暂的沙箱；快照/恢复休眠和非零重新连接窗口
保持不可用状态。

### 运行时设置

以下环境变量更改控制器的生命周期默认值
和工人：

|变量|目的|默认|
| ---| ---| ---: |
| `MODAL_CURSOR_SANDBOX_TIMEOUT_S` |最大沙箱生命周期 | `21600` |
| `MODAL_CURSOR_IDLE_RELEASE_TIMEOUT_S` |发布前的空闲时间| `600` |
| `MODAL_CURSOR_SPAWNER_READY_TIMEOUT_S` |工人登记等待| `120` |
| `MODAL_CURSOR_WORKER_POLL_INTERVAL_S` |注册轮询间隔| `1` |
| `MODAL_CURSOR_CONTROLLER_TIMEOUT_S` |控制器调用生命周期 | `86400` |
| `MODAL_CURSOR_CONTROLLER_MAX_RETRIES` |控制器重试计数 | `10` |
设置 `CURSOR_API_ENDPOINT` 使用不同的 Cursor API 端点。默认
是`https://api.cursor.com`； `modal-cursor init`还可以写自定义
端点到池文件中。

### 可观察性

设置`OTEL_EXPORTER_OTLP_ENDPOINT`导出生命周期和Cursor API跨越
OTLP/HTTP。仅当设置端点时，Instrumentation 才会导出遥测数据。
`OTEL_SERVICE_NAME` 更改发出的服务名称。

这些跨度包括池、请求、工作线程、沙箱和结果元数据。他们
省略 Cursor API 密钥、Modal Secret 值以及完整的声明和机器
有效负载。

### 凭证

控制器从 `CURSOR_SECRET_NAME` Modal 接收 `CURSOR_API_KEY`
秘密并将其传递给 Cursor 工作环境。

对于私有存储库，`GITHUB_TOKEN` 与光标键分开，并且是
仅在克隆步骤中使用。它在工作人员开始之前被删除。

[modal-cursor 源存储库](https://github.com/modal-labs/modal-cursor)
包含实施细节和包发布工作流程。