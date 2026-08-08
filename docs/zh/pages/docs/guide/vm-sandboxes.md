<!-- modal-docs: machine-translated zh-CN from English source -->

# 虚拟机沙箱

<Callout variant="beta" />

沙箱可以在完整的虚拟机之上运行，而不是在 gVisor 之上运行。这给出了
每个沙盒都是一个真正的 Linux 内核，这使得某些工作负载（例如 Docker 系统）表现良好
就像在普通 Linux 主机上一样。

您可以通过传递 `experimental_options={"vm_runtime": True}` 将虚拟机运行时用于您的沙箱
到`Sandbox.create()`。

<Collapsible title="VM demo">

```python fixture:sb_app
with modal.enable_output():
    sb = modal.Sandbox.create(
        app=sb_app,
        cpu=2,  # physical cores
        memory=4096,  # MiB
        experimental_options={"vm_runtime": True},
    )

# add a script that uses VM Sandbox features
sb.filesystem.write_text(
    """
  # Format an ext4 filesystem onto a regular file.
  truncate -s 100M /tmp/disk.img
  mkfs.ext4 -F /tmp/disk.img

  # Mount it. This works in a VM, but isn't supported in gVisor.
  mkdir -p /mnt/loop
  mount -o loop /tmp/disk.img /mnt/loop
""",
    "/tmp/mount_loopback_filesystem.sh",
)

p = sb.exec("bash", "/tmp/mount_loopback_filesystem.sh")
p.wait()

print(p.stdout.read())

print(p.stderr.read())

assert p.returncode == 0  # error if the program in the Sandbox fails

sb.terminate()
```

</Collapsible>

VM 沙箱也是在沙箱中运行 Docker 的推荐方法。为了尝试这个，
将以下程序复制到例如`docker_in_modal_demo.py`，然后运行它
`python docker_in_modal_demo.py`。

<Collapsible title="Docker-in-Sandbox demo">

<!-- 使下面的代码块与synthetic_monitoring/benchmarks/docker_in_modal.py保持同步。
下面的“标记”注释用于区分此代码与 synmon 中的代码。不要改变它们。 -->

<!-- synmon-sync:docker_in_modal:begin -->

```python
import modal

# Create an image for the parent Modal Sandbox, with Docker installed.
def create_modal_sandbox_image():
    image = (
        modal.Image.from_registry("ubuntu:24.04")
        .env({"DEBIAN_FRONTEND": "noninteractive"})
        .apt_install(["docker.io", "docker-buildx"])
        .run_commands("mkdir /build")
    )
    return image


def main():
    print("Looking up modal.Sandbox app")
    app = modal.App.lookup("docker-test", create_if_missing=True)
    print("Creating sandbox")

    with modal.enable_output():
        sb = modal.Sandbox.create(
            "/usr/bin/dockerd",
            "-D",
            timeout=60 * 60,
            app=app,
            image=create_modal_sandbox_image(),
            experimental_options={"vm_runtime": True},
        )

    print(f"sandbox_id: {sb.object_id}")
    task_id = sb._get_task_id()
    print(f"task_id: {task_id}")
    print(f"To shell into the task, run: modal shell {task_id}")
    # dockerd is the sandbox entrypoint and takes a moment to bind
    # /var/run/docker.sock after the sandbox is created. Poll until the
    # daemon answers so the first `docker build` doesn't run before dockerd is ready.
    print("Waiting for dockerd to be ready")
    wait_p = sb.exec(
        "sh",
        "-c",
        "for i in $(seq 1 120); do "
        "if [ -S /var/run/docker.sock ] && docker info >/dev/null 2>&1; then "
        "echo ready; exit 0; fi; sleep 1; done; "
        "echo 'dockerd not ready after 120s' >&2; exit 1",
    )
    wait_p.wait()
    if wait_p.returncode != 0:
        raise Exception(f"dockerd never became ready: {wait_p.stderr.read()}")

    # A simple Dockerfile that we'll build and run within Modal.
    dockerfile = """
    FROM ubuntu
    RUN apt-get update
    RUN apt-get install -y cowsay curl
    RUN mkdir -p /usr/share/cowsay/cows/
    RUN curl -o /usr/share/cowsay/cows/docker.cow https://raw.githubusercontent.com/docker/whalesay/master/docker.cow
    ENTRYPOINT ["/usr/games/cowsay", "-f", "docker.cow"]
    """
    sb.filesystem.write_text(dockerfile, "/build/Dockerfile")

    print("Building docker image")
    p = sb.exec("docker", "build", "-t", "whalesay", "/build")
    for l in p.stdout:
        print(l, end="")
    p.wait()
    print("--------------------------------")
    if p.returncode != 0:
        print(p.stderr.read())
        raise Exception("Docker build failed")

    # The Sandbox will run a container from the built image and print this:
    #
    #  ________
    # < Hello! >
    #  --------
    #     \
    #      \
    #       \
    #                     ##         .
    #               ## ## ##        ==
    #            ## ## ## ## ##    ===
    #        /"""""""""""""""""\___/ ===
    #       {                       /  ===-
    #        \______ O           __/
    #          \    \         __/
    #           \____\_______/

    print("Running Docker image")
    # Note we can't use -it here because we're not in a TTY.
    p = sb.exec("docker", "run", "--rm", "whalesay", "Hello!")
    print(p.stdout.read())
    p.wait()
    if p.returncode != 0:
        raise Exception(f"Docker run failed: {p.stderr.read()}")
    sb.terminate()

if __name__ == "__main__":
    main()
```

