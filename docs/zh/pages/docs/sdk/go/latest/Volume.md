<!-- modal-docs: machine-translated zh-CN from English source -->

# 音量

Volume 表示提供持久存储的模态卷。

```go
type Volume struct {
	VolumeID string
	Name     string
}
```

## 来自姓名

*通过`client.Volumes`访问*

```go
FromName(ctx context.Context, name string, params *VolumeFromNameParams) (*Volume, error)
```

FromName 通过名称引用卷。

**参数** (`VolumeFromNameParams`)

VolumeFromNameParams 是用于查找模态体积的选项。

* `Environment` (`string`)
* `CreateIfMissing` (`bool`)

## 短暂的

*通过`client.Volumes`访问*

```go
Ephemeral(ctx context.Context, params *VolumeEphemeralParams) (*Volume, error)
```

Ephemeral 创建一个无名的临时 Volume，该 Volume 会一直存在，直到调用 CloseEphemeral 或进程退出为止。

**参数** (`VolumeEphemeralParams`)

VolumeEphemeralParams 是 client.Volumes.Ephemeral 的选项。

* `Environment` (`string`)

## 删除

*通过`client.Volumes`访问*```go
Delete(ctx context.Context, name string, params *VolumeDeleteParams) error
```

删除会删除已命名的卷。

警告：删除是不可逆的，并且会影响当前使用该卷的任何应用程序。

**参数** (`VolumeDeleteParams`)

VolumeDeleteParams 是 client.Volumes.Delete 的选项。

* `Environment` (`string`)
* `AllowMissing` (`bool`)

## 关闭短暂的

```go
CloseEphemeral()
```

CloseEphemeral 删除临时 Volume，仅与 VolumeEphemeral 一起使用。

## 带安装选项

```go
WithMountOptions(options *VolumeMountOptionsParams) *Volume
```

WithMountOptions 配置卷的安装方式。保留选项中保留为 nil 的字段
同一卷上任何先前 WithMountOptions 调用的相应值（堆叠）。

**参数** (`VolumeMountOptionsParams`)
VolumeMountOptionsParams 是用于安装卷的选项。字段是指针，因此未设置值
保留先前 WithMountOptions 调用中的相应选项（堆叠）。

* `ReadOnly` (`*bool`)
* `SubPath` (`*string`)