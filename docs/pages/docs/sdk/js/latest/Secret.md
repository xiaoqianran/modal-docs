# Secret

Secrets provide a dictionary of environment variables for `Image`s.

```typescript
class Secret {
  readonly name?: string;
  get secretId(): string; // The ID of the server-side Secret, or an empty string if not yet hydrated.
}
```

## fromName

*Accessed via `modal.secrets`*

```typescript
async fromName(name: string, params?: SecretFromNameParams): Promise<Secret>
```

Reference a `Secret` by its name.

**Parameters** (`SecretFromNameParams`)

Optional parameters for `client.secrets.fromName()`.

* `environment?` (`string`)
* `requiredKeys?` (`string[]`)

## fromObject

*Accessed via `modal.secrets`*

```typescript
async fromObject(
  entries: Record<string, string>,
  params?: SecretFromObjectParams,
): Promise<Secret>
```

Create a `Secret` from a plain object of key-value pairs.

The returned Secret is lazy: no server-side Secret is created (and
`secretId` stays empty) until it is first used. When
used with `Sandbox.exec()` or
`client.sandboxes.experimentalCreate()`,
the values are sent directly to the worker as environment variables,
avoiding a `SecretGetOrCreate` round-trip entirely.

**Parameters** (`SecretFromObjectParams`)

Optional parameters for `client.secrets.fromObject()`.

* `environment?` (`string`)

## delete

*Accessed via `modal.secrets`*

```typescript
async delete(name: string, params?: SecretDeleteParams): Promise<void>
```

Delete a named `Secret`.

Warning: Deletion is irreversible and will affect any Apps currently using the Secret.

**Parameters** (`SecretDeleteParams`)

Optional parameters for `client.secrets.delete()`.

* `environment?` (`string`)
* `allowMissing?` (`boolean`)
