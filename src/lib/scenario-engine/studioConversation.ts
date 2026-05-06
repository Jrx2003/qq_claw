import type { StudioConversation } from "@/lib/llm/schemas";
import type { ChatMessage, DemoAction, DemoBeat, LlmTaskName } from "@/lib/types/demo";

export type StudioConversationIntent = StudioConversation["intent_type"];

export function buildStudioTurnMessages({
  turnIndex,
  userText,
  response,
  cardId,
  includeUser = true,
}: {
  turnIndex: number;
  userText: string;
  response: StudioConversation;
  cardId?: string;
  includeUser?: boolean;
}): ChatMessage[] {
  const messages: ChatMessage[] = [];

  if (includeUser) {
    messages.push({
      id: `studio_${turnIndex}_user`,
      actorId: "user_self",
      side: "right",
      type: "text",
      text: userText,
    });
  }

  messages.push(
    ...response.npc_messages.map((message, index): ChatMessage => ({
      id: `studio_${turnIndex}_npc_${index}`,
      actorId: message.actorId,
      side: "left",
      type: "text",
      text: message.text,
      delayMs: 360 + index * 360,
    })),
    {
      id: `studio_${turnIndex}_bot`,
      actorId: "bot_xjz",
      side: "left",
      type: "text",
      text: response.bot_message,
      delayMs: 520 + response.npc_messages.length * 360,
    },
  );

  if (cardId) {
    messages.push({
      id: `studio_${turnIndex}_card`,
      actorId: "bot_xjz",
      side: "left",
      type: "card",
      cardId,
      delayMs: 920 + response.npc_messages.length * 360,
    });
  }

  return messages;
}

export function buildStudioPendingMessages({
  turnIndex,
  userText,
}: {
  turnIndex: number;
  userText: string;
}): ChatMessage[] {
  return [
    {
      id: `studio_${turnIndex}_user`,
      actorId: "user_self",
      side: "right",
      type: "text",
      text: userText,
    },
    {
      id: `studio_${turnIndex}_pending`,
      actorId: "bot_xjz",
      side: "system",
      type: "hint",
      text: "虾局长正在生成回答...",
      delayMs: 240,
    },
  ];
}

export function buildStudioSceneActionMessages({
  turnIndex,
  beat,
}: {
  turnIndex: number;
  beat: Pick<DemoBeat, "messages">;
}): ChatMessage[] {
  return (beat.messages ?? []).map((message, index) => ({
    ...message,
    id: `studio_scene_${turnIndex}_${message.id}`,
    delayMs: message.delayMs ?? index * 420,
  }));
}

export function buildStudioSuggestionActions(chips: string[]): DemoAction[] {
  return chips.map((chip, index) => ({
    actionId: `studio.prompt.${index}`,
    id: `studio.prompt.${index}`,
    label: chip,
    kind: "chip" as const,
    nextBeatId: "__studio_dynamic__",
    nextStepId: "__studio_dynamic__",
  }));
}

export function resolveStudioConversationTask(intentType: StudioConversationIntent): LlmTaskName {
  const taskByIntent: Record<StudioConversationIntent, LlmTaskName> = {
    plan: "intent",
    anonymous: "anonymous",
    conflict: "conflict",
    game_party: "game-recap",
    recap: "recap",
    none: "intent",
  };

  return taskByIntent[intentType];
}

export function resolveStudioCardId(response: StudioConversation): string | undefined {
  const task = response.function_suggestion?.task ?? resolveStudioConversationTask(response.intent_type);

  if (!response.function_suggestion && response.stage !== "execute") {
    return undefined;
  }

  const cardByTask: Partial<Record<LlmTaskName, string>> = {
    intent: "plan_card_1",
    anonymous: "anonymous_card_1",
    conflict: "conflict_card_1",
    recap: "memory_card_1",
    "game-recap": "game_party_card_1",
  };

  return cardByTask[task];
}
