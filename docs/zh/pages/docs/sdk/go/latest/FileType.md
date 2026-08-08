<!-- modal-docs: machine-translated zh-CN from English source -->

# 文件类型

FileType 表示文件系统条目的类型。

```go
type FileType string
```

可能的值为：

* `FileTypeFile` = `"file"`
* `FileTypeDirectory` = `"directory"`
* `FileTypeSymlink` = `"symlink"`