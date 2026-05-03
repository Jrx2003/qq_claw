# 14 来源笔记

> 这份文档给团队写比赛说明文档时使用。这里保留的是“可以直接援引的外部证据”和“对产品结论的启发”，不是要在 Demo 里逐字展示给评委。

## 1）比赛资料共享表（可确认其结构）
来源：
- 腾讯文档共享表：腾讯PCG校园AI产品创意大赛·官方赛题包  
  https://docs.qq.com/sheet/DRmhOd1FHUWd6UnZ6?tab=i2kgfg

能从页面结构确认到的 tab：
- 目录&导航
- 初赛提交指南
- 赛题-命题赛道
- 赛题-开放赛道
- 赛程&奖项说明
- 评分细则
- FAQ 常见问题

启发：
- 我们补的内部文档结构，尽量对应“提交 / 赛题 / 评分 / FAQ / 演示”这些评委思维顺序。

## 2）QQ 机器人官方文档
启动接入：
https://bot.q.qq.com/wiki/develop/api-v2/

关键点：
- 机器人可以被添加到群聊/频道互动
- 用户也可以单独与机器人对话
- 创建机器人后获得 AppID / AppSecret
- AccessToken 方式鉴权

接口调用与鉴权：
https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/api-use.html

关键点：
- 获取 AccessToken 的地址是 `https://bots.qq.com/app/getAppAccessToken`
- access_token 默认约 7200 秒有效
- openapi 统一地址为 `https://api.sgroup.qq.com`

事件订阅与通知：
https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html

关键点：
- 支持 Webhook 和 WebSocket
- Webhook 需要 HTTPS
- 允许配置的回调端口为 80 / 443 / 8080 / 8443
- 需要签名校验

唯一身份机制：
https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/unique-id.html

关键点：
- user_openid / group_openid / member_openid 不可想当然混用
- member_openid 在不同群里会变化

群聊消息事件：
https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/send-receive/event.html

关键点：
- `GROUP_AT_MESSAGE_CREATE` 对应群里 @bot
- 真实产品不要默认 bot 能旁听所有群聊
- 相同 msg_id 可能重复推送，业务要去重

发送消息：
https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/send-receive/send.html

关键点：
- 单聊和群聊都有发送消息接口
- 群消息接口：`/v2/groups/{{group_openid}}/messages`
- 单聊接口：`/v2/users/{{openid}}/messages`
- 文档写明主动推送能力自 2025-04-21 起不再提供，应谨慎解读“主动提醒”类能力
- 消息内若含 URL，需要先在后台配置 URL 白名单

消息按钮：
https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/trans/msg-btn.html

关键点：
- keyboard 按钮依附于 markdown
- 单聊/群聊自定义按钮可用
- 触发 `INTERACTION_CREATE`
- 需要调用 `/interactions/{{interaction_id}}` 进行确认

用户事件：
https://bot.q.qq.com/wiki/develop/api-v2/server-inter/user/manage/event.html

关键点：
- `FRIEND_ADD`
- 有 `scene` 和 `scene_param`
- 未来可用于单聊绑定链路

群管理事件：
https://bot.q.qq.com/wiki/develop/api-v2/server-inter/group/manage/event.html

关键点：
- `GROUP_ADD_ROBOT`
- 可用于 bot 首次入群欢迎链路

## 3）中国互联网高频基础场景
CNNIC 第 55 次报告（英文版 PDF）：
https://www.cnnic.com.cn/IDR/ReportDownloads/202505/P020250514564119130448.pdf

关键点：
- 截至 2024 年 12 月，中国即时通信用户 10.81 亿，占 97.6%
- 社交网络用户 11.01 亿，占 99.3%
- 在线视频用户 10.70 亿级别
- 报告还提到腾讯通过连接微信、QQ 与在线游戏来丰富即时通信生态

启发：
- 群聊不是小众低频角落，而是超高频基础场景
- 活动组织、视频分享、游戏局都可以顺着大盘使用习惯来讲

## 4）高校人群规模
教育部《2024年全国教育事业发展统计公报》：
https://www.cee.edu.cn/n171/n459/n472/c804898/content.html

关键点：
- 全国各种形式高等教育在学总规模 4846.00 万
- 普通、职业本专科在校生 3891.26 万
- 在学研究生 409.54 万

启发：
- 校园场景足够大
- 宿舍群、班级群、社团群、游戏群都不是边缘场景

## 5）QQ 体量
腾讯 2025 年全年业绩新闻稿 PDF：
https://static.www.tencent.com/uploads/2026/03/18/559e5d480a4411165e6c7367d61fefbd.pdf

关键点：
- QQ 移动终端月活跃账户数 5.08 亿

启发：
- 题目 3 不是空壳命题，QQ 依然是大规模关系链容器

## 6）腾讯游戏局扩展
王者荣耀官网：
https://pvp.qq.com/

洛克王国官网：
https://17roco.qq.com/

启发：
- 如果做“游戏局回忆卡”或“开黑收口卡”，不会偏离腾讯生态
- 但它们应作为扩展模板，不要抢主叙事
