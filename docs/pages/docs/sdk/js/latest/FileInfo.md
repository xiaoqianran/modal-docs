# FileInfo

Metadata for a file or directory entry in a Sandbox.

```typescript
interface FileInfo {
  readonly name: string;
  readonly path: string;
  readonly type: FileType;
  readonly size: number;
  readonly mode: number;
  readonly permissions: string;
  readonly owner: string;
  readonly group: string;
  /** Unix epoch seconds. */
  readonly modifiedTime: number;
  readonly symlinkTarget: string | null;
}
```
