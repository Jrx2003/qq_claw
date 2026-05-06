# README for Judges

欢迎体验《虾局长》——QQ 群聊里的官方社交推进 Agent。

## 推荐体验方式

公网入口：`https://qqclaw.vercel.app`。
部署与接口验证记录见 `submission/DEPLOYMENT_STATUS.md`。

### 方式一：无 LLM 评审模式（推荐）
这是正式体验入口，走稳定 snapshot，不依赖模型波动。
线上路径：`https://qqclaw.vercel.app/judge`。
推荐你先走主线：
1. 进入 507 宿舍干饭群
2. 点击“帮我收口这局”
3. 观察虾局长如何从聊天中生成成局卡、投票进展卡、确认成局卡与回忆卡

### 方式二：真实 LLM 工作台
这是 live LLM 沙盒，适合自由输入一句群聊消息，观察其他群成员如何接话，以及虾局长如何识别意图、给出功能建议并把结果渲染回聊天界面。
线上路径：`https://qqclaw.vercel.app/studio?key=local-studio`。
当前演示访问密钥：`local-studio`。
建议先用右侧示例输入试一轮，再改成自己的说法继续推进。

## 核心能力
- 智能收口组局
- 匿名倡议
- 冲突桥梁
- 活动与游戏回忆卡
- 轻量偏好复用

## 最佳体验顺序
主线（吃饭局） → 匿名倡议 → 冲突桥梁 → 游戏局

## 你会看到什么
无 LLM 入口里，你控制的是群里的一个用户，其他群成员由导演脚本驱动，保证主线稳定。
真实 LLM 工作台里，你可以自由输入；其他群成员和虾局长由 LLM 根据背景、人设和最近聊天继续推进。

## 技术说明
无 LLM 评审模式默认使用 snapshot runtime，保证评审稳定。
真实 LLM 工作台默认使用 live runtime；当前 production 已验证 DeepSeek server-side route 可返回结构化群聊消息，前端不持有模型密钥。
