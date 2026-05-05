"use client";

import { useState } from "react";
import { Bot, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { runClientLlmTask } from "@/lib/scenario-engine/llmRuntime";
import { saveSnapshotFromStudio } from "@/lib/scenario-engine/snapshotStore";
import type { LlmTaskName, RuntimeMode } from "@/lib/types/demo";

const studioTasks: Array<{ taskName: LlmTaskName; label: string }> = [
  { taskName: "intent", label: "意图识别" },
  { taskName: "anonymous", label: "匿名改写" },
  { taskName: "conflict", label: "冲突桥梁" },
  { taskName: "recap", label: "回忆卡" },
  { taskName: "game-recap", label: "游戏回顾" },
];

export function StudioPanel({
  runtimeMode,
  sceneId,
}: {
  runtimeMode: RuntimeMode;
  sceneId: string;
}) {
  const [taskName, setTaskName] = useState<LlmTaskName>("intent");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<unknown>();
  const [error, setError] = useState<string>();

  const runTask = async () => {
    setPending(true);
    setError(undefined);

    try {
      const response = await runClientLlmTask(taskName, { sceneId }, runtimeMode);
      setResult(response);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
    } finally {
      setPending(false);
    }
  };

  const saveSnapshot = async () => {
    if (!result || typeof result !== "object" || !("data" in result)) {
      return;
    }

    await saveSnapshotFromStudio({
      taskName,
      snapshotKey: `${sceneId}/${taskName}_${Date.now()}`,
      data: (result as { data: unknown }).data,
      meta: { source: "studio" },
    });
  };

  return (
    <section className="w-full max-w-[390px] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-blue-600">Live LLM Studio</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">结构化 AI 任务</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
          {runtimeMode}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {studioTasks.map((task) => (
          <button
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              taskName === task.taskName
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
            key={task.taskName}
            onClick={() => setTaskName(task.taskName)}
            type="button"
          >
            {task.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button disabled={pending} onClick={runTask} type="button">
          <Bot size={16} />
          {pending ? "运行中" : "运行任务"}
        </Button>
        <Button disabled={!result} onClick={saveSnapshot} type="button" variant="outline">
          <Save size={16} />
          保存快照
        </Button>
      </div>
      {error ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{error}</p>
      ) : null}
      <pre className="mt-3 max-h-56 overflow-auto rounded-2xl bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">
        {JSON.stringify(result ?? { hint: "选择任务后运行，可切换 mock / snapshot / live。" }, null, 2)}
      </pre>
    </section>
  );
}
