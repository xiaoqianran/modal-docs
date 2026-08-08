<!-- modal-docs: machine-translated zh-CN from English source -->

# 云桶安装

CloudBucketMount 提供对模态函数内云存储桶的访问。

```go
type CloudBucketMount struct {
	BucketName        string
	Secret            *Secret
	ReadOnly          bool
	RequesterPays     bool
	BucketEndpointURL *string
	KeyPrefix         *string
	OidcAuthRoleArn   *string
}
```

## 新

*通过`client.CloudBucketMounts`访问*

```go
New(bucketName string, params *CloudBucketMountParams) (*CloudBucketMount, error)
```

New 创建一个新的 CloudBucketMount。

**参数** (`CloudBucketMountParams`)

CloudBucketMountParams 是用于创建 CloudBucketMount 的选项。

* `Secret` (`*Secret`)
* `ReadOnly` (`bool`)
* `RequesterPays` (`bool`)
* `BucketEndpointURL` (`*string`)
* `KeyPrefix` (`*string`)
* `OidcAuthRoleArn` (`*string`)