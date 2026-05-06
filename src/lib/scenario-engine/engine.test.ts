import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

import {
  advanceStep,
  createInitialDemoState,
  getTimeline,
  runAutoplayPath,
} from "./engine";
import { loadActorMap, loadCardMap, loadScene, loadScenes } from "../fixtures/loader";
import { appModeSchema, sceneIdSchema } from "../types/demo";

describe("fixture contract", () => {
  it("resolves every actor, card, entry beat, and branch used by every scene", () => {
    const scenes = loadScenes();
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
      const actionIds = new Set<string>();

      for (const button of card.buttons ?? []) {
        expect(typeof button).toBe("object");
        expect(button.actionId).toBeTruthy();
        expect(actionIds.has(button.actionId ?? "")).toBe(false);
        actionIds.add(button.actionId ?? "");
      }
    }
  });

  it("removes recording mode and the duplicate Luoke game scene from the judge surface", () => {
    expect(appModeSchema.safeParse("recording").success).toBe(false);
    expect(appModeSchema.parse("autoplay")).toBe("judge");
    expect(sceneIdSchema.safeParse("game_party_luoke").success).toBe(false);
  });

  it("keeps every visible card button actionable in the beat where the card appears", () => {
    const cards = loadCardMap();

    for (const scene of loadScenes()) {
      for (const beat of getTimeline(scene).beats) {
        const availableActionIds = new Set((beat.availableActions ?? []).map((action) => action.actionId));
        const visibleCards = (beat.messages ?? [])
          .filter((message) => message.type === "card" && message.cardId)
          .map((message) => cards.get(message.cardId ?? ""))
          .filter(Boolean);

        for (const card of visibleCards) {
          for (const button of card?.buttons ?? []) {
            expect(
              availableActionIds.has(button.actionId ?? ""),
              `${scene.id}/${beat.id} card ${card?.id} button ${button.label} must resolve to an available action`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("does not use no-op self-loop actions except replaying the scene entry", () => {
    for (const scene of loadScenes()) {
      for (const beat of getTimeline(scene).beats) {
        for (const action of beat.availableActions ?? []) {
          const isReplayToEntry = action.actionId.includes("replay") && action.nextBeatId === scene.entryBeatId;

          expect(
            action.nextBeatId !== beat.id || isReplayToEntry,
            `${scene.id}/${beat.id} action ${action.actionId} must not point back to the same beat`,
          ).toBe(true);
        }
      }
    }
  });

  it("keeps judge-facing beat copy limited to concise pain points", () => {
    for (const scene of loadScenes()) {
      for (const beat of getTimeline(scene).beats) {
        expect(beat.painPoint, `${scene.id}/${beat.id} needs painPoint`).toBeTruthy();
        expect(beat.painPoint.length, `${scene.id}/${beat.id} painPoint should stay concise`).toBeLessThanOrEqual(48);
        expect(
          beat.painPoint,
          `${scene.id}/${beat.id} painPoint should describe the user problem solved, not a product defect`,
        ).not.toMatch(/功能|如果没有下一步|如果不继续|停在一句/);

        for (const value of collectVisibleBeatText(beat)) {
          expect(value, `${scene.id}/${beat.id} contains judge-facing forbidden copy`).not.toContain("评委");
        }
      }
    }
  });

  it("keeps LLM mode switching out of the right-side demo toolbar", () => {
    const toolbarSource = readFileSync(path.join(process.cwd(), "src/components/demo/DemoToolbar.tsx"), "utf8");
    const pageSource = readFileSync(path.join(process.cwd(), "src/components/demo/ChatDemoPage.tsx"), "utf8");
    const homeSource = readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(toolbarSource).not.toContain("onMode");
    expect(toolbarSource).not.toContain("真实 LLM 工作台");
    expect(toolbarSource).not.toContain("无 LLM 评审");
    expect(pageSource).not.toContain("设计意图");
    expect(pageSource).not.toContain("期望效果");
    expect(homeSource).not.toContain("评委");
  });

  it("continues side-branch flows instead of ending after one reply", () => {
    for (const sceneId of ["anonymous_delegate", "conflict_bridge", "dinner_core"] as const) {
      const scene = loadScene(sceneId);
      const entryBeatId = sceneId === "dinner_core" ? "dinner.flash_anonymous" : scene.entryBeatId;
      const entry = getTimeline(scene).beats.find((beat) => beat.id === entryBeatId);

      expect(entry).toBeTruthy();

      for (const action of entry?.availableActions ?? []) {
        const nextBeat = getTimeline(scene).beats.find((beat) => beat.id === action.nextBeatId);
        const followUpActions = (nextBeat?.availableActions ?? []).filter(
          (candidate) => !candidate.actionId.includes("replay"),
        );

        expect(
          followUpActions.length,
          `${scene.id}/${action.actionId} should keep the branch moving after the first response`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("keeps authored scene branches conversational before they end", () => {
    const sceneIds = ["dinner_core", "anonymous_delegate", "conflict_bridge", "game_party_hok"] as const;

    for (const sceneId of sceneIds) {
      const scene = loadScene(sceneId);

      for (const beat of getTimeline(scene).beats) {
        const isReplayOnly = (beat.availableActions ?? []).every((action) => action.actionId.includes("replay"));

        expect(
          beat.messages.length,
          `${scene.id}/${beat.id} needs enough dialogue to avoid abrupt jumps`,
        ).toBeGreaterThanOrEqual(isReplayOnly ? 1 : 2);

        if (!isReplayOnly) {
          const nonReplayActions = (beat.availableActions ?? []).filter((action) => !action.actionId.includes("replay"));
          expect(
            nonReplayActions.length,
            `${scene.id}/${beat.id} should offer a next step before replay`,
          ).toBeGreaterThan(0);
        }
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
    expect(state.availableActions.map((action) => action.label)).toContain("@虾局长 帮我收口这局");
  });

  it("advances the guided main path through plan, vote, confirm, and memory cards", () => {
    const scene = loadScene("dinner_core");
    const cards = loadCardMap();
    let state = createInitialDemoState(scene, "guided");

    for (const actionId of ["dinner.ask_close", "dinner.vote_time", "dinner.remind_pending", "dinner.confirm_after_reminder", "dinner.send_reminder", "dinner.show_recap"]) {
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

  it("autoplay follows timeline policy to the memory card without hardcoded action ids or free text input", () => {
    const scene = loadScene("dinner_core");
    const cards = loadCardMap();

    const state = runAutoplayPath(scene);

    expect(state.experienceMode).toBe("judge");
    expect(state.currentBeatId).toBe("dinner.preference");
    expect(
      state.messages.some(
        (message) =>
          message.type === "card" &&
          cards.get(message.cardId ?? "")?.cardType === "memory",
      ),
    ).toBe(true);
    expect(state.messages.filter((message) => message.side === "right").map((message) => message.id)).toEqual([
      "u1",
      "u_time",
    ]);
  });
});

function collectVisibleBeatText(beat: ReturnType<typeof getTimeline>["beats"][number]): string[] {
  return [
    beat.description,
    beat.act,
    beat.painPoint,
    ...((beat.messages ?? []).map((message) => message.text)),
    ...((beat.availableActions ?? []).map((action) => action.label)),
  ].filter((value): value is string => Boolean(value));
}
