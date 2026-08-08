<!-- modal-docs: machine-translated zh-CN from English source -->

# CLs

Cls 表示可以使用参数实例化的 Modal 类定义。
它包含有关该类及其方法的元数据。

```go
type Cls struct {
}
```

## 来自姓名

*通过`client.Cls`访问*

```go
FromName(ctx context.Context, appName string, name string, params *ClsFromNameParams) (*Cls, error)
```

FromName 通过名称引用来自已部署应用程序的 Cl。

**参数** (`ClsFromNameParams`)

ClsFromNameParams 是 client.Cls.FromName 的选项。

* `Environment` (`string`)
* `Version` (`int`)：版本查找部署在此应用程序版本上的版本固定 Cls。

## 实例

```go
Instance(ctx context.Context, parameters map[string]any) (*ClsInstance, error)
```

实例使用提供的参数创建类的新实例。

## 带批处理

```go
WithBatching(params *ClsWithBatchingParams) *Cls
```WithBatching 创建启用动态批处理或用新值覆盖的 Cls 实例。

**参数** (`ClsWithBatchingParams`)

ClsWithBatchingParams 表示 Modal Cls 的批处理配置。

* `MaxBatchSize` (`int`)
* `Wait` (`time.Duration`)

## 并发性

```go
WithConcurrency(params *ClsWithConcurrencyParams) *Cls
```

WithConcurrency 创建一个启用输入并发性或用新值覆盖的 Cls 实例。

**参数** (`ClsWithConcurrencyParams`)

ClsWithConcurrencyParams 表示 Modal Cls 的并发配置。

* `MaxInputs` (`int`)
* `TargetInputs` (`*int`)

## 带选项

```go
WithOptions(params *ClsWithOptionsParams) *Cls
```

WithOptions 在运行时覆盖静态 Function 配置。

**参数** (`ClsWithOptionsParams`)
ClsWithOptionsParams 表示模态 Cl 的运行时选项。

* `CPU` (`*float64`)
* `CPULimit` (`*float64`)
* `MemoryMiB` (`*int`)
* `MemoryLimitMiB` (`*int`)
* `GPU` (`*string`)
* `Env` (`map[string]string`)
* `Secrets` (`[]*Secret`)
* `Volumes` (`map[string]*Volume`)
* `Retries` (`*Retries`)
* `MaxContainers` (`*int`)
* `BufferContainers` (`*int`)
* `ScaledownWindow` (`*time.Duration`)
* `Timeout` (`*time.Duration`)
* `RoutingRegion` (`*string`)