<!-- modal-docs: machine-translated zh-CN from English source -->

# 图片

```python
class Image(modal.object.Object)
```

用于运行函数的容器映像的基类。

不要直接构造这个类；而是使用其静态工厂方法之一，
例如 `modal.Image.debian_slim`、`modal.Image.from_registry` 或 `modal.Image.micromamba`。

## 添加\_local\_文件

```python
add_local_file(self, local_path, remote_path, *, copy=False)
```

将本地文件添加到容器内`remote_path`的图像中。

默认情况下（`copy=False`），文件在启动时添加到容器中，并且不会内置到实际的镜像中，
这加快了部署速度。

设置 `copy=True` 在构建时将文件复制到图像层，类似于
[`COPY`](https://docs.docker.com/engine/reference/builder/#copy) 在`Dockerfile` 中工作。copy=True 会减慢迭代速度，因为它需要重建图像和任何后续的
每当包含的文件发生更改时，都会执行构建步骤，但如果您想运行额外的文件，则需要执行此步骤
在这一步之后构建步骤。

*在 v0.66.40 中添加*：此方法取代了已弃用的 `modal.Image.copy_local_file` 方法。

**参数**

<Parameter name="local_path" type="str | Path" description="Path to the file on the local machine." />
<Parameter name="remote_path" type="str" description="Absolute path inside the container where the file should appear." />
<Parameter name="copy" type="bool" defaultValue="False" description="If True, bake the file into an image layer at build time; if False, mount at container startup." />

**退货**

应用了文件层或安装的新`Image`。

## 添加\_local\_dir

```python
add_local_dir(self, local_path, remote_path, *, copy=False, ignore=[])
```

将本地目录的内容添加到容器内`remote_path`处的图像中。

默认情况下（`copy=False`），文件在启动时添加到容器中，并且不会内置到实际的镜像中，
这加快了部署速度。
设置 `copy=True` 在构建时将文件复制到 Image 层，类似于
[`COPY`](https://docs.docker.com/engine/reference/builder/#copy) 在`Dockerfile` 中工作。

copy=True 会减慢迭代速度，因为它需要重建图像和任何后续的
每当包含的文件发生更改时，都会执行构建步骤，但如果您想运行额外的文件，则需要执行此步骤
在这一步之后构建步骤。

*在 v0.66.40 中添加*：此方法取代了已弃用的 `modal.Image.copy_local_dir` 方法。

**参数**

<Parameter name="local_path" type="str | Path" description="Path to the directory on the local machine." />
<Parameter name="remote_path" type="str" description="Absolute path inside the container where the directory contents should appear." />
<Parameter name="copy" type="bool" defaultValue="False" description="If True, bake the tree into an image layer at build time; if False, mount at container startup." />
<Parameter name="ignore" type="Sequence[str] | Callable[[Path], bool]" defaultValue="[]" description="Predicate or pattern list for file exclusion (True means exclude). A sequence is converted to a dockerignore-style matcher." />

**退货**

应用了目录层或挂载的新`Image`。

**使用**

```python
from modal import FilePatternMatcher

image = modal.Image.debian_slim().add_local_dir(
    "~/assets",
    remote_path="/assets",
    ignore=["*.venv"],
)

image = modal.Image.debian_slim().add_local_dir(
    "~/assets",
    remote_path="/assets",
    ignore=lambda p: p.is_relative_to(".venv"),
)

image = modal.Image.debian_slim().add_local_dir(
    "~/assets",
    remote_path="/assets",
    ignore=FilePatternMatcher("**/*.txt"),
)

# When including files is simpler than excluding them, you can use the `~` operator to invert the matcher.
image = modal.Image.debian_slim().add_local_dir(
    "~/assets",
    remote_path="/assets",
    ignore=~FilePatternMatcher("**/*.py"),
)

# You can also read ignore patterns from a file.
image = modal.Image.debian_slim().add_local_dir(
    "~/assets",
    remote_path="/assets",
    ignore=FilePatternMatcher.from_file("/path/to/ignorefile"),
)
```## 添加\_local\_python\_source

```python
add_local_python_source(self, *modules, copy=False, ignore=NON_PYTHON_FILES)
```

将本地可用的 Python 包/模块添加到容器中。

将指定 Python 包或模块中的所有文件添加到运行映像的容器中。

包被添加到容器的`/root`目录中，该目录位于`PYTHONPATH`上
任何已执行的模态函数的名称，从而可以通过该名称导入模块。

默认情况下（`copy=False`），文件在启动时添加到容器中，并且不会内置到实际的镜像中，
这加快了部署速度。

设置 `copy=True` 以在构建时将文件复制到图像层中。这会减慢迭代速度，因为
每当包含的文件发生更改时，它都需要重建映像以及任何后续的构建步骤，但它是
如果您想在此之后运行其他构建步骤，则需要此选项。

**注意：** 这不包括所有以点为前缀的子目录或文件以及所有 `.pyc`/`__pycache__` 文件。
要添加具有更精细控制的完整目录，请改用 `.add_local_dir()` 并将 `/root` 指定为
目标目录。

默认情况下，源模块中仅包含 `.py` 文件。将 `ignore` 参数设置为模式列表
或可调用来覆盖此行为。*在 v0.67.28 中添加*：此方法替换了已弃用的 `modal.Mount.from_local_python_packages` 模式。

**参数**

<Parameter name="*modules" type="str" description="Python package or module names to include from the local project." />
<Parameter name="copy" type="bool" defaultValue="False" description="If True, bake sources into an image layer; if False, mount at container startup." />
<Parameter name="ignore" type="Sequence[str] | Callable[[Path], bool]" defaultValue="NON_PYTHON_FILES" description="Patterns or callable controlling which files to exclude." />

**退货**

应用了 Python 源安装或层的新 `Image`。

**使用**

```py
# includes everything except data.json
modal.Image.debian_slim().add_local_python_source("mymodule", ignore=["data.json"])

# exclude large files
modal.Image.debian_slim().add_local_python_source(
    "mymodule",
    ignore=lambda p: p.stat().st_size > 1e9
)
```

## 来自\_id

```python
from_id(cls, image_id, client=None)
```

从 id 构造一个 Image 并查找 Image 结果。

可以使用`.object_id`访问图像对象的ID。

**参数**

<Parameter name="image_id" type="str" description="Image object ID to load." />
<Parameter name="client" type="&quot;modal.client.Client | None&quot;" defaultValue="None" description="Optional Modal client; uses the default synchronizer client when omitted." />

**退货**

给定 ID 的水合 `Image` 手柄。

## 构建

```python
build(self, app)
```

积极树立形象。

如果您的映像之前已构建，那么此方法将不会重建您的映像
并且返回您的缓存图像。
为了定义模态函数，在部署或运行​​应用程序时自动构建图像。
在这种情况下，您不需要显式构建图像。

**参数**

<Parameter name="app" type="modal.app._App" description="Initialized app used as the load context for the image build." />

**退货**

构建（和解析器加载）完成后的此图像。

**使用**

```python
image = modal.Image.debian_slim().uv_pip_install("scipy", "numpy")

app = modal.App.lookup("build-image", create_if_missing=True)
with modal.enable_output():  # To see logs in your local terminal
    image.build(app)

# Save the image id
my_image_id = image.object_id

# Reference the image with the id or uses it another context.
built_image = modal.Image.from_id(my_image_id)
```

或者，您可以预先构建图像并在沙箱中使用它：

```python notest
app = modal.App.lookup("sandbox-example", create_if_missing=True)

with modal.enable_output():
    image = modal.Image.debian_slim().uv_pip_install("scipy")
    image.build(app)

sb = modal.Sandbox.create("python", "-c", "import scipy; print(scipy)", app=app, image=image)
print(sb.stdout.read())
sb.terminate()
```

```python notest
app = modal.App()
image = modal.Image.debian_slim()

# No need to explicitly build the image for defining a function.
@app.function(image=image)
def f():
    ...
```

## pip\_install

```python
pip_install(self, *packages, find_links=None, index_url=None,
    extra_index_url=None, pre=False, extra_options="", force_build=False,
    env=None, secrets=None, gpu=None)
```

使用 pip 安装 Python 包列表。

**参数**

<Parameter name="*packages" type="str | list[str]" description="Python packages to install, e.g. `⟦T93⟧⟦T94⟧⟦T95⟧`." />
<Parameter name="find_links" type="str | None" defaultValue="None" description="Passed as `⟦T96⟧` to pip." />
<Parameter name="index_url" type="str | None" defaultValue="None" description="Passed as `⟦T97⟧` to pip." />
<Parameter name="extra_index_url" type="str | None" defaultValue="None" description="Passed as `⟦T98⟧` to pip." />
<Parameter name="pre" type="bool" defaultValue="False" description="If True, allow pre-release versions (`⟦T99⟧`)." />
<Parameter name="extra_options" type="str" defaultValue="&quot;&quot;" description="Additional raw options for pip, e.g. `⟦T100⟧`." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds (similar to `⟦T101⟧`)." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />

**退货**应用了 pip install 层的新 `Image`。

**使用**

安装简单：

```python
image = modal.Image.debian_slim().pip_install("click", "httpx~=0.23.3")
```

更复杂的安装：

```python
image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.2.0-devel-ubuntu22.04", add_python="3.11"
    )
    .pip_install(
        "ninja",
        "packaging",
        "wheel",
        "transformers==4.40.2",
    )
    .pip_install(
        "flash-attn==2.5.8", extra_options="--no-build-isolation"
    )
)
```

## pip\_install\_private\_repos

```python
pip_install_private_repos(self, *repositories, git_user, find_links=None,
    index_url=None, extra_index_url=None, pre=False, extra_options="", gpu=None,
    env=None, secrets=None, force_build=False)
```

使用 pip 从私有 git 存储库安装 Python 包列表。

该方法目前仅支持Github和Gitlab。

* **Github:** 提供一个包含`GITHUB_TOKEN`键值对的`modal.Secret`
* **Gitlab:** 提供一个包含`GITLAB_TOKEN`键值对的`modal.Secret`

这些 API 令牌应该有权读取作为参数提供的私有存储库列表。

我们建议使用 Github 的[“细粒度”访问令牌](https://github.blog/2022-10-18-introducing-fine-grained-personal-access-tokens-for-github/)。
这些令牌是存储库范围的，并且避免授予跨用户所有私有存储库的读取权限。

**参数**

<Parameter name="*repositories" type="str" description="Git URLs without scheme, e.g. `⟦T107⟧⟦T108⟧⟦T109⟧`." />
<Parameter name="git_user" type="str" description="Username embedded in HTTPS git URLs for authentication." />
<Parameter name="find_links" type="str | None" defaultValue="None" description="Passed as `⟦T110⟧` to pip." />
<Parameter name="index_url" type="str | None" defaultValue="None" description="Passed as `⟦T111⟧` to pip." />
<Parameter name="extra_index_url" type="str | None" defaultValue="None" description="Passed as `⟦T112⟧` to pip." />
<Parameter name="pre" type="bool" defaultValue="False" description="If True, allow pre-release versions." />
<Parameter name="extra_options" type="str" defaultValue="&quot;&quot;" description="Additional raw options for pip." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets that supply `⟦T113⟧⟦T114⟧⟦T115⟧` as required." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />

**退货**

安装了私人存储库的新`Image`。

**使用**

```python
image = (
    modal.Image
    .debian_slim()
    .pip_install_private_repos(
        "github.com/ecorp/private-one@1.0.0",
        "github.com/ecorp/private-two@main"
        "github.com/ecorp/private-three@d4776502"
        # install from 'inner' directory on default branch.
        "github.com/ecorp/private-four#subdirectory=inner",
        git_user="erikbern",
        secrets=[modal.Secret.from_name("github-read-private")],
    )
)
```

## pip\_install\_from\_requirements

```python
pip_install_from_requirements(self, requirements_txt, find_links=None, *,
    index_url=None, extra_index_url=None, pre=False, extra_options="",
    force_build=False, env=None, secrets=None, gpu=None)
```

从本地 `requirements.txt` 文件安装 Python 包列表。

**参数**

<Parameter name="requirements_txt" type="str" description="Path to a `⟦T118⟧` file on the local machine." />
<Parameter name="find_links" type="str | None" defaultValue="None" description="Passed as `⟦T119⟧` to pip." />
<Parameter name="index_url" type="str | None" defaultValue="None" description="Passed as `⟦T120⟧` to pip." />
<Parameter name="extra_index_url" type="str | None" defaultValue="None" description="Passed as `⟦T121⟧` to pip." />
<Parameter name="pre" type="bool" defaultValue="False" description="If True, allow pre-release versions." />
<Parameter name="extra_options" type="str" defaultValue="&quot;&quot;" description="Additional raw options for pip." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />

**退货**

安装了要求的新`Image`。

## pip\_install\_from\_pyproject

```python
pip_install_from_pyproject(self, pyproject_toml, optional_dependencies=[], *,
    find_links=None, index_url=None, extra_index_url=None, pre=False,
    extra_options="", force_build=False, env=None, secrets=None, gpu=None)
```安装本地 `pyproject.toml` 文件指定的依赖项。

`optional_dependencies` 是一个按键列表
`pyproject.toml` 文件的可选依赖项部分
（例如测试、文档、实验等）。当提供时，
每个列出的部分中的所有软件包也都已安装。

**参数**

<Parameter name="pyproject_toml" type="str" description="Path to a `⟦T126⟧⟦T127⟧⟦T128⟧`." />
<Parameter name="optional_dependencies" type="list[str]" defaultValue="[]" description="Keys under `⟦T129⟧` to install additionally." />
<Parameter name="find_links" type="str | None" defaultValue="None" description="Passed as `⟦T130⟧` to pip." />
<Parameter name="index_url" type="str | None" defaultValue="None" description="Passed as `⟦T131⟧` to pip." />
<Parameter name="extra_index_url" type="str | None" defaultValue="None" description="Passed as `⟦T132⟧` to pip." />
<Parameter name="pre" type="bool" defaultValue="False" description="If True, allow pre-release versions." />
<Parameter name="extra_options" type="str" defaultValue="&quot;&quot;" description="Additional raw options for pip." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />

**退货**

安装了项目依赖项的新`Image`。

## uv\_pip\_install

```python
uv_pip_install(self, *packages, requirements=None, find_links=None,
    index_url=None, extra_index_url=None, pre=False, extra_options="",
    force_build=False, uv_version=None, env=None, secrets=None, gpu=None)
```

使用 uv pip install 安装 Python 包列表。

该方法假设：

* Python 位于 `$PATH` 上，并且依赖项随第一个 Python 一起安装在 `$PATH` 上。
* shell 支持生成的 Dockerfile 中使用的 `$()` 样式替换。
* `command` 内置功能可在 `$PATH` 上使用。

v1.1.0 中添加。

**参数**

<Parameter name="*packages" type="str | list[str]" description="Python packages to pass to `⟦T139⟧`." />
<Parameter name="requirements" type="list[str] | None" defaultValue="None" description="Optional list of requirement file paths (passed as `⟦T140⟧`)." />
<Parameter name="find_links" type="str | None" defaultValue="None" description="Passed as `⟦T141⟧⟦T142⟧⟦T143⟧`." />
<Parameter name="index_url" type="str | None" defaultValue="None" description="Passed as `⟦T144⟧⟦T145⟧⟦T146⟧`." />
<Parameter name="extra_index_url" type="str | None" defaultValue="None" description="Passed as `⟦T147⟧⟦T148⟧⟦T149⟧`." />
<Parameter name="pre" type="bool" defaultValue="False" description="If True, allow pre-releases (`⟦T150⟧`)." />
<Parameter name="extra_options" type="str" defaultValue="&quot;&quot;" description="Additional raw options appended to the `⟦T151⟧` invocation." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="uv_version" type="str | None" defaultValue="None" description="Pin the uv binary version copied from `⟦T152⟧`." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />

**退货**

一个新的`Image`，通过 uv 安装了软件包。

**使用**

```python
image = modal.Image.debian_slim().uv_pip_install("torch==2.7.1", "numpy")
```

## 诗歌\_install\_from\_file

```python
poetry_install_from_file(self, poetry_pyproject_toml, poetry_lockfile=None, *,
    ignore_lockfile=False, force_build=False, with_=[], without=[], only=[],
    poetry_version="latest", old_installer=False, env=None, secrets=None,
    gpu=None)
```

安装本地 `pyproject.toml` 文件指定的诗歌*依赖项*。

如果未作为参数提供，则会推断锁定文件的路径。然而，文件必须存在，除非 `ignore_lockfile` 设置为 `True`。

注意，poetry项目的根项目没有安装，只安装了依赖项。
要包含本地 python 源文件，请参阅`add_local_python_source`

除非 `poetry_version` 设置为 None，否则 Poetry 将被安装到镜像中（使用 pip）。
请注意，`poetry_version="latest"` 的解释取决于模态图像生成器
版本，2024.10 及更早版本将诗歌限制为 1.x。

**参数**

<Parameter name="poetry_pyproject_toml" type="str" description="Path to a Poetry `⟦T160⟧` file." />
<Parameter name="poetry_lockfile" type="str | None" defaultValue="None" description="Path to `⟦T161⟧`; if omitted, inferred next to the pyproject." />
<Parameter name="ignore_lockfile" type="bool" defaultValue="False" description="If True, do not copy or use a lockfile even when present." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="with_" type="list[str]" defaultValue="[]" description="Optional dependency groups to include (`⟦T162⟧`)." />
<Parameter name="without" type="list[str]" defaultValue="[]" description="Optional dependency groups to exclude (`⟦T163⟧`)." />
<Parameter name="only" type="list[str]" defaultValue="[]" description="Only install dependency groups in this list (`⟦T164⟧`)." />
<Parameter name="poetry_version" type="str | None" defaultValue="&quot;latest&quot;" description="Poetry version specifier to `⟦T165⟧`, or None to skip installing Poetry." />
<Parameter name="old_installer" type="bool" defaultValue="False" description="If True, use Poetry&#x27;s legacy installer." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />

**退货**

安装了 Poetry 依赖项的新 `Image`。

## uv\_sync

```python
uv_sync(self, uv_project_dir="./", *, force_build=False, groups=None,
    extras=None, frozen=True, extra_options="", uv_version=None, env=None,
    secrets=None, gpu=None)
```
使用 `uv sync` 创建一个具有 uv 管理项目中依赖项的虚拟环境。

`uv_project_dir`中的`pyproject.toml`和`uv.lock`会自动添加到构建上下文中。的
`uv_project_dir` 相对于调用`modal` 的当前工作目录。

注意：这不会*将项目本身安装到环境中（这相当于
`uv sync` 命令中的 `--no-install-project` 标志），并且您需要添加任何本地 python 源
在此调用后使用 `Image.add_local_python_source` 或类似方法处理文件。

这确保了项目代码的更新不需要重新安装第三方依赖项每次改变之后。

目前不支持 uv 工作区。

v1.1.0 中添加。

**参数**

<Parameter name="uv_project_dir" type="str" defaultValue="&quot;./&quot;" description="Path to the local uv project directory (contains `⟦T176⟧`)." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="groups" type="list[str] | None" defaultValue="None" description="Dependency groups passed as `⟦T177⟧`." />
<Parameter name="extras" type="list[str] | None" defaultValue="None" description="Optional extras passed as `⟦T178⟧`." />
<Parameter name="frozen" type="bool" defaultValue="True" description="If True and a `⟦T179⟧⟦T180⟧⟦T181⟧` so the lock is not updated at build time." />
<Parameter name="extra_options" type="str" defaultValue="&quot;&quot;" description="Additional raw options appended to `⟦T182⟧`." />
<Parameter name="uv_version" type="str | None" defaultValue="None" description="Pin the uv binary version copied from `⟦T183⟧`." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />

**退货**

具有 uv 管理虚拟环境的新 `Image`。

**使用**

```python
image = modal.Image.debian_slim().uv_sync()
```

## dockerfile\_commands

```python
dockerfile_commands(self, *dockerfile_commands, context_files={}, env=None,
    secrets=None, gpu=None, context_dir=None, force_build=False,
    ignore=AUTO_DOCKERIGNORE, build_args={})
```

使用任意类似 Dockerfile 的命令扩展镜像。

**参数**

<Parameter name="*dockerfile_commands" type="str | list[str]" description="Dockerfile lines to append after `⟦T185⟧` (strings or nested lists)." />
<Parameter name="context_files" type="dict[str, str]" defaultValue="&#123;&#125;" description="Map of container paths to local files to include in the build context." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />
<Parameter name="context_dir" type="Path | str | None" defaultValue="None" description="Root directory for resolving relative COPY paths in implicit context mounts." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="ignore" type="Sequence[str] | Callable[[Path], bool]" defaultValue="AUTO_DOCKERIGNORE" description="Ignore rules for the implicit context mount (defaults to auto `⟦T186⟧` behavior)." />
<Parameter name="build_args" type="dict[str, str]" defaultValue="&#123;&#125;" description="Dockerfile `⟦T187⟧` values forwarded to the build." />

**退货**

应用了 Dockerfile 片段的新 `Image`。

**使用**

```python
from modal import FilePatternMatcher

# By default a .dockerignore file is used if present in the current working directory
image = modal.Image.debian_slim().dockerfile_commands(
    ["COPY data /data"],
)

image = modal.Image.debian_slim().dockerfile_commands(
    ["COPY data /data"],
    ignore=["*.venv"],
)

image = modal.Image.debian_slim().dockerfile_commands(
    ["COPY data /data"],
    ignore=lambda p: p.is_relative_to(".venv"),
)

image = modal.Image.debian_slim().dockerfile_commands(
    ["COPY data /data"],
    ignore=FilePatternMatcher("**/*.txt"),
)

# When including files is simpler than excluding them, you can use the `~` operator to invert the matcher.
image = modal.Image.debian_slim().dockerfile_commands(
    ["COPY data /data"],
    ignore=~FilePatternMatcher("**/*.py"),
)

# You can also read ignore patterns from a file.
image = modal.Image.debian_slim().dockerfile_commands(
    ["COPY data /data"],
    ignore=FilePatternMatcher.from_file("/path/to/dockerignore"),
)
```

## 入口点

```python
entrypoint(self, entrypoint_commands)
```

设置图像的入口点。

**参数**

<Parameter name="entrypoint_commands" type="list[str]" description="argv tokens for the `⟦T189⟧` JSON array form." />

**退货**
应用了入口点 Dockerfile 指令的新 `Image`。

## 外壳

```python
shell(self, shell_commands)
```

覆盖图像的默认外壳。

**参数**

<Parameter name="shell_commands" type="list[str]" description="argv tokens for the `⟦T191⟧` JSON array form." />

**退货**

应用了 shell Dockerfile 指令的新 `Image`。

## 运行\_命令

```python
run_commands(self, *commands, env=None, secrets=None, volumes=None, gpu=None,
    force_build=False)
```

使用要运行的 shell 命令列表来扩展映像。

**参数**

<Parameter name="*commands" type="str | list[str]" description="Shell commands to run as separate `⟦T193⟧` lines (strings or nested lists)." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="volumes" type="dict[str | PurePosixPath, _Volume] | None" defaultValue="None" description="Modal volumes to attach during the build step." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />

**退货**

一个新的`Image`，其命令作为层执行。

## 微曼巴蛇

```python
micromamba(python_version=None, force_build=False)
```

Micromamba 基础镜像。 Micromamba 允许快速构建基于 Conda 的小型容器。

**参数**

<Parameter name="python_version" type="str | None" defaultValue="None" description="Python series or full version to install in the base conda environment." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />**退货**

基于 Micromamba 的`Image`。

## micromamba\_install

```python
micromamba_install(self, *packages, spec_file=None, channels=[],
    force_build=False, env=None, secrets=None, gpu=None)
```

使用 micromamba 安装附加软件包列表。

**参数**

<Parameter name="*packages" type="str | list[str]" description="Conda packages to install, e.g. `⟦T196⟧` or version constraints." />
<Parameter name="spec_file" type="str | None" defaultValue="None" description="Optional local path to a conda spec file to pass with `⟦T197⟧`." />
<Parameter name="channels" type="list[str]" defaultValue="[]" description="Conda channels to pass with repeated `⟦T198⟧` flags." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />

**退货**

安装了 micromamba 软件包的新 `Image`。

## 来自\_registry

```python
from_registry(tag, secret=None, *, setup_dockerfile_commands=[],
    force_build=False, add_python=None, **kwargs)
```

从公共或私有映像注册表（例如 Docker Hub）构建模态映像。

镜像必须是针对`linux/amd64`平台构建的。

如果您的镜像未安装Python，您可以使用 `add_python` 参数
指定要添加到图像的 Python 版本。否则，图像预计会
在 PATH 上有 Python 作为 `python` 以及 `pip`。

您还可以在执行之前使用 `setup_dockerfile_commands` 运行 Dockerfile 命令
其余命令运行。如果您想要自定义 Python 安装或
设置`SHELL`。如果可能的话，更喜欢`run_commands()`。

要使用静态凭据对私有注册表进行身份验证，您必须将 `secret` 参数设置为
包含用户名 (`REGISTRY_USERNAME`) 的 `modal.Secret` 和
访问令牌或密码 (`REGISTRY_PASSWORD`)。

要使用云提供商的凭据对私有注册表进行身份验证，
使用`Image.from_gcp_artifact_registry()`或`Image.from_aws_ecr()`。

**参数**

<Parameter name="tag" type="str" description="Registry image reference (e.g. `⟦T213⟧`)." /><Parameter name="secret" type="_Secret | None" defaultValue="None" description="Optional secret for static registry credentials." />
<Parameter name="setup_dockerfile_commands" type="list[str]" defaultValue="[]" description="Extra Dockerfile lines run after `⟦T214⟧` during base setup." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="add_python" type="str | None" defaultValue="None" description="Optional standalone Python series to inject when the base image lacks Python." />
<Parameter name="**kwargs" type="" description="Additional arguments forwarded to the internal image constructor (e.g. registry config)." />

**退货**

基于注册表标签的`Image`。

**使用**

```python
modal.Image.from_registry("python:3.11-slim-bookworm")
modal.Image.from_registry("ubuntu:22.04", add_python="3.11")
modal.Image.from_registry("nvcr.io/nvidia/pytorch:22.12-py3")
```

## 来自\_gcp\_artifact\_registry

```python
from_gcp_artifact_registry(tag, secret=None, *, setup_dockerfile_commands=[],
    force_build=False, add_python=None, **kwargs)
```

从 Google Cloud Platform (GCP) Artifact Registry 中的私有映像构建 Modal 映像。

您需要传递包含[您的GCP服务帐户密钥数据](https://cloud.google.com/iam/docs/keys-create-delete#creating)的`modal.Secret`
如`SERVICE_ACCOUNT_JSON`。这可以从[秘密](https://modal.com/secrets)页面完成。
您的服务帐户应被授予特定角色，具体取决于所使用的 GCP 注册表：

* 对于 Artifact Registry 映像（`pkg.dev` 域）使用
  [“工件注册表读取器”](https://cloud.google.com/artifact-registry/docs/access-control#roles) 角色
* 对于容器注册表映像（`gcr.io` 域）使用
  [“存储对象查看器”](https://cloud.google.com/artifact-registry/docs/transition/setup-gcr-repo) 角色

**注意：** 该方法不使用 `GOOGLE_APPLICATION_CREDENTIALS`
变量接受 JSON 文件的路径，而不是实际的 JSON 字符串。

有关其他参数的信息，请参阅`Image.from_registry()`。

**参数**

<Parameter name="tag" type="str" description="Full GCP Artifact Registry image reference." />
<Parameter name="secret" type="_Secret | None" defaultValue="None" description="Secret containing `⟦T222⟧` for registry authentication." />
<Parameter name="setup_dockerfile_commands" type="list[str]" defaultValue="[]" description="Extra Dockerfile lines run after `⟦T223⟧` during base setup." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="add_python" type="str | None" defaultValue="None" description="Optional standalone Python series to inject when the base image lacks Python." />
<Parameter name="**kwargs" type="" description="Additional arguments forwarded to ⟦T224⟧." />

**退货**

基于私有 GCP 工件的 `Image`。

**使用**

```python
modal.Image.from_gcp_artifact_registry(
    "us-east1-docker.pkg.dev/my-project-1234/my-repo/my-image:my-version",
    secret=modal.Secret.from_name(
        "my-gcp-secret",
        required_keys=["SERVICE_ACCOUNT_JSON"],
    ),
    add_python="3.11",
)
```

## 来自\_aws\_ecr

```python
from_aws_ecr(tag, secret=None, *, setup_dockerfile_commands=[],
    force_build=False, add_python=None, **kwargs)
```

从 AWS Elastic Container Registry (ECR) 中的私有映像构建 Modal 映像。您需要传递包含 IAM 用户凭证或 OIDC 的 `modal.Secret`
配置访问目标 ECR 注册表。

对于 IAM 用户身份验证，设置 `AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY` 和 `AWS_REGION`。

对于OIDC身份验证，设置`AWS_ROLE_ARN`和`AWS_REGION`。

IAM 配置详细信息可以在 AWS 文档中找到：
[“私有存储库策略”](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-policies.html)。

有关使用 AWS 角色访问 ECR 的更多详细信息，请参阅[OIDC 集成指南](https://modal.com/docs/guide/oidc-integration)。

有关其他参数的信息，请参阅`Image.from_registry()`。

**参数**

<Parameter name="tag" type="str" description="Full ECR image URI." />
<Parameter name="secret" type="_Secret | None" defaultValue="None" description="Secret with IAM or OIDC credentials for ECR." />
<Parameter name="setup_dockerfile_commands" type="list[str]" defaultValue="[]" description="Extra Dockerfile lines run after `⟦T233⟧` during base setup." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="add_python" type="str | None" defaultValue="None" description="Optional standalone Python series to inject when the base image lacks Python." />
<Parameter name="**kwargs" type="" description="Additional arguments forwarded to ⟦T234⟧." />

**退货**

基于私有 ECR 镜像的`Image`。

**使用**

```python
modal.Image.from_aws_ecr(
    "000000000000.dkr.ecr.us-east-1.amazonaws.com/my-private-registry:my-version",
    secret=modal.Secret.from_name(
        "aws",
        required_keys=["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
    ),
    add_python="3.11",
)
```

## 来自\_dockerfile

```python
from_dockerfile(path, *, force_build=False, context_dir=None, env=None,
    secrets=None, gpu=None, add_python=None, build_args={},
    ignore=AUTO_DOCKERIGNORE)
```
从本地 Dockerfile 构建 Modal 映像。

如果你的 Dockerfile 没有安装 Python，你可以使用 `add_python` 参数
指定要添加到图像的 Python 版本。

**参数**

<Parameter name="path" type="str | Path" description="Path to the Dockerfile on the local machine." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="context_dir" type="Path | str | None" defaultValue="None" description="Build context directory for resolving relative COPY paths." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />
<Parameter name="add_python" type="str | None" defaultValue="None" description="Standalone Python version to add when the Dockerfile does not install Python." />
<Parameter name="build_args" type="dict[str, str]" defaultValue="&#123;&#125;" description="Dockerfile `⟦T237⟧` values forwarded to the build." />
<Parameter name="ignore" type="Sequence[str] | Callable[[Path], bool]" defaultValue="AUTO_DOCKERIGNORE" description="Ignore rules for the implicit context mount (defaults to auto `⟦T238⟧` behavior)." />

**退货**

从 Dockerfile 加上 Modal 运行时依赖项构建的 `Image`。

**使用**

```python
from modal import FilePatternMatcher

# By default a .dockerignore file is used if present in the current working directory
image = modal.Image.from_dockerfile(
    "./Dockerfile",
    add_python="3.12",
)

image = modal.Image.from_dockerfile(
    "./Dockerfile",
    add_python="3.12",
    ignore=["*.venv"],
)

image = modal.Image.from_dockerfile(
    "./Dockerfile",
    add_python="3.12",
    ignore=lambda p: p.is_relative_to(".venv"),
)

image = modal.Image.from_dockerfile(
    "./Dockerfile",
    add_python="3.12",
    ignore=FilePatternMatcher("**/*.txt"),
)

# When including files is simpler than excluding them, you can use the `~` operator to invert the matcher.
image = modal.Image.from_dockerfile(
    "./Dockerfile",
    add_python="3.12",
    ignore=~FilePatternMatcher("**/*.py"),
)

# You can also read ignore patterns from a file.
image = modal.Image.from_dockerfile(
    "./Dockerfile",
    add_python="3.12",
    ignore=FilePatternMatcher.from_file("/path/to/dockerignore"),
)
```

## 从头开始

```python
from_scratch(force_build=False)
```

创建一个空的Image，相当于Docker中的`FROM scratch`。

生成的镜像没有操作系统、shell 或包管理器。这是主要用作轻量级文件系统，通过以下方式挂载到沙箱中
`Sandbox.mount_image`。

请注意，由于此映像不包含 Python 或其他标准操作系统实用程序，
像`pip_install`这样的更高级别的图像构建步骤不能链接到它上面。它还
不能用于`modal.Function`执行，这需要Python解释器。

**参数**

<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />

**退货**

适合最小文件系统挂载的空`Image`。

**使用**

```python notest
image = modal.Image.from_scratch().add_local_file(local_path, "/bin/my_binary", copy=True)
```

## debian\_slim

```python
debian_slim(python_version=None, force_build=False)
```

默认镜像，基于官方 `python` Docker 镜像。

**参数**

<Parameter name="python_version" type="str | None" defaultValue="None" description="Python series or full version to use from the Debian slim images." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />

**退货**

标准 Debian slim Python `Image` 用作 Modal 的默认基础。

## apt_install

```python
apt_install(self, *packages, force_build=False, env=None, secrets=None,
    gpu=None)
```
使用 `apt` 安装 Debian 软件包列表。

**参数**

<Parameter name="*packages" type="str | list[str]" description="Apt package names to install, e.g. `⟦T248⟧⟦T249⟧⟦T250⟧`." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the build container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets injected as environment variables during the build." />
<Parameter name="gpu" type="str | None" defaultValue="None" description="GPU type to attach to the builder container." />

**退货**

应用了 `apt-get install` 图层的新 `Image`。

**使用**

```python
image = modal.Image.debian_slim().apt_install("git")
```

## 运行\_函数

```python
run_function(self, raw_f, *, env=None, secrets=None, volumes={},
    network_file_systems={}, gpu=None, cpu=None, memory=None, timeout=60 * 60,
    cloud=None, region=None, force_build=False, args=(), kwargs={},
    include_source=True)
```

运行用户定义的函数 `raw_f` 作为映像构建步骤。

该函数像普通模态函数一样运行，接受资源配置并集成
具有诸如 Secrets 和 Volumes 之类的模态功能。与普通模态函数不同，对
文件系统状态将在容器退出时捕获并保存为新映像。仅`raw_f`的源代码、`**kwargs`的内容以及任何引用的*全局*变量
用于确定映像是否已更改并需要重建。
如果此函数引用其他函数或变量，则图像将不会被重建
对它们进行更改。您可以通过更改函数的源代码本身来强制重建。

**参数**

<Parameter name="raw_f" type="Callable[..., Any]" description="Callable executed remotely during the image build." />
<Parameter name="env" type="dict[str, str | None] | None" defaultValue="None" description="Environment variables set in the builder container." />
<Parameter name="secrets" type="Collection[_Secret] | None" defaultValue="None" description="Secrets available to the builder function." />
<Parameter name="volumes" type="dict[str | PurePosixPath, _Volume | _CloudBucketMount]" defaultValue="&#123;&#125;" description="Volume and bucket mounts attached for the build." />
<Parameter name="network_file_systems" type="dict[str | PurePosixPath, _NetworkFileSystem]" defaultValue="&#123;&#125;" description="Network file systems attached for the build." />
<Parameter name="gpu" type="str | list[str] | None" defaultValue="None" description="GPU type or list of types for the builder container." />
<Parameter name="cpu" type="float | None" defaultValue="None" description="CPU cores to request (soft limit)." />
<Parameter name="memory" type="int | None" defaultValue="None" description="Memory to request in MiB (soft limit)." />
<Parameter name="timeout" type="int" defaultValue="60 * 60" description="Maximum build-step runtime in seconds." />
<Parameter name="cloud" type="str | None" defaultValue="None" description="Cloud provider for the builder function." />
<Parameter name="region" type="str | Sequence[str] | None" defaultValue="None" description="Region or regions for the builder function." />
<Parameter name="force_build" type="bool" defaultValue="False" description="If True, skip cached image builds." />
<Parameter name="args" type="Sequence[Any]" defaultValue="()" description="Positional arguments serialized to the builder function." />
<Parameter name="kwargs" type="dict[str, Any]" defaultValue="&#123;&#125;" description="Keyword arguments serialized to the builder function." />
<Parameter name="include_source" type="bool" defaultValue="True" description="Whether to include the function&#x27;s source in the builder image." />

**退货**

`raw_f` 完成后，新的 `Image` 捕获文件系统。

**使用**

```python notest

def my_build_function():
    open("model.pt", "w").write("parameters!")

image = (
    modal.Image
        .debian_slim()
        .pip_install("torch")
        .run_function(my_build_function, secrets=[...], volumes={...})
)
```

## 环境

```python
env(self, vars)
```

设置图像中的环境变量。

**参数**

<Parameter name="vars" type="dict[str, str]" description="Map of environment variable names to string values." />
**退货**

应用了 `ENV` 指令的新 `Image`。

**使用**

```python
image = (
    modal.Image.debian_slim()
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
)
```

## 工作目录

```python
workdir(self, path)
```

设置后续映像构建步骤和函数执行的工作目录。

**参数**

<Parameter name="path" type="str | PurePosixPath" description="Working directory path inside the image." />

**退货**

应用了新的 `Image` 和 `WORKDIR`。

**使用**

```python
image = (
    modal.Image.debian_slim()
    .run_commands("git clone https://xyz app")
    .workdir("/app")
    .run_commands("yarn install")
)
```

## 命令

```python
cmd(self, cmd)
```

设置容器启动时运行的默认命令（`CMD`）。

与`modal.Sandbox`一起使用。对`modal.Function`没有影响。

**参数**

<Parameter name="cmd" type="list[str]" description="argv tokens for the default container command." />

**退货**

应用了新的 `Image` 和 `CMD`。

**使用**

```python
image = (
    modal.Image.debian_slim().cmd(["python", "app.py"])
)
```

## 管道

```python
pipe(self, func, *args, **kwargs)
```

应用局部函数来扩展图像配方。此方法对于定义可重用的图像构建非常有用
与流畅的图像生成器界面完美结合的食谱。

**示例**

```python
def workspace_setup(image: modal.Image, repo: str) -> modal.Image:
    return image.run_commands(f"git clone {repo}").uv_pip_install(".")

image = (
    modal.Image.debian_slim()
    .apt_install("git")
    .pipe(workspace_setup, "https://github.com/example/repo.git")
)
```

## 进口

```python
imports(self)
```

用于导入全局范围内的包，这些包仅在远程运行时可用。

通过使用这个上下文管理器，您可以避免由于没有某些特定的信息而导致的 `ImportError`
本地安装的软件包。

**退货**

上下文管理器记录导入失败，直到图像在远程环境中水合为止。

**使用**

```python notest
with image.imports():
    import torch
```

## 来自\_name

```python
from_name(name, *, environment_name=None, client=None)
```

引用之前使用 `.publish()` 发布的命名图像。
名称可以包含可选的 `:tag` 部分。如果不包含标签部分，则使用`":latest"`，匹配
Docker 约定。

```python notest
image = modal.Image.from_name("my-image")     # references my-image:latest
image_v1 = modal.Image.from_name("my-image:v1")

@app.function(image=image)
def run():
    ...
```

## 发布

```python
publish(self, name, *, environment_name=None, experimental_options=None,
    client=None)
```

以指定名称发布此图像

图像必须已创建（通常通过调用`image.build()`或`sandbox.snapshot_filesystem()`）。

图像名称可以包含使用 `name:tag` 的显式标签指定。如果名称中不包含标签，
使用`":latest"`，匹配 Docker 约定。要发布多个标签，请为每个标签调用一次`.publish()`。

```python notest
image = modal.Image.debian_slim().pip_install("numpy")
image.build(app)
image.publish("my-image-with-numpy")     # my-image-with-numpy:latest
image.publish("my-image-with-numpy:v1")
```

## 日志

```python
logs: ImageLogsManager
```

`Image` 的访问日志。

使用[`fetch()`](#logsfetch)
读取各个构建层的日志和 [`tail()`](#logstail)
读取最新的日志。

**另见**

* [`modal app logs`](https://modal.com/docs/cli/latest/app#modal-app-logs):
  CLI 访问应用程序的日志。

### 日志.fetch

```python
fetch(self, layers=1)
```

获取最新镜像构建步骤的日志。

**参数**

<Parameter name="layers" type="int | None" defaultValue="1" description="The number of build layers to fetch, counting backward from the final Image. If None, logs are fetched for all build steps." />

### 日志.tail

```python
tail(self, entries=100)
```

获取最新的图像日志。

**参数**

<Parameter name="entries" type="int" defaultValue="100" description="The number of log entries to return." />