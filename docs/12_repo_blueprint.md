# 12 仓库蓝图

## 推荐结构

```text
xiajuzhang/
  README.md
  docs/
  public/
    prototypes/
    reference/
  src/
    app/
      page.tsx
      demo/
        page.tsx
      layout.tsx
      globals.css
    components/
      chat/
        ChatShell.tsx
        ChatHeader.tsx
        MessageList.tsx
        MessageBubble.tsx
        BotBubble.tsx
        SuggestionChipBar.tsx
      cards/
        PlanCard.tsx
        VoteProgressCard.tsx
        ConfirmCard.tsx
        MemoryCard.tsx
        AnonymousProposalCard.tsx
        ConflictBridgeCard.tsx
      common/
        StatusBadge.tsx
        OptionChip.tsx
        KeyboardButton.tsx
        PollBar.tsx
        AvatarCluster.tsx
        DevPanel.tsx
    lib/
      scenario-engine/
        runStep.ts
        autoplay.ts
        selectors.ts
      state/
        demoStore.ts
      types/
        demo.ts
      fixtures/
        loader.ts
    data/
      scenes/
      npcs/
      cards/
  package.json
  tsconfig.json
```

## 页面建议
### `/`
- 项目介绍
- 一句话说明
- 开始演示按钮
- 场景选择

### `/demo`
- 主演示页面
- 默认进入 dinner_core
- 支持模式切换

## 组件职责
### 页面层
只负责布局与模式切换。

### 引擎层
负责：
- 当前步骤
- 动作推进
- 自动播放
- 卡片更新
- 消息插入

### 组件层
只负责渲染。

## 命名建议
- 用 `Scene`, `Step`, `Card`, `Action`, `Actor` 这些强业务词
- 不要用含糊的 `data1`, `temp`, `testFlow`

## 状态管理建议
### 如果用 Zustand
维护：
- mode
- currentScene
- currentStep
- messages
- cards
- availableActions
- flags

### 如果用 XState
将 dinner_core 定义为主 machine，其余场景为子 machine。

## 路由建议
不做太多页面，避免割裂。
一个 `/demo` 足够，内部用 state 切场景。

## Debug 入口
建议用：
- `?debug=1`
- 或键盘快捷键 `Shift + D`

## 资源引用建议
- 所有原型图放 `public/prototypes/`
- 所有参考图放 `public/reference/`
- 所有 fixtures 放 `src/data/`

## 代码风格建议
- TypeScript 严格模式
- 组件 props 明确
- 用 Zod 校验 fixture
- 所有 mock 数据统一出口
