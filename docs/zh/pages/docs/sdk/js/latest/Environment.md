<!-- modal-docs: machine-translated zh-CN from English source -->

# 环境

模态环境，具有用于访问其资源的名称空间。

```typescript
class Environment {
  readonly environmentId: string;
  readonly name: string;
  readonly apps: EnvironmentAppsService;
}
```

## 来自姓名

*通过`modal.environments`访问*

```typescript
async fromName(
  name: string,
  params: EnvironmentFromNameParams = {},
): Promise<Environment>
```

按名称查找环境，如果不存在则可以选择创建它。

**参数** (`EnvironmentFromNameParams`)

`client.environments.fromName()` 的可选参数。

* `createIfMissing?` (`boolean`)

**加薪：**

* `InvalidError`: 环境名称无效。

## 来自上下文

*通过`modal.environments`访问*

```typescript
async fromContext(): Promise<Environment>
```

使用当前上下文查找环境对象。

该方法返回本地配置定义的环境
（即 `environment` 传递到 `ModalClient`、您的活动个人资料或`MODAL_ENVIRONMENT`环境变量），或者从以下位置获取默认环境
本地未定义时的服务器。如果在 Modal 容器内调用，它将返回
容器关联的环境。

```typescript
const environment = await client.environments.fromContext();
console.log(environment.environmentId, environment.name);
```

## 环境.apps

用于访问 `Environment` 中的应用程序的命名空间。

### 列表

```typescript
async *list(): AsyncGenerator<App, void, unknown>
```

此环境中实时应用程序的产量句柄，不包括已停止和禁用的应用程序。
列出应用程序不会创建应用程序。

```typescript
const environment = await client.environments.fromName("prod");
for await (const app of environment.apps.list()) {
  console.log(app.appId, app.name);
}
```

## 模态.环境.对象

用于创建、列出和删除环境的命名空间。

### 创建

```typescript
async create(
  name: string,
  params: EnvironmentCreateParams = {},
): Promise<void>
```

使用给定名称创建一个环境。

**参数** (`EnvironmentCreateParams`)
`EnvironmentObjectsService.create` 的可选参数。

* `restricted?` (`boolean`)：限制对具有明确分配的环境角色的用户的访问。
* `defaultRole?` (`string`)：工作区成员的默认环境角色。

### 列表

```typescript
async *list(): AsyncGenerator<Environment, void, unknown>
```

Yield 环境无需额外的查找请求即可处理。

```typescript
for await (const environment of client.environments.objects.list()) {
  console.log(environment.environmentId, environment.name);
}
```

###删除

```typescript
async delete(name: string): Promise<void>
```

按名称删除环境。
这将永久删除环境及其中的所有对象。