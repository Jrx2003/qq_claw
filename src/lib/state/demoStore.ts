"use client";

import { create } from "zustand";

import {
  advanceStep,
  createRecordingState,
  createInitialDemoState,
  findStep,
  goToStep,
  playNextTimelineBeat,
} from "@/lib/scenario-engine/engine";
import {
  loadActorMap,
  loadCardMap,
  loadScene,
  loadSceneManifest,
} from "@/lib/fixtures/loader";
import type {
  Actor,
  AppMode,
  DemoCard,
  DemoState,
  RuntimeMode,
  SceneDefinition,
  SceneId,
  SceneManifest,
  TriggerPreset,
} from "@/lib/types/demo";

type DemoStore = DemoState & {
  sceneManifest: SceneManifest;
  currentScene: SceneDefinition;
  actors: Map<string, Actor>;
  cards: Map<string, DemoCard>;
  debugOpen: boolean;
  autoplayRunning: boolean;
  switchMode: (mode: AppMode) => void;
  switchRuntimeMode: (mode: RuntimeMode) => void;
  switchTriggerPreset: (preset: TriggerPreset) => void;
  switchScene: (sceneId: SceneId, mode?: AppMode) => void;
  triggerAction: (actionId: string) => void;
  replay: () => void;
  jumpToStep: (stepId: string) => void;
  setDebugOpen: (open: boolean) => void;
  setAutoplayRunning: (running: boolean) => void;
  resumeRecording: () => void;
  autoplayTick: () => boolean;
};

const initialScene = loadScene("dinner_core");
const initialState = createInitialDemoState(initialScene, {
  experienceMode: "judge",
  runtimeMode: "snapshot",
});

export const useDemoStore = create<DemoStore>((set, get) => ({
  ...initialState,
  sceneManifest: loadSceneManifest(),
  currentScene: initialScene,
  actors: loadActorMap(),
  cards: loadCardMap(),
  debugOpen: false,
  autoplayRunning: false,
  switchMode: (mode) => {
    set((state) => ({
      experienceMode: mode,
      mode,
      debugOpen: mode === "studio" ? true : state.debugOpen,
      autoplayRunning: mode === "recording",
      recording: {
        ...state.recording,
        running: mode === "recording",
        paused: false,
        pausePoint: undefined,
      },
    }));
  },
  switchRuntimeMode: (runtimeMode) => {
    set({ runtimeMode });
  },
  switchTriggerPreset: (triggerPreset) => {
    set({ triggerPreset });
  },
  switchScene: (sceneId, mode) => {
    const scene = loadScene(sceneId);
    const experienceMode = mode ?? get().experienceMode;
    const nextState =
      experienceMode === "recording"
        ? createRecordingState(scene)
        : createInitialDemoState(scene, {
            experienceMode,
            runtimeMode: get().runtimeMode,
            triggerPreset: scene.triggerPreset ?? get().triggerPreset,
          });

    set({
      ...nextState,
      currentScene: scene,
      autoplayRunning: experienceMode === "recording",
    });
  },
  triggerAction: (actionId) => {
    const state = get();
    const scene = loadScene(state.sceneId);
    const nextState = advanceStep(scene, state, actionId);

    set({
      ...nextState,
      autoplayRunning: false,
      recording: {
        ...nextState.recording,
        running: false,
        paused: false,
      },
    });
  },
  replay: () => {
    const state = get();
    const scene = loadScene(state.sceneId);
    const nextState =
      state.experienceMode === "recording"
        ? createRecordingState(scene)
        : createInitialDemoState(scene, {
            experienceMode: state.experienceMode,
            runtimeMode: state.runtimeMode,
            triggerPreset: state.triggerPreset,
          });

    set({
      ...nextState,
      autoplayRunning: state.experienceMode === "recording",
    });
  },
  jumpToStep: (stepId) => {
    const state = get();
    const scene = loadScene(state.sceneId);
    const nextStep = findStep(scene, stepId);
    const nextState =
      nextStep.id === scene.entryStepId
        ? createInitialDemoState(scene, state.mode)
        : goToStep(scene, state, stepId);

    set({
      ...nextState,
      autoplayRunning: false,
      recording: {
        ...nextState.recording,
        running: false,
        paused: false,
      },
    });
  },
  setDebugOpen: (open) => set({ debugOpen: open }),
  setAutoplayRunning: (running) => {
    set((state) => ({
      autoplayRunning: running,
      experienceMode: running ? "recording" : state.experienceMode,
      mode: running ? "recording" : state.mode,
      recording: {
        ...state.recording,
        running,
        paused: false,
        pausePoint: undefined,
      },
    }));
  },
  resumeRecording: () => {
    set((state) => ({
      autoplayRunning: true,
      recording: {
        ...state.recording,
        running: true,
        paused: false,
        pausePoint: undefined,
      },
    }));
  },
  autoplayTick: () => {
    const state = get();

    if (state.recording.paused) {
      set({ autoplayRunning: false });
      return false;
    }

    const scene = loadScene(state.sceneId);
    const nextState = playNextTimelineBeat(scene, state);
    const shouldContinue = nextState.recording.running;

    set({
      ...nextState,
      mode: "recording",
      experienceMode: "recording",
      autoplayRunning: shouldContinue,
    });

    return shouldContinue;
  },
}));
