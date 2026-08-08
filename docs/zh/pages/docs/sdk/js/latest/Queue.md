<!-- modal-docs: machine-translated zh-CN from English source -->

# 队列

Modal `Apps` 中数据流的分布式 FIFO 队列。

```typescript
class Queue {
  readonly queueId: string;
  readonly name?: string;
}
```

## 短暂的

*通过`modal.queues`访问*

```typescript
async ephemeral(params: QueueEphemeralParams = {}): Promise<Queue>
```

创建一个无名的临时`Queue`。
您需要调用`Queue.closeEphemeral()`来删除队列。

**参数** (`QueueEphemeralParams`)

`client.queues.ephemeral()` 的可选参数。

* `environment?` (`string`)

## 来自姓名

*通过`modal.queues`访问*

```typescript
async fromName(
  name: string,
  params: QueueFromNameParams = {},
): Promise<Queue>
```

按名称引用`Queue`。

**参数** (`QueueFromNameParams`)

`client.queues.fromName()` 的可选参数。

* `environment?` (`string`)
* `createIfMissing?` (`boolean`)

## 删除

*通过`modal.queues`访问*

```typescript
async delete(name: string, params: QueueDeleteParams = {}): Promise<void>
```

按名称删除`Queue`。

警告：删除是不可逆的，并且会影响当前使用队列的任何应用程序。**参数** (`QueueDeleteParams`)

`client.queues.delete()` 的可选参数。

* `environment?` (`string`)
* `allowMissing?` (`boolean`)

## 清除

```typescript
async clear(params: QueueClearParams = {}): Promise<void>
```

从队列分区中删除所有对象。

**参数** (`QueueClearParams`)

`Queue.clear()` 的可选参数。

* `partition?` (`string`)：要清除的分区，如果不设置则使用默认分区。
* `all?` (`boolean`): 设置清除所有Queue分区。

## 关闭短暂的

```typescript
closeEphemeral(): void
```

删除临时队列。仅适用于临时队列。

## 得到

```typescript
async get(params: QueueGetParams = {}): Promise<any | null>
```

从队列中删除并返回下一个对象。

默认情况下，这将等到队列中至少存在一项。
如果设置了`timeoutMs`，则在没有可用项目时引发`QueueEmptyError`
在该超时时间内（以毫秒为单位）。

**参数** (`QueueGetParams`)

`Queue.get()` 的可选参数。

* `timeoutMs?` (`number`): 如果队列为空则等待多长时间，以毫秒为单位（默认：无限期）。
* `partition?` (`string`): 从中获取值的分区，如果未设置则使用默认分区。

## 获取很多

```typescript
async getMany(n: number, params: QueueGetManyParams = {}): Promise<any[]>
```

从队列中删除并返回最多 `n` 个对象。

默认情况下，这将等到队列中至少存在一项。
如果设置了`timeoutMs`，则在没有可用项目时引发`QueueEmptyError`
在该超时时间内（以毫秒为单位）。

**参数** (`QueueGetManyParams`)

`Queue.getMany()` 的可选参数。* `timeoutMs?` (`number`): 如果队列为空则等待多长时间，以毫秒为单位（默认值：无限期）。
* `partition?` (`string`): 从中获取值的分区，如果未设置则使用默认分区。

## 迭代

```typescript
async *iterate(
  params: QueueIterateParams = {},
): AsyncGenerator<any, void, unknown>
```

迭代队列中的项目而不进行突变。

**参数** (`QueueIterateParams`)

`Queue.iterate()` 的可选参数。

* `itemPollTimeoutMs?` (`number`): 退出迭代之前连续项目之间等待的时间（默认值：0）。
* `partition?` (`string`): 分区迭代，如果不设置则使用默认分区。

## 长度

```typescript
async len(params: QueueLenParams = {}): Promise<number>
```

返回队列中对象的数量。

**参数** (`QueueLenParams`)

`Queue.len()` 的可选参数。
* `partition?` (`string`): 计算长度的分区，如果不设置则使用默认分区。
* `total?` (`boolean`)：返回所有分区的总长度。

## 把

```typescript
async put(v: any, params: QueuePutParams = {}): Promise<void>
```

将一个项目添加到队列末尾。

如果队列已满，将以指数退避重试，直到
如果达到`timeoutMs`，则无限期地达到`timeoutMs`。
如果超时后队列仍满，则引发 `QueueFullError`。

**参数** (`QueuePutParams`)

`Queue.put()` 的可选参数。

* `timeoutMs?` (`number`): 如果队列已满，则等待多长时间（以毫秒为单位）（默认值：无限期）。* `partition?` (`string`): 添加项目的分区，如果未设置则使用默认分区。
* `partitionTtlMs?` (`number`)：分区的 TTL（以毫秒为单位）（默认值：1 天）。

## putMany

```typescript
async putMany(values: any[], params: QueuePutManyParams = {}): Promise<void>
```

将多个项目添加到队列末尾。

如果队列已满，将以指数退避重试，直到
如果达到`timeoutMs`，则无限期地达到`timeoutMs`。
如果超时后队列仍满，则引发 `QueueFullError`。

**参数** (`QueuePutManyParams`)

`Queue.putMany()` 的可选参数。

* `timeoutMs?` (`number`): 如果队列已满则等待多长时间（以毫秒为单位）（默认值：无限期）。
* `partition?` (`string`): 添加项目的分区，如果未设置则使用默认分区。
* `partitionTtlMs?` (`number`)：分区的 TTL（以毫秒为单位）（默认值：1 天）。