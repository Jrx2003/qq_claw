# 虾局长最终目标包 v2

更新时间：2026-05-05

这个包不是给“先做一个能跑的 P0”用的，而是给 **Codex 直接对齐最终交付目标** 用的。
它明确回答三件事：

1. 这个比赛里，虾局长最终要做成什么样。
2. 当前仓库与最终目标之间差在哪里。
3. Codex 接下来应该按什么路径把项目改到可评审、可上线、可讲清楚的状态。

## 一、这版文档的核心立场

- **不放弃功能。**
  之前讨论过的能力全部保留，并且都要进入最终产品蓝图：
  - 智能收口组局
  - 匿名倡议 / 匿名想法代发
  - 冲突桥梁 / AI 中继劝导
  - 活动回忆卡
  - 腾讯游戏局（王者荣耀五排）组队与回忆
  - 轻量偏好沉淀与下次再约

- **仍然坚持 Demo-first。**
  Demo-first 不是“把功能砍掉”，而是：
  - 功能必须存在
  - 评委体验必须被导演
  - 引导优先于自由探索
  - 真实 LLM 必须嵌入在可控链路里，而不是把整个体验交给开放式输入

- **真实 LLM 必须使用，但必须被约束。**
  本项目不是纯 mock。需要接入真实 LLM，用在：
  - 意图提取
  - 组局建议生成
  - 匿名倡议改写
  - 冲突桥梁转述
  - 回忆卡生成
  - 腾讯游戏局回顾生成

  但这些能力必须通过：
  - 结构化 schema
  - server-side route
  - fixture 快照缓存
  - 失败回退
  来保证演示稳定。

- **部署不是加分小尾巴，而是必须纳入设计。**
  项目需要云端可访问地址，供评委外部访问和后续讲解使用。

## 二、建议 Codex 的阅读顺序

1. `prompts/CODEX_GOAL_PROMPT.txt`
2. `docs/14_FINAL_TARGET_MASTER_SPEC.md`
3. `docs/15_FEATURE_MATRIX_AND_TRIGGER_RULES.md`
4. `docs/16_LLM_HYBRID_SYSTEM_SPEC.md`
5. `docs/17_REPO_REFACTOR_BLUEPRINT.md`
6. `docs/18_DEPLOYMENT_AND_LIVE_LLM_RUNBOOK.md`
7. `docs/19_SUBMISSION_MATERIALS_AND_REPO_CONTENT.md`
8. `docs/20_SOURCE_NOTES.md`
9. `docs/21_FINAL_ACCEPTANCE_CHECKLIST.md`
10. `docs/23_COMPETITION_ALIGNMENT_NOTES.md`

然后再阅读：

- `prompts/live_llm/`
- `schemas/`
- `fixtures/llm_examples/`
- `assets/`

## 三、最终产品是什么

最终不是“一个吃饭局小 demo”，而是 **QQ 养虾官方 Agent 的产品原型**：

### 产品名
虾局长

### 产品定位
QQ 群聊里的官方社交推进 Agent

### 解决的问题
- 群里有意图，但没人愿意承担组织责任
- “我都可以”让活动决策耗散
- 有些想法想说，但不想暴露自己当发起人
- 吵架时不是只有禁言一个选择
- 一次活动结束后，关系和偏好没有被沉淀
- 游戏局和群活动也缺少结构化回顾与再次发起入口

### 最终必须可演示的 4 条能力线
1. **收口组局主线**：周五烤肉局
2. **匿名倡议支线**：不想背组织责任，也能安全发起想法
3. **冲突桥梁支线**：吵架时由 AI 中继、转述、降温
4. **游戏局支线**：王者荣耀五排的组队和回忆

## 四、最终体验模式

### 1）无 LLM 评审模式
给评委访问的正式模式，路由仍是 `/judge`。要点：
- 默认进入移动端 QQ 群聊式界面
- 首屏只突出最易理解的主线
- 其他能力可通过“能力入口卡”进入
- 不暴露开发调试工具
- 引导强、干扰少、可稳定讲解
- 默认使用 snapshot，不依赖实时模型波动

### 2）真实 LLM 工作台
给你自己调试和现场证明真实 AI 链路用的模式，路由仍是 `/studio`。要点：
- 可切场景
- 可看 state / fixtures / LLM 原始输出
- 可切换 mock / live / snapshot
- 可强制推进剧情
- 可保存 live LLM 输出为快照

## 五、当前仓库要被纠正的方向

当前仓库已经有：
- Next.js + TypeScript + Tailwind 风格前端底座
- dinner_core 主线
- 基础卡片和场景脚本
- autoplay / guided / dev 的雏形

但新的最终目标要求它必须升级成：

- **完整功能矩阵**
- **真实 LLM + 可控 fallback**
- **更清楚的触发规则**
- **评审级逐条消息演示**
- **云端可部署**
- **提交材料内生化到仓库结构**

## 六、这个包会直接帮 Codex 做什么

### 文档层
把“最终做什么”写清楚。

### 工程层
把“哪些文件要改、为什么改、改成什么”写清楚。

### LLM 层
把可直接接入的 prompt、schema、示例输入输出写清楚。

### 部署层
把外部可访问站点怎么发出去写清楚。

### 参赛层
把仓库里应该补齐哪些材料写清楚。

## 七、不要再回到旧目标

旧目标里把匿名倡议、冲突桥梁、游戏局放到后面再说，这一版已经废止。
从现在开始，Codex 应该以 **完整参赛项目** 为目标，而不是只做一个最小化前端样片。

## 八、当前仓库运行入口

- 公网 Demo：`https://qqclaw.vercel.app`
- `/`：能力总入口
- `/judge`：无 LLM 评审模式，默认 snapshot runtime
- `/studio`：真实 LLM 工作台，可切 mock / snapshot / live，可运行 LLM 任务并保存快照
- `/api/llm/intent`、`/api/llm/anonymous`、`/api/llm/conflict`、`/api/llm/recap`、`/api/llm/game-recap`：服务端结构化 LLM route

环境变量模板见 `.env.example`，部署建议见 `docs/18_DEPLOYMENT_AND_LIVE_LLM_RUNBOOK.md`。
生产部署验证记录见 `submission/DEPLOYMENT_STATUS.md`。
