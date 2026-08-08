<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用程序

应用程序引用已部署的模态应用程序。

```go
type App struct {
	AppID       string
	Name        string
	Environment string
}
```

## 来自姓名

*通过`client.Apps`访问*

```go
FromName(ctx context.Context, name string, params *AppFromNameParams) (*App, error)
```

FromName 引用具有给定名称的应用程序，如有必要，创建一个新应用程序。

**参数** (`AppFromNameParams`)

AppFromNameParams 是 client.Apps.FromName 的选项。

* `Environment` (`string`)
* `CreateIfMissing` (`bool`)