# 18 部署与真实 LLM 运行手册

## 1. 总目标

项目必须具备：
1. 一条公开可访问的评委链接
2. 一条你自己可调试的 studio 链接
3. 真实 LLM 的服务端接入
4. 稳定 fallback
5. 演示模式与线上模式都能跑

## 2. 推荐部署方案

### 主方案：Vercel
适合原因：
- 与 Next.js 集成最好
- GitHub 导入最快
- 配置环境变量方便
- 适合短周期产品比赛
- 评委访问链路简单

### 备选方案：腾讯云
适合原因：
- 作为国内网络环境兜底
- 如果需要更稳的国内访问，可作为备用部署
- 对 Next.js 也有官方文档路径

### 最终建议
- **主站上 Vercel**
- **必要时保留腾讯云备用站**
- 同时准备本地录屏备份

## 3. 必须准备的环境变量

```bash
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_DEFAULT_EXPERIENCE_MODE=judge
NEXT_PUBLIC_ENABLE_STUDIO=false
NEXT_PUBLIC_ENABLE_RECORDING=true

LLM_RUNTIME_MODE=snapshot
LLM_PROVIDER=openai-compatible
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
OPENAI_TIMEOUT_MS=12000

ENABLE_LIVE_LLM=true
ENABLE_SNAPSHOT_SAVE=true
STUDIO_ACCESS_KEY=
```

说明：
- `OPENAI_BASE_URL` 留空表示官方
- 如用 OpenAI-compatible 服务，也可替换 base url
- `STUDIO_ACCESS_KEY` 用于保护 studio 模式，不要裸奔

## 4. Vercel 部署步骤

1. 把 GitHub 仓库连接到 Vercel
2. Framework 识别为 Next.js
3. Build Command 使用仓库默认 `next build`
4. 在 Vercel 项目设置里填好环境变量
5. 首次发布到 preview
6. 自己检查：
   - `/judge`
   - `/recording`
   - `/studio`
   - `/api/llm/*`
7. 没问题后再发 production

## 5. 腾讯云备用部署建议

如果需要国内备用线路，可准备：
- 一套相同环境变量
- 一条备用域名或访问地址
- 同样的 build 产物与路由

注意：
- 如果最终走 SSR / server route，必须确保部署平台支持 Node/函数执行
- 如果要降级成纯静态展示，则 live LLM 功能不能在静态版裸跑

## 6. 最稳的线上结构

### Judge / Recording
默认走：
- snapshot 模式

原因：
- 最稳定
- 不受模型波动影响
- 不怕 API 抖动

### Studio
支持：
- mock
- snapshot
- live

原因：
- 只有 studio 才需要真正调 live
- 正式评委访问不需要承担 live 风险

## 7. 真实 LLM 的线上安全约束

### 必须做
- API key 只在 server route 使用
- 前端只调自己站点的 `/api/llm/*`
- 每个请求设置 timeout
- 每个请求返回 schema 校验结果
- 失败时回退

### 不要做
- 在前端暴露第三方密钥
- 直接从浏览器打第三方模型 API
- 让 judge route 默认 live 调模型

## 8. 推荐的服务器路由行为

### `/judge`
- 隐藏 studio 面板
- 默认 snapshot
- 只允许受控交互
- URL 干净

### `/recording`
- 默认自动播放
- 关键点暂停
- 允许 replay
- 隐藏调试信息

### `/studio`
- 允许 query 或 access key 进入
- 支持 live 调用
- 支持保存快照
- 支持查看原始 JSON

## 9. 观测与容错

至少要做这几件事：

### 错误显示
如果 live 请求失败：
- judge/recording 不要红色报错大弹窗
- 直接无感回退到 snapshot
- studio 再显示详细错误

### 请求日志
建议保存：
- task name
- latency
- model
- mode
- success/fallback
- snapshot key

### 健康检查
可选新增：
- `/api/health`
- `/api/llm/health`

## 10. 录屏前的上线检查清单

录视频之前必须确认：

1. production 链接可打开
2. judge route 正常
3. recording route 正常
4. snapshot 数据齐全
5. 录屏主线无需 live 即可完整跑通
6. studio route 可临时演示一次 live
7. 所有原型图、截图和文档已同步到仓库

## 11. 最推荐的实战流程

### 开发中
- 本地 `npm run dev`
- studio 模式调 live
- 生成并保存 snapshot

### 联调中
- Vercel preview 检查
- judge/recording 只走 snapshot

### 正式提交前
- 锁定一个稳定 production URL
- 录制视频时使用 recording route
- 把视频中出现的界面与线上 judge route 保持一致

## 12. 不能忽略的备用方案

就算线上部署成功，也要准备：

- 一份本地可运行版本
- 一份录屏成品
- 一份截图说明
- 一份 judge 指南

这样即便评委现场网络一般，也不会影响你提交作品。
