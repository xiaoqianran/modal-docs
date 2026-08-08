# CloudBucketMount

CloudBucketMount provides access to cloud storage buckets within Modal Functions.

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

## New

*Accessed via `client.CloudBucketMounts`*

```go
New(bucketName string, params *CloudBucketMountParams) (*CloudBucketMount, error)
```

New creates a new CloudBucketMount.

**Parameters** (`CloudBucketMountParams`)

CloudBucketMountParams are options for creating a CloudBucketMount.

* `Secret` (`*Secret`)
* `ReadOnly` (`bool`)
* `RequesterPays` (`bool`)
* `BucketEndpointURL` (`*string`)
* `KeyPrefix` (`*string`)
* `OidcAuthRoleArn` (`*string`)
