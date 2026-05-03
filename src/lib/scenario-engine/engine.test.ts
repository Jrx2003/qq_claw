import { describe, expect, it } from "vitest";

import {
  advanceStep,
  createInitialDemoState,
  runAutoplayPath,
} from "./engine";
import { loadActorMap, loadCardMap, loadScene } from "../fixtures/loader";

describe("dinner_core fixture contract", () => {
  it("resolves every actor, card, entry step, and branch used by the P0 scene", () => {
    const scene = loadScene("dinner_core");
    const actors = loadActorMap();
    const cards = loadCardMap();
    const stepIds = new Set(scene.steps.map((step) => step.id));

    expect(stepIds.has(scene.entryStepId)).toBe(true);

    for (const step of scene.steps) {
      for (const message of step.autoMessages ?? []) {
        expect(actors.has(message.actorId)).toBe(true);

        if (message.type === "card") {
          expect(message.cardId).toBeTruthy();
          expect(cards.has(message.cardId ?? "")).toBe(true);
        }
      }

      for (const action of step.availableActions ?? []) {
        expect(stepIds.has(action.nextStepId)).toBe(true);
      }
    }
  });
});

describe("demo engine", () => {
  it("starts guided mode from fixture seed messages and first-step actions", () => {
    const scene = loadScene("dinner_core");
    const state = createInitialDemoState(scene, "guided");

    expect(state.mode).toBe("guided");
    expect(state.currentStepId).toBe("scene_a_chat_seed");
    expect(state.messages.map((message) => message.id)).toEqual([
      "m1",
      "m2",
      "m3",
      "m4",
      "m5",
    ]);
    expect(state.availableActions.map((action) => action.label)).toContain(
      "@虾局长 周五要不要去吃烤肉，帮我收口这局",
    );
  });

  it("advances the guided main path through plan, vote, confirm, and memory cards", () => {
    const scene = loadScene("dinner_core");
    const cards = loadCardMap();
    let state = createInitialDemoState(scene, "guided");

    for (const actionId of [
      "a1",
      "b_action_1",
      "c_action_1",
      "d_action_1",
    ]) {
      state = advanceStep(scene, state, actionId);
    }

    const cardTypes = state.messages
      .filter((message) => message.type === "card")
      .map((message) => cards.get(message.cardId ?? "")?.cardType);

    expect(cardTypes).toEqual(["plan", "vote", "confirm", "memory"]);
    expect(state.currentStepId).toBe("scene_e_memory");
    expect(state.availableActions.map((action) => action.label)).toContain(
      "Replay",
    );
  });

  it("autoplay follows fixture actions to the memory card without free text input", () => {
    const scene = loadScene("dinner_core");
    const cards = loadCardMap();

    const state = runAutoplayPath(scene);

    expect(state.mode).toBe("autoplay");
    expect(state.currentStepId).toBe("scene_e_memory");
    expect(
      state.messages.some(
        (message) =>
          message.type === "card" &&
          cards.get(message.cardId ?? "")?.cardType === "memory",
      ),
    ).toBe(true);
    expect(state.messages.filter((message) => message.side === "right")).toHaveLength(
      1,
    );
  });
});
