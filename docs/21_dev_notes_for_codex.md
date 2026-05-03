# 21 给 Codex 的实现备注

## 最容易翻车的地方
1. 把剧情写死在组件里，后面没法改
2. 太早做复杂状态同步
3. UI 过于网页化，不像聊天产品
4. 输入框留着却真让用户乱输
5. Auto Play 节奏太快或太慢
6. 组件名和数据名混乱

## 最容易显得高级的地方
1. 聊天节奏
2. 卡片组件统一
3. 选项 chips 的产品感
4. Bot 微文案
5. 场景切换流畅
6. 录屏时每张卡都有漂亮停留画面

## 实现顺序建议
### 第 1 步
搭项目骨架 + 全局样式 + `/demo`

### 第 2 步
做 ChatShell + MessageBubble + ChatHeader

### 第 3 步
做 4 张核心卡

### 第 4 步
读取 `fixtures/scenes/dinner_core.json`

### 第 5 步
实现 step 推进引擎

### 第 6 步
实现 guided mode

### 第 7 步
实现 autoplay mode

### 第 8 步
实现 scene switcher 与 debug panel

### 第 9 步
打磨动效和文案
