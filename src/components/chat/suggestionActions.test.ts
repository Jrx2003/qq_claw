import { describe, expect, it } from "vitest";

import type { DemoAction } from "@/lib/types/demo";
import { getVisibleSuggestionActions } from "./suggestionActions";

describe("suggestion action visibility", () => {
  it("keeps every actionable recommendation visible in the chat footer", () => {
    const actions: DemoAction[] = [
      {
        actionId: "chip",
        id: "chip",
        label: "chip",
        kind: "chip",
        nextBeatId: "next",
        nextStepId: "next",
      },
      {
        actionId: "keyboard",
        id: "keyboard",
        label: "keyboard",
        kind: "keyboard",
        nextBeatId: "next",
        nextStepId: "next",
      },
      {
        actionId: "toolbar",
        id: "toolbar",
        label: "toolbar",
        kind: "toolbar",
        nextBeatId: "next",
        nextStepId: "next",
      },
      {
        actionId: "scene",
        id: "scene",
        label: "scene",
        kind: "scene-switch",
        nextBeatId: "next",
        nextStepId: "next",
      },
    ];

    expect(getVisibleSuggestionActions(actions).map((action) => action.actionId)).toEqual([
      "chip",
      "keyboard",
      "toolbar",
      "scene",
    ]);
  });
});
