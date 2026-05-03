import type { SceneDefinition } from "@/lib/types/demo";

export function sceneText(scene: SceneDefinition, key: string, fallback = "") {
  const value = scene[key];
  return typeof value === "string" ? value : fallback;
}

export function sceneTextArray(scene: SceneDefinition, key: string, fallback: string[] = []) {
  const value = scene[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : fallback;
}

export function sceneContextLabel(scene: SceneDefinition) {
  const groupName = sceneText(scene, "groupName");

  if (!groupName) {
    return scene.title;
  }

  return `${groupName} · ${scene.title}`;
}
