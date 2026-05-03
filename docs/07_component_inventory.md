# 07 组件清单

## 目标
组件化到足以支撑演示与换皮，不做过度抽象。

## 页面级组件
### ChatDemoPage
承载整个移动端聊天演示页面。

### SceneSwitcher
切换场景：
- 宿舍吃饭局
- 匿名倡议
- 冲突中继
- 游戏局（可选）

### DemoToolbar
可放：
- Auto Play
- Replay
- 下一幕
- 开发开关

## 聊天区组件
### ChatShell
整体移动端容器，带顶部栏与底部输入区。

### ChatHeader
显示：
- 群名
- 在线人数
- 返回按钮
- 更多按钮

### MessageList
聊天流容器。

### MessageBubble
普通消息气泡。

### BotBubble
虾局长消息专用气泡，带 bot 标识。

### RightActionBubble
右侧用户本人消息。

### TypingIndicator
虾局长正在思考 / 收口中 / 生成回忆中。

### SuggestionChipBar
底部建议项：
- 帮我收口这局
- 匿名发起倡议
- 发起时间投票
- 提醒未回复

## 卡片组件
### PlanCard
字段：
- 标题
- 状态
- 摘要
- 时间选项
- 地点选项
- 未回复成员
- keyboard 按钮

### VoteProgressCard
字段：
- 已回复人数
- 时间投票结果
- 地点投票结果
- 未回复成员
- 继续投票 / 提醒未回复 / 查看详情

### ConfirmCard
字段：
- 确认时间
- 确认地点
- 参加人数
- 提醒安排
- 成员列表
- 操作按钮

### MemoryCard
字段：
- 参与人数
- 最受欢迎项
- 群聊高光
- 关键词
- 图片条
- 下次再约 / 保存回忆 / 生成群总结

### AnonymousProposalCard（扩展）
字段：
- 虾局长代发倡议
- 不暴露发起人
- 是否发起投票

### ConflictBridgeCard（扩展）
字段：
- 双方诉求摘要
- 温和转述文案
- 继续沟通选项

## 微型组件
### StatusBadge
如：
- 正在收口中
- 投票进行中
- 已成局
- 已完成

### OptionChip
时间 / 地点选择 chips。

### KeyboardButton
QQ 风格 markdown keyboard 按钮感。

### PollBar
投票结果条。

### AvatarCluster
参与成员头像堆叠。

### MemoryPhotoStrip
回忆卡里的 3 张图。

### InlineMeta
例如：
- 当前意向 6 人
- 已回复 8/10 人

## 开发组件
### DevPanel
仅在 dev 模式出现：
- 当前 scene
- 当前 step
- flags
- 可跳转 step
- 当前 activeCards

### JsonPreviewDrawer
可选，用于查看当前 fixture 状态。

## 优先级
### 必做
- ChatShell
- ChatHeader
- MessageBubble
- BotBubble
- PlanCard
- VoteProgressCard
- ConfirmCard
- MemoryCard
- SuggestionChipBar

### 可选
- SceneSwitcher
- DevPanel
- JsonPreviewDrawer
- AnonymousProposalCard
- ConflictBridgeCard
