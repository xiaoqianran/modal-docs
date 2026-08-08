<!-- modal-docs: machine-translated zh-CN from English source -->

# 应用程序

代表已部署的模态应用程序。

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