<!-- synmon-sync:docker_in_modal:end -->

</Collapsible>

此外，还可以使用以下命令通过 CLI 快速配置带有 PTY shell 的 VM Sandbox：

```
modal shell --experimental-option vm_runtime=1
```

## 对 gVisor 沙箱的改进

Docker 工作负载的行为更像是在非容器环境中的行为。特别是：

* Docker 状态（例如 `/var/lib/docker`）包含在 [文件系统快照](/docs/guide/sandbox-snapshots#filesystem-snapshots) 中
* 之前需要在 gVisor 上进行特殊处理的 Docker 功能（例如容器间网络）也将正常工作

现在可以使用只有在真正的 Linux 环境中才有意义的功能：

* 支持自定义[初始化系统](https://arxiv.org/pdf/0706.2748)（如[`systemd`](https://man7.org/linux/man-pages/man1/systemd.1.html)）
* 支持[eBPF](https://ebpf.io/)
* 支持[FUSE](https://www.kernel.org/doc/html/latest/filesystems/fuse.html)安装座
* 支持沙盒内通过[cgroups](https://man7.org/linux/man-pages/man7/cgroups.7.html)进行资源隔离

最后，对于大多数工作负载，根文件系统在 VM 沙箱上的性能比在 gVisor 沙箱中的性能更好。

## 资源模型

与其他运行时中的[资源配置](/docs/guide/resources)不同，
VM 沙箱的内存配置是**静态**：您获得的内存量完全相同
RAM 根据您的请求通过 `memory` 参数传递给 `Sandbox.create`。默认情况下，虚拟机
沙箱有 1GiB RAM。

然而，CPU 配置是有弹性的。您可以突破您要求的金额。

两种资源的成本根据请求量、使用量、
沙盒执行的持续时间，以及[我们的`cpu`和`memory`费率](/定价)。

## 限制

以下限制是已知的，我们正在跟踪它们：

* **不支持 GPU。** VM 沙盒当前仅支持 CPU 工作负载。
* **[Sandbox 文件系统 API](/docs/guide/sandbox-files#filesystem-api-beta) 仅在新的 SDK 版本中可用**。对于Python SDK，它需要版本≥ 1.4.0，对于JS/TS/Go SDK，它需要版本≥ 0.7.6。
* **不支持[`Sandbox.reload_volumes()`](/docs/sdk/py/latest/Sandbox#reload_volumes)。** VM Sandbox 目前不支持在运行时重新加载卷。
* **尚不支持[内存快照](/docs/guide/sandbox-snapshots#memory-snapshots)。** 仅
  [文件系统快照](/docs/guide/sandbox-snapshots#filesystem-snapshots) 目前适用于 VM 沙箱。
* **不支持 ≥ 512 GiB 的根映像。** VM 根文件系统当前限制为 512 GiB。从超过此大小的容器映像创建的沙箱将无法启动。

如果您遇到此处未列出的问题，请通过 [Slack](/slack) 联系我们或发送电子邮件至 <support@modal.com>。