"use client";

import { sceneText } from "@/lib/sceneMeta";
import type { DemoCard, DemoState, SceneDefinition } from "@/lib/types/demo";

export function DevPanel({
  scene,
  state,
  cards,
  onJump,
}: {
  scene: SceneDefinition;
  state: DemoState;
  cards: Map<string, DemoCard>;
  onJump: (beatId: string) => void;
}) {
  return (
    <section className="w-full max-w-[390px] rounded-3xl border border-amber-200 bg-amber-50/95 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">debug</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">{sceneText(scene, "groupName", scene.title)}</h3>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-amber-700">
          {state.currentBeatId}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {scene.beats.map((beat) => (
          <button
            className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold ${
              state.currentBeatId === beat.id
                ? "border-amber-500 bg-white text-amber-700"
                : "border-amber-100 bg-white/70 text-slate-600"
            }`}
            key={beat.id}
            onClick={() => onJump(beat.id)}
            type="button"
          >
            {beat.description}
          </button>
        ))}
      </div>
      <pre className="mt-4 max-h-56 overflow-auto rounded-2xl bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">
        {JSON.stringify(
          {
            mode: state.mode,
            experienceMode: state.experienceMode,
            runtimeMode: state.runtimeMode,
            triggerPreset: state.triggerPreset,
            sceneId: state.sceneId,
            currentBeatId: state.currentBeatId,
            playedBeatIds: state.playedBeatIds,
            messages: state.messages.length,
            activeCards: state.activeCards.map((card) => cards.get(card.id)?.cardType ?? card.cardType),
            availableActions: state.availableActions.map((action) => action.actionId),
            recording: state.recording,
            lastLlmTask: state.lastLlmTask,
            flags: state.flags,
          },
          null,
          2,
        )}
      </pre>
    </section>
  );
}
