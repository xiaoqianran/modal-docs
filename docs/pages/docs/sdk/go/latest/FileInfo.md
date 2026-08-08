# FileInfo

FileInfo holds metadata for a file, directory, or symlink in a Sandbox.

```go
type FileInfo struct {
	Name          string
	Path          string
	Type          FileType
	Size          int64
	Mode          uint32
	Permissions   string
	Owner         string
	Group         string
	ModifiedTime  float64
	SymlinkTarget *string
}
```
