<!-- modal-docs: machine-translated zh-CN from English source -->

# 传递本地数据

如果您的函数需要访问 Python 中不存在的某些数据
文件本身，您有一些选项可以将这些数据与模态捆绑在一起
应用程序。

## 传递函数参数

最简单直接的方法就是从本地读取数据
编写脚本并将数据传递给最外面的模态函数调用：

```python
import json


@app.function()
def foo(a):
    print(sum(a["numbers"]))


@app.local_entrypoint()
def main():
    data_structure = json.load(open("blob.json"))
    foo.remote(data_structure)
```

任何可通过以下方式序列化的合理大小的数据
[cloudpickle](https://github.com/cloudpipe/cloudpickle) 作为一个还算可以
模态函数的参数。小有效负载（≤ 2 MiB）内联存储在我们的元数据存储中；
较大的有效负载存储在对象存储中。

请参阅[全局变量](/docs/guide/global-variables) 部分了解如何
处理只能在本地初始化的全局范围内的对象。

## 包括本地文件

要包含供模态函数访问的本地文件，请参阅[定义图像](/docs/guide/images)。