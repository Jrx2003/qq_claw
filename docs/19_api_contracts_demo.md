# 19 Demo API / 数据契约

## 说明
P0 可以纯前端，不一定需要真正 API。
但为了让代码结构更清晰，建议仍然先写“内部 API 契约”与 TypeScript 类型。

## 推荐接口（即使只是本地 mock）
### 1. 获取场景清单
`GET /api/scenes`

返回：
```json
{
  "defaultScene": "dinner_core",
  "scenes": [
    {"id": "dinner_core", "title": "宿舍烤肉局", "priority": "P0"}
  ]
}
```

### 2. 获取场景详情
`GET /api/scenes/:sceneId`

返回：
- scene metadata
- steps
- actor refs
- card refs

### 3. 启动场景
`POST /api/demo/start`

请求：
```json
{"sceneId":"dinner_core","mode":"guided"}
```

返回：
```json
{"state": { "...": "..." }}
```

### 4. 推进一步
`POST /api/demo/action`

请求：
```json
{"actionId":"b_action_1"}
```

返回：
```json
{
  "state": {
    "currentStepId": "scene_c_vote_progress"
  }
}
```

## 如果不做真 API
也应当在 `lib/types/` 定义这些返回结构，方便未来迁移。

## 前端最少需要的类型
- SceneManifest
- SceneDefinition
- DemoStep
- ChatMessage
- DemoCard
- DemoAction
- DemoState
