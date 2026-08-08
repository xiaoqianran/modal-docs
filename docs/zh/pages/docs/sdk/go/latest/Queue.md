<!-- modal-docs: machine-translated zh-CN from English source -->

# 队列

队列是 Modal 应用程序中用于数据流的分布式 FIFO 队列。

```go
type Queue struct {
	QueueID string
	Name    string
}
```

## 短暂的

*通过`client.Queues`访问*

```go
Ephemeral(ctx context.Context, params *QueueEphemeralParams) (*Queue, error)
```

Ephemeral 创建一个无名的临时队列，该队列将持续存在，直到调用 CloseEphemeral 或进程退出为止。

**参数** (`QueueEphemeralParams`)

QueueEphemeralParams 是 client.Queues.Ephemeral 的选项。

* `Environment` (`string`)

## 来自姓名

*通过`client.Queues`访问*

```go
FromName(ctx context.Context, name string, params *QueueFromNameParams) (*Queue, error)
```

FromName 引用一个命名队列，必要时创建。

**参数** (`QueueFromNameParams`)

QueueFromNameParams 是 client.Queues.FromName 的选项。

* `Environment` (`string`)
* `CreateIfMissing` (`bool`)

## 删除*通过`client.Queues`访问*

```go
Delete(ctx context.Context, name string, params *QueueDeleteParams) error
```

删除按名称删除队列。

警告：删除是不可逆的，并且会影响当前使用队列的任何应用程序。

**参数** (`QueueDeleteParams`)

QueueDeleteParams 是 client.Queues.Delete 的选项。

* `Environment` (`string`)
* `AllowMissing` (`bool`)

## 清除

```go
Clear(ctx context.Context, params *QueueClearParams) error
```

清除将从队列分区中删除所有对象。

**参数** (`QueueClearParams`)

* `Partition` (`string`)：要清除的分区（默认“”）
* `All` (`bool`): 清除*所有*分区（与Partition互斥）

## 关闭短暂的

```go
CloseEphemeral()
```

CloseEphemeral 删除临时队列，仅与 QueueEphemeral 一起使用。

## 获取

```go
Get(ctx context.Context, params *QueueGetParams) (any, error)
```
Get 删除并返回一项（默认情况下是阻塞的）。

默认情况下，这将等到队列中至少存在一项。
如果设置了`timeout`，则在没有可用项目时返回`QueueEmptyError`
在该超时时间内。

**参数** (`QueueGetParams`)

QueueGetParams 是 Queue.Get 的选项。

* `Timeout` (`*time.Duration`): 等待最大值（nil = 无限期）
* `Partition` (`string`)

## 获取很多

```go
GetMany(ctx context.Context, n int, params *QueueGetManyParams) ([]any, error)
```

GetMany 最多删除 n 个项目。

默认情况下，这将等到队列中至少存在一项。
如果设置了`timeout`，则在没有可用项目时返回`QueueEmptyError`
在该超时时间内。

**参数** (`QueueGetManyParams`)QueueGetManyParams 是 Queue.GetMany 的选项。

*没有可配置选项。*

## 迭代

```go
Iterate(ctx context.Context, params *QueueIterateParams) iter.Seq2[any, error]
```

迭代从队列中产生项目，直到队列为空。

**参数** (`QueueIterateParams`)

* `ItemPollTimeout` (`time.Duration`): 在此期间没有新项目则退出
* `Partition` (`string`)

## 莱恩

```go
Len(ctx context.Context, params *QueueLenParams) (int, error)
```

Len 返回队列中的对象数量。

**参数** (`QueueLenParams`)

* `Partition` (`string`)
* `Total` (`bool`): 所有分区的总计（与分区互斥）

## 把

```go
Put(ctx context.Context, v any, params *QueuePutParams) error
```

Put 将单个项目添加到队列末尾。

如果队列已满，将以指数退避重试，直到
如果达到`timeout`，则无限期地达到`timeout`。
如果超时后队列仍满，则引发 `QueueFullError`。

**参数** (`QueuePutParams`)

QueuePutParams 是 Queue.Put 的选项。

* `Timeout` (`*time.Duration`): 最大等待空间（nil = 无限期）
* `Partition` (`string`)
* `PartitionTTL` (`time.Duration`): *分区* 的 ttl（默认 24 小时）

## PutMany

```go
PutMany(ctx context.Context, values []any, params *QueuePutManyParams) error
```

PutMany 将多个项目添加到队列末尾。

如果队列已满，将以指数退避重试，直到
如果达到`timeout`，则无限期地达到`timeout`。
如果超时后队列仍满，则引发 `QueueFullError`。

**参数** (`QueuePutManyParams`)

QueuePutManyParams 是 Queue.PutMany 的选项。

*没有可配置选项。*