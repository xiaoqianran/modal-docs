# Queue

Distributed, FIFO queue for data flow in Modal `Apps`.

```typescript
class Queue {
  readonly queueId: string;
  readonly name?: string;
}
```

## ephemeral

*Accessed via `modal.queues`*

```typescript
async ephemeral(params: QueueEphemeralParams = {}): Promise<Queue>
```

Create a nameless, temporary `Queue`.
You will need to call `Queue.closeEphemeral()` to delete the Queue.

**Parameters** (`QueueEphemeralParams`)

Optional parameters for `client.queues.ephemeral()`.

* `environment?` (`string`)

## fromName

*Accessed via `modal.queues`*

```typescript
async fromName(
  name: string,
  params: QueueFromNameParams = {},
): Promise<Queue>
```

Reference a `Queue` by name.

**Parameters** (`QueueFromNameParams`)

Optional parameters for `client.queues.fromName()`.

* `environment?` (`string`)
* `createIfMissing?` (`boolean`)

## delete

*Accessed via `modal.queues`*

```typescript
async delete(name: string, params: QueueDeleteParams = {}): Promise<void>
```

Delete a `Queue` by name.

Warning: Deletion is irreversible and will affect any Apps currently using the Queue.

**Parameters** (`QueueDeleteParams`)

Optional parameters for `client.queues.delete()`.

* `environment?` (`string`)
* `allowMissing?` (`boolean`)

## clear

```typescript
async clear(params: QueueClearParams = {}): Promise<void>
```

Remove all objects from a Queue partition.

**Parameters** (`QueueClearParams`)

Optional parameters for `Queue.clear()`.

* `partition?` (`string`): Partition to clear, uses default partition if not set.
* `all?` (`boolean`): Set to clear all Queue partitions.

## closeEphemeral

```typescript
closeEphemeral(): void
```

Delete the ephemeral Queue. Only usable with ephemeral Queues.

## get

```typescript
async get(params: QueueGetParams = {}): Promise<any | null>
```

Remove and return the next object from the Queue.

By default, this will wait until at least one item is present in the Queue.
If `timeoutMs` is set, raises `QueueEmptyError` if no items are available
within that timeout in milliseconds.

**Parameters** (`QueueGetParams`)

Optional parameters for `Queue.get()`.

* `timeoutMs?` (`number`): How long to wait if the Queue is empty in milliseconds (default: indefinite).
* `partition?` (`string`): Partition to fetch values from, uses default partition if not set.

## getMany

```typescript
async getMany(n: number, params: QueueGetManyParams = {}): Promise<any[]>
```

Remove and return up to `n` objects from the Queue.

By default, this will wait until at least one item is present in the Queue.
If `timeoutMs` is set, raises `QueueEmptyError` if no items are available
within that timeout in milliseconds.

**Parameters** (`QueueGetManyParams`)

Optional parameters for `Queue.getMany()`.

* `timeoutMs?` (`number`): How long to wait if the Queue is empty in milliseconds (default: indefinite).
* `partition?` (`string`): Partition to fetch values from, uses default partition if not set.

## iterate

```typescript
async *iterate(
  params: QueueIterateParams = {},
): AsyncGenerator<any, void, unknown>
```

Iterate through items in a Queue without mutation.

**Parameters** (`QueueIterateParams`)

Optional parameters for `Queue.iterate()`.

* `itemPollTimeoutMs?` (`number`): How long to wait between successive items before exiting iteration in milliseconds (default: 0).
* `partition?` (`string`): Partition to iterate, uses default partition if not set.

## len

```typescript
async len(params: QueueLenParams = {}): Promise<number>
```

Return the number of objects in the Queue.

**Parameters** (`QueueLenParams`)

Optional parameters for `Queue.len()`.

* `partition?` (`string`): Partition to compute length, uses default partition if not set.
* `total?` (`boolean`): Return the total length across all partitions.

## put

```typescript
async put(v: any, params: QueuePutParams = {}): Promise<void>
```

Add an item to the end of the Queue.

If the Queue is full, this will retry with exponential backoff until the
provided `timeoutMs` is reached, or indefinitely if `timeoutMs` is not set.
Raises `QueueFullError` if the Queue is still full after the timeout.

**Parameters** (`QueuePutParams`)

Optional parameters for `Queue.put()`.

* `timeoutMs?` (`number`): How long to wait if the Queue is full in milliseconds (default: indefinite).
* `partition?` (`string`): Partition to add items to, uses default partition if not set.
* `partitionTtlMs?` (`number`): TTL for the partition in milliseconds (default: 1 day).

## putMany

```typescript
async putMany(values: any[], params: QueuePutManyParams = {}): Promise<void>
```

Add several items to the end of the Queue.

If the Queue is full, this will retry with exponential backoff until the
provided `timeoutMs` is reached, or indefinitely if `timeoutMs` is not set.
Raises `QueueFullError` if the Queue is still full after the timeout.

**Parameters** (`QueuePutManyParams`)

Optional parameters for `Queue.putMany()`.

* `timeoutMs?` (`number`): How long to wait if the Queue is full in milliseconds (default: indefinite).
* `partition?` (`string`): Partition to add items to, uses default partition if not set.
* `partitionTtlMs?` (`number`): TTL for the partition in milliseconds (default: 1 day).
