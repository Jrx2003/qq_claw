"use client";

import type { SceneId, SceneManifest } from "@/lib/types/demo";

export function SceneLauncher({
  sceneManifest,
  activeSceneId,
  onScene,
}: {
  sceneManifest: SceneManifest;
  activeSceneId: SceneId;
  onScene: (sceneId: SceneId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sceneManifest.scenes.map((scene) => (
        <button
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            activeSceneId === scene.id
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600"
          }`}
          key={scene.id}
          onClick={() => onScene(scene.id)}
          type="button"
        >
          {scene.title}
        </button>
      ))}
    </div>
  );
}
