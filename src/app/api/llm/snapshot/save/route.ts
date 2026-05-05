import { NextResponse } from "next/server";

import { writeSnapshot } from "@/lib/llm/snapshot";
import { validateLlmTaskData } from "@/lib/llm/validators";
import { llmTaskNameSchema } from "@/lib/types/demo";

export async function POST(request: Request) {
  if (process.env.ENABLE_SNAPSHOT_SAVE === "false") {
    return NextResponse.json({ ok: false, error: "Snapshot save disabled." }, { status: 403 });
  }

  const body = (await request.json()) as {
    taskName?: unknown;
    snapshotKey?: unknown;
    data?: unknown;
    meta?: Record<string, unknown>;
  };
  const taskName = llmTaskNameSchema.parse(body.taskName);

  if (typeof body.snapshotKey !== "string") {
    return NextResponse.json({ ok: false, error: "snapshotKey is required." }, { status: 400 });
  }

  const data = validateLlmTaskData(taskName, body.data);
  const path = await writeSnapshot({
    taskName,
    snapshotKey: body.snapshotKey,
    data,
    meta: body.meta,
  });

  return NextResponse.json({ ok: true, path });
}
