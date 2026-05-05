import type { LlmTaskName } from "@/lib/types/demo";

export type SnapshotSaveRequest = {
  taskName: LlmTaskName;
  snapshotKey: string;
  data: unknown;
  meta?: Record<string, unknown>;
};

export async function saveSnapshotFromStudio(request: SnapshotSaveRequest) {
  const response = await fetch("/api/llm/snapshot/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Snapshot save failed with HTTP ${response.status}.`);
  }

  return response.json() as Promise<{ ok: boolean; path?: string }>;
}
