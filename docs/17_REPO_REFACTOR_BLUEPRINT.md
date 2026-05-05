# 17 仓库重构蓝图（按文件与模块）

## 1. 总原则

不要推倒重来。
当前仓库已经有：
- Next.js + TypeScript 基础
- QQ 群聊式 UI 雏形
- dinner_core fixtures
- demo page / toolbar / engine 雏形

接下来应该 **保留技术底盘，重构导演层、功能层、LLM 层、部署层**。

## 2. 需要替换或新增的核心文件

## 2.1 根目录与文档

### 替换
- `README_INDEX.md`
- `prompts/CODEX_GOAL_PROMPT.txt`

### 新增
- `docs/14_FINAL_TARGET_MASTER_SPEC.md`
- `docs/15_FEATURE_MATRIX_AND_TRIGGER_RULES.md`
- `docs/16_LLM_HYBRID_SYSTEM_SPEC.md`
- `docs/17_REPO_REFACTOR_BLUEPRINT.md`
- `docs/18_DEPLOYMENT_AND_LIVE_LLM_RUNBOOK.md`
- `docs/19_SUBMISSION_MATERIALS_AND_REPO_CONTENT.md`
- `docs/20_SOURCE_NOTES.md`
- `docs/21_FINAL_ACCEPTANCE_CHECKLIST.md`
- `docs/22_RECORDING_AND_DEMO_MODE_SPEC.md`

## 2.2 fixtures 层

### 现有问题
现在的场景还偏“主线 demo step”思维，不足以承载：
- 匿名倡议完整闭环
- 冲突桥梁完整闭环
- 游戏局完整闭环
- 真实 LLM 结果快照

### 必须新增
```text
fixtures/
  scenes/
    dinner_core_v2.json
    anonymous_delegate.json
    conflict_bridge.json
    game_party_hok.json
  policies/
    trigger_presets.json
  llm_examples/
    plan_request_sample.json
    plan_response_sample.json
    anonymous_request_sample.json
    anonymous_response_sample.json
    conflict_request_sample.json
    conflict_response_sample.json
    recap_request_sample.json
    recap_response_sample.json
    game_recap_request_sample.json
    game_recap_response_sample.json
  snapshots/
    dinner_core/
    anonymous/
    conflict/
    game/
```

### 重构要求
- 不再只用 step
- 增加 beat / timeline / pausePoint / llmTask / autoAdvance
- 卡片按钮必须显式绑定 `actionId`
- 不允许再靠 label 猜 action

## 2.3 类型系统

### 替换
- `src/lib/types/demo.ts`

### 新类型必须包含
```ts
type ExperienceMode = "judge" | "studio";
type RuntimeMode = "mock" | "live" | "snapshot";
type TriggerPreset = "conservative" | "balanced" | "active_host" | "conflict_safe";

interface DemoBeat { ... }
interface TimelinePausePoint { ... }
interface LlmTaskSpec { ... }
interface CardActionBinding { ... }
interface SnapshotMeta { ... }
```

### 关键要求
- 区分体验模式与 LLM 运行模式
- 区分 trigger 预设与具体动作
- 卡片动作必须结构化

## 2.4 引擎层

### 重写
- `src/lib/scenario-engine/engine.ts`

### 新增
```text
src/lib/scenario-engine/
  engine.ts
  timeline.ts
  autoplay.ts
  triggerPolicy.ts
  llmRuntime.ts
  snapshotStore.ts
  selectors.ts
```

### 引擎目标
当前问题是“到某一步就整体 append 一批消息”。
新引擎必须支持：
- beat-by-beat 播放
- typing
- delay
- pause point
- auto-advance
- live LLM 插入结果
- replay
- judge route progressive playback

### 必须去掉的旧问题
- 基于固定 actionId 列表的 autoplay 硬编码
- 基于固定终点 stepId 的主线假设
- active card 与 available actions 不一致
- teaser 场景和完整场景混放

## 2.5 LLM 层

### 新增
```text
src/lib/llm/
  client.ts
  schemas.ts
  validators.ts
  mapping.ts
  fallback.ts
  snapshot.ts
app/api/llm/intent/route.ts
app/api/llm/anonymous/route.ts
app/api/llm/conflict/route.ts
app/api/llm/recap/route.ts
app/api/llm/game-recap/route.ts
app/api/llm/snapshot/save/route.ts
```

### 实现要求
- 仅服务端持有密钥
- 请求前注入 schema
- 响应后做 zod 校验
- 错误回退到 snapshot / fixture
- Studio Mode 支持保存 live 输出

## 2.6 页面与组件

### 重构
- `src/components/demo/ChatDemoPage.tsx`
- `src/components/demo/DemoToolbar.tsx`

### 建议拆分
```text
src/components/demo/
  JudgeShell.tsx
  StudioShell.tsx
  GroupChatFrame.tsx
  SuggestionChips.tsx
  StudioPanel.tsx
  StateInspector.tsx
  SceneLauncher.tsx
```

### 卡片组件必须齐全
```text
src/components/cards/
  PlanSuggestionCard.tsx
  VoteProgressCard.tsx
  ConfirmPlanCard.tsx
  MemoryCard.tsx
  AnonymousProposalCard.tsx
  ConflictBridgeCard.tsx
  GamePartyCard.tsx
  GameMemoryCard.tsx
```

### 关键原则
- 评委模式和 studio 模式不能再共屏
- 无 LLM 评审模式必须默认隐藏 debug
- 扩展场景入口要整合成能力入口卡，而不是在同一层堆 chips

## 2.7 路由层

### 建议新增
```text
app/
  page.tsx                # landing / ability launcher
  judge/page.tsx
  studio/page.tsx
```

### 路由目标
- `/judge`：无 LLM 评审体验
- `/studio`：真实 LLM 工作台
- `/`：能力总入口，解释虾局长能做什么

## 2.8 录屏素材层

### 新增
```text
submission/
  README_FOR_JUDGES.md
  PDF_OUTLINE.md
  VIDEO_SCRIPT_OUTLINE.md
  SCREENSHOT_SHOTLIST.md
  MATERIALS_CHECKLIST.md
```

## 3. 当前仓库必须纠正的产品策略

### 旧策略
- 主线先做
- 其他功能后面再说

### 新策略
- 主线最先做完
- 但匿名倡议 / 冲突桥梁 / 游戏局必须进入正式产品范围
- 只是主视频先讲主线，再闪示支线

## 4. 开发顺序（对 Codex）

1. 先重写类型与 fixtures 结构
2. 再重写 scenario engine
3. 再补 judge / studio 两种壳子
4. 再接 live LLM adapter
5. 再补匿名 / 冲突 / 游戏三条支线
6. 再补 landing 与 submission 目录
7. 最后统一视觉、动效和文案

## 5. 完成后的仓库应像这样

```text
README_INDEX.md
docs/
prompts/
schemas/
fixtures/
assets/
submission/
app/
src/
```

并且每一层都能清楚回答：
- 为什么做
- 做了什么
- 怎么跑
- 怎么讲
- 怎么交比赛
