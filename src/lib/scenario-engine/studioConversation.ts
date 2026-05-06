import type { StudioConversation } from "@/lib/llm/schemas";
import type { ChatMessage, DemoAction, DemoBeat, DemoCard, LlmTaskName } from "@/lib/types/demo";

export type StudioConversationIntent = StudioConversation["intent_type"];
type StudioCardDraft = NonNullable<StudioConversation["card_draft"]>;
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
  cardDraft,
}: {
  baseCard?: DemoCard;
  cardId?: string;
  turnIndex: number;
  userText: string;
  cardDraft?: StudioCardDraft;
}): DemoCard | undefined {
  if (!baseCard || !cardId) {
    return undefined;
  }

  if (cardId === "plan_card_1") {
    return buildDynamicPlanCard({ baseCard, turnIndex, userText, cardDraft });
  }

  if (cardId === "vote_card_1") {
    const timeOption = extractTimeOption(userText) ?? firstText(cardDraft?.timeOptions);

    if (!timeOption) {
      return cardDraft?.cardType === "vote"
        ? applyCardDraft(
            {
              ...baseCard,
              id: `studio_card_${turnIndex}`,
            },
            cardDraft,
          )
        : undefined;
    }

    const timeVotes = prependVoteOption(baseCard.timeVotes, timeOption);

    return applyCardDraft(
      {
        ...baseCard,
        id: `studio_card_${turnIndex}`,
        status: "时间投票更新中",
        timeVotes,
      },
      cardDraft?.cardType === "vote" ? cardDraft : undefined,
    );
  }

  if (cardId === "place_vote_card_1") {
    const placeOption = extractPlaceOption(userText) ?? firstText(cardDraft?.placeOptions);

    if (!placeOption) {
      return cardDraft?.cardType === "vote"
        ? applyCardDraft(
            {
              ...baseCard,
              id: `studio_card_${turnIndex}`,
            },
            cardDraft,
          )
        : undefined;
    }

    const placeVotes = prependVoteOption(baseCard.placeVotes, placeOption);

    return applyCardDraft(
      {
        ...baseCard,
        id: `studio_card_${turnIndex}`,
        status: "地点投票更新中",
        placeVotes,
      },
      cardDraft?.cardType === "vote" ? cardDraft : undefined,
    );
  }

  return undefined;
}

function buildDynamicPlanCard({
  baseCard,
  turnIndex,
  userText,
  cardDraft,
}: {
  baseCard: DemoCard;
  turnIndex: number;
  userText: string;
  cardDraft?: StudioCardDraft;
}): DemoCard {
  const planDraft = cardDraft?.cardType === "plan" ? cardDraft : undefined;
  const timeLabel = extractEventTimeLabel(userText);
  const activityLabel = extractActivityLabel(userText);
  const eventLabel = buildEventLabel(timeLabel, activityLabel);

  return applyPlanCardDraft(
    {
      ...baseCard,
      id: `studio_card_${turnIndex}`,
      title: `${eventLabel}局 · 先确认去不去`,
      status: "参加意向投票中",
      summary: `先确认${eventLabel}谁能来，人数稳定后再分开问时间和地点`,
      attendanceOptions: baseCard.attendanceOptions,
      timeOptions: [],
      placeOptions: [],
    },
    planDraft,
  );
}

function applyPlanCardDraft(card: DemoCard, cardDraft?: StudioCardDraft): DemoCard {
  if (!cardDraft) {
    return card;
  }

  return {
    ...card,
    ...(cardDraft.title ? { title: cardDraft.title } : {}),
    ...(cardDraft.status ? { status: cardDraft.status } : {}),
    ...(cardDraft.summary ? { summary: cardDraft.summary } : {}),
    ...(cardDraft.attendanceOptions ? { attendanceOptions: cardDraft.attendanceOptions } : {}),
    ...(cardDraft.pendingMembers ? { pendingMembers: cardDraft.pendingMembers } : {}),
    timeOptions: [],
    placeOptions: [],
  };
}

function applyCardDraft(card: DemoCard, cardDraft?: StudioCardDraft): DemoCard {
  if (!cardDraft) {
    return card;
  }

  return {
    ...card,
    ...(cardDraft.title ? { title: cardDraft.title } : {}),
    ...(cardDraft.status ? { status: cardDraft.status } : {}),
    ...(cardDraft.summary ? { summary: cardDraft.summary } : {}),
    ...(cardDraft.attendanceOptions ? { attendanceOptions: cardDraft.attendanceOptions } : {}),
    ...(cardDraft.timeOptions ? { timeOptions: cardDraft.timeOptions } : {}),
    ...(cardDraft.placeOptions ? { placeOptions: cardDraft.placeOptions } : {}),
    ...(cardDraft.pendingMembers ? { pendingMembers: cardDraft.pendingMembers } : {}),
    ...(cardDraft.confirmedTime ? { confirmedTime: cardDraft.confirmedTime } : {}),
    ...(cardDraft.confirmedPlace ? { confirmedPlace: cardDraft.confirmedPlace } : {}),
  };
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

function firstText(values?: string[]): string | undefined {
  return values?.find((value) => value.trim().length > 0)?.trim();
}

function extractEventTimeLabel(text: string): string | undefined {
  const normalized = text.replace(/\s+/g, "");
  const match = normalized.match(/((?:本周|这周|下周)?周[一二三四五六日天末]|今天|今晚|明天|明晚|后天|周末)/);

  return match?.[1];
}

function extractActivityLabel(text: string): string {
  const normalized = text.replace(/\s+/g, "");
  const activityRules: Array<[RegExp, string]> = [
    [/火锅/, "火锅"],
    [/烤肉|烧烤/, "烤肉"],
    [/王者荣耀|王者|五排|开黑/, "王者五排"],
    [/剧本杀/, "剧本杀"],
    [/密室/, "密室"],
    [/KTV|唱歌/i, "KTV"],
    [/电影/, "电影"],
    [/奶茶/, "奶茶"],
    [/羽毛球|打球/, "羽毛球"],
    [/吃饭|聚餐|饭局/, "聚餐"],
  ];

  return activityRules.find(([pattern]) => pattern.test(normalized))?.[1] ?? "活动";
}

function buildEventLabel(timeLabel: string | undefined, activityLabel: string): string {
  if (activityLabel === "活动" && !timeLabel) {
    return "这次活动";
  }

  return `${timeLabel ?? ""}${activityLabel}`;
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
