import type { LlmTaskName, RuntimeMode } from "@/lib/types/demo";

export type ClientLlmResult<T> = {
  ok: boolean;
  mode: RuntimeMode;
  data: T;
  meta?: {
    latencyMs?: number;
    fallbackUsed?: boolean;
    snapshotKey?: string;
    provider?: string;
    model?: string;
  };
};

export async function runClientLlmTask<T>(
  taskName: LlmTaskName,
  body: unknown,
  runtimeMode: RuntimeMode,
): Promise<ClientLlmResult<T>> {
  const endpointByTask: Record<LlmTaskName, string> = {
    intent: "/api/llm/intent",
    anonymous: "/api/llm/anonymous",
    conflict: "/api/llm/conflict",
    recap: "/api/llm/recap",
    "game-recap": "/api/llm/game-recap",
    "studio-conversation": "/api/llm/studio-conversation",
  };

  const response = await fetch(endpointByTask[taskName], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode: runtimeMode, input: body }),
  });

  if (!response.ok) {
    throw new Error(`LLM task "${taskName}" failed with HTTP ${response.status}.`);
  }

  return response.json() as Promise<ClientLlmResult<T>>;
}
