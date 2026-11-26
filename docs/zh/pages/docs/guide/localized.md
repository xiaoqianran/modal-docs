<!-- modal-docs: machine-translated zh-CN from English source -->

# 本地化放置

<Callout variant="info">

`@modal.experimental.localized()` 是
[实验装饰器](/docs/guide/feature-maturity#experimental-sdk)。

</Callout>

Modal 在多个不同的云中全局运行容器。默认情况下，
容器可以在任何有容量的地方运行，但某些应用程序有延迟
要求并需要容器在靠近特定地理位置的地方运行。

本地化放置可让您指定容器的放置位置
跑。 Modal 将尝试将您的容器安排在尽可能靠近该位置的位置可能，但需支付额外费用。如果莫代尔将容器放置在您首选的容器之外
地区，集装箱计费费率较低。

放置使用以下距离类别，从您的目标开始测量
运行容器的数据中心的位置：

|距离类别|距目标的距离 |大约延迟 |定价乘数|
| ----------------- | -------------------- | ------------------- | ------------------ |
| `short` | <800公里| <20 毫秒 | 1.8 倍 |
| `medium` | <2,500 公里 | <50 毫秒 | 1.5 倍 |
| `long` | <6,400 公里 | <100 毫秒 | 1.1 倍 |
| `none`（任何地方）|任何|不适用 | 1x |

## 配置本地化放置

在 Function 或 Server 装饰器下面添加 `@modal.experimental.localized()` ：

```python notest
@app.function(gpu="H100")
@modal.experimental.localized(
    target_location="san-jose",
    preferred_distance="medium",
    max_distance="long",
)
```

装饰器接受三个可选参数：

* `target_location`：您希望容器运行附近的位置。当省略时，
  它使用您的路由区域的位置。
* `preferred_distance`：最大定价乘数。默认为
  分钟（`medium`，`max_distance`）。
* `max_distance`：容器可运行的最远距离类别。
  默认为`none`。仅当您的应用程序具有严格的延迟时才设置此限制要求并且不能容忍进一步的安置；限制放置可以
  延迟启动。

Modal 将尝试将容器放置在给定的`preferred_distance`内
可用容量。否则，容器将被放置在最近的可用位置
`max_distance`内的地点。

对于请求通过 Modal 路由的应用程序，省略 `target_location`
首选[路由区域](/docs/guide/region-selection#regional-routing)附近的容器：

```python notest
@app.server(routing_region="us-west")
@modal.experimental.localized(
    preferred_distance="medium",
    max_distance="long",
)
```

## 定价

在我们的[基本使用定价](https://modal.com/pricing)之上应用乘数
每个容器，基于其与目标位置的距离。如果集装箱落地
* **在`preferred_distance`**内：集装箱按该类别计费
  乘数，即使它更接近目标。
* **境外`preferred_distance`**：集装箱按较低计费
  其运行距离类别的乘数。

### 将本地化放置与区域限制相结合

对于具有数据驻留要求的工作负载，您可以结合本地化
放置在[广泛区域](/docs/guide/region-selection#container-region-options)。
不支持与狭窄区域的组合。

容器放置同时满足`max_distance`和区域限制。
每个集装箱按其本地乘数和实际乘数之间较高的费率计费。
[区域乘数](/docs/guide/region-selection#pricing)。

## 位置选项

`target_location` 支持的选项有 `ashburn`、`chicago`、`columbus`、`dallas`、
`dublin`、`frankfurt`、`los-angeles`、`phoenix` 和 `san-jose`。

随着时间的推移，将会添加更多地点。如果您需要的地点不在此处，请告诉我们！

## 限制

沙箱、函数或服务器不支持本地化放置
`modal.clustered` 装饰器。