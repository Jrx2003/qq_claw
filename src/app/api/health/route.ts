import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "xiajuzhang-demo",
    defaultMode: process.env.NEXT_PUBLIC_DEFAULT_EXPERIENCE_MODE ?? "judge",
    llmRuntimeMode: process.env.LLM_RUNTIME_MODE ?? "snapshot",
  });
}
