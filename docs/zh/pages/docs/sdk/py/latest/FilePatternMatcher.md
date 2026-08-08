<!-- modal-docs: machine-translated zh-CN from English source -->

# 文件模式匹配器

```python
class FilePatternMatcher(modal.file_pattern_matcher._AbstractPatternMatcher)
```

允许根据模式列表匹配文件路径对象。

**使用**

```python
from pathlib import Path
from modal import FilePatternMatcher

matcher = FilePatternMatcher("*.py")

assert matcher(Path("foo.py"))

# You can also negate the matcher.
negated_matcher = ~matcher

assert not negated_matcher(Path("foo.py"))
```

```python
__init__(self, *pattern)
```

初始化一个新的 FilePatternMatcher 实例。

**参数**

<Parameter name="*pattern" type="str" description="One or more pattern strings." />

**加薪**

* `ValueError`：如果提供了非法的排除模式。

## 可以\_修剪\_目录

```python
can_prune_directories(self)
```

如果此模式匹配器允许安全的早期目录修剪，则返回 True。

当可以完全跳过匹配的目录时，目录修剪是安全的
不遗漏任何应该包含的文件。例如，这不是
当我们有反转/否定忽略模式时是安全的（例如“！\ * \ * / \ *.py”）。

## 来自\_file

```python
from_file(cls, file_path)
```

从文件初始化一个新的 FilePatternMatcher 实例。

第一次使用匹配器时，将延迟读取文件中的模式。

**参数**

<Parameter name="file_path" type="Path" description="The path to the file containing patterns." />

**使用**

```python
from modal import FilePatternMatcher

matcher = FilePatternMatcher.from_file("/path/to/ignorefile")
```