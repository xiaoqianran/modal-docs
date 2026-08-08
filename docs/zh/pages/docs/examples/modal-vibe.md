<!-- modal-docs: machine-translated zh-CN from English source -->

# Modal Vibe：可扩展的人工智能编码平台

<center>
<video controls playsinline class="w-full aspect-[16/9]" poster="https://modal-cdn.com/blog/videos/modal-vibe-scaleup-poster.png">
<source src="https://modal-cdn.com/blog/videos/modal-vibe-scaleup.mp4" type="video/mp4">
<track kind="captions" />
</video>
</center>

[Modal Vibe 存储库](https://github.com/modal-labs/modal-vibe) 演示了如何构建
Modal 上的可扩展人工智能编码平台。

应用程序的用户可以提示法学硕士创建通过 UI 为 React 提供服务的沙盒应用程序。

每个应用程序都位于[模态沙箱](https://modal.com/docs/guide/sandboxes)
并包含一个可通过以下方式访问的网络服务器
[模态隧道](https://modal.com/docs/guide/tunnels)。

有关 Modal Vibe 的高级概述，包括性能数据及其重要性，请参阅
[随附的博客文章](https://modal.com/blog/modal-vibe)。有关实施的详细信息，请继续阅读。

## 它的结构如何

![Modal Vibe 架构图](https://modal-cdn.com/modal-vibe/architecture.png)

* `main.py` 是运行 FastAPI 控制器的入口点，该控制器为 Web 应用程序提供服务并管理沙箱应用程序。
* `core`包含`SandboxApp`模型的逻辑和LLM逻辑。
* `sandbox` 包含一个小型 HTTP 服务器，该服务器放置在创建的每个沙箱中，以及一些沙箱生命周期管理代码。
* `web` 包含用户查看并与之交互的 Modal Vibe 网站，以及管理沙箱的 api 服务器。

## 如何运行

首先，搭建本地环境：

```bash
python3 -m venv venv && source venv/bin/activate && pip install -r requirements.dev.txt
```

### 部署
要部署到 Modal，请将 `.env.example` 复制到名为 `.env` 的文件并添加您的 `ANTHROPIC_API_KEY`。
另外，创建一个名为 `anthropic-secret` 的 [Modal Secret](https://modal.com/docs/guide/secrets)，以便我们的应用程序可以访问它。

然后，使用 Modal 部署应用程序：

```bash
modal deploy -m main
```

### 本地发展

运行负载测试：

```bash
modal run main.py::create_app_loadtest_function --num-apps 10
```

删除沙箱：

```bash
modal run main.py::delete_sandbox_admin_function --app-id <APP_ID>
```

运行示例沙箱 HTTP 服务器：

```bash
python -m sandbox.server
```