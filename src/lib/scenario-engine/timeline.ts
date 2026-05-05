import type { DemoBeat, SceneDefinition } from "@/lib/types/demo";

export type TimelineModel = {
  entryBeatId: string;
  beats: DemoBeat[];
  recordingEndBeatId?: string;
};

export function buildTimeline(scene: SceneDefinition): TimelineModel {
  return {
    entryBeatId: scene.entryBeatId,
    beats: scene.beats,
    recordingEndBeatId: scene.recordingEndBeatId,
  };
}

export function findTimelineBeat(scene: SceneDefinition, beatId: string): DemoBeat {
  const beat = buildTimeline(scene).beats.find((candidate) => candidate.id === beatId);

  if (!beat) {
    throw new Error(`Scene "${scene.id}" does not define beat "${beatId}".`);
  }

  return beat;
}
