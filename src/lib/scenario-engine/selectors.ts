import type { DemoAction, DemoState } from "@/lib/types/demo";

export function selectPrimaryAction(state: DemoState): DemoAction | undefined {
  return state.availableActions.find((action) => action.kind !== "scene-switch");
}

export function selectSceneSwitchActions(state: DemoState): DemoAction[] {
  return state.availableActions.filter((action) => action.kind === "scene-switch");
}
