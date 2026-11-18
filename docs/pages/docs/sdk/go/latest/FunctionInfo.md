# FunctionInfo

FunctionInfo contains the configuration of a Function, including any
overrides applied with WithOptions, WithConcurrency, or WithBatching.

```go
type FunctionInfo struct {
	CPU            *float64
	CPULimit       *float64
	MemoryMiB      *uint32
	MemoryLimitMiB *uint32
	GPUs           []struct {
		GpuType string
		Count   uint32
	}
	EphemeralDiskMiB *uint32
	ImageID          string
	StartupTimeout   *time.Duration
	Timeout          time.Duration
	MaxRetries       *uint32
	Nonpreemptible   bool
	Regions          []string
	RoutingRegion    *string
	Cloud            *string
	ClusterInfo      *struct {
		Size       uint32
		Rdma       bool
		FabricSize *uint32
	}
	BatchingInfo *struct {
		MaxBatchSize uint32
		WaitMs       uint64
	}
	ConcurrencyInfo *struct {
		MaxInputs    *uint32
		TargetInputs *uint32
	}
	Schedule            *string
	RestrictModalAccess bool
	BlockNetwork        bool
	SingleUseContainers bool
	Volumes             map[string]struct {
		VolumeID string
		ReadOnly bool
		SubPath  *string
	}
	CloudBucketMounts map[string]struct {
		BucketName string
		BucketType string // "s3", "r2", "gcp"
		ReadOnly   bool
		KeyPrefix  *string
	}
	SecretIDs []string
	WebInfo   *struct {
		WebURL          string
		Method          *string
		Unauthenticated bool
	}
	MethodNames   []string
	MethodDetails map[string]struct {
		WebURL          string
		Method          *string
		Unauthenticated bool
	}
}
```
