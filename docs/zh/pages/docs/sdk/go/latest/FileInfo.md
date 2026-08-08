<!-- modal-docs: machine-translated zh-CN from English source -->

# 文件信息

FileInfo 保存沙箱中文件、目录或符号链接的元数据。

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