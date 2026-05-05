"use client";

import { DevPanel } from "@/components/demo/DevPanel";
import type { DemoCard, DemoState, SceneDefinition } from "@/lib/types/demo";

export function StateInspector({
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
  return <DevPanel cards={cards} onJump={onJump} scene={scene} state={state} />;
}
