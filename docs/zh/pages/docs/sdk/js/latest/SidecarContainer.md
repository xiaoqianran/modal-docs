<!-- modal-docs: machine-translated zh-CN from English source -->

# 边车容器

在沙箱中运行的边车容器的句柄。

实验性：API 可能会发生变化。

```typescript
class SidecarContainer {
  readonly containerId: string; // The fully qualified container ID.
  readonly containerName: string; // The logical name of the container within the Sandbox.
  get filesystem(): SandboxFilesystem; // Namespace for filesystem APIs scoped to this sidecar container.
}
```

## 执行

```typescript
async exec(
  command: string[],
  params?: SidecarExecParams & { mode?: "text" },
): Promise<ContainerProcess<string>>
async exec(
  command: string[],
  params: SidecarExecParams & { mode: "binary" },
): Promise<ContainerProcess<Uint8Array>>
```

在 sidecar 容器中运行命令并返回进程句柄。

**参数** (`SidecarExecParams`)

`SidecarContainer.exec()` 的选项。

* `mode?` (`StreamMode`)：指定输入和输出流的文本或二进制编码。
* `stdout?` (`StdioBehavior`): 是否通过管道传输或忽略标准输出。
* `stderr?` (`StdioBehavior`): 是否通过管道传输或忽略标准错误。
* `workdir?` (`string`)：运行命令的工作目录。* `timeoutMs?` (`number`)：进程超时（以毫秒为单位）。默认为 0（无超时）。
* `env?` (`Record<string, string>`): 为命令设置的环境变量。
* `secrets?` (`Secret[]`): `Secret` 作为命令的环境变量注入。
* `pty?` (`boolean`): 为命令启用 PTY。启用后，所有输出（进程中的 stdout 和 stderr）都会多路复用到 stdout，并且 stderr 流实际上为空。

## 民意调查

```typescript
async poll(): Promise<number | null>
```

检查sidecar容器是否运行完毕。

如果容器仍在运行，则返回 `null`，否则返回退出代码。

## 终止

```typescript
async terminate(): Promise<void>
async terminate(params: { wait: true }): Promise<number>
```

停止边车容器。

返回的退出代码仅在 `wait` 为 true 时才有意义。

**参数** (`SidecarTerminateParams`)
`SidecarContainer.terminate()` 的选项。

* `wait?` (`boolean`): 如果为 true，则等待 sidecar 容器终止。

## 等待

```typescript
async wait(): Promise<number>
```

阻塞直到 sidecar 容器退出，并返回其退出代码。

## SidecarContainer.文件系统

文件系统 API 的命名空间仅限于此 sidecar 容器。

### 从本地复制

```typescript
async copyFromLocal(localPath: string, remotePath: string): Promise<void>
```

将本地文件复制到沙箱中。

`remotePath` 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。

**加薪：**

* `SandboxFilesystemNotADirectoryError`：`remotePath`的父组件不是目录。* `SandboxFilesystemIsADirectoryError`: `remotePath` 指向一个目录。
* `SandboxFilesystemPermissionError`：沙盒中的写入权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。
* `Error`: `localPath`不存在、是目录或无法读取(`ENOENT`、`EISDIR`、`EACCES`)。

### 复制到本地

```typescript
async copyToLocal(remotePath: string, localPath: string): Promise<void>
```

将文件从沙箱复制到本地路径。

`remotePath` 必须是沙盒中文件的绝对路径。
如果需要，会创建 `localPath` 的父目录。本地文件
如果已经存在则被覆盖。

**加薪：**

* `SandboxFilesystemNotFoundError`: 远程路径不存在。
* `SandboxFilesystemIsADirectoryError`：远程路径指向一个目录。
* `SandboxFilesystemFileTooLargeError`：文件超出读取大小限制。
* `SandboxFilesystemPermissionError`：沙箱中的读取权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。
* `Error`: `localPath` 指向目录，否则不允许写入。

### 列表文件

```typescript
async listFiles(remotePath: string): Promise<FileInfo[]>
```

列出 Sandbox 目录中的文件和目录。

`remotePath` 必须是沙箱中目录的绝对路径。
返回按名称排序的 `FileInfo` 对象数组。

**加薪：**

* `SandboxFilesystemNotFoundError`: 路径不存在。
* `SandboxFilesystemNotADirectoryError`：路径不是目录。
* `SandboxFilesystemPermissionError`：读取权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### make目录

```typescript
async makeDirectory(
  remotePath: string,
  options?: { createParents?: boolean },
): Promise<void>
```

在沙箱中创建一个新目录。`remotePath` 必须是沙盒中的绝对路径。

当 `createParents` 为 `true`（默认）时，任何缺失的父级
创建目录并且调用是幂等的（如果
目录已存在）。当`createParents`为`false`时，立即数
父级必须已存在，并且路径不得已存在。

**加薪：**

* `SandboxFilesystemNotFoundError`：父级不存在且`createParents`为`false`。
* `SandboxFilesystemPathAlreadyExistsError`：路径已存在，`createParents`为`false`。
* `SandboxFilesystemNotADirectoryError`：路径组件不是目录。
* `SandboxFilesystemPermissionError`：不允许创建。
* `InvalidError`：挂载不支持该操作。
* `SandboxFilesystemError`：命令因任何其他原因失败。
### 读取字节

