<!-- modal-docs: machine-translated zh-CN from English source -->

# 从注册表快速拉取

将公共和私人图像从注册表拉入 Modal 的性能
采用[eStargz](https://github.com/containerd/stargz-snapshotter/blob/main/docs/estargz.md)压缩格式可以显着提高。

通过在镜像构建和推送过程中应用 eStargz 压缩，Modal 将会变得更加强大
更有效地从注册表中提取图像。

## 如何使用estargz

如果您的[Buildkit](https://docs.docker.com/build/buildkit/)版本大于`0.10.0`，采用`estargz`就像
向您的 `docker buildx build` 命令添加一些标志：

* `type=registry` 标志将指示 BuildKit 在构建后推送镜像。* 如果您在构建后不立即推送映像，而是尝试稍后使用 docker Push 推送映像，则映像将转换为标准 gzip 映像。
* `compression=estargz` 指定我们使用 [eStargz](https://github.com/containerd/stargz-snapshotter/blob/main/docs/estargz.md) 压缩格式。
* `oci-mediatypes=true` 指定我们正在使用 eStargz 所需的 OCI 媒体类型。
* `force-compression=true` 将重新压缩整个图像并将基础图像转换为 eStargz（如果尚未）。

```bash
docker buildx build --tag "<registry>/<namespace>/<repo>:<version>" \
--output type=registry,compression=estargz,force-compression=true,oci-mediatypes=true \
.
```

然后在模态代码中像平常一样引用容器图像。

```python notest
app = modal.App(
    "example-estargz-pull",
    image=modal.Image.from_registry(
        "public.ecr.aws/modal/estargz-example-images:text-generation-v1-esgz"
    )
)
```

在构建时，您应该看到支持 eStargz 的拉取程序激活：

```
Building image im-TinABCTIf12345ydEwTXYZ

=> Step 0: FROM public.ecr.aws/modal/estargz-example-images:text-generation-v1-esgz
Using estargz to speed up image pull (index loaded in 1.86s)...
Progress: 10% complete... (1.11s elapsed)
Progress: 20% complete... (3.10s elapsed)
Progress: 30% complete... (4.18s elapsed)
Progress: 40% complete... (4.76s elapsed)
Progress: 50% complete... (5.51s elapsed)
Progress: 62% complete... (6.17s elapsed)
Progress: 74% complete... (6.99s elapsed)
Progress: 81% complete... (7.23s elapsed)
Progress: 99% complete... (8.90s elapsed)
Progress: 100% complete... (8.90s elapsed)
Copying image...
Copied image in 5.81s
```

## 支持的注册表
目前，Modal 支持使用以下注册表快速 estargz 拉取镜像：

* AWS 弹性容器注册表 (ECR)
* Docker 中心 (docker.io)
* Google Artifact 注册表（gcr.io、pkg.dev）

我们正在努力添加对 GitHub 容器注册表 (ghcr.io) 的支持。