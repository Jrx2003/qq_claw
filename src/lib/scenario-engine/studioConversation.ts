import type { StudioConversation } from "@/lib/llm/schemas";
import type { ChatMessage, DemoAction, LlmTaskName } from "@/lib/types/demo";

export type StudioConversationIntent = StudioConversation["intent_type"];

export function buildStudioTurnMessages({
  turnIndex,
  userText,
  response,
  cardId,
}: {
  turnIndex: number;
  userText: string;
  response: StudioConversation;
  cardId?: string;
}): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      id: `studio_${turnIndex}_user`,
      actorId: "user_self",
      side: "right",
      type: "text",
      text: userText,
    },
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
  ];

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
