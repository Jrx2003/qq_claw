import type { StudioConversation } from "@/lib/llm/schemas";
import type { ChatMessage, DemoAction, DemoBeat, DemoCard, LlmTaskName } from "@/lib/types/demo";

export type StudioConversationIntent = StudioConversation["intent_type"];
type StudioCardDraft = NonNullable<StudioConversation["card_draft"]>;
export type StudioDinnerStage = "plan" | "time" | "place" | "confirm";
export type StudioAttendanceStatus = "joined" | "maybe" | "declined";
export type StudioThreadState = {
  dinner?: {
    stage: StudioDinnerStage;
    eventTitle?: string;
    attendanceStatus?: StudioAttendanceStatus;
    timeOptions?: string[];
    placeOptions?: string[];
  };
};
export type StudioCardContext = {
  userText?: string;
  recentMessages?: Array<Pick<ChatMessage, "type" | "text" | "cardId">>;
  threadState?: StudioThreadState;
};
export type StudioCardIdMap = Record<string, string | undefined>;

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
  cardIdMap = {},
  hiddenCardIds = [],
}: {
  turnIndex: number;
  beat: Pick<DemoBeat, "messages">;
  cardIdMap?: StudioCardIdMap;
  hiddenCardIds?: string[];
}): ChatMessage[] {
  const hiddenCardIdSet = new Set(hiddenCardIds);

  return (beat.messages ?? [])
    .filter((message) => !message.cardId || !hiddenCardIdSet.has(message.cardId))
    .map((message, index) => ({
      ...message,
      id: `studio_scene_${turnIndex}_${message.id}`,
      cardId: message.cardId ? (cardIdMap[message.cardId] ?? message.cardId) : message.cardId,
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

export function stabilizeStudioConversationResponse(
  response: StudioConversation,
  context: StudioCardContext = {},
): StudioConversation {
  const userText = context.userText ?? "";
  const currentTurnEvidenceText = buildCurrentTurnEvidenceText(response, userText);

  if (hasActiveDinnerContext(context) && wantsPlaceVote(userText) && !hasPlaceOptionEvidence(context, currentTurnEvidenceText)) {
    return {
      ...response,
      stage: "follow_up",
      bot_message: "地点还没人提。你们有想去的店、商圈或品类吗？先在群里抛一个，我再开地点投票。",
      function_suggestion: undefined,
      card_draft: undefined,
      chips: ["寿喜烧可以吗？", "学校南门那家店呢？", "先问大家想去哪"],
    };
  }

  if (hasActiveDinnerContext(context) && wantsTimeVote(userText) && !hasTimeOptionEvidence(context, currentTurnEvidenceText)) {
    return {
      ...response,
      stage: "follow_up",
      bot_message: "还没有具体时间。你们先抛一个能到的点，我再把真实出现的时间开成投票。",
      function_suggestion: undefined,
      card_draft: undefined,
      chips: ["周六晚上八点呢？", "七点可以吗？", "先问大家几点"],
    };
  }

  if (context.threadState?.dinner?.attendanceStatus === "joined" && /确认.*去不去|先确认.*参加|先确认.*谁能/.test(response.bot_message)) {
    return {
      ...response,
      bot_message: "你已经在参加名单里了。接下来等群里补具体时间或地点，我再把候选拆成单独投票。",
      function_suggestion: undefined,
      card_draft: undefined,
    };
  }

  return response;
}

export function resolveStudioCardId(response: StudioConversation, context: StudioCardContext = {}): string | undefined {
  const task = response.function_suggestion?.task ?? resolveStudioConversationTask(response.intent_type);
  const currentTurnEvidenceText = buildCurrentTurnEvidenceText(response, context.userText ?? "");
  const contextualDinnerCardId = resolveContextualDinnerCardId(context, currentTurnEvidenceText);

  if (contextualDinnerCardId) {
    return contextualDinnerCardId;
  }

  if (!response.function_suggestion && response.stage !== "execute") {
    return undefined;
  }

  if (task === "intent") {
    return resolveIntentStudioCardId(response, context, currentTurnEvidenceText);
  }

  const cardByTask: Partial<Record<LlmTaskName, string>> = {
    anonymous: "anonymous_card_1",
    conflict: "conflict_card_1",
    recap: "memory_card_1",
    "game-recap": "game_party_card_1",
  };
  const taskCardId = cardByTask[task];

  if (taskCardId && getActiveCardIds(context).includes(taskCardId)) {
    return undefined;
  }

  return taskCardId;
}

export function buildStudioDynamicCard({
  baseCard,
  cardId,
  turnIndex,
  userText,
  cardDraft,
  threadState,
  optionEvidenceText,
}: {
  baseCard?: DemoCard;
  cardId?: string;
  turnIndex: number;
  userText: string;
  cardDraft?: StudioCardDraft;
  threadState?: StudioThreadState;
  optionEvidenceText?: string;
}): DemoCard | undefined {
  if (!baseCard || !cardId) {
    return undefined;
  }

  if (cardId === "plan_card_1") {
    return buildDynamicPlanCard({ baseCard, turnIndex, userText, cardDraft });
  }

  if (cardId === "vote_card_1") {
    const evidenceText = [userText, optionEvidenceText].filter(Boolean).join(" ");
    const userTimeOptions = extractTimeOptions(userText);
    const evidenceTimeOptions = extractTimeOptions(evidenceText);
    const stateTimeOptions = threadState?.dinner?.timeOptions ?? [];
    const draftTimeOptions = filterDraftOptionsByEvidence(cardDraft?.timeOptions, evidenceText);
    const timeOptions = compactOptionLabels(
      uniqueLabels([...userTimeOptions, ...evidenceTimeOptions, ...stateTimeOptions, ...draftTimeOptions]),
    );
    const timeOption = firstText(timeOptions);
    const hasDinnerThread = Boolean(threadState?.dinner);
    const title = buildVoteTitle(threadState, cardDraft, "时间投票");

    if (!timeOption) {
      return undefined;
    }

    const timeVotes = buildVoteRows(timeOptions, hasDinnerThread ? [] : baseCard.timeVotes);

    return applyVoteCardDraft(
      {
        ...baseCard,
        id: `studio_card_${turnIndex}`,
        title,
        status: userTimeOptions.length > 0 ? "时间投票更新中" : "时间投票进行中",
        timeVotes,
        placeVotes: undefined,
      },
      cardDraft?.cardType === "vote" ? cardDraft : undefined,
    );
  }

  if (cardId === "place_vote_card_1") {
    const evidenceText = [userText, optionEvidenceText].filter(Boolean).join(" ");
    const userPlaceOptions = extractPlaceOptions(userText);
    const evidencePlaceOptions = extractPlaceOptions(evidenceText);
    const statePlaceOptions = threadState?.dinner?.placeOptions ?? [];
    const draftPlaceOptions = filterDraftOptionsByEvidence(cardDraft?.placeOptions, evidenceText);
    const placeOptions = compactOptionLabels(
      uniqueLabels([...userPlaceOptions, ...evidencePlaceOptions, ...statePlaceOptions, ...draftPlaceOptions]),
    );
    const placeOption = firstText(placeOptions);
    const hasDinnerThread = Boolean(threadState?.dinner);
    const title = buildVoteTitle(threadState, cardDraft, "地点投票");

    if (!placeOption) {
      return undefined;
    }

    const placeVotes = buildVoteRows(placeOptions, hasDinnerThread ? [] : baseCard.placeVotes);

    return applyVoteCardDraft(
      {
        ...baseCard,
        id: `studio_card_${turnIndex}`,
        title,
        status: userPlaceOptions.length > 0 ? "地点投票更新中" : "地点投票进行中",
        timeVotes: undefined,
        placeVotes,
      },
      cardDraft?.cardType === "vote" ? cardDraft : undefined,
    );
  }

  if (cardId === "confirm_card_1") {
    if (!threadState?.dinner && cardDraft?.cardType !== "confirm") {
      return undefined;
    }

    return applyCardDraft(
      applyThreadEventTitle(
        {
          ...baseCard,
          id: `studio_card_${turnIndex}`,
        },
        threadState,
      ),
      cardDraft?.cardType === "confirm" ? cardDraft : undefined,
    );
  }

  return undefined;
}

export function resolveNextStudioThreadState({
  currentState = {},
  userText = "",
  cardId,
  card,
  actionId,
}: {
  currentState?: StudioThreadState;
  userText?: string;
  cardId?: string;
  card?: DemoCard;
  actionId?: string;
}): StudioThreadState {
  const next: StudioThreadState = currentState.dinner ? { dinner: { ...currentState.dinner } } : {};
  const actionUpdate = actionId ? resolveDinnerActionUpdate(actionId) : undefined;
  const cardStage = resolveDinnerStageFromCard(cardId, card);
  const attendanceStatus = resolveAttendanceStatus(userText);
  const eventTitle = normalizeDinnerEventTitle(card?.title) ?? next.dinner?.eventTitle;
  const shouldCollectPlaceOptions = cardStage === "place" || next.dinner?.stage === "place" || wantsPlaceVote(userText);
  const timeOptions = uniqueLabels([...extractTimeOptions(userText), ...(next.dinner?.timeOptions ?? [])]);
  const placeOptions = shouldCollectPlaceOptions
    ? uniqueLabels([...extractPlaceOptions(userText), ...(next.dinner?.placeOptions ?? [])])
    : (next.dinner?.placeOptions ?? []);

  if (actionUpdate || cardStage || attendanceStatus || eventTitle || timeOptions.length > 0 || placeOptions.length > 0) {
    next.dinner = {
      stage: actionUpdate?.stage ?? cardStage ?? next.dinner?.stage ?? "plan",
      ...(eventTitle ? { eventTitle } : {}),
      ...(actionUpdate?.attendanceStatus ?? attendanceStatus ?? next.dinner?.attendanceStatus
        ? { attendanceStatus: actionUpdate?.attendanceStatus ?? attendanceStatus ?? next.dinner?.attendanceStatus }
        : {}),
      ...(timeOptions.length > 0 ? { timeOptions } : {}),
      ...(placeOptions.length > 0 ? { placeOptions } : {}),
    };
  }

  return next;
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

function applyVoteCardDraft(card: DemoCard, cardDraft?: StudioCardDraft): DemoCard {
  if (!cardDraft) {
    return card;
  }

  return {
    ...card,
    ...(cardDraft.summary ? { summary: cardDraft.summary } : {}),
    ...(cardDraft.pendingMembers ? { pendingMembers: cardDraft.pendingMembers } : {}),
  };
}

function applyThreadEventTitle(card: DemoCard, threadState?: StudioThreadState): DemoCard {
  const eventTitle = threadState?.dinner?.eventTitle;

  return eventTitle
    ? {
        ...card,
        title: eventTitle,
      }
    : card;
}

function buildVoteTitle(threadState: StudioThreadState | undefined, cardDraft: StudioCardDraft | undefined, suffix: string): string {
  const eventTitle = threadState?.dinner?.eventTitle ?? normalizeDinnerEventTitle(cardDraft?.title) ?? "这次活动";

  return `${eventTitle} · ${suffix}`;
}

function resolveIntentStudioCardId(
  response: StudioConversation,
  context: StudioCardContext,
  currentTurnEvidenceText: string,
): string | undefined {
  const userText = context.userText ?? "";
  const suggestionText = [
    response.bot_message,
    response.function_suggestion?.label,
    response.function_suggestion?.reason,
    ...response.chips,
  ].join(" ");
  const activeCardIds = getActiveCardIds(context);
  const hasActiveDinnerCard = hasActiveDinnerContext(context);
  const dinnerStage = inferDinnerStage(context);
  const hasTimeOption = hasTimeOptionEvidence(context, currentTurnEvidenceText);
  const hasPlaceOption = hasPlaceOptionEvidence(context, currentTurnEvidenceText);

  if (hasActiveDinnerCard && isJoinOnlyText(userText)) {
    return undefined;
  }

  if ((activeCardIds.includes("place_vote_card_1") || dinnerStage === "place") && wantsConfirm(userText)) {
    return "confirm_card_1";
  }

  if (hasActiveDinnerCard && wantsPlaceVote(userText) && !hasPlaceOption) {
    return undefined;
  }

  if (hasActiveDinnerCard && wantsTimeVote(userText) && !hasTimeOption) {
    return undefined;
  }

  if (hasActiveDinnerCard && isPlaceText(userText) && hasPlaceOption) {
    return "place_vote_card_1";
  }

  if (hasActiveDinnerCard && isTimeDiscussionText(userText) && hasTimeOption) {
    return "vote_card_1";
  }

  if (dinnerStage === "time" && !wantsPlaceVote(userText) && !isPlaceText(userText) && hasTimeOption) {
    return "vote_card_1";
  }

  if (hasActiveDinnerCard && /地点|位置|店|餐厅/.test(suggestionText) && hasPlaceOption) {
    return "place_vote_card_1";
  }

  if (hasActiveDinnerCard && /时间|几点|补充时间/.test(suggestionText) && hasTimeOption) {
    return "vote_card_1";
  }

  if (activeCardIds.includes("place_vote_card_1") && /确认|定了|成局|就这/.test(`${userText} ${suggestionText}`)) {
    return "confirm_card_1";
  }

  if (hasActiveDinnerCard) {
    return undefined;
  }

  return "plan_card_1";
}

function resolveContextualDinnerCardId(
  context: StudioCardContext,
  currentTurnEvidenceText = context.userText ?? "",
): string | undefined {
  const userText = context.userText ?? "";
  const dinnerStage = inferDinnerStage(context);
  const hasTimeOption = hasTimeOptionEvidence(context, currentTurnEvidenceText);
  const hasPlaceOption = hasPlaceOptionEvidence(context, currentTurnEvidenceText);

  if (!hasActiveDinnerContext(context)) {
    return undefined;
  }

  if (isJoinOnlyText(userText)) {
    return undefined;
  }

  if ((wantsPlaceVote(userText) || isPlaceText(userText)) && hasPlaceOption) {
    return "place_vote_card_1";
  }

  if ((wantsTimeVote(userText) || isTimeDiscussionText(userText)) && hasTimeOption) {
    return "vote_card_1";
  }

  if (dinnerStage === "time" && hasTimeOption && !wantsPlaceVote(userText) && !isPlaceText(userText)) {
    return "vote_card_1";
  }

  if (wantsConfirm(userText) && inferDinnerStage(context) === "place") {
    return "confirm_card_1";
  }

  return undefined;
}

function hasActiveDinnerContext(context: StudioCardContext): boolean {
  if (context.threadState?.dinner) {
    return true;
  }

  return getActiveCardIds(context).some(
    (cardId) =>
      ["plan_card_1", "vote_card_1", "place_vote_card_1", "confirm_card_1"].includes(cardId) ||
      cardId.startsWith("studio_card_"),
  );
}

export function isStudioDinnerCardId(cardId?: string): boolean {
  return Boolean(cardId && ["plan_card_1", "vote_card_1", "place_vote_card_1", "confirm_card_1"].includes(cardId));
}

function inferDinnerStage(context: StudioCardContext): StudioDinnerStage | undefined {
  if (context.threadState?.dinner?.stage) {
    return context.threadState.dinner.stage;
  }

  const cardIds = getActiveCardIds(context).reverse();

  if (cardIds.includes("confirm_card_1")) {
    return "confirm";
  }

  if (cardIds.includes("place_vote_card_1")) {
    return "place";
  }

  if (cardIds.includes("vote_card_1")) {
    return "time";
  }

  if (cardIds.includes("plan_card_1") || cardIds.some((cardId) => cardId.startsWith("studio_card_"))) {
    return "plan";
  }

  return undefined;
}

function getActiveCardIds(context: StudioCardContext): string[] {
  return (context.recentMessages ?? [])
    .map((message) => message.cardId)
    .filter((cardId): cardId is string => Boolean(cardId));
}

function isTimeDiscussionText(text: string): boolean {
  return extractTimeOptions(text).length > 0 || /时间|几点|早一点|晚一点|更早|更晚|再晚|再早|上午|中午|下午|晚上|今晚|明晚/.test(text);
}

function isPlaceText(text: string): boolean {
  return Boolean(extractPlaceOption(text));
}

function wantsTimeVote(text: string): boolean {
  return /时间投票|投时间|继续.*时间|进入.*时间|开.*时间|问.*时间|选.*时间|几点/.test(text);
}

function wantsPlaceVote(text: string): boolean {
  return /地点投票|投地点|继续.*地点|进入.*地点|开.*地点|问.*地点|选.*地点|选店|哪家|哪里|去哪/.test(text);
}

function wantsConfirm(text: string): boolean {
  return /确认|定了|成局|就这|收口/.test(text);
}

function isJoinText(text: string): boolean {
  const normalized = text.replace(/\s+/g, "");

  if (/不去|不参加|去不了|算了|不了/.test(normalized)) {
    return false;
  }

  return /我可以去|可以去|我能去|能去|我去|算我|加我|报名|参加/.test(normalized);
}

function isJoinOnlyText(text: string): boolean {
  return isJoinText(text) && extractTimeOptions(text).length === 0 && extractPlaceOptions(text).length === 0;
}

function hasTimeOptionEvidence(context: StudioCardContext, evidenceText: string): boolean {
  return extractTimeOptions(evidenceText).length > 0 || (context.threadState?.dinner?.timeOptions?.length ?? 0) > 0;
}

function hasPlaceOptionEvidence(context: StudioCardContext, evidenceText: string): boolean {
  return extractPlaceOptions(evidenceText).length > 0 || (context.threadState?.dinner?.placeOptions?.length ?? 0) > 0;
}

function buildCurrentTurnEvidenceText(response: StudioConversation, userText: string): string {
  return [
    userText,
    ...response.npc_messages.map((message) => message.text),
  ].join(" ");
}

function resolveAttendanceStatus(text: string): StudioAttendanceStatus | undefined {
  const normalized = text.replace(/\s+/g, "");

  if (/不去|不参加|去不了|算了|不了/.test(normalized)) {
    return "declined";
  }

  if (/看情况|待定|不确定|可能/.test(normalized)) {
    return "maybe";
  }

  return isJoinText(normalized) ? "joined" : undefined;
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

function resolveDinnerStageFromCard(cardId?: string, card?: DemoCard): StudioDinnerStage | undefined {
  const effectiveCardId = cardId ?? card?.id;

  if (effectiveCardId === "plan_card_1" || card?.cardType === "plan") {
    return "plan";
  }

  if (effectiveCardId === "vote_card_1") {
    return "time";
  }

  if (effectiveCardId === "place_vote_card_1") {
    return "place";
  }

  if (effectiveCardId === "confirm_card_1" || card?.cardType === "confirm") {
    return "confirm";
  }

  if (card?.cardType === "vote") {
    return card.placeVotes ? "place" : "time";
  }

  return undefined;
}

function resolveDinnerActionUpdate(
  actionId: string,
): { stage?: StudioDinnerStage; attendanceStatus?: StudioAttendanceStatus } | undefined {
  if (/vote_join|enter_time_vote|maybe_to_time/.test(actionId)) {
    return { stage: "time", attendanceStatus: "joined" };
  }

  if (/maybe_join|maybe_watch/.test(actionId)) {
    return { stage: "plan", attendanceStatus: "maybe" };
  }

  if (/decline/.test(actionId)) {
    return { attendanceStatus: "declined" };
  }

  if (/enter_place_vote|place_vote/.test(actionId)) {
    return { stage: "place" };
  }

  if (/confirm/.test(actionId)) {
    return { stage: "confirm" };
  }

  return undefined;
}

function normalizeDinnerEventTitle(title?: string): string | undefined {
  const normalized = title?.replace(/\s*·.*$/, "").trim();

  return normalized && normalized.length > 0 ? normalized : undefined;
}

function extractTimeOptions(text: string): string[] {
  const normalized = text
    .replace(/[，,。！？!?]/g, " ")
    .replace(/(可以|怎么样|如何|行不行|吗|呢|吧|呀|啊)/g, " ")
    .trim();
  const vagueMatch = normalized.match(/(再晚一点|再早一点|晚一点|早一点|更早|更晚|再晚|再早)/);

  if (vagueMatch) {
    return [vagueMatch[1].replace(/^再/, "")];
  }

  const prefix = String.raw`(?:本周|这周|下周)?(?:周[一二三四五六日天末]\s*)?(?:早上|上午|中午|下午|晚上|今晚|明晚)?\s*`;
  const digitTime = new RegExp(`(${prefix}(?:\\d{1,2}[:：]\\d{2}|\\d{1,2}\\s*点半?|\\d{1,2}\\s*点\\s*\\d{1,2}\\s*分?))`, "g");
  const chineseTime = new RegExp(`(${prefix}(?:[一二两三四五六七八九十]{1,3}\\s*点半?|[一二两三四五六七八九十]{1,3}\\s*点\\s*[一二两三四五六七八九十]{1,3}\\s*分?))`, "g");
  const labels = uniqueLabels([
    ...collectPositiveOptionMatches(normalized, digitTime).map(normalizeTimeLabel),
    ...collectPositiveOptionMatches(normalized, chineseTime).map(normalizeTimeLabel),
  ]);

  if (labels.length > 0) {
    return labels;
  }

  return [];
}

function normalizeTimeLabel(label: string): string {
  return label.replace(/\s+/g, "").replace("：", ":").trim();
}

function extractPlaceOption(text: string): string | undefined {
  return extractPlaceOptions(text)[0];
}

function extractPlaceOptions(text: string): string[] {
  const normalized = text
    .replace(/[，,。！？!?]/g, " ")
    .replace(/(可以|怎么样|如何|行不行|吗|呢|吧|呀|啊)/g, " ")
    .trim();
  const knownMatches = collectPositiveOptionMatches(
    normalized,
    /(寿喜烧自助|海底捞|木屋烧烤|韩宫宴|寿喜烧|重庆老火锅|湊湊|巴奴|小龙坎|萨莉亚|太二酸菜鱼|麦当劳|肯德基|日料|烤鱼|自助|串串|小龙虾|麻辣烫|寿司|牛排)/g,
  );

  const placeMatches = collectPositiveOptionMatches(
    normalized,
    /([\u4e00-\u9fa5A-Za-z0-9·]{2,22}(?:烤肉店|烧烤店|火锅店|餐厅|饭店|小馆|小店|店|烧烤|烤肉|火锅))/g,
  ).map(normalizePlaceLabel);
  const aliasMatches = collectPositiveOptionMatches(
    normalized,
    /叫[“”‘’"'「」]?([\u4e00-\u9fa5A-Za-z0-9·]{2,12})[“”‘’"'「」]?/g,
  );

  return compactOptionLabels(uniqueLabels([...knownMatches, ...placeMatches, ...aliasMatches]));
}

function filterDraftOptionsByEvidence(options: string[] | undefined, evidenceText: string): string[] {
  if (!options || options.length === 0) {
    return [];
  }

  const normalizedEvidence = normalizeOptionEvidence(evidenceText);

  return uniqueLabels(options).filter((option) => {
    const normalizedOption = normalizeOptionEvidence(option);
    const optionIndex = normalizedEvidence.indexOf(normalizedOption);

    return optionIndex >= 0 && !isRejectedOptionMention(normalizedEvidence, optionIndex, normalizedOption.length);
  });
}

function normalizeOptionEvidence(text: string): string {
  return text
    .replace(/[，,。！？!?：:；;、\s]/g, "")
    .toLowerCase();
}

function collectPositiveOptionMatches(text: string, pattern: RegExp): string[] {
  return Array.from(text.matchAll(pattern))
    .filter((match) => !isRejectedOptionMention(text, match.index ?? 0, match[1].length))
    .map((match) => match[1]);
}

function isRejectedOptionMention(text: string, start: number, length: number): boolean {
  const beforeText = text.slice(Math.max(0, start - 3), start);
  const afterText = text.slice(start + length, start + length + 10);

  return (
    /(别|不要|不想)$/.test(beforeText) ||
    /太晚|太早|不行|不可以|不合适|赶不上|去不了|算了|不要|不想|太远|太贵|排队.{0,6}算/.test(afterText)
  );
}

function compactOptionLabels(labels: string[]): string[] {
  return labels.filter((label, index) => {
    const normalizedLabel = normalizeOptionEvidence(label);

    return !labels.some((otherLabel, otherIndex) => {
      if (index === otherIndex) {
        return false;
      }

      const normalizedOtherLabel = normalizeOptionEvidence(otherLabel);

      return normalizedOtherLabel.length > normalizedLabel.length && normalizedOtherLabel.includes(normalizedLabel);
    });
  });
}

function normalizePlaceLabel(label: string): string {
  return label.replace(/^(不过|但是|但|其实|还是)/, "").trim();
}

function buildVoteRows(labels: string[], fallback: unknown) {
  const fallbackRows = Array.isArray(fallback)
    ? fallback.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    : [];

  if (labels.length === 0) {
    return fallbackRows;
  }

  const fallbackByLabel = new Map(fallbackRows.map((row) => [String(row.label), row]));

  return labels.map((label, index) => ({
    label,
    votes: Number(fallbackByLabel.get(label)?.votes ?? (index === 0 ? 1 : 0)),
    percent: Number(fallbackByLabel.get(label)?.percent ?? (index === 0 ? 12 : 0)),
  }));
}

function uniqueLabels(labels: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const label of labels) {
    const normalized = label?.trim();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}
