import type { DemoAction } from "@/lib/types/demo";

export function selectTimelineAction(actions: DemoAction[]): DemoAction | undefined {
  return [...actions]
    .filter((action) => action.kind !== "scene-switch")
    .sort((left, right) => (left.autoplayPriority ?? 100) - (right.autoplayPriority ?? 100))[0];
}
