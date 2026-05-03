"use client";

import { Bug, Play, RotateCcw, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sceneText } from "@/lib/sceneMeta";
import type { AppMode, SceneDefinition, SceneManifest } from "@/lib/types/demo";

export function DemoToolbar({
  mode,
  scene,
  sceneManifest,
  debugOpen,
  autoplayRunning,
  onMode,
  onScene,
  onReplay,
  onAutoplay,
  onNext,
  onDebug,
}: {
  mode: AppMode;
  scene: SceneDefinition;
  sceneManifest: SceneManifest;
  debugOpen: boolean;
  autoplayRunning: boolean;
  onMode: (mode: AppMode) => void;
  onScene: (sceneId: SceneManifest["scenes"][number]["id"]) => void;
  onReplay: () => void;
  onAutoplay: () => void;
  onNext: () => void;
  onDebug: () => void;
}) {
  return (
    <aside className="w-full max-w-[390px] space-y-4 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">P0 Demo</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">虾局长</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          帮 QQ 群把“有人想法”推进成“真的成局”。
        </p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500">主路径</p>
        <p className="mt-1 text-sm font-bold text-slate-800">
          {sceneText(scene, "progressLabel", "收口 → 投票 → 成局 → 回忆")}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["guided", "autoplay", "dev"] as AppMode[]).map((candidate) => (
          <button
            className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
              mode === candidate
                ? "bg-qq-blue text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            key={candidate}
            onClick={() => onMode(candidate)}
            type="button"
          >
            {candidate}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={onAutoplay} type="button">
          <Play size={16} />
          {autoplayRunning ? "播放中" : "Auto Play"}
        </Button>
        <Button onClick={onReplay} type="button" variant="outline">
          <RotateCcw size={16} />
          Replay
        </Button>
        <Button onClick={onNext} type="button" variant="outline">
          <SkipForward size={16} />
          下一幕
        </Button>
        <Button onClick={onDebug} type="button" variant={debugOpen ? "warn" : "outline"}>
          <Bug size={16} />
          Debug
        </Button>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500">扩展场景</p>
        <div className="flex flex-wrap gap-2">
          {sceneManifest.scenes.map((item) => (
            <button
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                scene.id === item.id
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
              key={item.id}
              onClick={() => onScene(item.id)}
              type="button"
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
