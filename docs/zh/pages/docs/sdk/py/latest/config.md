<!-- modal-docs: machine-translated zh-CN from English source -->

# 配置

模式客户端配置。

配置值从`.modal.toml`中的活动配置文件中读取。每个
设置可以被名为 `MODAL_<SETTING>` 的环境变量覆盖。

客户端进程可以通过两种方式进行身份验证：

1. Modal API 令牌使用 `MODAL_TOKEN_ID` 和 `MODAL_TOKEN_SECRET`。的
   `modal token set` 命令将这些值存储在`.modal.toml` 中。
2. 第三方 OAuth 集成通常会注入 `MODAL_OAUTH_REFRESH_TOKEN`，
   `MODAL_OAUTH_CLIENT_ID`和`MODAL_OAUTH_CLIENT_SECRET`进入流程。

两种身份验证方法不能组合使用，并且所有值
必须提供所选方法。

## .modal.toml`.modal.toml` 文件通常存储在您的主目录中。
它应该看起来像这样::

```toml
[default]
token_id = "ak-12345..."
token_secret = "as-12345..."
```

您可以手动创建此文件，也可以运行 `modal token set ...`
命令（见下文）。

## 使用 CLI 设置令牌

您可以通过运行以下命令来设置令牌：

```
modal token set \
  --token-id <token id> \
  --token-secret <token secret>
```

这会将令牌 ID 和密钥写入`.modal.toml`。

如果令牌 ID 或密钥以字符串 `-`（单个破折号）形式提供，
那么它将以秘密方式从 stdin 读取。

## 其他配置选项

其他可能的配置选项有：

* `loglevel`（在 .toml 文件中）/`MODAL_LOGLEVEL`（作为环境变量）。
  默认为`WARNING`。将其设置为 `DEBUG` 以查看内部消息。
* `logs_timeout`（在 .toml 文件中）/`MODAL_LOGS_TIMEOUT`（作为环境变量）。
  默认为 10。
  关闭会话时等待日志耗尽的秒数，
  在放弃之前。
* `max_throttle_wait`（在 .toml 文件中）/`MODAL_MAX_THROTTLE_WAIT`（作为环境变量）。
  默认为“无”（无限制）。
  请求被限制时等待的最大秒数（即，由于
  速率限制或其他通常可以通过退避解决的情况）。
* `force_build`（在 .toml 文件中）/`MODAL_FORCE_BUILD`（作为环境变量）。
  默认为 False。
  设置后，忽略图像缓存并构建所有图像层。请注意，这将破坏基于重建图层的所有图像的缓存，因此其他图像
  即使配置已恢复，也可能会在后续运行/部署时重建。
* `ignore_cache`（在 .toml 文件中）/`MODAL_IGNORE_CACHE`（作为环境变量）。
  默认为 False。
  设置后，忽略图像缓存并构建所有图像层。与`force_build`不同，
  这不会覆盖具有相同配方的其他图像的缓存。
  不使用此选项的后续运行将从中提取*前一个*图像
  缓存（如果存在）。它对于测试应用程序的稳健性很有用
  图像重建不会破坏其他应用程序使用的图像。
* `traceback`（在 .toml 文件中）/`MODAL_TRACEBACK`（作为环境变量）。
  默认为 False。允许在意外的 CLI 上打印完整的回溯
  错误，这对于调试客户端问题很有用。
* `log_pattern`（在 .toml 文件中）/`MODAL_LOG_PATTERN`（作为环境变量）。
  默认为`"[modal-client] %(asctime)s %(message)s"`
  模式客户端本身将使用的日志格式模式。
  请参阅https://docs.python.org/3/library/logging.html#logrecord-attributes了解可用信息
  日志属性。
* `dev_suffix`（在 .toml 文件中）/`MODAL_DEV_SUFFIX`（作为环境变量）。
  覆盖添加到为 Web Functions 生成的 URL 的默认 `-dev` 后缀
  当应用程序是临时的（即通过`modal serve`创建）时。一定是短篇字母数字字符串。

## 元配置

一些“元选项”仅使用环境变量设置：

* `MODAL_CONFIG_PATH` 允许您覆盖 .toml 文件的位置，
  默认`~/.modal.toml`。
* `MODAL_PROFILE` 允许您使用 .toml 文件中的多个部分
  并在它们之间切换。它默认为“默认”。

## 配置

```python
class Config(object)
```

Singleton 保存 Modal 内部使用的配置。

```python
__init__(self)
```

### 得到

```python
get(self, key, *, profile=None, use_env=True)
```

查找配置值。

解决顺序（优先级最高）：

1. 环境变量`MODAL_<KEY>`（下划线分隔，大写），当`use_env`为True时。
2. `.modal.toml` 中命名的配置文件。
3. 该设置的内置默认值。

**参数**

<Parameter name="key" type="str" description="Setting name (for example `⟦T50⟧⟦T51⟧⟦T52⟧⟦T53⟧⟦T54⟧` module docs." />
<Parameter name="profile" type="str | None" defaultValue="None" description="Profile section to read from the TOML file; defaults to the active profile." />
<Parameter name="use_env" type="bool" defaultValue="True" description="When False, skip environment variables and read only from the file or defaults." />

**退货**

转换后的配置值（类型取决于设置）。

### 本地覆盖\_

```python
override_locally(self, key, value)
```

### 到\_dict

```python
to_dict(self)
```

## 配置\_配置文件

```python
config_profiles()
```

在 `.modal.toml` 文件中列出可用的模态配置文件。

**退货**

配置文件中存在的配置文件部分名称。

## 配置\_set\_active\_profile

```python
config_set_active_profile(profile)
```

通过将用户的活动模态配置文件写入 `.modal.toml` 文件来设置用户的活动模态配置文件。

**参数**

<Parameter name="profile" type="str" description="Name of an existing profile section to mark as active." />