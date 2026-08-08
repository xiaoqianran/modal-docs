<!-- modal-docs: machine-translated zh-CN from English source -->

# S3 网关端点

在AWS中运行工作负载时，我们的系统会自动使用相应的
[S3 网关端点](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html)
确保 Modal 和 S3 之间的低成本、最佳性能和网络可靠性。

在 Modal 上运行的工作负载不应产生相关的出口或入口费用
与 S3 操作。您的应用程序无需配置即可使用 S3 网关端点。
当您的应用程序在 AWS 上运行时，会自动使用 S3 网关端点。

## 端点配置

仅使用特定于区域的端点 (`s3.<region>.amazonaws.com`) 或
全球 AWS 端点 (`s3.amazonaws.com`)。使用来自一个区域的 S3 端点
在另一个**不会使用 S3 网关端点而产生网络成本**。

避免手动指定区域端点，因为这可能会导致意外成本
或性能下降。

## 区域间成本

S3 网关端点保证同一 AWS 区域内的网络流量不产生任何费用。
但是，如果您的模态函数在一个区域中运行，但您的存储桶驻留在
不同区域，您将需要支付区域间流量费用。

您可以通过将模态应用程序安排在您的同一区域来防止这种情况发生
具有[区域选择](https://modal.com/docs/guide/region-selection#region-selection)的S3存储桶。