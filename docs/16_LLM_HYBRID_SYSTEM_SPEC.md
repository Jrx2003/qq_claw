# 16 真实 LLM + 演示引擎混合架构说明

## 1. 这次必须真的接 LLM，但不能把演示稳定性交出去

正确架构不是：

- 所有东西都写死
- 或者所有东西都自由生成

而是中间态：

**脚本引擎负责导演，真实 LLM 负责在少数关键节点提供“真实 AI 感”。**

## 2. 总体架构

```text
UI (Judge / Recording / Studio)
  ↓
Scenario Engine
  ↓
Capability Runtime
  ├─ Scripted Timeline
  ├─ Trigger Policy
  ├─ Snapshot Store
  └─ Live LLM Adapter
         ↓
      Server Route
         ↓
  OpenAI-compatible API / 真实模型服务
```

## 3. 关键原则

### 3.1 UI 不直接调 LLM
前端不应直接带 key 调第三方模型。
必须：
- 走 Next.js server route
- 服务端读取环境变量
- 服务端做 schema 校验
- 服务端做 timeout / fallback

### 3.2 LLM 只干结构化任务
不要让 LLM 负责整个剧情推进。
它只负责：
- 从聊天里抽结构化信息
- 生成被限制格式的建议
- 生成卡片文案
- 生成冲突桥梁话术
- 生成回忆卡内容

### 3.3 每个 live 能力都必须能快照化
任何一次 live 成功生成后，都要允许在 Studio Mode 中：
- 查看原始输入
- 查看原始输出
- 一键保存到 `fixtures/llm_examples/` 或 `snapshots/`

这样后续录屏就能用快照，而不怕现场模型波动。

## 4. 三种运行模式

## 4.1 mock
- 完全不调用 LLM
- 只使用 fixtures
- 最稳定
- 适合 CI / 静态 review / 本地开发

## 4.2 live
- 每次都真调用 LLM
- 最能展示真实能力
- 可能有波动
- 适合 studio 演示、生成新快照

## 4.3 snapshot
- 不再请求外部模型
- 使用曾经 live 生成并落盘的 JSON
- 适合录屏和正式评审

## 5. 必须实现的 LLM 能力节点

## 5.1 Intent Extractor
输入：
- 最近 N 条群聊消息
- 群成员列表
- 当前场景类型

输出：
- 是否存在组局 / 倡议 / 冲突 / 游戏意图
- 置信度
- 活动标题建议
- 时间候选
- 地点候选
- 需要进一步确认的信息
- 是否建议匿名

用途：
- 自动建议泡泡
- 成局卡初始内容

## 5.2 Anonymous Proposal Writer
输入：
- 用户隐藏表达
- 群当前上下文
- 目标语气

输出：
- 群里可发布的匿名倡议消息
- 是否需要附投票
- 建议 chips / 按钮

用途：
- 匿名倡议支线

## 5.3 Conflict Bridge Writer
输入：
- 最近一段争执聊天
- 双方角色
- 群规则 / 场景

输出：
- 双方诉求摘要
- 中性桥接消息
- 建议动作
- 是否建议公开发言还是先私下转述

用途：
- 冲突桥梁支线

## 5.4 Recap Writer
输入：
- 确认成局后的结果
- 群里局后消息
- 图片描述 / 高光关键词
- 偏好信息

输出：
- 回忆卡标题
- 亮点文案
- 关键词
- 下次再约入口文案

用途：
- 活动回忆卡主线

## 5.5 Game Recap Writer
输入：
- 游戏类型
- 对局摘要 / 战绩结构化信息
- 聊天高光

输出：
- 游戏风格回顾文案
- MVP / 高光
- 下次组队入口

用途：
- 腾讯游戏支线

## 6. API 设计

建议新增：

```text
POST /api/llm/intent
POST /api/llm/anonymous
POST /api/llm/conflict
POST /api/llm/recap
POST /api/llm/game-recap
POST /api/llm/snapshot/save
POST /api/llm/snapshot/list
```

### 通用响应格式
```json
{
  "ok": true,
  "mode": "live",
  "schemaVersion": "1.0.0",
  "data": { "...": "..." },
  "meta": {
    "provider": "openai-compatible",
    "model": "configured-model-name",
    "latencyMs": 1240,
    "fallbackUsed": false
  }
}
```

## 7. 为什么推荐 Structured Outputs / JSON Schema

因为这个项目不是纯聊天，而是产品系统。
你需要的是：
- 稳定字段
- 明确校验
- 可直接渲染到卡片
- 出错时能回退

所以不应该让模型输出一大段自由文本再手工 parse。
应当直接要求模型输出符合 schema 的 JSON。

## 8. 前端如何消费 live 结果

前端不应该知道 provider 细节，只关心：

```ts
type RuntimeMode = "mock" | "live" | "snapshot";

interface LiveTaskResult<T> {
  ok: boolean;
  mode: RuntimeMode;
  data: T;
  meta?: {
    latencyMs?: number;
    fallbackUsed?: boolean;
    snapshotKey?: string;
  };
}
```

然后在 UI 中只体现两个层次：
- 用户可见结果
- studio 可见调试信息

## 9. 必须做的 fallback 策略

### 一级 fallback
live 失败 → 回退到 snapshot

### 二级 fallback
snapshot 缺失 → 回退到 fixture 默认值

### 三级 fallback
显示兜底文案：
- “我先按当前讨论给出一个默认建议，你也可以继续补充信息。”

## 10. 推荐的环境变量

```bash
LLM_RUNTIME_MODE=snapshot
LLM_PROVIDER=openai-compatible
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
OPENAI_TIMEOUT_MS=12000
ENABLE_LIVE_LLM=true
ENABLE_SNAPSHOT_SAVE=true
```

## 11. 推荐的前端状态分层

### UI State
- 当前模式
- 当前 scene
- 当前 step / beat
- 面板开关

### Runtime State
- 当前消息流
- 当前卡片状态
- 当前可点击动作
- 当前 trigger policy

### LLM State
- 当前 live 请求状态
- 最近一次结果
- 最近一次错误
- snapshot key

不要把这些全塞到一个组件里。
要单独建：
- engine store
- llm store
- studio store

## 12. 真实 LLM 的最佳使用方式

### 在 Judge Mode
- 默认走 snapshot
- 保证稳定

### 在 Studio Mode
- 支持 live
- 支持一键保存结果为 snapshot

### 在现场讲解
- 可以演示一次 live 刷新
- 然后再切回 snapshot 稳定展示

## 13. Codex 实现时的关键目标

不是“随便接个模型就算完成”，而是：
- live 可用
- snapshot 可存
- mock 可跑
- schema 不乱
- fallback 稳定
- UI 不崩

这才叫比赛可用的真实 LLM 接入。
