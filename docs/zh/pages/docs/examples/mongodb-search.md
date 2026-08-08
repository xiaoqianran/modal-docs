<!-- modal-docs: machine-translated zh-CN from English source -->

# 使用 MongoDB Atlas Vector 和 GeoJSON 搜索与 Modal

这个[示例仓库](https://github.com/modal-labs/search-california)
演示如何一起使用 Modal 和 MongoDB
构建全栈应用程序。

该应用程序是一个混合搜索引擎，
就像为 RAG 聊天机器人提供动力的检索引擎一样，
但对于加利福尼亚州的卫星图像。
可以根据图像搜索
地理空间和时间元数据或基于其语义内容
由预先训练的嵌入模型捕获。

我们使用【粘土基础模型】(https://clay-foundation.github.io/model/index.html)
用于嵌入，我们从欧洲航天局获取图像
[哨兵卫星](https://www.esa.int/Applications/Observing_the_Earth/Copernicus/The_Sentinel_missions)。

您可以尝试一下我们的应用程序部署
[这里](https://modal-labs-examples--clay-hybrid-search.modal.run/)。

## 概述

应用程序的中心是 MongoDB Atlas 实例
它存储卫星图像集合的元数据。

Modal 围绕该数据库编排计算：
从其他地方检索数据并将其存储在数据库中，
计算数据库中数据的向量嵌入，
并为前端和客户端提供服务。

数据流看起来像这样：

1.每隔几天，欧洲航天局就会
   [哨兵卫星](https://www.esa.int/Applications/Observing_the_Earth/Copernicus/The_Sentinel_missions)
完成对整个地球的全面穿越，包括加利福尼亚州。
   这些图像可通过[公共 STAC API](https://element84.com/geospatial/introducing-earth-search-v1-new-datasets-now-available/) 获取。
2. 每天，我们在 Modal 上运行一个查询 STAC API 的作业
   获取加利福尼亚州的新图像并将元数据存储在 MongoDB Atlas 中
   数据库实例。
3. 我们在 Modal 上异步运行一个作业来检查哪些条目
   数据库中没有关联的嵌入。
   然后将这些图像发送到无服务器嵌入服务
   在模态上运行。我们将生成的嵌入发送到数据库。
4. 我们在 Modal 上托管一个数据库客户端，允许应用程序
   开发人员操纵数据。该客户端也被两个人使用
   用于矢量和地理空间搜索查询的 Web 功能
   阿特拉斯搜索。
5. 最后，我们在 Modal 上运行一个简单的静态 FastAPI 服务器来提供服务
   用于执行这些查询并呈现其结果的 Alpine JS 前端。

整个应用程序 -
从 API 查询和前端 UI 到 GPU 推理和混合搜索 —
仅使用 Modal 和 MongoDB Atlas 来交付。
自己设置只需要这些平台上的凭据
和一些命令，详细信息如下。
## 部署后端

### 设置：Modal 和 MongoDB Atlas

您的本地计算机上需要有一个 Python 环境。
任何最新版本的 Python 都可以。
大多数依赖项将安装在 Modal 上的环境中，
所以你不需要太担心。

按照[此处](https://modal.com/docs/guide#getting-started)的说明进行操作
设置您的 Modal 帐户。
Modal 免费套餐中包含的每月 30 美元的计算费用为
足以部署和托管此示例。

您还需要一个 MongoDB Atlas 帐户。
您可以在[此处](https://www.mongodb.com/docs/atlas/getting-started/)找到说明。
我们更喜欢使用 UI 而不是 CLI 进行设置。
免费套餐足以运行此示例。

您需要创建一个名为 `modal-examples` 的数据库。
确保可以从[所有 IP 地址](https://stackoverflow.com/questions/66035947/allow-access-from-anywhere-mongodb-atlas) 访问它。
在此过程中，您将创建一个带有密码的数据库用户。
导航至 Modal Secrets 仪表板 [此处](https://modal.com/secrets)
并添加此信息以及数据库的连接字符串，
基于仪表板中可用的 MongoDB 模板的模态密钥。

### MongoDB 客户端 (`database.py`)

如果您的 Modal Secret 和 MongoDB Atlas 实例设置正确，
您应该能够运行以下命令：

```bash
modal run -m backend.database::MongoClient.ping
```
一旦该命令起作用，您就可以开始操作数据库
来自莫代尔。

首先，您需要将感兴趣区域 (AOI) 添加到数据库中：

```bash
modal run -m backend.database --action add_aoi
```

默认情况下，它是 GeoJSON 定义的加利福尼亚州
在此存储库的 `data` 文件夹中（最初检索自
[`geojsonio` GitHub 存储库](https://github.com/ropensci/geojsonio/blob/7e4cc683ed3d6eec38a8cae5ce03fa6d82acafc7/inst/examples/california.geojson))。
您可以将不同的 GeoJSON 文件传递给 `add_aoi` 操作
带有 `--target` 标志。

`modal run` 命令用于一次性任务。
部署数据库客户端以供应用程序的其他部分使用
以及任何人都可以用来运行搜索查询的网络挂钩，我们使用`modal deploy`：

```bash
modal deploy -m backend.database
```

这些 webhook 附带交互式 OpenAPI 文档，
您可以通过导航到部署 URL 的 `/docs` 路由来访问它。
您应该在终端输出中看到该 URL。
您还可以在应用程序的[模态仪表板](https://modal.com/apps)中找到该URL。

对于我们的部署，地理区域的交互式文档的 URL
搜索端点是
[`https://modal-labs-examples--clay-mongo-client-geo-search.modal.run/docs`](https://modal-labs-examples--clay-mongo-client-geo-search.modal.run/docs)。

如果您尚未为数据库实例运行回填作业，
如下所述，此搜索不会返回任何结果，
但您可以使用它来检查数据库客户端是否已部署。

### 回填和更新 (`extract.py`)
我们通过查询 Sentinel STAC API 中的图像来将数据添加到数据库中。

运行以下命令在 AOI 中搜索图像
上周的数据并将其添加到数据库中：

```bash
modal run -m backend.extract
```

您可以通过 Atlas UI 检查结果
或者通过在数据库客户端的地理搜索 Webhook 中执行搜索查询，
如上所述。

要定期使用新图像更新数据库，
我们部署`extract.py`中定义的应用程序：

```bash
modal deploy -m backend.extract
```

该应用程序还运行常规作业以将嵌入添加到图像中
在数据库中。

但它本身并不计算嵌入——嵌入由单独的服务提供，
接下来将对此进行描述。

### 粘土嵌入服务 (`embeddings.py`)

构建嵌入服务的环境
并在一些示例数据上测试嵌入引擎，
执行以下命令：

```bash
modal run -m backend.embeddings
```

为了在 Modal 上部署它，我们再次使用 `modal deploy`：

```bash
modal deploy -m backend.embeddings
```

### 把它们放在一起

现在嵌入服务已经部署完毕，
我们可以通过调用 `enrich_vectors` 添加向量
`extract` 与 `modal run` 中的函数：

```bash
modal run -m backend.extract::enrich_vectors
```

此命令将确保数据库中的所有图像都有嵌入。

您应该能够在通过 Atlas UI 查看的记录中观察到它们
或者通过数据库客户端的地理搜索 webhook 执行搜索查询，
如前所述。

要使用嵌入进行搜索，我们建议运行前端 UI，
我们接下来会讲到这一点。

## 部署前端

前端比后端简单得多。
它由一个小型 Alpine JS 应用程序和一个 FastAPI Python 服务器组成
将其传递给客户端浏览器。

您可以使用我们的前端部署
[这里](https://modal-labs-examples--clay-hybrid-search.modal.run/)。

### Alpine 应用程序 (`app.js`)

Alpine 应用程序提供了用于构建地理搜索查询的基本界面
通过单击地图并查看结果。
单击返回的图像会触发对相似图像的矢量搜索。
此外，还可以使用日期选择器按日期过滤图像。

### FastAPI 服务器 (`serve.py`)

该应用程序由 FastAPI 服务器向客户端提供服务。

要部署它，请运行以下命令：

```bash
modal deploy -m frontend
```