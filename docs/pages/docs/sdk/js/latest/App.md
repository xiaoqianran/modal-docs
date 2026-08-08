# App

Represents a deployed Modal App.

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
