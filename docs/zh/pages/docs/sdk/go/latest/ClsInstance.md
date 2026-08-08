<!-- modal-docs: machine-translated zh-CN from English source -->

# 类实例

ClsInstance 表示带有绑定参数的实例化 Modal 类。
它提供对带有绑定参数的类方法的访问。

```go
type ClsInstance struct {
}
```

## 方法

```go
Method(name string) (*Function, error)
```

方法从 ClsInstance 中返回具有给定名称的函数。