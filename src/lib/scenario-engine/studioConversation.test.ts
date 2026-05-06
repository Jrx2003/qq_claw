import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

import { studioConversationSchema } from "@/lib/llm/schemas";
import {
  buildStudioSuggestionActions,
  buildStudioTurnMessages,
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

  it("renders the user input, LLM-controlled NPCs, bot response, and suggested card into chat messages", () => {
    const messages = buildStudioTurnMessages({
      turnIndex: 3,
      userText: "周五晚上有人想吃烤肉吗？",
      cardId: "plan_card",
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
    expect(messages.at(-1)).toMatchObject({ type: "card", cardId: "plan_card" });
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

  it("selects the matching structured task for each studio intent", () => {
    expect(resolveStudioConversationTask("plan")).toBe("intent");
    expect(resolveStudioConversationTask("anonymous")).toBe("anonymous");
    expect(resolveStudioConversationTask("conflict")).toBe("conflict");
    expect(resolveStudioConversationTask("game_party")).toBe("game-recap");
    expect(resolveStudioConversationTask("none")).toBe("intent");
  });

  it("wires studio UI as a free-input chat sandbox, not a raw JSON task panel", () => {
    const chatShell = readFileSync(path.join(process.cwd(), "src/components/chat/ChatShell.tsx"), "utf8");
    const chipBar = readFileSync(path.join(process.cwd(), "src/components/chat/SuggestionChipBar.tsx"), "utf8");
    const chatDemoPage = readFileSync(path.join(process.cwd(), "src/components/demo/ChatDemoPage.tsx"), "utf8");
    const studioPanel = readFileSync(path.join(process.cwd(), "src/components/demo/StudioPanel.tsx"), "utf8");

    expect(chatShell).toContain("onSubmitText");
    expect(chatDemoPage).toContain("effectiveMode");
    expect(chipBar).toContain("textarea");
    expect(chipBar).toContain("自由输入");
    expect(studioPanel).toContain("群聊背景");
    expect(studioPanel).not.toContain("<pre");
    expect(studioPanel).not.toContain("JSON.stringify");
  });
});
