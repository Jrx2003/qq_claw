import { z } from "zod";

export const experienceModeSchema = z.enum(["judge", "studio"]);
export type ExperienceMode = z.infer<typeof experienceModeSchema>;

export const runtimeModeSchema = z.enum(["mock", "live", "snapshot"]);
export type RuntimeMode = z.infer<typeof runtimeModeSchema>;

export const triggerPresetSchema = z.enum([
  "conservative",
  "balanced",
  "active_host",
  "conflict_safe",
]);
export type TriggerPreset = z.infer<typeof triggerPresetSchema>;

const legacyModeSchema = z.enum(["guided", "autoplay", "dev"]);

export const appModeSchema = z
  .union([experienceModeSchema, legacyModeSchema])
  .transform((mode): ExperienceMode => {
    if (mode === "guided") {
      return "judge";
    }

    if (mode === "autoplay") {
      return "judge";
    }

    if (mode === "dev") {
      return "studio";
    }

    return mode;
  });
export type AppMode = ExperienceMode;

export const sceneIdSchema = z.enum([
  "dinner_core",
  "anonymous_delegate",
  "conflict_bridge",
  "game_party_hok",
]);
export type SceneId = z.infer<typeof sceneIdSchema>;

export const actorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    side: z.enum(["left", "right", "system"]).optional(),
    avatar: z.string().optional(),
    role: z.string(),
    badge: z.string().optional(),
    traits: z.array(z.string()).optional(),
  })
  .passthrough();
export type Actor = z.infer<typeof actorSchema>;

export const chatMessageSchema = z
  .object({
    id: z.string(),
    actorId: z.string(),
    side: z.enum(["left", "right", "system"]),
    type: z.enum(["text", "card", "typing", "hint"]),
    text: z.string().optional(),
    cardId: z.string().optional(),
    delayMs: z.number().optional(),
    timestamp: z.string().optional(),
  })
  .passthrough();
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const timelinePausePointSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    durationMs: z.number().optional(),
    narrationHint: z.string().optional(),
  })
  .passthrough();
export type TimelinePausePoint = z.infer<typeof timelinePausePointSchema>;

export const llmTaskNameSchema = z.enum([
  "intent",
  "anonymous",
  "conflict",
  "recap",
  "game-recap",
]);
export type LlmTaskName = z.infer<typeof llmTaskNameSchema>;

export const llmTaskSpecSchema = z
  .object({
    taskName: llmTaskNameSchema,
    schemaKey: z.string(),
    promptKey: z.string(),
    snapshotKey: z.string(),
    required: z.boolean().default(false),
  })
  .passthrough();
export type LlmTaskSpec = z.infer<typeof llmTaskSpecSchema>;

export const cardActionBindingSchema = z.object({
  label: z.string(),
  actionId: z.string().optional(),
});
export type CardActionBinding = z.infer<typeof cardActionBindingSchema>;

export const demoActionSchema = z
  .object({
    actionId: z.string(),
    id: z.string().optional(),
    label: z.string(),
    kind: z.enum(["chip", "keyboard", "toolbar", "scene-switch"]),
    nextBeatId: z.string(),
    nextStepId: z.string().optional(),
    autoplayPriority: z.number().optional(),
    analyticsName: z.string().optional(),
  })
  .passthrough()
  .transform((action) => ({
    ...action,
    id: action.id ?? action.actionId,
    nextStepId: action.nextStepId ?? action.nextBeatId,
  }));
export type DemoAction = z.output<typeof demoActionSchema>;

export const demoBeatSchema = z
  .object({
    id: z.string(),
    description: z.string(),
    act: z.string().optional(),
    messages: z.array(chatMessageSchema).optional(),
    autoMessages: z.array(chatMessageSchema).optional(),
    availableActions: z.array(demoActionSchema).optional(),
    nextAutoBeatId: z.string().optional(),
    nextAutoStepId: z.string().optional(),
    autoAdvanceAfterMs: z.number().optional(),
    minStayMs: z.number().optional(),
    designIntent: z.string(),
    painPoint: z.string(),
    expectedEffect: z.string(),
    pausePoint: timelinePausePointSchema.optional(),
    llmTask: llmTaskSpecSchema.optional(),
    setFlags: z.record(z.boolean()).optional(),
  })
  .passthrough()
  .transform((beat) => ({
    ...beat,
    messages: beat.messages ?? beat.autoMessages ?? [],
    nextAutoBeatId: beat.nextAutoBeatId ?? beat.nextAutoStepId,
  }));
export type DemoBeat = z.output<typeof demoBeatSchema>;
export type DemoStep = DemoBeat;

export const demoCardSchema = z
  .object({
    id: z.string(),
    cardType: z.enum([
      "plan",
      "vote",
      "confirm",
      "memory",
      "anonymous",
      "conflict",
      "game-party",
      "game-memory",
    ]),
    title: z.string(),
    status: z.string().optional(),
    buttons: z.array(cardActionBindingSchema).optional(),
  })
  .passthrough();
export type DemoCard = z.infer<typeof demoCardSchema>;

export const sceneDefinitionSchema = z
  .object({
    id: sceneIdSchema,
    title: z.string(),
    modeDefault: appModeSchema.optional().default("judge"),
    runtimeDefault: runtimeModeSchema.optional().default("snapshot"),
    triggerPreset: triggerPresetSchema.optional().default("balanced"),
    entryBeatId: z.string(),
    entryStepId: z.string().optional(),
    beats: z.array(demoBeatSchema),
    steps: z.array(demoBeatSchema).optional(),
  })
  .passthrough()
  .transform((scene) => ({
    ...scene,
    entryStepId: scene.entryStepId ?? scene.entryBeatId,
    steps: scene.steps ?? scene.beats,
  }));
export type SceneDefinition = z.output<typeof sceneDefinitionSchema>;

export const sceneManifestSchema = z.object({
  defaultScene: sceneIdSchema,
  scenes: z.array(
    z.object({
      id: sceneIdSchema,
      title: z.string(),
      priority: z.string(),
      path: z.string(),
    }),
  ),
});
export type SceneManifest = z.infer<typeof sceneManifestSchema>;

export type SnapshotMeta = {
  taskName: LlmTaskName;
  snapshotKey: string;
  createdAt: string;
  provider?: string;
  model?: string;
};

export type DemoState = {
  experienceMode: ExperienceMode;
  runtimeMode: RuntimeMode;
  triggerPreset: TriggerPreset;
  mode: AppMode;
  sceneId: SceneId;
  currentBeatId: string;
  currentStepId: string;
  playedBeatIds: string[];
  playedStepIds: string[];
  messages: ChatMessage[];
  activeCards: DemoCard[];
  availableActions: DemoAction[];
  flags: Record<string, boolean>;
  lastLlmTask?: LlmTaskSpec;
};
