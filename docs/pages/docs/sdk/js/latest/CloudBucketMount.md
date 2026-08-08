# CloudBucketMount

Cloud Bucket Mounts provide access to cloud storage buckets within Modal Functions.

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

## create

*Accessed via `modal.cloudBucketMounts`*

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
