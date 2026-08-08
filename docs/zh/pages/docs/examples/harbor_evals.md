<!-- modal-docs: machine-translated zh-CN from English source -->

# 在模态沙箱上运行大规模并行评估

[模态沙箱](https://modal.com/docs/guide/sandboxes) 对于执行非常有用
语言模型生成的代码，创建隔离的运行环境
不受信任的代码等等。这里我们使用[Harbor](https://www.harborframework.com/docs)，
用于评估和优化容器环境中的代理和模型的框架，
运行大规模并行评估。 Harbor 通过以下方式创建模态沙箱
`harbor run --env modal`。

## 设置

该脚本需要在本地安装一些依赖项。我们包括
遵循[内联脚本元数据](https://peps.python.org/pep-0723/)，以便像[`uv`](https://docs.astral.sh/uv/)这样的工具可以自动安装这些
依赖关系。

```python
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "harbor[modal]==0.15.0",
#   "modal~=1.5.3",
# ]
# ///
```

要运行此示例：

```shell
uv run --python 3.12 --script 13_sandboxes/harbor_evals.py
```

```python
import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

```

## 定义任务

一个Harbor [任务](https://www.harborframework.com/docs/tasks)是一个目录
Harbor 用于设置环境、指示代理和验证的文件
它的结果。 Harbor 在自己的模态沙箱中将每次任务尝试作为试验运行。
默认任务是一个演示基本功能的玩具示例。

```python
DEFAULT_TASK_FILES = {
    "task.toml": """version = "1.0"
[environment]
docker_image = "ubuntu:24.04"
workdir = "/app"
network_mode = "no-network"
cpus = 1
memory_mb = 512
storage_mb = 1024
""",
    "instruction.md": "Create `answer.txt` containing exactly `ok`.\n",
    "solution/solve.sh": "#!/bin/bash\nprintf 'ok\\n' > answer.txt\n",
    "tests/test.sh": """#!/bin/bash
if [ "$(cat /app/answer.txt 2>/dev/null)" = "ok" ]; then
  echo 1 > /logs/verifier/reward.txt
else
  echo 0 > /logs/verifier/reward.txt
  exit 1
fi
""",
}

```

## 运行评估

我们只需将任务文件写入临时目录，
然后让Harbor 处理剩下的事情。

```python
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run parallel Harbor oracle evals on Modal Sandboxes."
    )
    parser.add_argument("--n-parallel", type=int, default=8)
    parser.add_argument(
        "--task",
        type=Path,
        default=None,
        help="Harbor task directory.",
    )
    args = parser.parse_args()

    has_toml = (Path.home() / ".modal.toml").exists()
    has_env = bool(
        os.environ.get("MODAL_TOKEN_ID") and os.environ.get("MODAL_TOKEN_SECRET")
    )
    if not has_toml and not has_env:
        print(
            "Modal auth required: run `modal token new` or set "
            "MODAL_TOKEN_ID and MODAL_TOKEN_SECRET.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    with tempfile.TemporaryDirectory() as tmp:
        run_dir = Path(tmp) / os.urandom(16).hex()
        run_dir.mkdir(parents=True, exist_ok=True)
        jobs = run_dir / "jobs"

        if args.task is None:
            task = run_dir / "task"
            (task / "environment").mkdir(parents=True)
            for name, contents in DEFAULT_TASK_FILES.items():
                path = task / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(contents)
                if name.endswith(".sh"):
                    path.chmod(0o755)
        else:
            task = args.task.expanduser().resolve()
            if not task.is_dir():
                print(f"Task path must be a directory: {task}", file=sys.stderr)
                raise SystemExit(1)

        print(
            f"Running {args.n_parallel} trials on {args.n_parallel} concurrent "
            "Modal Sandboxes...",
            flush=True,
        )
        subprocess.run(
            [
                "harbor",
                "run",
                "--path",
                str(task),
                "--agent",
                "oracle",
                "--env",
                "modal",
                "--n-attempts",
                str(args.n_parallel),
                "--n-concurrent",
                str(args.n_parallel),
                "--jobs-dir",
                str(jobs),
                "--yes",
                "--quiet",
            ],
            check=True,
        )
        rewards = [path.read_text().strip() for path in jobs.glob("**/reward.txt")]
        passed = sum(reward == "1" for reward in rewards)
        total = args.n_parallel

    print(f"{passed}/{total} tests passed")
    if passed != total:
        raise SystemExit(1)


if __name__ == "__main__":
    main()


```

## 后续步骤

默认的八个并行沙箱可以快速完成并适合
每个[模态计划](https://modal.com/pricing)。要查看真实比例，请传递更大的
值，最高可达您计划的并发容器限制：

```shell
uv run --python 3.12 --script 13_sandboxes/harbor_evals.py --n-parallel 100
```

您还可以传递本地目录来运行您自己的任务：

```shell
uv run --python 3.12 --script 13_sandboxes/harbor_evals.py --task ./my-task
```