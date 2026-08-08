<!-- modal-docs: machine-translated zh-CN from English source -->

# 持续部署

将 Modal 应用程序自动部署为 CI/CD 管道的一部分是一种常见模式。
为了帮助您入门，下面是持续部署 Modal 的指南
GitHub 中的应用程序。

## GitHub 操作

这是一个示例 GitHub Actions 工作流程，它会在每次推送时部署您的应用程序
`main` 分支。

这需要您创建一个 [Modal token](/settings/tokens) 并将其添加为
[Github Actions 工作流程的秘密](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)。

设置机密后，在您的存储库中创建一个新的工作流程文件：
`.github/workflows/ci-cd.yml` 包含以下内容：

```yaml
name: CI/CD

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    env:
      MODAL_TOKEN_ID: ${{ secrets.MODAL_TOKEN_ID }}
      MODAL_TOKEN_SECRET: ${{ secrets.MODAL_TOKEN_SECRET }}

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v6

      - name: Install Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"

      - name: Install Modal
        run: |
          python -m pip install --upgrade pip
          pip install modal

      - name: Deploy job
        run: |
          modal deploy -m my_package.my_file
```

请务必将 `my_package.my_file` 替换为您的实际入口点。

如果您使用多个模态[环境](/docs/guide/environments)，您可以
另外使用 YAML 指定目标环境
`MODAL_ENVIRONMENT=xyz`。