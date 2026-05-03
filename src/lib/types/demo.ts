import { z } from "zod";

export const appModeSchema = z.enum(["guided", "autoplay", "dev"]);
export type AppMode = z.infer<typeof appModeSchema>;

export const sceneIdSchema = z.enum([
  "dinner_core",
  "anonymous_proposal",
  "conflict_bridge",
  "game_party",
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

export const demoActionSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    kind: z.enum(["chip", "keyboard", "toolbar", "scene-switch"]),
    nextStepId: z.string(),
    analyticsName: z.string().optional(),
  })
  .passthrough();
export type DemoAction = z.infer<typeof demoActionSchema>;

export const demoStepSchema = z
  .object({
    id: z.string(),
    description: z.string(),
    autoMessages: z.array(chatMessageSchema).optional(),
    availableActions: z.array(demoActionSchema).optional(),
    nextAutoStepId: z.string().optional(),
    autoAdvanceAfterMs: z.number().optional(),
    setFlags: z.record(z.boolean()).optional(),
  })
  .passthrough();
export type DemoStep = z.infer<typeof demoStepSchema>;

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
    ]),
    title: z.string(),
    status: z.string().optional(),
  })
  .passthrough();
export type DemoCard = z.infer<typeof demoCardSchema>;

export const sceneDefinitionSchema = z
  .object({
    id: sceneIdSchema,
    title: z.string(),
    modeDefault: appModeSchema.optional(),
    entryStepId: z.string(),
    steps: z.array(demoStepSchema),
  })
  .passthrough();
export type SceneDefinition = z.infer<typeof sceneDefinitionSchema>;

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

export type DemoState = {
  mode: AppMode;
  sceneId: SceneId;
  currentStepId: string;
  playedStepIds: string[];
  messages: ChatMessage[];
  activeCards: DemoCard[];
  availableActions: DemoAction[];
  flags: Record<string, boolean>;
};
