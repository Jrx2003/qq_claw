import { z } from "zod";

import type { LlmTaskName } from "@/lib/types/demo";

export const intentExtractionSchema = z.object({
  should_intervene: z.boolean(),
  intent_type: z.enum(["plan", "anonymous", "conflict", "game_party", "none"]),
  confidence: z.number().min(0).max(1),
  title: z.string(),
  suggested_trigger: z.enum([
    "suggestion_chip",
    "explicit_at",
    "anonymous_delegate",
    "auto_host",
    "conflict_bridge",
    "none",
  ]),
  summary: z.string(),
  time_candidates: z.array(z.string()),
  location_candidates: z.array(z.string()),
  participants: z.array(
    z.object({
      name: z.string(),
      status: z.enum([
        "positive",
        "neutral",
        "uncertain",
        "silent",
        "conflict_a",
        "conflict_b",
      ]),
    }),
  ),
  missing_info: z.array(z.string()),
  suggested_bot_copy: z.string(),
  chips: z.array(z.string()),
});

export const anonymousProposalSchema = z.object({
  title: z.string(),
  group_message: z.string(),
  tone: z.enum(["light", "warm", "neutral", "gamey"]),
  attach_vote: z.boolean(),
  vote_options: z.array(z.string()),
  follow_up_chips: z.array(z.string()),
});

export const conflictBridgeSchema = z.object({
  intensity: z.enum(["low", "medium", "high"]),
  side_a_need: z.string(),
  side_b_need: z.string(),
  common_ground: z.string(),
  public_bridge_message: z.string(),
  actions: z.array(z.string()),
});

export const recapCardSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  highlight_quote: z.string(),
  keywords: z.array(z.string()),
  next_invite_copy: z.string(),
});

export const gameRecapSchema = z.object({
  game: z.string(),
  title: z.string(),
  mvp: z.string(),
  highlight: z.string(),
  keywords: z.array(z.string()),
  next_invite_copy: z.string(),
});

export const studioConversationSchema = z.object({
  intent_type: z.enum(["plan", "anonymous", "conflict", "game_party", "recap", "none"]),
  stage: z.enum(["listen", "suggest", "execute", "follow_up"]),
  bot_message: z.string(),
  npc_messages: z
    .array(
      z.object({
        actorId: z.enum(["akai", "xiaoyu", "laozhou", "dazhuang", "naicha", "xiaoma", "aze", "ayuan"]),
        text: z.string(),
      }),
    )
    .min(1)
    .max(4),
  function_suggestion: z
    .object({
      label: z.string(),
      task: z.enum(["intent", "anonymous", "conflict", "recap", "game-recap"]),
      reason: z.string(),
    })
    .optional(),
  chips: z.array(z.string()).min(2).max(4),
});

export const llmTaskSchemas = {
  intent: intentExtractionSchema,
  anonymous: anonymousProposalSchema,
  conflict: conflictBridgeSchema,
  recap: recapCardSchema,
  "game-recap": gameRecapSchema,
  "studio-conversation": studioConversationSchema,
} satisfies Record<LlmTaskName, z.ZodTypeAny>;

export type IntentExtraction = z.infer<typeof intentExtractionSchema>;
export type AnonymousProposal = z.infer<typeof anonymousProposalSchema>;
export type ConflictBridge = z.infer<typeof conflictBridgeSchema>;
export type RecapCard = z.infer<typeof recapCardSchema>;
export type GameRecap = z.infer<typeof gameRecapSchema>;
export type StudioConversation = z.infer<typeof studioConversationSchema>;

export type LlmTaskData<T extends LlmTaskName> = z.infer<(typeof llmTaskSchemas)[T]>;
