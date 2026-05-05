import anonymousSchema from "../../../schemas/anonymous_proposal.schema.json";
import conflictSchema from "../../../schemas/conflict_bridge.schema.json";
import gameRecapSchema from "../../../schemas/game_recap.schema.json";
import intentSchema from "../../../schemas/intent_extraction.schema.json";
import recapSchema from "../../../schemas/recap_card.schema.json";

import type { LlmTaskName } from "@/lib/types/demo";

export type LlmTaskConfig = {
  taskName: LlmTaskName;
  route: string;
  promptFile: string;
  schema: unknown;
  fallbackSnapshotKey: string;
};

export const llmTaskConfigByName: Record<LlmTaskName, LlmTaskConfig> = {
  intent: {
    taskName: "intent",
    route: "/api/llm/intent",
    promptFile: "prompts/live_llm/intent_extractor.md",
    schema: intentSchema,
    fallbackSnapshotKey: "dinner_core/intent_seed",
  },
  anonymous: {
    taskName: "anonymous",
    route: "/api/llm/anonymous",
    promptFile: "prompts/live_llm/anonymous_advocate.md",
    schema: anonymousSchema,
    fallbackSnapshotKey: "anonymous/weekend_delegate",
  },
  conflict: {
    taskName: "conflict",
    route: "/api/llm/conflict",
    promptFile: "prompts/live_llm/conflict_bridge.md",
    schema: conflictSchema,
    fallbackSnapshotKey: "conflict/bridge_seed",
  },
  recap: {
    taskName: "recap",
    route: "/api/llm/recap",
    promptFile: "prompts/live_llm/recap_generator.md",
    schema: recapSchema,
    fallbackSnapshotKey: "dinner_core/recap_card",
  },
  "game-recap": {
    taskName: "game-recap",
    route: "/api/llm/game-recap",
    promptFile: "prompts/live_llm/game_party_recap.md",
    schema: gameRecapSchema,
    fallbackSnapshotKey: "game/hok_recap",
  },
};
