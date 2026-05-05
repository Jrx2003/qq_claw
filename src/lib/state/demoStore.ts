"use client";

import { create } from "zustand";

import {
  advanceStep,
  createInitialDemoState,
  findStep,
  goToStep,
  playNextAutoplayBeat,
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
      autoplayRunning: false,
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
    const nextState = createInitialDemoState(scene, {
      experienceMode,
      runtimeMode: get().runtimeMode,
      triggerPreset: scene.triggerPreset ?? get().triggerPreset,
    });

    set({
      ...nextState,
      currentScene: scene,
      autoplayRunning: false,
    });
  },
  triggerAction: (actionId) => {
    const state = get();
    const scene = loadScene(state.sceneId);
    const nextState = advanceStep(scene, state, actionId);

    set({
      ...nextState,
      autoplayRunning: false,
    });
  },
  replay: () => {
    const state = get();
    const scene = loadScene(state.sceneId);
    const nextState = createInitialDemoState(scene, {
      experienceMode: state.experienceMode,
      runtimeMode: state.runtimeMode,
      triggerPreset: state.triggerPreset,
    });

    set({
      ...nextState,
      autoplayRunning: false,
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
    });
  },
  setDebugOpen: (open) => set({ debugOpen: open }),
  setAutoplayRunning: (running) => {
    set((state) => ({
      autoplayRunning: running,
      experienceMode: state.experienceMode,
      mode: state.mode,
    }));
  },
  autoplayTick: () => {
    const state = get();

    const scene = loadScene(state.sceneId);
    const nextState = playNextAutoplayBeat(scene, state);
    const shouldContinue = nextState.currentBeatId !== state.currentBeatId && nextState.availableActions.length > 0;

    set({
      ...nextState,
      autoplayRunning: shouldContinue,
    });

    return shouldContinue;
  },
}));
