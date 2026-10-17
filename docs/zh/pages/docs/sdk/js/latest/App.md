<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用程序

代表模态应用程序。

```typescript
class App {
  readonly appId: string;
  readonly name?: string;
  readonly environmentName?: string;
}
```

## 来自姓名

*通过`modal.apps`访问*

```typescript
async fromName(name: string, params: AppFromNameParams = {}): Promise<App>
```

按名称引用已部署的`App`，如果不存在则创建。

**参数** (`AppFromNameParams`)

`client.apps.fromName()` 的可选参数。

* `environment?` (`string`)
* `createIfMissing?` (`boolean`)

## 信息

```typescript
async info(params: AppInfoParams = {}): Promise<AppInfo>
```

返回有关此应用程序的信息，包括其生命周期以及成员函数和服务器。
默认情况下，返回上次查找、列出或刷新的快照。

**参数** (`AppInfoParams`)

`App.info` 的可选参数。

* `refresh?` (`boolean`)：获取当前信息而不是缓存的查找或列出快照。