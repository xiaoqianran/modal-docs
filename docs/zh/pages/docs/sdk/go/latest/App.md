<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用程序

应用程序引用模态应用程序。

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

## 信息

```go
Info(ctx context.Context, params *AppInfoParams) (*AppInfo, error)
```

信息返回先前查找、列出或刷新的快照。
设置“刷新”以获取当前生命周期信息以及成员函数和服务器 ID。
返回的信息是一个副本，调用者可以独立修改。

**参数** (`AppInfoParams`)

AppInfoParams 是 App.Info 的选项。

* `Refresh` (`bool`)：刷新获取当前信息而不是缓存的快照。