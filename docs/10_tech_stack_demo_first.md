# 10 技术栈（Demo-first 版本）

## 总体结论
P0 用 **前端主导 + 本地脚本数据 + 可选极薄后端** 的方案最合适。

## 推荐栈
### 前端
- Next.js（App Router）
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Zustand 或 XState
- Zod

### 推荐最终选择
如果 Codex 擅长状态机：  
**Next.js + TypeScript + Tailwind + shadcn + Framer Motion + XState + Zod**

如果想更快：
**Next.js + TypeScript + Tailwind + shadcn + Framer Motion + Zustand + Zod**

## 为什么不建议 P0 先上重后端
因为当前目标不是：
- 真实多用户同步
- 复杂鉴权
- 持久化存储
- 真正 LLM 编排
- 真实 QQ 接入

先上这些会：
- 拖慢进度
- 增加不稳定性
- 分散注意力
- 稀释演示质量

## 推荐架构
### P0
纯前端也可以完成：
- 场景脚本 JSON
- 聊天 UI
- 卡片状态变化
- 按钮交互
- 自动播放

### P0.5
加一个极薄 API 层（可选）：
- 读取 fixture
- 记录用户点击
- 方便调试和日志

### P1
再考虑：
- 真实 QQ Bot adapter
- LLM adapter
- 数据存储
- 场景配置后台

## 包管理与目录建议
```text
app/
components/
lib/
  scenario-engine/
  state/
  utils/
data/
  scenes/
  npcs/
  cards/
public/
  prototypes/
```

## UI 层建议
- 所有卡片做成纯组件 + props 驱动
- 所有消息流只吃统一 message 数据
- 所有状态变更由 demo engine 驱动
- 不要把业务状态散落在多个组件里

## 动效层建议
Framer Motion 用在：
- 新消息淡入
- typing 过渡
- 卡片更新
- 场景切换
- 轻度数字变化

## 数据层建议
### 场景文件
放 `fixtures/scenes/*.json`

### 人设文件
放 `fixtures/npcs/*.json`

### 卡片 payload 示例
放 `fixtures/cards/*.json`

## 是否要接真 LLM
P0 不建议把真 LLM 放进主路径。

可以保留接口抽象：
```ts
interface AiNarrationService {
  summarizeIntent(input: string[]): Promise<PlanSummary>;
  generateRecap(input: RecapInput): Promise<RecapOutput>;
}
```

但默认实现应为：
- 本地 mock
- 预置结果
- 可控 deterministic 输出

## 是否要接真 QQ
P0 不建议。

但是要预留 adapter interface：
```ts
interface GroupPlatformAdapter {
  sendMessage(payload: OutboundMessage): Promise<void>;
  renderKeyboard(buttons: ButtonSpec[]): PlatformKeyboard;
}
```

## 适合现场演示的附加功能
- URL 参数控制初始场景
- `?mode=autoplay`
- `?scene=dinner_core`
- `?debug=1`

## 部署建议
### 最佳选择
- Vercel / Netlify
- 纯前端静态或轻 SSR
- 一条公开 URL

### 备选
- 本地跑 + 录屏
- 本地跑 + 现场备用视频

## 技术成功标准
- 首屏快
- 不崩
- 组件统一
- 场景切换清晰
- 演示过程可重复
