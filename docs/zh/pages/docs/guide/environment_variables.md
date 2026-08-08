<!-- modal-docs: machine-translated zh-CN from English source -->

# 环境变量

Modal 运行时在初始化期间设置几个环境变量。的
这些环境变量的键被保留并且不能被覆盖
您的函数或沙箱配置。

这些变量提供有关容器运行时的信息
环境。

## 容器运行时环境变量

每个 Modal 容器中都存在以下变量：

* **`MODAL_CLOUD_PROVIDER`** — Modal 跨多个云执行容器
  提供商（[AWS](https://aws.amazon.com/)、[GCP](https://cloud.google.com/)、
  [OCI](https://www.oracle.com/cloud/))。该变量指定哪个云Modal 容器在其中运行的提供者。
* **`MODAL_IMAGE_ID`** — 的 ID
  Modal 容器使用的 [`modal.Image`](/docs/sdk/py/latest/Image)。
* **`MODAL_REGION`** — 这将对应于来自的地理区域标识符
  与 Modal 容器关联的云提供商（见上文）。对于 AWS 来说，
  标识符是一个“区域”。对于 GCP 来说，它是一个“区域”，对于 OCI 来说，它是一个
  “可用域”。示例值为 `us-east-1` (AWS)、`us-central1`
  （GCP），`us-ashburn-1`（OCI）。请参阅[此处的完整列表](/docs/guide/region-selection#container-region-options)。
* **`MODAL_TASK_ID`** — 运行模态函数或沙箱的容器的 ID。
## 函数运行时环境变量

运行模态函数的容器中存在以下变量：

* **`MODAL_ENVIRONMENT`** — 的名称
  [模态环境](/docs/guide/environments) 容器正在其中运行。
* **`MODAL_IS_REMOTE`** - 设置为“1”表示模态函数代码正在运行
  一个远程容器。
* **`MODAL_IDENTITY_TOKEN`** — [OIDC 代币](/docs/guide/oidc-integration)
  编码模态函数的恒等式。

## 沙箱环境变量

[`modal.Sandbox`](/docs/sdk/py/latest/Sandbox) 实例中存在以下变量。

* **`MODAL_SANDBOX_ID`** — 沙盒的 ID。

## 容器镜像环境变量

`modal.Image`使用的容器图像层可以设置
环境变量。这些变量将出现在容器的运行时中
环境。例如，
[`debian_slim`](/docs/sdk/py/latest/Image#debian_slim) 图像设置
`GPG_KEY` 可变。

要覆盖图像变量或设置新变量，请使用
[`.env`](https://modal.com/docs/sdk/py/latest/Image#env) 提供的方法
`modal.Image`。