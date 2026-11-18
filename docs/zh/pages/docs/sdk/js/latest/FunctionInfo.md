<!-- modal-docs: machine-translated zh-CN from English source -->

# 函数信息

```typescript
type FunctionInfo = {
  cpu?: number | [number, number];
  memoryMiB?: number | [number, number];
  gpus: { gpuType: string; count: number }[];
  ephemeralDiskMiB?: number;

  imageId: string;

  startupTimeoutSecs?: number;
  timeoutSecs: number;
  maxRetries?: number;

  nonpreemptible: boolean;
  regions?: string[];
  routingRegion?: string;
  cloud?: string;

  clusterInfo?: { size: number; rdma: boolean; fabricSize?: number };
  batchingInfo?: { maxBatchSize: number; waitMs: number };
  concurrencyInfo?: { maxInputs?: number; targetInputs?: number };

  schedule?: string;

  restrictModalAccess: boolean;
  blockNetwork: boolean;
  singleUseContainers: boolean;

  volumes: Map<
    string,
    { volumeId: string; readOnly: boolean; subPath?: string }
  >;
  cloudBucketMounts: Map<
    string,
    {
      bucketName: string;
      bucketType: "s3" | "r2" | "gcp";
      readOnly: boolean;
      keyPrefix?: string;
    }
  >;
  secretIds: string[];

  webInfo?: { webUrl: string; method?: string; unauthenticated: boolean };

  methodNames?: string[];
  methodDetails?: Map<
    string,
    { webUrl: string; method?: string; unauthenticated: boolean }
  >;
};
```