```typescript
async readBytes(remotePath: string): Promise<Uint8Array>
```

从沙盒中读取文件并以字节形式返回其内容。

`remotePath` 必须是沙箱中文件的绝对路径。

**加薪：**

* `SandboxFilesystemNotFoundError`: 路径不存在。
* `SandboxFilesystemIsADirectoryError`：路径指向一个目录。
* `SandboxFilesystemFileTooLargeError`：文件超出读取大小限制。
* `SandboxFilesystemPermissionError`：读取权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### 读取文本

```typescript
async readText(remotePath: string): Promise<string>
```

从沙盒中读取文件并将其内容作为 UTF-8 字符串返回。

`remotePath` 必须是沙盒中文件的绝对路径。

**加薪：**

* `SandboxFilesystemNotFoundError`：路径不存在。* `SandboxFilesystemIsADirectoryError`：路径指向一个目录。
* `SandboxFilesystemFileTooLargeError`：文件超出读取大小限制。
* `SandboxFilesystemPermissionError`：读取权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### 删除

```typescript
async remove(
  remotePath: string,
  options?: { recursive?: boolean },
): Promise<void>
```

删除沙箱中的文件或目录。

`remotePath` 必须是沙盒中的绝对路径。当`remotePath`
是一个目录，`recursive`是`false`（默认），它被删除
仅当为空时。当`recursive`为`true`时，目录及其所有内容
内容被删除。并非所有安装都支持递归删除 -
`CloudBucketMount`不支持。

**加薪：**

* `SandboxFilesystemNotFoundError`：路径不存在。
* `SandboxFilesystemDirectoryNotEmptyError`: `recursive` 为 `false` 并且目录不为空。
* `SandboxFilesystemPermissionError`：不允许拆除。
* `InvalidError`：安装座不支持该操作。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### 统计

```typescript
async stat(remotePath: string): Promise<FileInfo>
```

返回沙盒中单个文件、目录或符号链接的元数据。

`remotePath` 必须是沙盒中的绝对路径。如果 `remotePath` 是
符号链接，返回的 `FileInfo` 描述符号链接本身，而不是
它指向的目标。

**加薪：**

* `SandboxFilesystemNotFoundError`：路径不存在。
* `SandboxFilesystemNotADirectoryError`：路径的非叶组件不是目录。
* `SandboxFilesystemPermissionError`：路径组件不可搜索。* `SandboxFilesystemError`：命令因任何其他原因失败。

###观看

```typescript
async *watch(
  remotePath: string,
  params: {
    filter?: FileWatchEventType[];
    recursive?: boolean;
    timeoutMs?: number;
  } = {},
): AsyncIterable<FileWatchEvent>
```

观察沙盒中的路径以了解文件系统更改。

`remotePath` 必须是沙盒中的绝对路径。如果它指向一个
文件，报告该文件的事件。如果它指向一个目录，
报告直接位于其中的条目的事件。套装`recursive: true`
还接收所有嵌套子目录的事件。如果 `remotePath` 是
一个符号链接，它遵循已解析的事件引用路径
目标。

当变化发生时产生 `FileWatchEvent` 对象，直到
超时结束、迭代器关闭或沙箱终止。
可以选择将发出的事件类型限制为包含在
`filter`。未定义的`filter`允许所有类型；传递一个空数组
抑制所有事件。

`timeoutMs` 被截断为整秒。省略它即可无限期观看。
当超时结束时，迭代器将停止而不引发异常。

**加薪：**

* `SandboxFilesystemNotFoundError`: `remotePath` 不存在。
* `SandboxFilesystemPermissionError`：手表访问被拒绝。
* `InvalidError`：文件系统不支持观看。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### 写入字节

```typescript
async writeBytes(
  data: Uint8Array | ArrayBuffer | Buffer,
  remotePath: string,
): Promise<void>
```

将二进制内容写入沙箱中的文件。`remotePath` 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。

**加薪：**

* `TypeError`：`data` 不是 `Uint8Array`、`ArrayBuffer` 或 `Buffer`。
* `SandboxFilesystemNotADirectoryError`：`remotePath`的父组件不是目录。
* `SandboxFilesystemIsADirectoryError`: `remotePath` 指向一个目录。
* `SandboxFilesystemPermissionError`: 写权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。

### 写文本

```typescript
async writeText(data: string, remotePath: string): Promise<void>
```

将 UTF-8 文本写入沙箱中的文件。

`remotePath` 必须是沙盒中文件的绝对路径。
如果需要，将创建父目录。远程文件被覆盖
如果它已经存在。
**加薪：**

* `TypeError`: `data` 不是字符串。
* `SandboxFilesystemNotADirectoryError`：`remotePath`的父组件不是目录。
* `SandboxFilesystemIsADirectoryError`: `remotePath` 指向一个目录。
* `SandboxFilesystemPermissionError`：写权限被拒绝。
* `SandboxFilesystemError`：命令因任何其他原因失败。