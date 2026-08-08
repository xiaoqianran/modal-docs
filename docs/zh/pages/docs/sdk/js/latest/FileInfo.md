<!-- modal-docs: machine-translated zh-CN from English source -->

# 文件信息

沙箱中文件或目录条目的元数据。

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