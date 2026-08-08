<!-- modal-docs: machine-translated zh-CN from English source -->

# CLs

代表已部署的模态 Cl。

## 来自姓名

*通过`modal.cls`访问*

```typescript
async fromName(
  appName: string,
  name: string,
  params: ClsFromNameParams = {},
): Promise<Cls>
```

通过名称引用已部署的 `App` 中的 `Cls`。

**参数** (`ClsFromNameParams`)

`client.cls.fromName()` 的可选参数。

* `environment?` (`string`)
* `version?` (`number`)：查找在此 App 版本上部署的版本固定 Cls。

## 实例

```typescript
async instance(parameters: Record<string, any> = {}): Promise<ClsInstance>
```

使用参数和/或运行时选项创建 Cls 的新实例。

## 批处理

```typescript
withBatching(params: ClsWithBatchingParams): Cls
```

创建启用动态批处理或用新值覆盖的 Cls 实例。

**参数** (`ClsWithBatchingParams`)* `maxBatchSize` (`number`)
* `waitMs` (`number`)

## 并发

```typescript
withConcurrency(params: ClsWithConcurrencyParams): Cls
```

创建启用输入并发性或用新值覆盖的 Cls 实例。

**参数** (`ClsWithConcurrencyParams`)

* `maxInputs` (`number`)
* `targetInputs?` (`number`)

## 带选项

```typescript
withOptions(options: ClsWithOptionsParams): Cls
```

在运行时覆盖静态 Function 配置。

**参数** (`ClsWithOptionsParams`)

* `cpu?` (`number`)
* `cpuLimit?` (`number`)
* `memoryMiB?` (`number`)
* `memoryLimitMiB?` (`number`)
* `gpu?` (`string`)
* `env?` (`Record<string, string>`)
* `secrets?` (`Secret[]`)
* `volumes?` (`Record<string, Volume>`)
* `retries?` (`number | Retries`)
* `maxContainers?` (`number`)
* `bufferContainers?` (`number`)
* `scaledownWindowMs?` (`number`)
* `timeoutMs?` (`number`)
* `routingRegion?` (`string`)