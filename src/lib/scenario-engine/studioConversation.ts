import type { StudioConversation } from "@/lib/llm/schemas";
import type { ChatMessage, DemoAction, DemoBeat, DemoCard, LlmTaskName } from "@/lib/types/demo";

export type StudioConversationIntent = StudioConversation["intent_type"];
export type StudioCardContext = {
  userText?: string;
  recentMessages?: Array<Pick<ChatMessage, "type" | "text" | "cardId">>;
};

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

export function resolveStudioCardId(response: StudioConversation, context: StudioCardContext = {}): string | undefined {
  const task = response.function_suggestion?.task ?? resolveStudioConversationTask(response.intent_type);

  if (!response.function_suggestion && response.stage !== "execute") {
    return undefined;
  }

  if (task === "intent") {
    return resolveIntentStudioCardId(response, context);
  }

  const cardByTask: Partial<Record<LlmTaskName, string>> = {
    anonymous: "anonymous_card_1",
    conflict: "conflict_card_1",
    recap: "memory_card_1",
    "game-recap": "game_party_card_1",
  };

  return cardByTask[task];
}

export function buildStudioDynamicCard({
  baseCard,
  cardId,
  turnIndex,
  userText,
}: {
  baseCard?: DemoCard;
  cardId?: string;
  turnIndex: number;
  userText: string;
}): DemoCard | undefined {
  if (!baseCard || !cardId) {
    return undefined;
  }

  if (cardId === "vote_card_1") {
    const timeOption = extractTimeOption(userText);

    if (!timeOption) {
      return undefined;
    }

    const timeVotes = prependVoteOption(baseCard.timeVotes, timeOption);

    return {
      ...baseCard,
      id: `studio_card_${turnIndex}`,
      status: "时间投票更新中",
      timeVotes,
    };
  }

  if (cardId === "place_vote_card_1") {
    const placeOption = extractPlaceOption(userText);

    if (!placeOption) {
      return undefined;
    }

    const placeVotes = prependVoteOption(baseCard.placeVotes, placeOption);

    return {
      ...baseCard,
      id: `studio_card_${turnIndex}`,
      status: "地点投票更新中",
      placeVotes,
    };
  }

  return undefined;
}

function resolveIntentStudioCardId(response: StudioConversation, context: StudioCardContext): string {
  const userText = context.userText ?? "";
  const suggestionText = [
    response.bot_message,
    response.function_suggestion?.label,
    response.function_suggestion?.reason,
    ...response.chips,
  ].join(" ");
  const activeCardIds = new Set(
    (context.recentMessages ?? [])
      .map((message) => message.cardId)
      .filter((cardId): cardId is string => Boolean(cardId)),
  );
  const hasActiveDinnerCard = ["plan_card_1", "vote_card_1", "place_vote_card_1", "confirm_card_1"].some((cardId) =>
    activeCardIds.has(cardId),
  );

  if (hasActiveDinnerCard && isPlaceText(userText)) {
    return "place_vote_card_1";
  }

  if (hasActiveDinnerCard && isTimeText(userText)) {
    return "vote_card_1";
  }

  if (hasActiveDinnerCard && /地点|位置|店|餐厅/.test(suggestionText)) {
    return "place_vote_card_1";
  }

  if (hasActiveDinnerCard && /时间|几点|补充时间/.test(suggestionText)) {
    return "vote_card_1";
  }

  if (activeCardIds.has("place_vote_card_1") && /确认|定了|成局|就这/.test(`${userText} ${suggestionText}`)) {
    return "confirm_card_1";
  }

  return "plan_card_1";
}

function isTimeText(text: string): boolean {
  return Boolean(extractTimeOption(text));
}

function isPlaceText(text: string): boolean {
  return Boolean(extractPlaceOption(text));
}

function extractTimeOption(text: string): string | undefined {
  const normalized = text.trim();
  const clockMatch = normalized.match(/(?:周[一二三四五六日天末]\s*)?(\d{1,2}[:：]\d{2})/);

  if (clockMatch) {
    return clockMatch[1].replace("：", ":");
  }

  const pointMatch = normalized.match(/((?:周[一二三四五六日天末]\s*)?(?:早上|上午|中午|下午|晚上|今晚)?\s*\d{1,2}\s*点半?)/);

  if (pointMatch) {
    return pointMatch[1].replace(/\s+/g, "");
  }

  const dayPartMatch = normalized.match(/(周[一二三四五六日天末]\s*(?:早上|上午|中午|下午|晚上))/);

  return dayPartMatch?.[1].replace(/\s+/g, "");
}

function extractPlaceOption(text: string): string | undefined {
  const normalized = text
    .replace(/[，,。！？!?]/g, " ")
    .replace(/(可以|怎么样|如何|行不行|吗|呢|吧|呀|啊)/g, " ")
    .trim();
  const knownMatch = normalized.match(/(海底捞|木屋烧烤|韩宫宴)/);

  if (knownMatch) {
    return knownMatch[1];
  }

  const placeMatch = normalized.match(/([\u4e00-\u9fa5A-Za-z0-9·]{2,22}(?:烤肉店|烧烤店|火锅店|餐厅|饭店|小馆|店|烧烤|烤肉|火锅))/);

  return placeMatch?.[1];
}

function prependVoteOption(value: unknown, label: string) {
  const rows = Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];

  if (rows.some((row) => row.label === label)) {
    return rows;
  }

  return [
    {
      label,
      votes: 1,
      percent: 12,
    },
    ...rows,
  ];
}
