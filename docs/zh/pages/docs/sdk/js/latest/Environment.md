<!-- modal-docs: translation failed; English fallback -->

# Environment

A Modal Environment, with namespaces for accessing its resources.

```typescript
class Environment {
  readonly environmentId: string;
  readonly name: string;
  readonly apps: EnvironmentAppsService;
}
```

## fromName

*Accessed via `modal.environments`*

```typescript
async fromName(
  name: string,
  params: EnvironmentFromNameParams = {},
): Promise<Environment>
```

Look up an Environment by name, optionally creating it if it does not exist.

**Parameters** (`EnvironmentFromNameParams`)

Optional parameters for `client.environments.fromName()`.

* `createIfMissing?` (`boolean`)

**Raises:**

* `InvalidError`: The Environment name is invalid.

## Environment.apps

Namespace for accessing Apps in an `Environment`.

### list

```typescript
async *list(): AsyncGenerator<App, void, unknown>
```

Yield handles for live Apps in this Environment, excluding stopped and disabled Apps.
Listing Apps does not create Apps.

```typescript
const environment = await client.environments.fromName("prod");
for await (const app of environment.apps.list()) {
  console.log(app.appId, app.name);
}
```

## modal.environments.objects

Namespace for creating, listing, and deleting Environments.

### create

```typescript
async create(
  name: string,
  params: EnvironmentCreateParams = {},
): Promise<void>
```

Create an Environment with the given name.

**Parameters** (`EnvironmentCreateParams`)

Optional parameters for `EnvironmentObjectsService.create`.

* `restricted?` (`boolean`): Restrict access to users with explicitly assigned Environment roles.
* `defaultRole?` (`string`): Default Environment role for workspace members.

### list

```typescript
async *list(): AsyncGenerator<Environment, void, unknown>
```

Yield Environment handles without additional lookup requests.

```typescript
for await (const environment of client.environments.objects.list()) {
  console.log(environment.environmentId, environment.name);
}
```

### delete

```typescript
async delete(name: string): Promise<void>
```

Delete an Environment by name.
This permanently deletes the Environment and all objects in it.
