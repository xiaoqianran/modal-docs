<!-- modal-docs: translation failed; English fallback -->

# AppLifecycle

Timestamps and attributions for events in an App's lifecycle.

```typescript
interface AppLifecycle {
  state: AppState;
  version?: number;
  createdAt: Date;
  createdBy: string;
  deployedAt?: Date;
  deployedBy?: string;
  stoppedAt?: Date;
  stoppedBy?: string;
}
```
