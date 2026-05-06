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

    for (const scene of ["dinner_core", "anonymous_delegate", "conflict_bridge", "game_party_hok"].map(loadScene)) {
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
    for (const scene of ["dinner_core", "anonymous_delegate", "conflict_bridge", "game_party_hok"].map(loadScene)) {
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
        ).not.toMatch(/功能|如果没有下一步|如果不继续|停在一句|slide|demo|卡片按钮/);

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

  it("keeps top-left mode state, animation pacing, and stage progress readable", () => {
    const pageSource = readFileSync(path.join(process.cwd(), "src/components/demo/ChatDemoPage.tsx"), "utf8");
    const bubbleSource = readFileSync(path.join(process.cwd(), "src/components/chat/MessageBubble.tsx"), "utf8");

    expect(pageSource).toContain("navLinkClass(\"judge\")");
    expect(pageSource).toContain("navLinkClass(\"studio\")");
    expect(pageSource).toContain("AUTOPLAY_TICK_MS");
    expect(pageSource).toContain("stageProgressCount");
    expect(bubbleSource).toContain("MAX_REVEAL_DELAY_SECONDS");
  });

  it("continues side-branch flows instead of ending after one reply", () => {
    for (const sceneId of ["anonymous_delegate", "conflict_bridge", "dinner_core", "game_party_hok"] as const) {
      const scene = loadScene(sceneId);
      const entryBeatId = scene.entryBeatId;
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

  it("keeps the anonymous flow merged into the dinner scene surface", () => {
    const manifest = JSON.parse(readFileSync(path.join(process.cwd(), "fixtures/scenes/scene_manifest.json"), "utf8")) as {
      scenes: Array<{ id: string }>;
    };
    const dinner = loadScene("dinner_core");
    const seedActions = getTimeline(dinner).beats.find((beat) => beat.id === "dinner.seed")?.availableActions ?? [];

    expect(manifest.scenes.map((scene) => scene.id)).not.toContain("anonymous_delegate");
    expect(seedActions.map((action) => action.nextBeatId)).not.toContain("dinner.flash_anonymous");
  });

  it("lets the dinner scene surface bot intent detection without a user @ mention", () => {
    const dinner = loadScene("dinner_core");
    const seed = getTimeline(dinner).beats.find((beat) => beat.id === "dinner.seed");
    const plan = getTimeline(dinner).beats.find((beat) => beat.id === "dinner.plan");

    expect(seed?.messages.some((message) => message.actorId === "bot_xjz")).toBe(true);
    expect(seed?.availableActions?.map((action) => action.label).join(" ")).not.toContain("@虾局长");
    expect(seed?.availableActions?.map((action) => action.label).join(" ")).not.toContain("收口烤肉局");
    expect(plan?.messages.some((message) => message.actorId === "user_self" && message.text?.includes("@虾局长"))).toBe(false);
  });

  it("starts dinner planning with attendance only before time and place polls", () => {
    const dinner = loadScene("dinner_core");
    const cards = loadCardMap();
    const plan = getTimeline(dinner).beats.find((beat) => beat.id === "dinner.plan");
    const planCard = cards.get("plan_card_1");
    const planActionLabels = (plan?.availableActions ?? []).map((action) => action.label).join(" ");
    const planButtonLabels = (planCard?.buttons ?? []).map((button) => button.label).join(" ");

    expect(planActionLabels).toMatch(/我可以去|看情况|这次不去/);
    expect(planButtonLabels).toMatch(/我可以去|看情况|这次不去/);
    expect(`${planActionLabels} ${planButtonLabels}`).not.toMatch(/时间投票|地点投票|提醒未回复|私下提醒|查看详情/);

    const joinBeat = getTimeline(dinner).beats.find((beat) => beat.id === "dinner.join_vote");
    expect((joinBeat?.availableActions ?? []).map((action) => action.label).join(" ")).toMatch(/进入时间投票/);
    expect((joinBeat?.availableActions ?? []).map((action) => action.label).join(" ")).not.toMatch(/地点投票/);

    const timeBeat = getTimeline(dinner).beats.find((beat) => beat.id === "dinner.time_vote");
    expect((timeBeat?.availableActions ?? []).map((action) => action.label).join(" ")).toMatch(/进入地点投票/);
  });

  it("routes every dinner branch before the recap back to the memory beat", () => {
    const dinner = loadScene("dinner_core");
    const timeline = getTimeline(dinner);
    const beforeRecapIds = collectReachableBefore(timeline, timeline.entryBeatId, "dinner.recap");

    expect(beforeRecapIds.has("dinner.plan")).toBe(true);
    expect(beforeRecapIds.has("dinner.decline_vote")).toBe(true);

    for (const beat of timeline.beats) {
      if (!beforeRecapIds.has(beat.id)) {
        continue;
      }

      for (const action of beat.availableActions ?? []) {
        if (action.actionId.includes("replay")) {
          continue;
        }

        expect(
          canReachBeat(timeline, action.nextBeatId, "dinner.recap"),
          `${beat.id}/${action.label} should continue to dinner.recap instead of ending early`,
        ).toBe(true);
      }
    }
  });

  it("offers graceful abandon paths after voting and confirmation", () => {
    const dinner = loadScene("dinner_core");
    const actionLabelsByBeat = new Map(
      getTimeline(dinner).beats.map((beat) => [beat.id, (beat.availableActions ?? []).map((action) => action.label)]),
    );

    for (const beatId of ["dinner.time_vote", "dinner.place_vote", "dinner.join_vote", "dinner.confirm_detail", "dinner.confirm"]) {
      const labels = actionLabelsByBeat.get(beatId)?.join(" ") ?? "";
      expect(labels, `${beatId} should let a user leave or decline`).toMatch(/不参加|放弃|退出/);
    }
  });

  it("grounds the dinner memory card with barbecue photo and chat before recap", () => {
    const dinner = loadScene("dinner_core");
    const recap = getTimeline(dinner).beats.find((beat) => beat.id === "dinner.recap");
    const messages = recap?.messages ?? [];
    const firstCardIndex = messages.findIndex((message) => message.type === "card");
    const firstImageIndex = messages.findIndex((message) => message.type === "image");

    expect(firstImageIndex, "recap should show a barbecue photo before the memory card").toBeGreaterThanOrEqual(0);
    expect(firstImageIndex).toBeLessThan(firstCardIndex);
    expect(messages.find((message) => message.type === "image")?.imageUrl).toMatch(/^\/generated\/qq-bbq-memory\.(png|jpg|jpeg|webp|svg)$/);
    expect(messages.map((message) => message.text).join(" ")).toMatch(/烤肉|肥牛|照片/);
  });

  it("gives conflict and game scenes visual assets and a complete final step", () => {
    const expectedFinalByScene = new Map([
      ["conflict_bridge", "conflict.decision"],
      ["game_party_hok", "game_hok.recap"],
    ]);

    for (const sceneId of ["conflict_bridge", "game_party_hok"] as const) {
      const scene = loadScene(sceneId);
      const timeline = getTimeline(scene);
      const finalBeatId = expectedFinalByScene.get(sceneId) ?? "";
      const images = timeline.beats.flatMap((beat) => (beat.messages ?? []).filter((message) => message.type === "image"));

      expect(images.length, `${sceneId} should include a generated scene image`).toBeGreaterThan(0);
      for (const image of images) {
        expect(image.imageUrl, `${sceneId} image should use a generated asset`).toMatch(/^\/generated\//);
      }

      for (const action of timeline.beats.find((beat) => beat.id === scene.entryBeatId)?.availableActions ?? []) {
        if (action.actionId.includes("replay")) {
          continue;
        }

        expect(
          canReachBeat(timeline, action.nextBeatId, finalBeatId),
          `${sceneId}/${action.label} should reach ${finalBeatId}`,
        ).toBe(true);
      }
    }
  });

  it("keeps private outreach and anonymous delegation copy out of normal chat bubbles", () => {
    const forbiddenNormalChat = /单聊|不在群里公开点名|匿名委托|不暴露发起人|不公开发起人|真实发起人|发起人身份/;

    for (const scene of loadScenes()) {
      for (const beat of getTimeline(scene).beats) {
        for (const message of beat.messages ?? []) {
          if (message.side !== "system") {
            expect(
              message.text ?? "",
              `${scene.id}/${beat.id}/${message.id} leaks private operation copy into chat`,
            ).not.toMatch(forbiddenNormalChat);
          }
        }
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
      "m6_seed_bot",
    ]);
    expect(state.availableActions.map((action) => action.label)).toContain("可以，先确认去不去");
  });

  it("advances the guided main path through plan, vote, confirm, and memory cards", () => {
    const scene = loadScene("dinner_core");
    const cards = loadCardMap();
    let state = createInitialDemoState(scene, "guided");

    for (const actionId of [
      "dinner.ask_attendance",
      "dinner.vote_join",
      "dinner.enter_time_vote",
      "dinner.enter_place_vote",
      "dinner.remind_pending",
      "dinner.confirm_after_reminder",
      "dinner.send_reminder",
      "dinner.show_recap",
    ]) {
      state = advanceStep(scene, state, actionId);
    }

    const cardTypes = state.messages
      .filter((message) => message.type === "card")
      .map((message) => cards.get(message.cardId ?? "")?.cardType);

    expect(cardTypes).toEqual(["plan", "vote", "vote", "confirm", "memory"]);
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
      "u_join",
      "u_time",
      "u_place",
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

function canReachBeat(timeline: ReturnType<typeof getTimeline>, fromBeatId: string, targetBeatId: string): boolean {
  const beatsById = new Map(timeline.beats.map((beat) => [beat.id, beat]));
  const seen = new Set<string>();
  const queue = [fromBeatId];

  while (queue.length > 0) {
    const beatId = queue.shift() ?? "";

    if (beatId === targetBeatId) {
      return true;
    }

    if (seen.has(beatId)) {
      continue;
    }

    seen.add(beatId);

    for (const action of beatsById.get(beatId)?.availableActions ?? []) {
      if (!action.actionId.includes("replay")) {
        queue.push(action.nextBeatId);
      }
    }
  }

  return false;
}

function collectReachableBefore(
  timeline: ReturnType<typeof getTimeline>,
  entryBeatId: string,
  stopBeatId: string,
): Set<string> {
  const beatsById = new Map(timeline.beats.map((beat) => [beat.id, beat]));
  const seen = new Set<string>();
  const queue = [entryBeatId];

  while (queue.length > 0) {
    const beatId = queue.shift() ?? "";

    if (beatId === stopBeatId || seen.has(beatId)) {
      continue;
    }

    seen.add(beatId);

    for (const action of beatsById.get(beatId)?.availableActions ?? []) {
      if (!action.actionId.includes("replay")) {
        queue.push(action.nextBeatId);
      }
    }
  }

  return seen;
}
