import { promises as fs } from "fs";
import path from "path";

import type { LlmTaskName } from "@/lib/types/demo";

const snapshotsRoot = path.join(process.cwd(), "fixtures", "snapshots");

export function snapshotPath(snapshotKey: string): string {
  const normalized = snapshotKey.replace(/^\/*/, "").replace(/\.\./g, "");
  return path.join(snapshotsRoot, `${normalized}.json`);
}

export async function readSnapshot(snapshotKey: string): Promise<unknown | undefined> {
  try {
    const raw = await fs.readFile(snapshotPath(snapshotKey), "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export async function writeSnapshot({
  taskName,
  snapshotKey,
  data,
  meta,
}: {
  taskName: LlmTaskName;
  snapshotKey: string;
  data: unknown;
  meta?: Record<string, unknown>;
}) {
  const filePath = snapshotPath(snapshotKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    `${JSON.stringify(
      {
        taskName,
        snapshotKey,
        data,
        meta: {
          ...meta,
          savedAt: new Date().toISOString(),
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return filePath;
}

export async function listSnapshots() {
  const results: string[] = [];

  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith(".json")) {
        results.push(path.relative(snapshotsRoot, fullPath).replace(/\.json$/, ""));
      }
    }
  }

  await walk(snapshotsRoot);
  return results.sort();
}
