import { describe, expect, it } from "vitest";

import {
  advanceStep,
  createRecordingState,
  createInitialDemoState,
  getTimeline,
  playNextTimelineBeat,
  runAutoplayPath,
} from "./engine";
import { loadActorMap, loadCardMap, loadScene } from "../fixtures/loader";

describe("fixture contract", () => {
  it("resolves every actor, card, entry beat, and branch used by every scene", () => {
    const scenes = [
      loadScene("dinner_core"),
      loadScene("anonymous_delegate"),
      loadScene("conflict_bridge"),
      loadScene("game_party_hok"),
      loadScene("game_party_luoke"),
    ];
    const actors = loadActorMap();
    const cards = loadCardMap();

    for (const scene of scenes) {
      const timeline = getTimeline(scene);
      const beatIds = new Set(timeline.beats.map((beat) => beat.id));

      expect(beatIds.has(timeline.entryBeatId)).toBe(true);

      for (const beat of timeline.beats) {
        for (const message of beat.messages ?? []) {
          expect(actors.has(message.actorId)).toBe(true);

          if (message.type === "card") {
            expect(message.cardId).toBeTruthy();
            expect(cards.has(message.cardId ?? "")).toBe(true);
          }
        }

        for (const action of beat.availableActions ?? []) {
          expect(action.actionId).toBeTruthy();
          expect(beatIds.has(action.nextBeatId)).toBe(true);
        }
      }
    }
  });

  it("uses explicit card action bindings instead of matching button labels", () => {
    const cards = loadCardMap();

    for (const card of cards.values()) {
      for (const button of card.buttons ?? []) {
        expect(typeof button).toBe("object");
        expect(button.actionId).toBeTruthy();
      }
    }
  });
});

describe("demo engine", () => {
  it("starts judge mode from fixture seed messages and first-beat actions", () => {
    const scene = loadScene("dinner_core");
    const state = createInitialDemoState(scene, {
      experienceMode: "judge",
      runtimeMode: "snapshot",
    });

    expect(state.experienceMode).toBe("judge");
    expect(state.runtimeMode).toBe("snapshot");
    expect(state.currentBeatId).toBe("dinner.seed");
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
      "dinner.ask_close",
      "dinner.vote_time",
      "dinner.remind_pending",
      "dinner.show_recap",
    ]) {
      state = advanceStep(scene, state, actionId);
    }

    const cardTypes = state.messages
      .filter((message) => message.type === "card")
      .map((message) => cards.get(message.cardId ?? "")?.cardType);

    expect(cardTypes).toEqual(["plan", "vote", "confirm", "memory"]);
    expect(state.currentBeatId).toBe("dinner.recap");
    expect(state.availableActions.map((action) => action.label)).toContain(
      "Replay",
    );
  });

  it("recording mode pauses at director pause points instead of running through everything", () => {
    const scene = loadScene("dinner_core");
    let state = createRecordingState(scene);

    state = playNextTimelineBeat(scene, state);

    expect(state.experienceMode).toBe("recording");
    expect(state.recording.paused).toBe(true);
    expect(state.recording.pausePoint?.id).toBe("pause.plan_card");
    expect(state.currentBeatId).toBe("dinner.plan");
  });

  it("autoplay follows timeline policy to the memory card without hardcoded action ids or free text input", () => {
    const scene = loadScene("dinner_core");
    const cards = loadCardMap();

    const state = runAutoplayPath(scene);

    expect(state.experienceMode).toBe("recording");
    expect(state.currentBeatId).toBe("dinner.recap");
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
