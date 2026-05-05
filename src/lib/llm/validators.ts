import { llmTaskSchemas, type LlmTaskData } from "@/lib/llm/schemas";
import type { LlmTaskName } from "@/lib/types/demo";

export function validateLlmTaskData<T extends LlmTaskName>(
  taskName: T,
  data: unknown,
): LlmTaskData<T> {
  return llmTaskSchemas[taskName].parse(data) as LlmTaskData<T>;
}

export function safeValidateLlmTaskData<T extends LlmTaskName>(taskName: T, data: unknown) {
  return llmTaskSchemas[taskName].safeParse(data);
}
