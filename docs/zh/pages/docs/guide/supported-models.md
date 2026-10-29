<!-- modal-docs: machine-translated zh-CN from English source -->

# 支持的型号

模态端点为本页面列出的开放权重模型提供服务。
[共享端点](/docs/guide/shared-endpoints) 从以下位置提供模型
模态管理的计算池，使用基于令牌的计费。
[专用端点](/docs/guide/dedicated-endpoints) 运行中列出的模型
[专用端点模型](#dedicated-endpoint-models)，或兼容的自定义
权重，在隔离的、自动缩放的容器上。

了解有关模型功能的更多信息
[模型库](https://modal.com/library)。

## 共享端点模型

共享端点按令牌计费。费率以每百万代币美元为单位，
当您创建端点时也会出现。

|型号|输入方式 |输入 <span class="text-xs text-secondary">($/Mtok)</span> |输出<span class="text-xs text-secondary">($/Mtok)</span> |
| ---------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [GLM 5.3 闪存 NVFP4](/library/zai/glm-5-3-flash-nvfp4) |文字、图像| 0.15 / 0.03 缓存 | 0.50 | 0.50
| [DeepSeek V4.1 Flash 1017](/library/deepseek/deepseek-v4-1-flash-1017) |文字、图像| 0.25 / 0.005 缓存 | 1.00 || [DeepSeek V4.1 Flash](/library/deepseek/deepseek-v4-1-flash) |文字、图像| 0.30 / 0.03 缓存 | 1.20 | 1.20
| [GLM 5.3 Flash](/library/zai/glm-5-3-flash) |文字、图像| 0.45 / 0.09 缓存 | 1.50 | 1.50
| [Muse Spark 开放](/library/meta/muse-spark-open) |文本、图像、音频 | 1.25 / 0.15 缓存 | 4.25 | 4.25
| [GLM 5.3](/library/zai/glm-5-3) |文字| 1.40 / 0.26 缓存 | 4.40 | 4.40
| [Inkling NVFP4](/library/thinking-machines/inkling) |文本、图像、音频 | 1.20 / 0.27 缓存 | 5.00 || [Qwen3.8-Max](/library/qwen/qwen3-8-max) |文字| 2.00 / 0.25 缓存 | 6.00 |
| [Qwen3.8-Max VL](/library/qwen/qwen3-8-max-vl) |文字、图像| 2.00 / 0.25 缓存 | 6.00 |
| [Kimi K3](/library/moonshot/kimi-k3) |文字、图像| 3.00 / 0.30 缓存 | 15:00 |

## 专用端点模型

服务模型所需的计算专用端点账单；看
[专用端点定价](/docs/guide/dedicated-endpoints#pricing)。

对于显示为模型 ID 的条目，请将 ID 传递给 `modal endpoint create --model`。

|型号|输入方式 |
| -------------------------------------------------------------------------------------------------- | ------------------ |
| [光束 1.0 501B-A23B-FP8](/库/反射/光束) |文字|| [光束 1.0 501B-A23B-NVFP4](/库/反射/光束) |文字|
| [DeepSeek V4 Flash](/library/deepseek/deepseek-v4-flash) |文字|
| [DeepSeek V4 Flash 预览](/library/deepseek/deepseek-v4-flash-preview) |文字|
| [DeepSeek V4 Pro](/library/deepseek/deepseek-v4-pro) |文字|
| [DeepSeek V4 专业版预览](/library/deepseek/deepseek-v4-pro-preview) |文字|
| [DeepSeek V4.1 Flash](/library/deepseek/deepseek-v4-1-flash) |文字、图像|
| [Gemma 3 1B IT](/library/google/gemma-3-1b-it) |文字|
| [Gemma 4 26B A4B IT](/library/google/gemma-4-26b-a4b-it) |文字、图像|
| [杰玛 4 31B IT](/library/google/gemma-4-31b) |文字、图像|| [Gemma 4 E2B IT](/library/google/gemma-4-e2b-it) |文字、图像|
| [Gemma 4 E4B IT](/library/google/gemma-4-e4b-it) |文字、图像|
| [GLM 4.7](/library/zai/glm-4-7) |文字|
| [GLM 5.2 FP8](/library/zai/glm-5-2-fp8) |文字|
| [GLM 5.2 NVFP4](/library/zai/glm-5-2-nvfp4) |文字|
| [GLM 5.3](/library/zai/glm-5-3-nvfp4) |文字|
| [GLM 5.3 Flash](/library/zai/glm-5-3-flash) |文字、图像|
| [GPT-OSS 120B](/library/openai/gpt-oss-120b) |文字|
| [Hy3 GPTQ Int4](/library/tencent/hy3-gptq-int4) |文字|| [Inkling NVFP4](/library/thinking-machines/inkling) |文本、图像、音频 |
| [K2 地平线 0.9B](/library/ifm/k2-horizo​​n-0-9b) |文字|
| [Kimi K2.6 NVFP4](/library/moonshot/kimi-k2-6-nvfp4) |文字|
| [Kimi K3](/library/moonshot/kimi-k3) |文字、图像|
| [缪斯微光 30B BF16](/library/meta/muse-glimmer-30b-bf16) |文字|
| [Muse Glimmer 30B NVFP4](/library/meta/muse-glimmer-30b-nvfp4) |文字|
| [Nemotron 3.5 Lightning 30B A3B NVFP4](/library/nvidia/nemotron-3-5-lightning-30b-a3b-nvfp4) |文字|
| [Nemotron 3.5 Super VL 120B A12B NVFP4](/library/nvidia/nemotron-3-5-super-vl-120b-a12b-nvfp4) |文字、图像|
| [NVIDIA Nemotron 3 Super 120B A12B NVFP4](/library/nvidia/nvidia-nemotron-3-super-120b-a12b-nvfp4) |文字|| [NVIDIA Nemotron 3 Ultra 550B A55B NVFP4](/library/nvidia/nvidia-nemotron-3-ultra-550b-a55b-nvfp4) |文字|
| [PhoneLLM Alpha 1](/library/pipecat/phonellm-alpha-1) |文字|
| [PhoneLLM Max Alpha 2](/library/pipecat/phonellm-max-alpha-2) |文字|
| [PhoneLLM Mini Alpha 2](/library/pipecat/phonellm-mini-alpha-2) |文字|
| [Qwen3 嵌入 0.6B](/library/qwen/qwen3-embedding-0-6b) |文字|
| [Qwen3 嵌入 8B](/library/qwen/qwen3-embedding-8b) |文字|
| [Qwen3.5 0.8B](/library/qwen/qwen3-5-0-8b) |文字、图像|
| [Qwen3.5 122B A10B FP8](/library/qwen/qwen3-5-122b-a10b-fp8) |文字、图像|
| [Qwen3.5 27B FP8](/library/qwen/qwen3-5-27b-fp8) |文字、图像|| [Qwen3.5 2B](/library/qwen/qwen3-5-2b) |文字、图像|
| [Qwen3.5 35B A3B FP8](/library/qwen/qwen3-5-35b-a3b-fp8) |文字、图像|
| [Qwen3.5 397B A17B FP8](/library/qwen/qwen3-5-397b-a17b-fp8) |文字、图像|
| [Qwen3.5 4B](/library/qwen/qwen3-5-4b) |文字、图像|
| [Qwen3.5 9B](/library/qwen/qwen3-5-9b) |文字、图像|
| [Qwen3.6 27B](/library/qwen/qwen3-6-27b) |文字、图像|
| [Qwen3.6 27B FP8](/library/qwen/qwen3-6-27b-fp8) |文字、图像|
| [Qwen3.6 35B A3B](/library/qwen/qwen3-6-35b-a3b) |文字、图像|
| [Qwen3.6 35B A3B FP8](/library/qwen/qwen3-6-35b-a3b-fp8) |文字、图像|| [Qwen3.8 2.4T A95B NVFP4](/library/qwen/qwen3-8-2-4t-a95b-nvfp4) |文字|
| [Qwen3.8 27B](/library/qwen/qwen3-8-27b) |文字|
| [Qwen3.8 Flash Next](/library/qwen/qwen3-8-flash-next-fp8) |文字、图像|
| [Qwen3.8 Flash Next FP8](/library/qwen/qwen3-8-flash-next-fp8) |文字、图像|
| [第 5 步预览](/library/stepfun/step-5-preview) |文字、图像|