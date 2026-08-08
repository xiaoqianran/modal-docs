<!-- modal-docs: machine-translated zh-CN from English source -->

# 隧道

从正在运行的 Modal 容器内转发的端口。由`modal.forward()`创建。

**重要提示：** 这是一个实验性 API，将来可能会发生变化。

**属性**

<Parameter name="host" type="str" description="" />
<Parameter name="port" type="int" description="" />
<Parameter name="unencrypted_host" type="str" description="" />
<Parameter name="unencrypted_port" type="int" description="" />

## 网址

```python
url(self)
```

获取转发端口的公共 HTTPS URL。

## tls\_socket

```python
tls_socket(self)
```

获取公共 TLS 套接字作为（主机、端口）元组。

## tcp\_socket

```python
tcp_socket(self)
```

获取公共 TCP 套接字作为（主机，端口）元组。