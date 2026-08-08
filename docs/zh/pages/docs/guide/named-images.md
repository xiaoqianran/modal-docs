<!-- modal-docs: machine-translated zh-CN from English source -->

# 命名图像

命名图像允许您以可以引用的名称发布模态图像
稍后使用该镜像，类似于容器注册表。

这对于更严格的图像更改管理和避免
意外的图像失效并在延迟敏感的代码路径上重建。

与内联图像定义不同，通过名称引用图像永远不会
隐式重建图像。名称的图像引用是可变的，
并且因为参考通常仅在成功之后更新
发布后，调用者在新版本运行时继续使用以前的工作图像。

使用命名图像的典型工作流程是：

1. 在独立运行的镜像构建脚本中定义、构建和发布镜像
2. 在沙盒或函数代码中按名称引用已发布的镜像，获取当时该镜像的最新版本

## 从脚本发布图像

使用 [`Image.build`](/docs/sdk/py/latest/Image#build) 构建
图像，然后对生成的图像调用 `.publish()`：

<CodeTabs>
  {#snippet python()}

```python notest
# build_image.py
app = modal.App.lookup("image-builds", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git")
    .uv_pip_install("numpy", "pandas", "scikit-learn")
    .run_commands("python -c 'import sklearn; print(sklearn.__version__)'")
)

with modal.enable_output():
    image.build(app).publish("analytics-runtime")
```

{/片段}

{#snippet javascript()}

```javascript
// build_image.ts
const app = await modal.apps.fromName("image-builds", {
  createIfMissing: true,
});

const image = modal.images
  .fromRegistry("python:3.12-slim")
  .dockerfileCommands([
    "RUN apt-get update && apt-get install -y git",
    "RUN pip install numpy pandas scikit-learn",
    "RUN python -c 'import sklearn; print(sklearn.__version__)'",
  ]);

const builtImage = await image.build(app);
await builtImage.publish("analytics-runtime");
```

{/片段}

{#snippet go()}

```go
// build_image.go
app, err := mc.Apps.FromName(ctx, "image-builds", &modal.AppFromNameParams{
	CreateIfMissing: true,
})

image := mc.Images.FromRegistry("python:3.12-slim", nil).
	DockerfileCommands([]string{
		"RUN apt-get update && apt-get install -y git",
		"RUN pip install numpy pandas scikit-learn",
		"RUN python -c 'import sklearn; print(sklearn.__version__)'",
	}, nil)

builtImage, err := image.Build(ctx, app, nil)
err = builtImage.Publish(ctx, "analytics-runtime", nil)
```

{/片段} </CodeTabs>

## 使用命名图像启动沙箱
命名图像对于沙箱特别有用，因为沙箱创建经常发生
在对延迟敏感的路径上，您通常不想阻止沙盒创建
重建图像。

引用时使用 [`Image.from_name`](/docs/sdk/py/latest/Image#from_name)
您之前构建的命名图像，并使用它启动沙箱：

<CodeTabs>
  {#snippet python()}

```python notest
# sandbox_launcher.py
sb = modal.Sandbox.create(
    "python",
    "-c",
    "import pandas, sklearn; print('ready')",
    image=modal.Image.from_name("analytics-runtime"),
    app=app,
)
print(sb.stdout.read())
```

{/片段}

{#snippet javascript()}

```javascript
// sandbox_launcher.ts
const image = await modal.images.fromName("analytics-runtime");
const sb = await modal.sandboxes.create(app, image);

const p = await sb.exec([
  "python",
  "-c",
  "import pandas, sklearn; print('ready')",
]);
console.log(await p.stdout.readText());
sb.detach();
```

{/片段}

{#snippet go()}

```go
// sandbox_launcher.go
image, err := mc.Images.FromName(ctx, "analytics-runtime", nil)
sb, err := mc.Sandboxes.Create(ctx, app, image, nil)
defer sb.Detach()

p, err := sb.Exec(ctx, []string{
	"python",
	"-c",
	"import pandas, sklearn; print('ready')",
}, nil)
stdout, err := io.ReadAll(p.Stdout)
fmt.Println(string(stdout))
```

{/片段} </CodeTabs>

## 使用命名图像运行函数

当您想要更多地控制何时定义模态函数时，也可以使用命名图像
函数开始使用新图像。要使用命名图像，请指向函数图像属性
到 [`Image.from_name`](/docs/sdk/py/latest/Image#from_name) 参考：

```python notest
# app.py
@app.function(image=modal.Image.from_name("analytics-runtime"))
def train():
    import pandas as pd
    from sklearn.linear_model import LinearRegression
    ...
```

请注意，发布此命名图像的新版本不会自动
更新您部署的函数以使用更新后的映像。您仍然需要重新部署
引用该名称以传播更改的应用程序。

## 标签

每个命名图像都使用 `{name}:{tag}` 名称表示 - 如果您不指定标签部分，则会自动使用 `:latest` 标签。
您可以使用多个名称或标签发布同一图像，这对于执行图像版本控制等操作很有用。