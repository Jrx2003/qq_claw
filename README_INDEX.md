# 虾局长 Codex 启动包 v1

更新时间：2026-05-02

这个目录是给 **Codex / 代码代理** 直接阅读的启动包。目标不是做一个完整接入 QQ 的生产机器人，而是先做一个 **演示优先、路径受控、能快速让评委理解价值** 的产品原型。

## 1. 这个包的核心判断

- 当前阶段优先做 **Demo-first**，不是 Real-bot-first。
- 评委最需要看到的是：**问题定义 → AI 原生解法 → 主闭环 → 产品形态 → 演示完成度**。
- 因此 P0 不做自由探索式聊天，不把系统能力交给评委碰运气。
- 评委在原型里只控制 **一个用户**；其他群成员由系统脚本自动驱动。
- 用户主要通过 **按钮 / 选项 / 引导 chips** 触发剧情，快速走通“收口—投票—成局—回忆”闭环。
- 真实 QQ 机器人接口与 LLM 接口保留为 **后续扩展层**，不进入 P0 演示主路径。

## 2. 建议 Codex 的阅读顺序

1. `prompts/CODEX_GOAL_PROMPT.txt`
2. `docs/01_project_north_star.md`
3. `docs/02_demo_first_strategy.md`
4. `docs/03_scope_and_non_goals.md`
5. `docs/04_user_problem_and_evidence.md`
6. `docs/05_interaction_storyboard.md`
7. `docs/06_demo_engine_spec.md`
8. `docs/07_component_inventory.md`
9. `docs/08_visual_spec_qq_style.md`
10. `docs/09_conversation_script_library.md`
11. `docs/10_tech_stack_demo_first.md`
12. `docs/11_real_platform_notes_qq_bot.md`
13. `docs/12_repo_blueprint.md`
14. `docs/13_acceptance_checklist.md`

## 3. 当前推荐的产品版本

### P0 主路径（必须完成）
- 宿舍群吃饭局
- 触发：群里已有聊天，用户点选 `@虾局长 帮我收口这局`
- 虾局长生成 **成局卡**
- 群成员通过按钮完成 **时间/地点投票**
- 虾局长更新 **投票进展卡**
- 虾局长发布 **确认成局卡**
- 局后生成 **回忆卡**

### P0.5 可选增强
- 演示模式切换：`互动模式 / 自动播放模式 / 开发者调试模式`
- 进度控制器：用于录屏和现场演示
- 卡片动画、typing、延迟播放

### P1 备选扩展（不阻塞主线）
- 匿名倡议
- 冲突缓和 / AI 中继劝导
- 腾讯游戏局模板（王者荣耀、洛克王国等）

## 4. 本包内容说明

### docs/
文档说明、产品逻辑、技术栈、状态机、API 契约、组件清单、视觉规范。

### fixtures/
给 Codex 直接消费的结构化数据，包括：
- 场景脚本
- 卡片数据
- NPC 人设与偏好
- 建议按钮文案

### assets/
- `prototypes/`：用于产品形态参考的高保真原型图
- `reference/`：线框、流程、架构参考图

### legacy/
之前生成的比赛文档包，供补充参考，不作为 P0 编码的唯一真相源。

## 5. 最重要的开发原则

- **先把评委带对路，再考虑自由度。**
- **先把“像产品”做出来，再考虑“像系统”。**
- **先做可控演示，再做真实接入。**
- **先有完整闭环，再谈多场景。**

## 6. Codex 的落地目标

产出一个可运行的、可录屏的、视觉完成度较高的 Web 原型：
- QQ 群聊式移动界面
- 只有少量引导式交互
- 场景驱动
- 演示稳定
- 代码结构清晰
- 后续可插入真实 QQ 适配层和 LLM 适配层

详细目标见：`prompts/CODEX_GOAL_PROMPT.txt`
