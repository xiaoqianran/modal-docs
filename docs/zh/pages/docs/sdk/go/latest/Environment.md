<!-- modal-docs: machine-translated zh-CN from English source -->

# 环境

环境引用模态环境并公开其资源名称空间。

```go
type Environment struct {
	EnvironmentID string
	Name          string
	Apps          EnvironmentAppsService
}
```

## 来自上下文

*通过`client.Environments`访问*

```go
FromContext(ctx context.Context) (*Environment, error)
```

FromContext 使用当前上下文查找环境对象。

该方法返回本地配置定义的环境
（即，`ClientParams`中设置的环境、您的活动配置文件或
MODAL\_ENVIRONMENT 环境变量），或者获取默认环境
如果未在本地定义，则来自服务器。如果在 Modal 容器内调用，
它将返回与容器关联的环境。

```go
env, err := client.Environments.FromContext(ctx)
if err != nil {
	return err
}
fmt.Println(env.EnvironmentID, env.Name)
```## 来自姓名

*通过`client.Environments`访问*

```go
FromName(ctx context.Context, name string, params *EnvironmentFromNameParams) (*Environment, error)
```

FromName 按名称查找环境，如果不存在则可以选择创建它。

**参数** (`EnvironmentFromNameParams`)

EnvironmentFromNameParams 是 client.Environments.FromName 的选项。

* `CreateIfMissing` (`bool`)

## 环境.应用程序

EnvironmentAppsService 访问环境中的应用程序。

### 列表

```go
List(ctx context.Context) (iter.Seq2[*App, error], error)
```

列出实时应用程序的产量句柄，不包括已停止和禁用的应用程序。
列出应用程序不会创建应用程序。 RPC 错误是在迭代过程中产生的。

## 客户端.环境.对象

对象提供了创建、列出和删除环境的方法。

### 创建

```go
Create(ctx context.Context, name string, params *EnvironmentCreateParams) error
```
Create 创建一个具有给定名称的环境。

**参数** (`EnvironmentCreateParams`)

EnvironmentCreateParams 是 client.Environments.Objects.Create 的选项。

* `Restricted` (`bool`)：限制对具有明确分配的环境角色的用户的访问。
* `DefaultRole` (`string`)：DefaultRole 是工作区成员的默认环境角色。

### 列表

```go
List(ctx context.Context) (iter.Seq2[*Environment, error], error)
```

列表产生环境句柄，无需额外的查找请求。
RPC 错误是在迭代过程中产生的。

### 删除

```go
Delete(ctx context.Context, name string) error
```

删除会永久删除环境及其中的所有对象。