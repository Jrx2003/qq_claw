# 06 Demo 引擎规范

## 目标
构建一个 **脚本驱动的互动式产品原型引擎**，而不是一个开放式聊天机器人。

## 核心思路
用结构化 JSON 定义：
- 场景
- 角色
- 时间线
- 卡片
- 用户可点击操作
- 系统自动推进动作

前端只负责：
- 渲染聊天
- 响应点击
- 根据状态播放下一步
- 更新卡片与消息流

## 模式设计
### 1）guided
默认模式。评委只能按预设路径推进。

### 2）autoplay
自动播放整个演示，用于录屏。

### 3）dev
开发者模式，可跳步、重播、切场景、查看 JSON 状态。

## 状态模型
```ts
type AppMode = "guided" | "autoplay" | "dev";

type SceneId =
  | "dinner_core"
  | "anonymous_proposal"
  | "conflict_bridge"
  | "game_party";

type StepId = string;

type DemoState = {
  mode: AppMode;
  sceneId: SceneId;
  currentStepId: StepId;
  playedStepIds: StepId[];
  messages: ChatMessage[];
  activeCards: DemoCard[];
  availableActions: DemoAction[];
  flags: Record<string, boolean>;
};
```

## 基础实体
### ChatMessage
```ts
type ChatMessage = {
  id: string;
  actorId: string;
  side: "left" | "right" | "system";
  type: "text" | "card" | "typing" | "hint";
  text?: string;
  cardId?: string;
  delayMs?: number;
  timestamp?: string;
};
```

### DemoCard
```ts
type DemoCard = {
  id: string;
  cardType: "plan" | "vote" | "confirm" | "memory" | "anonymous" | "conflict";
  title: string;
  status?: string;
  payload: Record<string, unknown>;
};
```

### DemoAction
```ts
type DemoAction = {
  id: string;
  label: string;
  kind: "chip" | "keyboard" | "toolbar" | "scene-switch";
  nextStepId: string;
  analyticsName?: string;
};
```

## Step 结构
```ts
type DemoStep = {
  id: string;
  description: string;
  autoMessages?: ChatMessage[];
  cardMutations?: CardMutation[];
  availableActions?: DemoAction[];
  nextAutoStepId?: string;
  autoAdvanceAfterMs?: number;
  setFlags?: Record<string, boolean>;
};
```

## 推荐实现方式
### 方案 A（推荐）
- 当前 step 渲染后，如果有 autoMessages，就按 delay 依次插入
- 插入完成后更新 activeCards
- 如果有 availableActions，等待用户点击
- 如果有 nextAutoStepId，则自动进入下一步

### 方案 B
用状态机库（XState）定义主 flow，再在每个 state 内消费 step 数据。

## 为什么不直接做聊天自由流
因为演示目标是“让价值被看见”，不是“测试系统随机应变能力”。

## UI 层建议
- 左侧：聊天流
- 底部：建议选项 / keyboard
- 顶部：群名 / 在线人数 / 场景状态
- 隐藏开发面板：当前 scene、当前 step、快速跳转

## 必须支持的能力
- appendMessage(message)
- replaceCard(cardId, newPayload)
- pushAvailableActions(actions)
- goToStep(stepId)
- replayScene(sceneId)
- runAutoplay(sceneId)

## 非必须
- 实时网络请求
- 服务端数据库
- 真正 LLM 推理
- 真正多用户同步

## P0 的“AI 感”怎么做
不依赖真实模型也可以制造 AI 感：
- typing 延迟
- 从聊天中自动提炼出来的总结文案
- 卡片状态变化
- 智能微文案（例如“目前 19:00 + 木屋烧烤领先”）
- 回忆卡的高光句与关键词

## 推荐约束
- 所有场景脚本都放在 `fixtures/scenes/`
- 所有 UI 只读这些 fixture
- 不要把剧本写死在 React 组件里
