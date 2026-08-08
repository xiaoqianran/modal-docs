<!-- modal-docs: machine-translated zh-CN from English source -->

# 秘密

Secrets 为 `Image` 提供环境变量字典。

```typescript
class Secret {
  readonly name?: string;
  get secretId(): string; // The ID of the server-side Secret, or an empty string if not yet hydrated.
}
```

## 来自姓名

*通过`modal.secrets`访问*

```typescript
async fromName(name: string, params?: SecretFromNameParams): Promise<Secret>
```

通过名称引用 `Secret`。

**参数** (`SecretFromNameParams`)

`client.secrets.fromName()` 的可选参数。

* `environment?` (`string`)
* `requiredKeys?` (`string[]`)

## 来自对象

*通过`modal.secrets`访问*

```typescript
async fromObject(
  entries: Record<string, string>,
  params?: SecretFromObjectParams,
): Promise<Secret>
```

从键值对的普通对象创建一个`Secret`。

返回的 Secret 是惰性的：没有创建服务器端 Secret（并且
`secretId` 保持为空）直到第一次使用。当
与 `Sandbox.exec()` 或
`client.sandboxes.experimentalCreate()`,
这些值作为环境变量直接发送给工作人员，
完全避免`SecretGetOrCreate`往返。

**参数** (`SecretFromObjectParams`)

`client.secrets.fromObject()` 的可选参数。

* `environment?` (`string`)

## 删除

*通过`modal.secrets`访问*

```typescript
async delete(name: string, params?: SecretDeleteParams): Promise<void>
```

删除名为`Secret`。

警告：删除是不可逆的，并且会影响当前使用该 Secret 的任何应用程序。

**参数** (`SecretDeleteParams`)

`client.secrets.delete()` 的可选参数。

* `environment?` (`string`)
* `allowMissing?` (`boolean`)