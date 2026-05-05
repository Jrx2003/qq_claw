import { NextResponse } from "next/server";

import { listSnapshots } from "@/lib/llm/snapshot";

export async function GET() {
  return NextResponse.json({ ok: true, snapshots: await listSnapshots() });
}
