<!-- modal-docs: machine-translated zh-CN from English source -->

# 云桶安装

云存储桶安装提供对模态函数内的云存储桶的访问。

```typescript
class CloudBucketMount {
  readonly bucketName: string;
  readonly secret?: Secret;
  readonly readOnly: boolean;
  readonly requesterPays: boolean;
  readonly bucketEndpointUrl?: string;
  readonly keyPrefix?: string;
  readonly oidcAuthRoleArn?: string;
}
```

## 创建

*通过`modal.cloudBucketMounts`访问*

```typescript
create(
  bucketName: string,
  params: {
    secret?: Secret;
    readOnly?: boolean;
    requesterPays?: boolean;
    bucketEndpointUrl?: string;
    keyPrefix?: string;
    oidcAuthRoleArn?: string;
  } = {},
): CloudBucketMount
```