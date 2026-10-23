<!-- modal-docs: machine-translated zh-CN from English source -->

# 搜索语法

Modal 中的某些搜索框接受小型查询语言，因此您可以按以下条件进行过滤
字段而不是扫描原始输出。

## 过滤器

查询是由空格分隔的过滤器列表。过滤器可以是
`key:value` 要搜索的对或文本。每个过滤器都必须匹配：它们是
使用 AND 隐式组合，切勿使用 OR。

`key:value` 匹配 `key` 为 `value` 的项目 — 例如`status:success`。

* **否定** — 将 `-` 放在过滤器前面以排除它匹配的内容：
  `-status:success`。
* **多个值** — 将它们用括号内的 `OR` 分组：`status:(success OR failure)`。该组属于一个键，`OR`必须
  须大写。

## 搜索自由文本

一些搜索框还接受自由文本过滤器（任何没有键的过滤器/`:`
是自由文本）。例如，`timeout` 搜索该单词，并且 `-timeout`
排除它。您可以查询不带引号的自由文本，除非有特殊说明
使用字符。

## 引用

将过滤器用双引号引起来，以准确搜索其中的内容。
引用包含空格、括号、引号、反斜杠或的过滤器
a `:` 你的字面意思是：

* `name:"my app"` — 一个包含空格的值。
* `"status: success"` — 文本`status: success`，而不是`key:value` 过滤器。

## 逃脱
反斜杠仅转义引号或另一个反斜杠，并且仅转义在引号内。
其他任何地方 - 外部引号、任何其他字符之前或尾随
带引号的字符串的末尾 - 它被突出显示为错误：

* `"a \"quoted\" word"` — 包含双引号的文本。
* `"C:\\dir"` — 带有反斜杠的文本。

## 示例

|查询 |比赛|
| -------------------------------------- | --------------------------------------------------------------------------------------- || `status:success` |状态为成功的项目。                                              |
| `-status:success` |一切状态不是成功的事情。                                     |
| `status:(success OR failure)` |状态为其中之一的项目。                                           |
| `status:success timeout` |状态为成功且与文本 `timeout` 匹配的项目。            |
| `name:"my app"` |准确命名为 `my app` 的物品。                                               |
| `timeout` |与文本`timeout`匹配的项目。                                          |
| `-timeout` |项目与文本`timeout`不匹配。                                      |
| `-"connection timeout"` |项目与文本`connection timeout`不匹配。                           |
| `"-timeout"` |与文本 `-timeout` 匹配的项目，该文本未被否定。                   |
| `"status: success"` |与文本 `status: success` 匹配的项目，因为引用强制文本。       |
| `foo:bar` |与文本 `foo:bar` 匹配的项目，突出显示，因为 `foo` 不是字段。 |
| `"C:\dir"` |错误 - `\d` 没有转义任何内容。                                    |
| `"C:\\dir"` |与文本`C:\dir`匹配的项目。                                           |