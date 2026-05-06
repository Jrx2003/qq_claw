import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

import { studioConversationSchema } from "@/lib/llm/schemas";
import { loadCardMap } from "@/lib/fixtures/loader";
import {
  buildStudioDynamicCard,
  buildStudioPendingMessages,
  buildStudioSceneActionMessages,
  buildStudioSuggestionActions,
  buildStudioTurnMessages,
  resolveNextStudioThreadState,
  resolveStudioCardId,
  resolveStudioConversationTask,
} from "./studioConversation";

describe("studio conversation runtime", () => {
  it("validates renderable LLM chat output instead of raw JSON-only task output", () => {
    const parsed = studioConversationSchema.parse({
      intent_type: "plan",
      stage: "suggest",
      bot_message: "我看到大家都在聊周五吃饭，要不要我先帮你们确认谁能去？",
      npc_messages: [
        { actorId: "akai", text: "我可以，别太晚就行" },
        { actorId: "naicha", text: "地点最好别太远" },
      ],
      function_suggestion: {
        label: "生成成局卡",
        task: "intent",
        reason: "聊天里已经出现明确时间、地点和参与意向。",
      },
      chips: ["周五晚饭后可以", "先确认去不去"],
    });

    expect(parsed.bot_message).toContain("确认");
    expect(parsed.npc_messages).toHaveLength(2);
    expect(parsed.function_suggestion?.task).toBe("intent");
  });

  it("keeps LLM-authored dynamic card drafts for studio plan cards", () => {
    const parsed = studioConversationSchema.parse({
      intent_type: "plan",
      stage: "suggest",
      bot_message: "可以，我先帮你们确认周六火锅谁能来。",
      npc_messages: [{ actorId: "akai", text: "周六火锅我可以。" }],
      function_suggestion: {
        label: "先确认去不去",
        task: "intent",
        reason: "用户发起了新的周六火锅局。",
      },
      card_draft: {
        cardType: "plan",
        title: "周六火锅局 · 先确认去不去",
        status: "参加意向投票中",
        summary: "先确认周六火锅谁能来，再分开问时间和地点",
        attendanceOptions: ["我可以去", "看情况", "这次不去"],
      },
      chips: ["我可以去", "再问几点", "换个地点"],
    });

    expect(parsed.card_draft?.title).toBe("周六火锅局 · 先确认去不去");
    expect(parsed.card_draft?.attendanceOptions).toEqual(["我可以去", "看情况", "这次不去"]);
  });

  it("renders the user input, LLM-controlled NPCs, bot response, and suggested card into chat messages", () => {
    const messages = buildStudioTurnMessages({
      turnIndex: 3,
      userText: "周五晚上有人想吃烤肉吗？",
      cardId: "plan_card_1",
      response: {
        intent_type: "plan",
        stage: "execute",
        bot_message: "我先把这局整理成一个可投票的成局卡。",
        npc_messages: [
          { actorId: "akai", text: "我去，想吃烤肉" },
          { actorId: "xiaoyu", text: "我也可以" },
        ],
        function_suggestion: {
          label: "先确认去不去",
          task: "intent",
          reason: "已有两个积极响应。",
        },
        chips: ["周五 19:00", "换成火锅"],
      },
    });

    expect(messages.map((message) => message.actorId)).toEqual([
      "user_self",
      "akai",
      "xiaoyu",
      "bot_xjz",
      "bot_xjz",
    ]);
    expect(messages.at(-1)).toMatchObject({ type: "card", cardId: "plan_card_1" });
  });

  it("resolves every studio function suggestion to an existing renderable card", () => {
    const cards = loadCardMap();
    const cases: Array<{
      intentType: Parameters<typeof resolveStudioCardId>[0]["intent_type"];
      task: NonNullable<Parameters<typeof resolveStudioCardId>[0]["function_suggestion"]>["task"];
      expectedCardId: string;
    }> = [
      { intentType: "plan", task: "intent", expectedCardId: "plan_card_1" },
      { intentType: "anonymous", task: "anonymous", expectedCardId: "anonymous_card_1" },
      { intentType: "conflict", task: "conflict", expectedCardId: "conflict_card_1" },
      { intentType: "recap", task: "recap", expectedCardId: "memory_card_1" },
      { intentType: "game_party", task: "game-recap", expectedCardId: "game_party_card_1" },
    ];

    for (const testCase of cases) {
      const cardId = resolveStudioCardId({
        intent_type: testCase.intentType,
        stage: "suggest",
        bot_message: "ok",
        npc_messages: [],
        function_suggestion: {
          label: "显示卡片",
          task: testCase.task,
          reason: "test",
        },
        chips: [],
      });

      expect(cardId).toBe(testCase.expectedCardId);
      expect(cards.has(cardId ?? ""), `${testCase.intentType} should resolve to an existing card`).toBe(true);
    }
  });

  it("routes a new time option in an active dinner thread to the time vote card", () => {
    const response = {
      intent_type: "plan",
      stage: "suggest",
      bot_message: "我把这个新时间补进时间投票。",
      npc_messages: [{ actorId: "laozhou", text: "20:30 我更稳" }],
      function_suggestion: {
        label: "补充时间选项",
        task: "intent",
        reason: "用户在已有饭局里提出新的时间。",
      },
      chips: ["20:30 也可以", "继续看地点"],
    } as const;

    const cardId = resolveStudioCardId(response, {
      userText: "20:30 也可以吗？",
      recentMessages: [{ type: "card", cardId: "plan_card_1" }],
    });

    expect(cardId).toBe("vote_card_1");
  });

  it("routes a new place option in an active dinner thread to the place vote card", () => {
    const response = {
      intent_type: "plan",
      stage: "suggest",
      bot_message: "我把这个地点补进地点投票。",
      npc_messages: [{ actorId: "naicha", text: "南门新店也行" }],
      function_suggestion: {
        label: "补充地点选项",
        task: "intent",
        reason: "用户在已有饭局里提出新的地点。",
      },
      chips: ["南门新开的烤肉店", "继续确认时间"],
    } as const;

    const cardId = resolveStudioCardId(response, {
      userText: "南门新开的烤肉店怎么样？",
      recentMessages: [{ type: "card", cardId: "vote_card_1" }],
    });

    expect(cardId).toBe("place_vote_card_1");
  });

  it("routes free-text continuation intents through the active dynamic dinner thread", () => {
    const confusedResponse = {
      intent_type: "plan",
      stage: "suggest",
      bot_message: "我再帮你们确认一次谁能去。",
      npc_messages: [{ actorId: "akai", text: "我已经说过能去啦。" }],
      function_suggestion: {
        label: "先确认去不去",
        task: "intent",
        reason: "模型误以为需要重新确认参加意向。",
      },
      chips: ["我可以去", "继续时间投票"],
    } as const;

    expect(
      resolveStudioCardId(confusedResponse, {
        userText: "继续时间投票",
        recentMessages: [{ type: "card", cardId: "studio_card_1" }],
        threadState: {
          dinner: {
            stage: "plan",
            eventTitle: "周六火锅局",
            attendanceStatus: "joined",
          },
        },
      }),
    ).toBe("vote_card_1");

    expect(
      resolveStudioCardId(confusedResponse, {
        userText: "继续地点投票",
        recentMessages: [{ type: "card", cardId: "studio_card_2" }],
        threadState: {
          dinner: {
            stage: "time",
            eventTitle: "周六火锅局",
            attendanceStatus: "joined",
          },
        },
      }),
    ).toBe("place_vote_card_1");
  });

  it("keeps repeated time discussion in the time vote tool until the user explicitly asks for places", () => {
    const prematurePlaceResponse = {
      intent_type: "plan",
      stage: "suggest",
      bot_message: "时间差不多了，我来开地点投票。",
      npc_messages: [{ actorId: "akai", text: "我也可以。" }],
      function_suggestion: {
        label: "进入地点投票",
        task: "intent",
        reason: "模型过早推进到了地点。",
      },
      chips: ["继续地点投票", "确认地点"],
    } as const;

    expect(
      resolveStudioCardId(prematurePlaceResponse, {
        userText: "周六晚上八点呢？",
        recentMessages: [{ type: "card", cardId: "studio_card_2" }],
        threadState: {
          dinner: {
            stage: "time",
            eventTitle: "周六火锅局",
            attendanceStatus: "joined",
            timeOptions: ["周六晚上七点"],
          },
        },
      }),
    ).toBe("vote_card_1");

    expect(
      resolveStudioCardId(prematurePlaceResponse, {
        userText: "再晚一点呢？",
        recentMessages: [{ type: "card", cardId: "studio_card_3" }],
        threadState: {
          dinner: {
            stage: "time",
            eventTitle: "周六火锅局",
            attendanceStatus: "joined",
            timeOptions: ["周六晚上七点", "周六晚上八点"],
          },
        },
      }),
    ).toBe("vote_card_1");

    expect(
      resolveStudioCardId(prematurePlaceResponse, {
        userText: "继续地点投票",
        recentMessages: [{ type: "card", cardId: "studio_card_4" }],
        threadState: {
          dinner: {
            stage: "time",
            eventTitle: "周六火锅局",
            attendanceStatus: "joined",
            timeOptions: ["周六晚上七点", "周六晚上八点"],
          },
        },
      }),
    ).toBe("place_vote_card_1");
  });

  it("records free-text attendance and lets it advance to time voting", () => {
    const confusedResponse = {
      intent_type: "plan",
      stage: "listen",
      bot_message: "收到。",
      npc_messages: [{ actorId: "xiaoyu", text: "那人数够了吧。" }],
      chips: ["继续时间投票", "再等一下"],
    } as const;

    expect(
      resolveStudioCardId(confusedResponse, {
        userText: "我可以去",
        recentMessages: [{ type: "card", cardId: "studio_card_1" }],
        threadState: {
          dinner: {
            stage: "plan",
            eventTitle: "周六火锅局",
          },
        },
      }),
    ).toBe("vote_card_1");
  });

  it("injects user supplied time and place options into studio vote cards", () => {
    const cards = loadCardMap();
    const timeCard = buildStudioDynamicCard({
      baseCard: cards.get("vote_card_1"),
      cardId: "vote_card_1",
      turnIndex: 4,
      userText: "20:30 也可以吗？",
    });
    const placeCard = buildStudioDynamicCard({
      baseCard: cards.get("place_vote_card_1"),
      cardId: "place_vote_card_1",
      turnIndex: 5,
      userText: "南门新开的烤肉店怎么样？",
    });

    expect(timeCard?.id).toBe("studio_card_4");
    expect(timeCard?.timeVotes).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "20:30" })]),
    );
    expect(placeCard?.id).toBe("studio_card_5");
    expect(placeCard?.placeVotes).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "南门新开的烤肉店" })]),
    );
  });

  it("builds contextual first-round plan cards from the user's activity text", () => {
    const cards = loadCardMap();
    const hotpotCard = buildStudioDynamicCard({
      baseCard: cards.get("plan_card_1"),
      cardId: "plan_card_1",
      turnIndex: 6,
      userText: "周六有人吃火锅吗？",
    });
    const bbqCard = buildStudioDynamicCard({
      baseCard: cards.get("plan_card_1"),
      cardId: "plan_card_1",
      turnIndex: 7,
      userText: "周六有人吃烤肉吗？",
    });

    expect(hotpotCard?.id).toBe("studio_card_6");
    expect(hotpotCard?.title).toBe("周六火锅局 · 先确认去不去");
    expect(hotpotCard?.summary).toBe("先确认周六火锅谁能来，人数稳定后再分开问时间和地点");
    expect(hotpotCard?.summary).not.toContain("周五烤肉");
    expect(hotpotCard?.timeOptions).toEqual([]);
    expect(hotpotCard?.placeOptions).toEqual([]);
    expect(bbqCard?.title).toBe("周六烤肉局 · 先确认去不去");
  });

  it("uses LLM-authored plan-card copy without mixing in time or place votes", () => {
    const cards = loadCardMap();
    const draftedCard = buildStudioDynamicCard({
      baseCard: cards.get("plan_card_1"),
      cardId: "plan_card_1",
      turnIndex: 8,
      userText: "周六有人吃火锅吗？",
      cardDraft: {
        cardType: "plan",
        title: "周六宿舍火锅局 · 先确认去不去",
        status: "先看人数",
        summary: "只问能不能来，不把时间地点混在一张卡里",
        attendanceOptions: ["能来", "晚点看", "不来了"],
        timeOptions: ["周六 19:00"],
        placeOptions: ["宿舍楼下火锅"],
      },
    });

    expect(draftedCard?.id).toBe("studio_card_8");
    expect(draftedCard?.title).toBe("周六宿舍火锅局 · 先确认去不去");
    expect(draftedCard?.status).toBe("先看人数");
    expect(draftedCard?.summary).toBe("只问能不能来，不把时间地点混在一张卡里");
    expect(draftedCard?.attendanceOptions).toEqual(["能来", "晚点看", "不来了"]);
    expect(draftedCard?.timeOptions).toEqual([]);
    expect(draftedCard?.placeOptions).toEqual([]);
  });

  it("keeps dynamic dinner titles when free text opens time or place vote cards", () => {
    const cards = loadCardMap();
    const timeCard = buildStudioDynamicCard({
      baseCard: cards.get("vote_card_1"),
      cardId: "vote_card_1",
      turnIndex: 9,
      userText: "继续时间投票",
      threadState: {
        dinner: {
          stage: "plan",
          eventTitle: "周六火锅局",
          attendanceStatus: "joined",
        },
      },
    });
    const placeCard = buildStudioDynamicCard({
      baseCard: cards.get("place_vote_card_1"),
      cardId: "place_vote_card_1",
      turnIndex: 10,
      userText: "继续地点投票",
      threadState: {
        dinner: {
          stage: "time",
          eventTitle: "周六火锅局",
          attendanceStatus: "joined",
        },
      },
    });

    expect(timeCard?.id).toBe("studio_card_9");
    expect(timeCard?.title).toBe("周六火锅局 · 时间投票");
    expect(timeCard?.status).toBe("时间投票进行中");
    expect(placeCard?.id).toBe("studio_card_10");
    expect(placeCard?.title).toBe("周六火锅局 · 地点投票");
    expect(placeCard?.status).toBe("地点投票进行中");
  });

  it("treats the user's time text as the authoritative time vote option", () => {
    const cards = loadCardMap();
    const timeCard = buildStudioDynamicCard({
      baseCard: cards.get("vote_card_1"),
      cardId: "vote_card_1",
      turnIndex: 11,
      userText: "周六晚上八点呢？",
      cardDraft: {
        cardType: "vote",
        title: "周六火锅局 · 地点投票",
        status: "地点投票中",
        timeOptions: ["周六晚上6点", "周六晚上7点"],
        placeOptions: ["海底捞"],
      },
      threadState: {
        dinner: {
          stage: "time",
          eventTitle: "周六火锅局",
          attendanceStatus: "joined",
          timeOptions: ["周六晚上七点"],
        },
      },
    });

    expect(timeCard?.title).toBe("周六火锅局 · 时间投票");
    expect(timeCard?.status).toBe("时间投票更新中");
    expect(timeCard?.timeVotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "周六晚上八点" }),
        expect.objectContaining({ label: "周六晚上七点" }),
      ]),
    );
    expect(JSON.stringify(timeCard?.timeVotes)).not.toContain("周六晚上6点");
    expect(JSON.stringify(timeCard?.timeVotes)).not.toContain("海底捞");
  });

  it("accumulates exact user supplied time options in studio dinner state", () => {
    const stateAfterEight = resolveNextStudioThreadState({
      currentState: {
        dinner: {
          stage: "time",
          eventTitle: "周六火锅局",
          attendanceStatus: "joined",
          timeOptions: ["周六晚上七点"],
        },
      },
      userText: "周六晚上八点呢？",
      cardId: "vote_card_1",
      card: {
        id: "studio_card_11",
        cardType: "vote",
        title: "周六火锅局 · 时间投票",
      },
    });

    expect(stateAfterEight.dinner?.stage).toBe("time");
    expect(stateAfterEight.dinner?.timeOptions).toEqual(["周六晚上八点", "周六晚上七点"]);

    const stateAfterLater = resolveNextStudioThreadState({
      currentState: stateAfterEight,
      userText: "再晚一点呢？",
      cardId: "vote_card_1",
      card: {
        id: "studio_card_12",
        cardType: "vote",
        title: "周六火锅局 · 时间投票",
      },
    });

    expect(stateAfterLater.dinner?.stage).toBe("time");
    expect(stateAfterLater.dinner?.timeOptions).toEqual(["晚一点", "周六晚上八点", "周六晚上七点"]);
  });

  it("updates the studio dinner thread state from dynamic cards and free-text attendance", () => {
    const nextState = resolveNextStudioThreadState({
      currentState: {},
      userText: "周六有人吃火锅吗？",
      cardId: "plan_card_1",
      card: {
        id: "studio_card_1",
        cardType: "plan",
        title: "周六火锅局 · 先确认去不去",
      },
    });

    expect(nextState).toEqual({
      dinner: {
        stage: "plan",
        eventTitle: "周六火锅局",
      },
    });

    expect(
      resolveNextStudioThreadState({
        currentState: nextState,
        userText: "我可以去",
      }).dinner?.attendanceStatus,
    ).toBe("joined");
  });

  it("turns LLM suggestions into dynamic free-input actions", () => {
    const actions = buildStudioSuggestionActions(["帮我匿名发一下", "先降温再说"]);

    expect(actions).toEqual([
      expect.objectContaining({
        actionId: "studio.prompt.0",
        kind: "chip",
        label: "帮我匿名发一下",
        nextBeatId: "__studio_dynamic__",
      }),
      expect.objectContaining({
        actionId: "studio.prompt.1",
        kind: "chip",
        label: "先降温再说",
      }),
    ]);
  });

  it("shows an immediate generating status before the studio response arrives", () => {
    expect(buildStudioPendingMessages({ turnIndex: 2, userText: "周五有人吃烤肉吗？" })).toEqual([
      expect.objectContaining({
        id: "studio_2_user",
        actorId: "user_self",
        side: "right",
        type: "text",
        text: "周五有人吃烤肉吗？",
      }),
      expect.objectContaining({
        id: "studio_2_pending",
        actorId: "bot_xjz",
        side: "system",
        type: "hint",
        text: "虾局长正在生成回答...",
      }),
    ]);
  });

  it("appends authored scene action results after dynamic studio cards", () => {
    const beat = {
      messages: [
        { id: "join_1", actorId: "user_self", side: "right", type: "text", text: "我可以去" },
        { id: "join_2", actorId: "bot_xjz", side: "left", type: "text", text: "已记录" },
      ],
    };

    expect(buildStudioSceneActionMessages({ turnIndex: 3, beat }).map((message) => message.id)).toEqual([
      "studio_scene_3_join_1",
      "studio_scene_3_join_2",
    ]);
  });

  it("selects the matching structured task for each studio intent", () => {
    expect(resolveStudioConversationTask("plan")).toBe("intent");
    expect(resolveStudioConversationTask("anonymous")).toBe("anonymous");
    expect(resolveStudioConversationTask("conflict")).toBe("conflict");
    expect(resolveStudioConversationTask("game_party")).toBe("game-recap");
    expect(resolveStudioConversationTask("none")).toBe("intent");
  });

  it("wires studio UI as free-input chat without the side sandbox panel or raw JSON output", () => {
    const chatShell = readFileSync(path.join(process.cwd(), "src/components/chat/ChatShell.tsx"), "utf8");
    const chipBar = readFileSync(path.join(process.cwd(), "src/components/chat/SuggestionChipBar.tsx"), "utf8");
    const chatDemoPage = readFileSync(path.join(process.cwd(), "src/components/demo/ChatDemoPage.tsx"), "utf8");

    expect(chatShell).toContain("onSubmitText");
    expect(chatDemoPage).toContain("effectiveMode");
    expect(chatDemoPage).not.toContain("<StudioPanel");
    expect(chatDemoPage).not.toContain("自由群聊沙盒");
    expect(chipBar).toContain("textarea");
    expect(chipBar).toContain("自由输入");
    expect(chipBar).toContain("flex-wrap");
    expect(chipBar).not.toContain("overflow-x-auto");
    expect(chatDemoPage).not.toContain("<pre");
    expect(chatDemoPage).not.toContain("JSON.stringify");
  });

  it("removes the debug inspector surface from judge and studio UI", () => {
    const pageSource = readFileSync(path.join(process.cwd(), "src/components/demo/ChatDemoPage.tsx"), "utf8");
    const toolbarSource = readFileSync(path.join(process.cwd(), "src/components/demo/DemoToolbar.tsx"), "utf8");
    const storeSource = readFileSync(path.join(process.cwd(), "src/lib/state/demoStore.ts"), "utf8");

    expect(pageSource).not.toContain("StateInspector");
    expect(pageSource).not.toContain("debugOpen");
    expect(pageSource).not.toContain("debugParam");
    expect(toolbarSource).not.toContain("Debug");
    expect(toolbarSource).not.toContain("Bug");
    expect(storeSource).not.toContain("debugOpen");
  });
});
