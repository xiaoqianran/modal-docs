<!-- modal-docs: machine-translated zh-CN from English source -->

# 音量

卷提供可以安装在 Modal `Function` 中的持久存储。

```typescript
class Volume {
  readonly volumeId: string;
  readonly name?: string;
}
```

## 来自姓名

*通过`modal.volumes`访问*

```typescript
async fromName(name: string, params?: VolumeFromNameParams): Promise<Volume>
```

通过名称引用 `Volume`。

**参数** (`VolumeFromNameParams`)

`client.volumes.fromName()` 的可选参数。

* `environment?` (`string`)
* `createIfMissing?` (`boolean`)

## 短暂的

*通过`modal.volumes`访问*

```typescript
async ephemeral(params: VolumeEphemeralParams = {}): Promise<Volume>
```

创建一个无名的临时`Volume`。
它会一直持续到调用 closeEphemeral() 或进程退出为止。

**参数** (`VolumeEphemeralParams`)

`client.volumes.ephemeral()` 的可选参数。

* `environment?` (`string`)

## 删除

*通过`modal.volumes`访问*

```typescript
async delete(name: string, params?: VolumeDeleteParams): Promise<void>
```

删除名为`Volume`。警告：删除是不可逆的，并且会影响当前使用该卷的任何应用程序。

**参数** (`VolumeDeleteParams`)

`client.volumes.delete()` 的可选参数。

* `environment?` (`string`)
* `allowMissing?` (`boolean`)

## 关闭短暂的

```typescript
closeEphemeral(): void
```

删除临时卷。仅可与临时卷一起使用。

## 带有安装选项

```typescript
withMountOptions(params: VolumeMountOptionsParams = {}): Volume
```

配置安装此卷时使用的选项。未定义的字段保留其值
来自之前对同一卷的任何 withMountOptions 调用（堆叠）。

**参数** (`VolumeMountOptionsParams`)

安装 `Volume` 的选项。

* `readOnly?` (`boolean`)
* `subPath?` (`string`)