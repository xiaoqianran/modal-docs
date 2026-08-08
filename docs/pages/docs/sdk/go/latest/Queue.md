# Queue

Queue is a distributed, FIFO queue for data flow in Modal Apps.

```go
type Queue struct {
	QueueID string
	Name    string
}
```

## Ephemeral

*Accessed via `client.Queues`*

```go
Ephemeral(ctx context.Context, params *QueueEphemeralParams) (*Queue, error)
```

Ephemeral creates a nameless, temporary Queue, that persists until CloseEphemeral is called, or the process exits.

**Parameters** (`QueueEphemeralParams`)

QueueEphemeralParams are options for client.Queues.Ephemeral.

* `Environment` (`string`)

## FromName

*Accessed via `client.Queues`*

```go
FromName(ctx context.Context, name string, params *QueueFromNameParams) (*Queue, error)
```

FromName references a named Queue, creating if necessary.

**Parameters** (`QueueFromNameParams`)

QueueFromNameParams are options for client.Queues.FromName.

* `Environment` (`string`)
* `CreateIfMissing` (`bool`)

## Delete

*Accessed via `client.Queues`*

```go
Delete(ctx context.Context, name string, params *QueueDeleteParams) error
```

Delete removes a Queue by name.

Warning: Deletion is irreversible and will affect any Apps currently using the Queue.

**Parameters** (`QueueDeleteParams`)

QueueDeleteParams are options for client.Queues.Delete.

* `Environment` (`string`)
* `AllowMissing` (`bool`)

## Clear

```go
Clear(ctx context.Context, params *QueueClearParams) error
```

Clear removes all objects from a Queue partition.

**Parameters** (`QueueClearParams`)

* `Partition` (`string`): partition to clear (default "")
* `All` (`bool`): clear *all* partitions (mutually exclusive with Partition)

## CloseEphemeral

```go
CloseEphemeral()
```

CloseEphemeral deletes an ephemeral Queue, only used with QueueEphemeral.

## Get

```go
Get(ctx context.Context, params *QueueGetParams) (any, error)
```

Get removes and returns one item (blocking by default).

By default, this will wait until at least one item is present in the Queue.
If `timeout` is set, returns `QueueEmptyError` if no items are available
within that timeout.

**Parameters** (`QueueGetParams`)

QueueGetParams are options for Queue.Get.

* `Timeout` (`*time.Duration`): wait max (nil = indefinitely)
* `Partition` (`string`)

## GetMany

```go
GetMany(ctx context.Context, n int, params *QueueGetManyParams) ([]any, error)
```

GetMany removes up to n items.

By default, this will wait until at least one item is present in the Queue.
If `timeout` is set, returns `QueueEmptyError` if no items are available
within that timeout.

**Parameters** (`QueueGetManyParams`)

QueueGetManyParams are options for Queue.GetMany.

*No configurable options.*

## Iterate

```go
Iterate(ctx context.Context, params *QueueIterateParams) iter.Seq2[any, error]
```

Iterate yields items from the Queue until it is empty.

**Parameters** (`QueueIterateParams`)

* `ItemPollTimeout` (`time.Duration`): exit if no new items within this period
* `Partition` (`string`)

## Len

```go
Len(ctx context.Context, params *QueueLenParams) (int, error)
```

Len returns the number of objects in the Queue.

**Parameters** (`QueueLenParams`)

* `Partition` (`string`)
* `Total` (`bool`): total across all partitions (mutually exclusive with Partition)

## Put

```go
Put(ctx context.Context, v any, params *QueuePutParams) error
```

Put adds a single item to the end of the Queue.

If the Queue is full, this will retry with exponential backoff until the
provided `timeout` is reached, or indefinitely if `timeout` is not set.
Raises `QueueFullError` if the Queue is still full after the timeout.

**Parameters** (`QueuePutParams`)

QueuePutParams are options for Queue.Put.

* `Timeout` (`*time.Duration`): max wait for space (nil = indefinitely)
* `Partition` (`string`)
* `PartitionTTL` (`time.Duration`): ttl for the *partition* (default 24h)

## PutMany

```go
PutMany(ctx context.Context, values []any, params *QueuePutManyParams) error
```

PutMany adds multiple items to the end of the Queue.

If the Queue is full, this will retry with exponential backoff until the
provided `timeout` is reached, or indefinitely if `timeout` is not set.
Raises `QueueFullError` if the Queue is still full after the timeout.

**Parameters** (`QueuePutManyParams`)

QueuePutManyParams are options for Queue.PutMany.

*No configurable options.*
