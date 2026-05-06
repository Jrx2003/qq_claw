"use client";

import { BrainCircuit, MessageSquareText, Sparkles, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { StudioConversation } from "@/lib/llm/schemas";
import type { Actor, RuntimeMode, SceneDefinition } from "@/lib/types/demo";

const promptStarters = [
  "周五晚上有人想吃烤肉吗？我不想自己统计",
  "我想匿名问问大家周末要不要出去玩",
  "他们两个因为改时间有点吵起来了",
  "王者五排缺一个射手，21:30 能开吗",
];

export function StudioPanel({
  runtimeMode,
  scene,
  actors,
  pending,
  lastResponse,
  error,
  onPrompt,
}: {
  runtimeMode: RuntimeMode;
  scene: SceneDefinition;
  actors: Actor[];
  pending: boolean;
  lastResponse?: StudioConversation;
  error?: string;
  onPrompt: (text: string) => void;
}) {
  const npcActors = actors.filter((actor) => actor.role === "npc").slice(0, 5);

  return (
    <section className="w-full max-w-[390px] space-y-3 rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-blue-600">Live LLM Studio</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">自由群聊沙盒</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          {runtimeMode}
        </span>
      </div>

      <div className="rounded-2xl bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <MessageSquareText size={14} />
          群聊背景
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-750">
          当前在「{scene.title}」里自由输入。LLM 会让群成员继续接话，虾局长负责识别组局、匿名、冲突、游戏和回忆意图，并在合适时给出功能建议。
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <UsersRound size={14} />
          NPC 人格
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {npcActors.map((actor) => (
            <span
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-650"
              key={actor.id}
            >
              {actor.name} · {(actor.traits ?? [actor.role]).join("/")}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-blue-50 p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
          <BrainCircuit size={14} />
          最近识别
        </div>
        <p className="mt-2 text-sm leading-6 text-blue-950">
          {lastResponse
            ? `${intentLabel(lastResponse.intent_type)} · ${lastResponse.function_suggestion?.label ?? "继续观察群聊"}`
            : "输入一句群聊消息后，结果会直接进入左侧聊天流。"}
        </p>
        {lastResponse?.function_suggestion ? (
          <p className="mt-1 text-xs leading-5 text-blue-700">{lastResponse.function_suggestion.reason}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Sparkles size={14} />
          可直接试的输入
        </div>
        <div className="grid gap-2">
          {promptStarters.map((prompt) => (
            <Button
              className="h-auto justify-start rounded-xl px-3 py-2 text-left text-xs leading-5"
              disabled={pending}
              key={prompt}
              onClick={() => onPrompt(prompt)}
              type="button"
              variant="outline"
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{error}</p>
      ) : null}
    </section>
  );
}

function intentLabel(intentType: StudioConversation["intent_type"]) {
  const labels: Record<StudioConversation["intent_type"], string> = {
    plan: "组局收口",
    anonymous: "匿名倡议",
    conflict: "冲突桥梁",
    game_party: "游戏组队",
    recap: "回忆沉淀",
    none: "继续观察",
  };

  return labels[intentType];
}
