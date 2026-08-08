<!-- modal-docs: machine-translated zh-CN from English source -->

# Python SDK 参考

这是 [`modal`](https://pypi.org/project/modal/) 的 API 参考
Python SDK，它允许您以编程方式与 Modal 交互。

## 应用构建

|  |  |
| --- | --- |
| [`App`](/docs/sdk/py/latest/App) | Modal 上代码部署的主要单元 |
| [`App.function`](/docs/sdk/py/latest/App#function) |用于向 App 注册函数的装饰器 |
| [`App.cls`](/docs/sdk/py/latest/App#cls) |用于通过 App 注册类的装饰器 |
| [`App.server`](/docs/sdk/py/latest/App#server) |用于向应用程序注册服务器的装饰器 |## 无服务器执行

|  |  |
| --- | --- |
| [`Function`](/docs/sdk/py/latest/Function) |由自动扩展容器池支持的无服务器功能 |
| [`Cls`](/docs/sdk/py/latest/Cls) |支持参数化和生命周期挂钩的无服务器类 |
| [`Server`](/docs/sdk/py/latest/Server) |具有低延迟请求路由的无服务器 HTTP 应用程序 |

## 扩展功能配置

### 类参数化

|  |  |
| --- | --- |
| [`parameter`](/docs/sdk/py/latest/parameter) |用于定义类参数，类似于数据类字段 |

### 生命周期挂钩

|  |  |
| --- | --- |
| [`enter`](/docs/sdk/py/latest/enter) |将在容器启动期间执行的方法的装饰器 |
| [`exit`](/docs/sdk/py/latest/exit) |将在容器关闭期间执行的方法的装饰器 |
| [`method`](/docs/sdk/py/latest/method) |用于将方法公开为可调用函数的装饰器 |

### 网络集成

|  |  |
| --- | --- |
| [`fastapi_endpoint`](/docs/sdk/py/latest/fastapi_endpoint) |用于公开基于 FastAPI 的简单端点的装饰器 |
| [`asgi_app`](/docs/sdk/py/latest/asgi_app) |构建 ASGI Web 应用程序的函数装饰器 || [`wsgi_app`](/docs/sdk/py/latest/wsgi_app) |构造 WSGI Web 应用程序的函数装饰器 |
| [`web_server`](/docs/sdk/py/latest/web_server) |构造 HTTP Web 服务器的函数装饰器 |

### 函数语义

|  |  |
| --- | --- |
| [`batched`](/docs/sdk/py/latest/batched) |启用[动态输入批处理](/docs/guide/dynamic-batching) 的装饰器 |
| [`concurrent`](/docs/sdk/py/latest/concurrent) |启用[输入并发](/docs/guide/concurrent-inputs) | 的装饰器

### 日程安排

|  |  |
| --- | --- |
| [`Cron`](/docs/sdk/py/latest/Cron) |基于 cron 语法运行的计划 |
| [`Period`](/docs/sdk/py/latest/Period) |以固定时间间隔运行的计划 |

### 异常处理

|  |  |
| --- | --- |
| [`Retries`](/docs/sdk/py/latest/Retries) |输入失败的函数重试策略 |

## 沙盒执行

|  |  |
| --- | --- |
| [`Sandbox`](/docs/sdk/py/latest/Sandbox) |限制代码执行的接口 |
| [`ContainerProcess`](/docs/sdk/py/latest/container_process#containerprocess) |代表沙盒进程的对象 |
| [`FileIO`](/docs/sdk/py/latest/file_io#fileio) |沙盒文件系统中文件的句柄 |

## 容器配置

|  |  || --- | --- |
| [`Image`](/docs/sdk/py/latest/Image) |用于指定容器镜像的API |
| [`Secret`](/docs/sdk/py/latest/Secret) |指向将作为环境变量公开的秘密的指针 |

## 数据原语

### 持久存储

|  |  |
| --- | --- |
| [`Volume`](/docs/sdk/py/latest/Volume) |支持高性能并行读取的分布式存储 |
| [`CloudBucketMount`](/docs/sdk/py/latest/CloudBucketMount) |由第三方云存储桶（S3等）支持的存储 |

### 内存存储

|  |  |
| --- | --- |
| [`Dict`](/docs/sdk/py/latest/Dict) |分布式键值存储 |
| [`Queue`](/docs/sdk/py/latest/Queue) |分布式 FIFO 队列 |

## 账户配置

|  |  |
| --- | --- |
| [`Workspace`](/docs/sdk/py/latest/Workspace) |工作区级配置和可观察性 |
| [`Environment`](/docs/sdk/py/latest/Environment) |管理工作区细分 |

## 网络

|  |  |
| --- | --- |
| [`Proxy`](/docs/sdk/py/latest/Proxy) |为容器提供静态出站IP地址的对象 |
| [`forward`](/docs/sdk/py/latest/forward) |用于公开容器中端口的上下文管理器 |