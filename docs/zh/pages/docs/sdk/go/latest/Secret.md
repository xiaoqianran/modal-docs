<!-- modal-docs: machine-translated zh-CN from English source -->

# 秘密

Secret 代表模态 Secret。

```go
type Secret struct {
	SecretID string
	Name     string
}
```

## 来自姓名

*通过`client.Secrets`访问*

```go
FromName(ctx context.Context, name string, params *SecretFromNameParams) (*Secret, error)
```

FromName 通过名称引用 Secret。

**参数** (`SecretFromNameParams`)

SecretFromNameParams 是用于查找模态机密的选项。

* `Environment` (`string`)
* `RequiredKeys` (`[]string`)

## 来自地图

*通过`client.Secrets`访问*

```go
FromMap(ctx context.Context, keyValuePairs map[string]string, params *SecretFromMapParams) (*Secret, error)
```

FromMap 从键值对映射创建 Secret。

**参数** (`SecretFromMapParams`)

SecretFromMapParams 是用于从键/值映射创建 Secret 的选项。

* `Environment` (`string`)

## 删除

*通过`client.Secrets`访问*

```go
Delete(ctx context.Context, name string, params *SecretDeleteParams) error
```

删除会删除一个命名的 Secret。

警告：删除是不可逆的，并且会影响当前使用该 Secret 的任何应用程序。

**参数** (`SecretDeleteParams`)

SecretDeleteParams 是 client.Secrets.Delete 的选项。

* `Environment` (`string`)
* `AllowMissing` (`bool`)