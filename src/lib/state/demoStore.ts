"use client";

import { create } from "zustand";

import {
  advanceStep,
  createInitialDemoState,
  findStep,
  goToStep,
  selectAutoplayAction,
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
  SceneDefinition,
  SceneId,
  SceneManifest,
} from "@/lib/types/demo";

type DemoStore = DemoState & {
  sceneManifest: SceneManifest;
  currentScene: SceneDefinition;
  actors: Map<string, Actor>;
  cards: Map<string, DemoCard>;
  debugOpen: boolean;
  autoplayRunning: boolean;
  switchMode: (mode: AppMode) => void;
  switchScene: (sceneId: SceneId, mode?: AppMode) => void;
  triggerAction: (actionId: string) => void;
  replay: () => void;
  jumpToStep: (stepId: string) => void;
  setDebugOpen: (open: boolean) => void;
  setAutoplayRunning: (running: boolean) => void;
  autoplayTick: () => boolean;
};

const initialScene = loadScene("dinner_core");
const initialState = createInitialDemoState(initialScene, "guided");

export const useDemoStore = create<DemoStore>((set, get) => ({
  ...initialState,
  sceneManifest: loadSceneManifest(),
  currentScene: initialScene,
  actors: loadActorMap(),
  cards: loadCardMap(),
  debugOpen: false,
  autoplayRunning: false,
  switchMode: (mode) => {
    set({ mode, autoplayRunning: mode === "autoplay" });
  },
  switchScene: (sceneId, mode) => {
    const scene = loadScene(sceneId);
    const nextState = createInitialDemoState(scene, mode ?? get().mode);

    set({
      ...nextState,
      currentScene: scene,
      autoplayRunning: (mode ?? get().mode) === "autoplay",
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
    const nextState = createInitialDemoState(scene, state.mode);

    set({
      ...nextState,
      autoplayRunning: state.mode === "autoplay",
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
    set({
      autoplayRunning: running,
      mode: running ? "autoplay" : get().mode,
    });
  },
  autoplayTick: () => {
    const state = get();

    if (state.currentStepId === "scene_e_memory") {
      set({ autoplayRunning: false });
      return false;
    }

    const action = selectAutoplayAction(state.availableActions);

    if (!action) {
      set({ autoplayRunning: false });
      return false;
    }

    const scene = loadScene(state.sceneId);
    const nextState = advanceStep(scene, state, action.id);
    const shouldContinue = nextState.currentStepId !== "scene_e_memory";

    set({
      ...nextState,
      mode: "autoplay",
      autoplayRunning: shouldContinue,
    });

    return shouldContinue;
  },
}));
