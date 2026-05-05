# README for Judges

欢迎体验《虾局长》——QQ 群聊里的官方社交推进 Agent。

## 推荐体验方式

公网入口：`https://qqclaw.vercel.app`。
部署与接口验证记录见 `submission/DEPLOYMENT_STATUS.md`。

### 方式一：Judge Mode（推荐）
这是为评委准备的正式体验入口。
线上路径：`https://qqclaw.vercel.app/judge`。
推荐你先走主线：
1. 进入 507 宿舍干饭群
2. 点击“帮我收口这局”
3. 观察虾局长如何从聊天中生成成局卡、投票进展卡、确认成局卡与回忆卡

### 方式二：Recording Mode
这是自动演示入口，适合快速浏览完整主线。
线上路径：`https://qqclaw.vercel.app/recording`。

### 方式三：Studio Mode
这是调试入口，适合查看 live LLM、状态和支线能力，不建议第一次先看。
线上路径：`https://qqclaw.vercel.app/studio?key=local-studio`。
Studio Mode 用于证明真实 LLM 链路，不建议作为第一次体验入口。

## 核心能力
- 智能收口组局
- 匿名倡议
- 冲突桥梁
- 活动与游戏回忆卡
- 轻量偏好复用

## 最佳体验顺序
主线（吃饭局） → 匿名倡议 → 冲突桥梁 → 游戏局

## 你会看到什么
你控制的是群里的一个用户，其他群成员由系统驱动。
这个设计是为了帮助你快速理解产品逻辑，而不是把体验交给自由探索。

## 技术说明
Judge Mode 和 Recording Mode 默认使用 snapshot runtime，保证评审和录屏稳定。
Studio Mode 可以切到 live runtime；当前 production 已验证 DeepSeek server-side route 可返回结构化 JSON，前端不持有模型密钥。
