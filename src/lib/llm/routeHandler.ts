import { NextResponse } from "next/server";

import { callLiveStructuredLlm } from "@/lib/llm/client";
import { getFallbackForTask } from "@/lib/llm/fallback";
import { llmTaskConfigByName } from "@/lib/llm/mapping";
import { readSnapshot } from "@/lib/llm/snapshot";
import { validateLlmTaskData } from "@/lib/llm/validators";
import { runtimeModeSchema, type LlmTaskName, type RuntimeMode } from "@/lib/types/demo";

export async function handleLlmTaskRoute(taskName: LlmTaskName, request: Request) {
  const startedAt = Date.now();
  const body = await safeJson(request);
  const requestedMode = runtimeModeSchema.safeParse(body?.mode);
  const envMode = runtimeModeSchema.safeParse(process.env.LLM_RUNTIME_MODE);
  const mode: RuntimeMode = requestedMode.success
    ? requestedMode.data
    : envMode.success
      ? envMode.data
      : "snapshot";
  const config = llmTaskConfigByName[taskName];
  const input = body?.input ?? body ?? {};

  if (mode === "live" && process.env.ENABLE_LIVE_LLM !== "false") {
    try {
      const live = await callLiveStructuredLlm({ config, input });
      const data = validateLlmTaskData(taskName, live.data);

      return NextResponse.json({
        ok: true,
        mode,
        schemaVersion: "1.0.0",
        data,
        meta: {
          ...live.meta,
          fallbackUsed: false,
        },
      });
    } catch (error) {
      const fallback = await resolveFallback(taskName, config.fallbackSnapshotKey);
      return NextResponse.json({
        ok: true,
        mode: "snapshot",
        schemaVersion: "1.0.0",
        data: fallback.data,
        meta: {
          latencyMs: Date.now() - startedAt,
          fallbackUsed: true,
          fallbackReason: error instanceof Error ? error.message : "unknown",
          snapshotKey: fallback.snapshotKey,
        },
      });
    }
  }

  const fallback = await resolveFallback(taskName, config.fallbackSnapshotKey, mode);
  return NextResponse.json({
    ok: true,
    mode: fallback.mode,
    schemaVersion: "1.0.0",
    data: fallback.data,
    meta: {
      latencyMs: Date.now() - startedAt,
      fallbackUsed: fallback.mode !== mode,
      snapshotKey: fallback.snapshotKey,
    },
  });
}

async function resolveFallback(
  taskName: LlmTaskName,
  snapshotKey: string,
  requestedMode: RuntimeMode = "snapshot",
) {
  if (requestedMode !== "mock") {
    const snapshot = await readSnapshot(snapshotKey);
    if (snapshot && typeof snapshot === "object" && "data" in snapshot) {
      return {
        mode: "snapshot" as const,
        snapshotKey,
        data: validateLlmTaskData(taskName, (snapshot as { data: unknown }).data),
      };
    }

    if (snapshot) {
      return {
        mode: "snapshot" as const,
        snapshotKey,
        data: validateLlmTaskData(taskName, snapshot),
      };
    }
  }

  return {
    mode: "mock" as const,
    snapshotKey,
    data: getFallbackForTask(taskName),
  };
}

async function safeJson(request: Request): Promise<Record<string, unknown> | undefined> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
