# FileType

FileType represents the type of a filesystem entry.

```go
type FileType string
```

The possible values are:

* `FileTypeFile` = `"file"`
* `FileTypeDirectory` = `"directory"`
* `FileTypeSymlink` = `"symlink"`
