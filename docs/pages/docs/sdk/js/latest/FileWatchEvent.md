# FileWatchEvent

A filesystem change event.

`paths` contains the absolute path(s) affected by the event. For most event
types it holds a single entry. Rename operations are reported as `Modify`
events: when both the source and destination fall within the watched scope,
`paths` holds `[source, destination]`; when only one side of the rename is
visible, `paths` holds that single path.

```typescript
interface FileWatchEvent {
  readonly eventType: FileWatchEventType;
  readonly paths: string[];
}
```
