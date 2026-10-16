# App

Represents a Modal App.

```typescript
class App {
  readonly appId: string;
  readonly name?: string;
  readonly environmentName?: string;
}
```

## fromName

*Accessed via `modal.apps`*

```typescript
async fromName(name: string, params: AppFromNameParams = {}): Promise<App>
```

Reference a deployed `App` by name, or create if it does not exist.

**Parameters** (`AppFromNameParams`)

Optional parameters for `client.apps.fromName()`.

* `environment?` (`string`)
* `createIfMissing?` (`boolean`)

## info

```typescript
async info(params: AppInfoParams = {}): Promise<AppInfo>
```

Return information about this App, including its lifecycle and member Functions and Servers.
By default, returns the snapshot from the previous lookup, listing, or refresh.

**Parameters** (`AppInfoParams`)

Optional parameters for `App.info`.

* `refresh?` (`boolean`): Fetch current information rather than the cached lookup or listing snapshot.
