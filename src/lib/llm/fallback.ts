import anonymousFallback from "../../../fixtures/llm_examples/anonymous_response_sample.json";
import conflictFallback from "../../../fixtures/llm_examples/conflict_response_sample.json";
import gameRecapFallback from "../../../fixtures/llm_examples/game_recap_response_sample.json";
import intentFallback from "../../../fixtures/llm_examples/plan_response_sample.json";
import recapFallback from "../../../fixtures/llm_examples/recap_response_sample.json";

import { validateLlmTaskData } from "@/lib/llm/validators";
import type { LlmTaskData } from "@/lib/llm/schemas";
import type { LlmTaskName } from "@/lib/types/demo";

const fallbackByTask = {
  intent: {
    ...intentFallback,
    chips: [
      "@虾局长 周五要不要去吃烤肉，帮我收口这局",
      ...intentFallback.chips,
    ],
  },
  anonymous: anonymousFallback,
  conflict: conflictFallback,
  recap: recapFallback,
  "game-recap": gameRecapFallback,
} satisfies Record<LlmTaskName, unknown>;

export function getFallbackForTask<T extends LlmTaskName>(taskName: T): LlmTaskData<T> {
  return validateLlmTaskData(taskName, fallbackByTask[taskName]);
}
